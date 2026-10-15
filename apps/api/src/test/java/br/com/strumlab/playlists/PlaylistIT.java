package br.com.strumlab.playlists;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import tools.jackson.databind.ObjectMapper;
import br.com.strumlab.songs.*;
import java.util.*;
import static br.com.strumlab.playlists.PlaylistModels.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties="strumlab.playlists.worker-enabled=false") @Import(PlaylistIT.Config.class)
class PlaylistIT {
    @TestConfiguration static class Config {
        @Bean(destroyMethod="close") FakeSpotify fakeSpotify()throws Exception{return new FakeSpotify(0);}
        @Bean @Primary SpotifyClient fixtureClient(FakeSpotify fake,ObjectMapper json){return new SpotifyClient(json,"fixture-client",SpotifyClientTest.CALLBACK,fake.base()+"/v1",fake.base());}
    }
    @Autowired PlaylistService service;@Autowired SpotifyClient spotify;@Autowired JdbcTemplate jdbc;@Autowired SongService songs;@Autowired PlatformTransactionManager manager;@Autowired FakeSpotify fake;
    PlaylistWorker worker;
    @BeforeEach void init(){service.disconnect();fake.account="fixture-account";fake.rates.set(0);SpotifyClientTest.connect(spotify);service.bindAccount();worker=new PlaylistWorker(jdbc,manager,spotify,service);}
    @AfterEach void cleanup(){service.disconnect();}
    Detail imported(){var d=service.create(new Create("https://open.spotify.com/playlist/"+"P".repeat(22)));worker.metadata();return service.detail(d.playlist().id());}
    SongService.Detail song(){var c=new SongContent(1,"Cifra manual de teste "+UUID.randomUUID(),"Autoral","G",90,"4/4",2,"manual","","own",List.of(new SongContent.Section("verse","verse","Verso",List.of(new SongContent.Line("line",List.of(new SongContent.Token("text",null,"Conteudo proprio preservado")))))));var d=songs.create(c);return songs.save(d.song().id(),new SongService.Edit(c,d.baseRevisionId(),d.song().draftVersion()));}
    Detail link(Detail d,Item i,SongService.Detail song){return service.edit(d.playlist().id(),i.id(),new Edit(d.playlist().version(),"link",null,song.song().id(),song.song().currentRevisionId()));}
    @Test void deduplicatesMetadataButKeepsOrderAndIndependentTrackFailures(){var d=imported();assertThat(d.items()).hasSize(4);assertThat(d.items().get(1).status()).isEqualTo("failed");assertThat(d.items().get(0).status()).isEqualTo("needs_input");assertThat(service.create(new Create(d.playlist().sourceUrl())).playlist().id()).isEqualTo(d.playlist().id());var s=song();d=link(d,d.items().get(0),s);worker.item();d=service.detail(d.playlist().id());assertThat(d.items().get(0).status()).isEqualTo("ready");assertThat(d.items().get(1).status()).isEqualTo("failed");assertThat(songs.detail(s.song().id()).revisions()).hasSize(1);}
    @Test void partialExportIsExplicitPinnedAndIdempotentWithDuplicateControl(){var d=imported();var s=song();d=link(d,d.items().get(0),s);worker.item();d=service.detail(d.playlist().id());d=service.edit(d.playlist().id(),d.items().get(3).id(),new Edit(d.playlist().version(),"select",true,null,null));var id=d.playlist().id();var version=d.playlist().version();var ids=List.of(d.items().get(0).id());assertThatThrownBy(()->service.export(id,new Export(version,UUID.randomUUID(),"Meu repertorio",ids,false,false))).isInstanceOf(SongProblem.class);UUID key=UUID.randomUUID();var input=new Export(version,key,"Meu repertorio",ids,true,false);var book=service.export(id,input);assertThat(book.items().getFirst().revisionId()).isEqualTo(s.song().currentRevisionId());assertThat(service.export(id,input).book().id()).isEqualTo(book.book().id());assertThatThrownBy(()->service.export(id,new Export(version,key,"Outro titulo",ids,true,false))).isInstanceOf(SongProblem.class);}
    @Test void staleEditsAndForeignOwnershipCannotReplaceSelection(){var d=imported();var i=d.items().getFirst();service.edit(d.playlist().id(),i.id(),new Edit(d.playlist().version(),"select",true,null,null));assertThatThrownBy(()->service.edit(d.playlist().id(),i.id(),new Edit(d.playlist().version(),"select",false,null,null))).isInstanceOf(SongProblem.class);UUID other=UUID.randomUUID();jdbc.update("INSERT INTO workspace(id,name) VALUES (?,?)",other,"Outro workspace");jdbc.update("UPDATE playlist_import SET owner_id=? WHERE id=?",other,d.playlist().id());assertThatThrownBy(()->service.detail(d.playlist().id())).isInstanceOf(SongProblem.class);jdbc.update("DELETE FROM playlist_import WHERE id=?",d.playlist().id());}
    @Test void sourceLessRetryIsRejectedAndExplicitDraftCreationIsIndependent() {
        var d=imported();var item=d.items().getFirst();var original=d;
        assertThatThrownBy(()->service.edit(original.playlist().id(),item.id(),new Edit(original.playlist().version(),"retry",null,null,null))).isInstanceOf(SongProblem.class);
        d=service.edit(d.playlist().id(),item.id(),new Edit(d.playlist().version(),"prepare",null,null,null));
        var draft=songs.detail(d.items().getFirst().songId());assertThat(draft.draft().title()).isEqualTo("Nova cifra");assertThat(draft.revisions()).isEmpty();assertThat(d.items().getFirst().status()).isEqualTo("needs_input");assertThat(d.items().getFirst().revisionId()).isNull();
        var prepared=d;assertThatThrownBy(()->service.edit(prepared.playlist().id(),item.id(),new Edit(prepared.playlist().version(),"prepare",null,null,null))).isInstanceOf(SongProblem.class);
        service.disconnect();assertThat(songs.detail(draft.song().id()).draft()).isEqualTo(draft.draft());
    }
    @Test void cancelRetryAndDisconnectPreserveManualLibrary(){var s=song();var d=service.create(new Create("https://open.spotify.com/playlist/"+"P".repeat(22)));d=service.action(d.playlist().id(),new Action(d.playlist().version(),"cancel"));worker.metadata();assertThat(service.detail(d.playlist().id()).items()).isEmpty();service.action(d.playlist().id(),new Action(d.playlist().version(),"retry"));worker.metadata();assertThat(service.detail(d.playlist().id()).items()).hasSize(4);service.disconnect();assertThat(service.list()).isEmpty();assertThat(songs.detail(s.song().id()).revisions()).hasSize(1);assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM spotify_account_binding",Integer.class)).isZero();}
    @Test void accountSwapPurgesOldMetadataButSameAccountReconnectKeepsIt(){var d=imported();SpotifyClientTest.connect(spotify);service.bindAccount();assertThat(service.detail(d.playlist().id()).items()).hasSize(4);fake.account="another-account";SpotifyClientTest.connect(spotify);service.bindAccount();assertThat(service.list()).isEmpty();}
    @Test void workerDoesNotClaimJobsFromAnotherWorkspace(){UUID other=UUID.randomUUID(),foreign=UUID.randomUUID();jdbc.update("INSERT INTO workspace(id,name) VALUES (?,?)",other,"Workspace isolado");jdbc.update("INSERT INTO playlist_import(id,owner_id,external_id,source_url) VALUES (?,?,?,?)",foreign,other,"P".repeat(22),"https://open.spotify.com/playlist/"+"P".repeat(22));try{var own=imported();assertThat(own.playlist().status()).isEqualTo("ready");assertThat(jdbc.queryForObject("SELECT attempts FROM playlist_import WHERE id=?",Integer.class,foreign)).isZero();assertThat(jdbc.queryForObject("SELECT status FROM playlist_import WHERE id=?",String.class,foreign)).isEqualTo("pending");}finally{jdbc.update("DELETE FROM playlist_import WHERE id=?",foreign);}}
    @Test void explicitCopyCreatesIndependentManualRevisionWithoutChangingSource(){var d=imported();var source=song();d=service.edit(d.playlist().id(),d.items().getFirst().id(),new Edit(d.playlist().version(),"copy",null,source.song().id(),source.song().currentRevisionId()));var copy=songs.detail(d.items().getFirst().songId());assertThat(copy.song().id()).isNotEqualTo(source.song().id());assertThat(copy.draft().sections()).isEqualTo(source.draft().sections());assertThat(copy.revisions()).hasSize(1);assertThat(songs.detail(source.song().id()).draft()).isEqualTo(source.draft());worker.item();assertThat(service.detail(d.playlist().id()).items().getFirst().status()).isEqualTo("ready");}
    @Test void lateMetadataCannotPublishAfterCancellation()throws Exception{
        var entered=new java.util.concurrent.CountDownLatch(1);var release=new java.util.concurrent.CountDownLatch(1);
        fake.beforeMetadata=()->{entered.countDown();try{if(!release.await(10,java.util.concurrent.TimeUnit.SECONDS))throw new IllegalStateException("fixture timeout");}catch(InterruptedException e){Thread.currentThread().interrupt();}};
        var d=service.create(new Create("https://open.spotify.com/playlist/"+"P".repeat(22)));
        try(var pool=java.util.concurrent.Executors.newSingleThreadExecutor()){
            var work=pool.submit(()->worker.metadata());try{assertThat(entered.await(5,java.util.concurrent.TimeUnit.SECONDS)).isTrue();var current=service.detail(d.playlist().id());service.action(d.playlist().id(),new Action(current.playlist().version(),"cancel"));}finally{release.countDown();}
            work.get(10,java.util.concurrent.TimeUnit.SECONDS);assertThat(service.detail(d.playlist().id()).items()).isEmpty();assertThat(service.detail(d.playlist().id()).playlist().status()).isEqualTo("cancelled");
        }finally{fake.beforeMetadata=()->{};}
    }
}
