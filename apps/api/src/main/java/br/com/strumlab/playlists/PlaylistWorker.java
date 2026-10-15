package br.com.strumlab.playlists;

import java.util.*;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.scheduling.annotation.*;
import br.com.strumlab.songs.SongProblem;

/** Queue claims and publication are short transactions; Spotify I/O holds no DB locks. */
@Component @EnableScheduling
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name="strumlab.playlists.worker-enabled",havingValue="true",matchIfMissing=true)
public class PlaylistWorker {
    @org.springframework.beans.factory.annotation.Value("${strumlab.workspace-id:00000000-0000-4000-8000-000000000001}")
    private UUID owner=UUID.fromString("00000000-0000-4000-8000-000000000001");
    private final JdbcTemplate jdbc;private final TransactionTemplate tx;private final SpotifyClient spotify;private final PlaylistService service;
    public PlaylistWorker(JdbcTemplate jdbc,PlatformTransactionManager manager,SpotifyClient spotify,PlaylistService service){this.jdbc=jdbc;tx=new TransactionTemplate(manager);this.spotify=spotify;this.service=service;}
    @Scheduled(fixedDelay=1000,initialDelay=3000)
    public void tick(){try{metadata();item();}catch(RuntimeException e){System.out.println("{\"event\":\"playlist_worker_failed\"}");}}
    void metadata(){
        var job=tx.execute(s->{jdbc.update("DELETE FROM playlist_import WHERE owner_id=? AND updated_at<CURRENT_TIMESTAMP-INTERVAL '30 days'",owner);jdbc.update("UPDATE playlist_import SET status='failed',error_code='lease_expired',lease_token=NULL,lease_until=NULL,version=version+1 WHERE owner_id=? AND status='processing' AND lease_until<CURRENT_TIMESTAMP AND attempts>=3",owner);var rows=jdbc.queryForList("SELECT id,external_id FROM playlist_import WHERE owner_id=? AND attempts<3 AND (status='pending' OR (status='processing' AND lease_until<CURRENT_TIMESTAMP)) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",owner);if(rows.isEmpty())return null;var row=rows.getFirst();UUID lease=UUID.randomUUID();jdbc.update("UPDATE playlist_import SET status='processing',attempts=attempts+1,lease_token=?,lease_until=CURRENT_TIMESTAMP+INTERVAL '180 seconds',version=version+1 WHERE id=?",lease,row.get("id"));row.put("lease",lease);return row;});if(job==null)return;
        PlaylistModels.RemotePlaylist result=null;String error=null;int retry=0;try{result=spotify.playlist((String)job.get("external_id"));}catch(SpotifyClient.Failure e){error=e.code;retry=e.retrySeconds;}catch(RuntimeException e){error="provider_failed";}
        final var payload=result;final String failure=error;final int seconds=retry;
        tx.executeWithoutResult(s->{var active=jdbc.queryForList("SELECT id FROM playlist_import WHERE id=? AND status='processing' AND lease_token=? AND lease_until>CURRENT_TIMESTAMP FOR UPDATE",job.get("id"),job.get("lease"));if(active.isEmpty())return;
            if(failure!=null){jdbc.update("UPDATE playlist_import SET status='failed',error_code=?,retry_after=CURRENT_TIMESTAMP+(? * INTERVAL '1 second'),lease_token=NULL,lease_until=NULL,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",failure,seconds,job.get("id"));return;}
            for(var item:payload.items())jdbc.update("INSERT INTO playlist_import_item(id,import_id,position,external_id,title,artist,available,status,error_code) VALUES (?,?,?,?,?,?,?,?,?)",UUID.randomUUID(),job.get("id"),item.position(),item.externalId(),item.title(),item.artist(),item.available(),item.available()?"needs_input":"failed",item.errorCode());
            jdbc.update("UPDATE playlist_import SET title=?,snapshot_id=?,status='ready',error_code=NULL,retry_after=NULL,lease_token=NULL,lease_until=NULL,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",payload.title(),payload.snapshot(),job.get("id"));
        });
    }
    void item(){tx.executeWithoutResult(s->{jdbc.update("UPDATE playlist_import_item SET status='failed',error_code='lease_expired',lease_token=NULL,lease_until=NULL WHERE import_id IN (SELECT id FROM playlist_import WHERE owner_id=?) AND status='processing' AND lease_until<CURRENT_TIMESTAMP AND attempts>=3",owner);var rows=jdbc.queryForList("SELECT i.* FROM playlist_import_item i JOIN playlist_import p ON p.id=i.import_id WHERE p.owner_id=? AND p.status='ready' AND i.attempts<3 AND (i.status='pending' OR (i.status='processing' AND i.lease_until<CURRENT_TIMESTAMP)) ORDER BY p.created_at,i.position FOR UPDATE OF p,i SKIP LOCKED LIMIT 1",owner);if(rows.isEmpty())return;var row=rows.getFirst();String status="ready",error=null;UUID song=(UUID)row.get("song_id"),revision=(UUID)row.get("revision_id");if(song==null||revision==null){status="needs_input";error="authorized_content_required";}else try{service.validateRevision(song,revision);}catch(SongProblem e){status="failed";error="revision_unavailable";}
        jdbc.update("UPDATE playlist_import_item SET status=?,error_code=?,attempts=attempts+1,lease_token=NULL,lease_until=NULL WHERE id=?",status,error,row.get("id"));jdbc.update("UPDATE playlist_import SET version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",row.get("import_id"));});}
}
