package br.com.strumlab.playlists;

import com.sun.net.httpserver.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import tools.jackson.databind.ObjectMapper;

/** Synthetic official-shape responses. Never included in the production JAR. */
public class FakeSpotify implements AutoCloseable {
    final HttpServer server;final ObjectMapper json=new ObjectMapper();
    volatile String account="fixture-account",lastVerifier="";
    volatile boolean rejectNextRead=false;
    volatile Runnable beforeMetadata=()->{};
    final AtomicInteger refreshes=new AtomicInteger(),rates=new AtomicInteger(),snapshots=new AtomicInteger(),requests=new AtomicInteger();
    public FakeSpotify(int port)throws Exception{server=HttpServer.create(new InetSocketAddress("127.0.0.1",port),0);server.createContext("/",this::handle);server.start();}
    public String base(){return "http://127.0.0.1:"+server.getAddress().getPort();}
    static Map<String,String> params(String query){var values=new HashMap<String,String>();if(query!=null)for(String part:query.split("&")){String[] pair=part.split("=",2);values.put(URLDecoder.decode(pair[0],StandardCharsets.UTF_8),pair.length>1?URLDecoder.decode(pair[1],StandardCharsets.UTF_8):"");}return values;}
    void reply(HttpExchange e,int status,Object value)throws java.io.IOException{byte[] body=json.writeValueAsBytes(value);e.getResponseHeaders().set("Content-Type","application/json");e.sendResponseHeaders(status,body.length);try(var out=e.getResponseBody()){out.write(body);}}
    Map<String,Object> track(String id,String name){return Map.of("item",Map.of("id",id,"name",name,"type","track","artists",List.of(Map.of("name","Artista de teste"))),"is_local",false);}
    void handle(HttpExchange e)throws java.io.IOException{requests.incrementAndGet();String path=e.getRequestURI().getPath();var q=params(e.getRequestURI().getRawQuery());
        if(path.equals("/authorize")){e.getResponseHeaders().set("Location",q.get("redirect_uri")+"?state="+q.get("state")+"&code=fixture-code");e.sendResponseHeaders(302,-1);e.close();return;}
        if(path.equals("/api/token")){var body=params(new String(e.getRequestBody().readAllBytes(),StandardCharsets.UTF_8));lastVerifier=body.getOrDefault("code_verifier","");if("refresh_token".equals(body.get("grant_type")))refreshes.incrementAndGet();if("bad-code".equals(body.get("code"))){reply(e,400,Map.of("error","invalid_grant"));return;}reply(e,200,Map.of("access_token","fixture-token","refresh_token","fixture-refresh","expires_in",3600));return;}
        if(!"Bearer fixture-token".equals(e.getRequestHeaders().getFirst("Authorization"))){reply(e,401,Map.of("error","unauthorized"));return;}
        if(path.equals("/v1/me")){reply(e,200,Map.of("id",account));return;}
        if(rejectNextRead){rejectNextRead=false;reply(e,401,Map.of("error","expired"));return;}
        if(path.startsWith("/v1/playlists/")){String id=path.split("/")[3];if(id.startsWith("F")){reply(e,403,Map.of("error","forbidden"));return;}if(id.startsWith("M")){reply(e,404,Map.of("error","not_found"));return;}if(id.startsWith("R")&&rates.getAndIncrement()==0){e.getResponseHeaders().set("Retry-After","1");reply(e,429,Map.of("error","rate_limited"));return;}
            if(!path.endsWith("/items")){beforeMetadata.run();reply(e,200,Map.of("name","Playlist de teste autorizada","snapshot_id",id.startsWith("C")?"snapshot-"+snapshots.incrementAndGet():"stable"));return;}
            int offset=Integer.parseInt(q.getOrDefault("offset","0"));var page=new HashMap<String,Object>();page.put("offset",offset);page.put("total",id.startsWith("L")?201:4);page.put("next",offset==0?base()+"/v1/ignored-next-link":null);page.put("items",offset==0?List.of(track("A".repeat(22),"Faixa Alfa"),Collections.singletonMap("item",null)):List.of(track("A".repeat(22),"Faixa Alfa"),track("B".repeat(22),"Faixa Beta")));reply(e,200,page);return;}
        reply(e,404,Map.of("error","unknown_fixture_path"));
    }
    public void close(){server.stop(0);}
}
