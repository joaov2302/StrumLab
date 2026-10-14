package br.com.strumlab.songs;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.net.*;
import java.net.http.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
class SongsIT {
    @LocalServerPort int port;
    @Value("${LOCAL_API_TOKEN}") String token;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    SongContent content() { return new SongContent(1,"Teste autoral " + UUID.randomUUID(),"Autor fictício","G",90,"4/4",2,"manual","Fixture sintética","own",List.of(new SongContent.Section("verse","verse","Verso",List.of(new SongContent.Line("line1",List.of(new SongContent.Token("chord","G/B",null),new SongContent.Token("text",null,"ação e coração 🎶"))))),new SongContent.Section("chorus","chorus","Refrão",List.of(new SongContent.Line("line2",List.of(new SongContent.Token("chord","Em7",null))))))); }
    HttpResponse<String> call(String method,String path,Object body,boolean authorized,String origin) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1/songs"+path)).header("Content-Type","application/json");
        if(authorized)builder.header("X-StrumLab-Local-Token",token);
        if(origin!=null)builder.header("Origin",origin);
        return HttpClient.newHttpClient().send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build(),HttpResponse.BodyHandlers.ofString());
    }
    SongService.Detail create() throws Exception { var response=call("POST","",content(),true,null);assertThat(response.statusCode()).isEqualTo(201);return decode(response); }
    SongService.Detail decode(HttpResponse<String> response) { return json.readValue(response.body(),SongService.Detail.class); }
    SongService.Edit edit(SongService.Detail detail,SongContent content) { return new SongService.Edit(content,detail.baseRevisionId(),detail.song().draftVersion()); }
    @Test void snapshotsDraftConcurrencyRestoreAndArchive() throws Exception {
        var initial=create(); var initialContent=initial.draft(); String path="/"+initial.song().id();
        var first=decode(call("POST",path+"/revisions",edit(initial,initialContent),true,null));
        var transposed=Music.transpose(initialContent,2,"sharps");
        assertThat(transposed.sections().getFirst().lines().getFirst().tokens().getFirst().symbol()).isEqualTo("A/C#");
        assertThat(transposed.capo()).isEqualTo(2);
        assertThat(transposed.sections().getFirst().lines().getFirst().tokens().get(1)).isEqualTo(initialContent.sections().getFirst().lines().getFirst().tokens().get(1));
        var draft=decode(call("PUT",path+"/draft",edit(first,transposed),true,null));
        assertThat(draft.revisions()).hasSize(1);
        assertThat(draft.revisions().getFirst().content()).isEqualTo(initialContent);
        assertThat(call("PUT",path+"/draft",edit(first,initialContent),true,null).statusCode()).isEqualTo(409);
        var second=decode(call("POST",path+"/revisions",edit(draft,transposed),true,null));
        var reopened=decode(call("GET",path,null,true,null));assertThat(reopened.draft()).isEqualTo(transposed);
        assertThat(reopened.revisions().get(1).content()).isEqualTo(initialContent);
        var restored=decode(call("POST",path+"/revisions/"+first.revisions().getFirst().id()+"/restore",Map.of("draftVersion",second.song().draftVersion(),"baseRevisionId",second.baseRevisionId()),true,null));
        assertThat(restored.revisions()).hasSize(3);assertThat(restored.revisions().getFirst().source()).isEqualTo("restored");assertThat(restored.draft()).isEqualTo(initialContent);
        assertThatThrownBy(()->jdbc.update("UPDATE song_revision SET content_json='{}'::jsonb WHERE id=?",first.revisions().getFirst().id())).hasMessageContaining("immutable");
        var archived=decode(call("PATCH",path,Map.of("archived",true,"draftVersion",restored.song().draftVersion()),true,null));
        assertThat(call("POST",path+"/revisions",edit(archived,initialContent),true,null).statusCode()).isEqualTo(409);
        var reopenedArchive=decode(call("PATCH",path,Map.of("archived",false,"draftVersion",archived.song().draftVersion()),true,null));assertThat(reopenedArchive.song().status()).isEqualTo("reviewed");
    }
    @Test void parallelRevisionRequestsHaveExactlyOneWinner() throws Exception {
        var initial=create();var request=edit(initial,initial.draft());String path="/"+initial.song().id()+"/revisions";
        var a=CompletableFuture.supplyAsync(()->{try{return call("POST",path,request,true,null).statusCode();}catch(Exception e){throw new RuntimeException(e);}});
        var b=CompletableFuture.supplyAsync(()->{try{return call("POST",path,request,true,null).statusCode();}catch(Exception e){throw new RuntimeException(e);}});
        assertThat(List.of(a.join(),b.join())).containsExactlyInAnyOrder(200,409);
        assertThat(decode(call("GET","/"+initial.song().id(),null,true,null)).revisions()).hasSize(1);
    }
    @Test void ownerIsolationTokenAndValidation() throws Exception {
        assertThat(call("GET","",null,false,null).statusCode()).isEqualTo(403);
        assertThat(call("POST","",content(),true,"https://untrusted.example").statusCode()).isEqualTo(403);
        UUID otherOwner=UUID.randomUUID(),otherSong=UUID.randomUUID();
        jdbc.update("INSERT INTO workspace(id,name) VALUES (?,?)",otherOwner,"Outro workspace sintético");
        jdbc.update("INSERT INTO song(id,owner_id,title,status) VALUES (?,?,?,'draft')",otherSong,otherOwner,"Conteúdo de outro dono");
        assertThat(call("GET","/"+otherSong,null,true,null).statusCode()).isEqualTo(404);
        assertThat(call("PATCH","/"+otherSong,Map.of("archived",true,"draftVersion",0),true,null).statusCode()).isEqualTo(404);
        assertThat(call("GET","?q=Conte%C3%BAdo%20de%20outro%20dono&status=all",null,true,null).body()).contains("\"total\":0");
        var initial=create();var invalid=new SongContent(1,"","","H",null,"4/4",0,"manual","","unspecified",initial.draft().sections());
        assertThat(call("POST","/"+initial.song().id()+"/revisions",edit(initial,invalid),true,null).statusCode()).isEqualTo(422);
        assertThat(decode(call("GET","/"+initial.song().id(),null,true,null)).song().draftVersion()).isEqualTo(0);
    }
}
