package br.com.strumlab.strumming;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import br.com.strumlab.songs.SongProblem;
import static br.com.strumlab.strumming.StrummingModels.*;

@Service
public class StrummingService {
    private final JdbcTemplate jdbc;private final ObjectMapper json;private final UUID owner;
    public StrummingService(JdbcTemplate jdbc,ObjectMapper json,@Value("${strumlab.workspace-id:00000000-0000-4000-8000-000000000001}") UUID owner){this.jdbc=jdbc;this.json=json;this.owner=owner;}
    public List<Pattern> catalog(){return jdbc.query("SELECT content_json FROM strumming_pattern ORDER BY id,version DESC",(rs,n)->json.readValue(rs.getString(1),Pattern.class));}
    public Pattern pattern(String id,int version){return catalog().stream().filter(p->p.id().equals(id)&&p.version()==version).findFirst().orElseThrow(()->new SongProblem(422,"Modelo/versão de batida não disponível."));}
    private void owned(UUID id,boolean lock,boolean writing){var rows=jdbc.queryForList("SELECT status FROM song WHERE id=? AND owner_id=?"+(lock?" FOR UPDATE":""),id,owner);if(rows.isEmpty())throw new SongProblem(404,"Música não encontrada.");if(writing&&rows.getFirst().get("status").equals("archived"))throw new SongProblem(409,"Reabra a música antes de alterar a batida.");}
    public Binding binding(UUID songId){owned(songId,false,false);var rows=jdbc.query("SELECT version,snapshot_json FROM song_strumming WHERE song_id=?",(rs,n)->new Binding(rs.getLong(1),rs.getString(2)==null?null:json.readValue(rs.getString(2),Snapshot.class)),songId);return rows.isEmpty()?new Binding(0,null):rows.getFirst();}
    @Transactional public Binding save(UUID songId,Edit edit){owned(songId,true,true);var previous=binding(songId);if(edit.version()==null||edit.version()!=previous.version())throw new SongProblem(409,"A batida mudou em outra aba. Recarregue antes de salvar.");if(edit.bpm()<45||edit.bpm()>160||edit.notes()==null||edit.notes().length()>1000)throw new SongProblem(422,"BPM deve estar entre 45 e 160; notas até 1000 caracteres.");var snapshot=edit.patternId()==null?null:new Snapshot(pattern(edit.patternId(),edit.patternVersion()),edit.bpm(),edit.notes(),edit.showInPdf());jdbc.update("INSERT INTO song_strumming(song_id,version,snapshot_json) VALUES (?,?,?::jsonb) ON CONFLICT(song_id) DO UPDATE SET version=EXCLUDED.version,snapshot_json=EXCLUDED.snapshot_json",songId,previous.version()+1,snapshot==null?null:json.writeValueAsString(snapshot));return binding(songId);}
}
