package br.com.strumlab.playlists;

import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.*;
import br.com.strumlab.songs.SongProblem;
import static br.com.strumlab.playlists.PlaylistModels.*;

/** Official Spotify endpoints only. Tokens are process-local and never serialized. */
@Component
public class SpotifyClient {
    public static class Failure extends RuntimeException {
        public final String code; public final int retrySeconds;
        public Failure(String code,int retrySeconds){super(code);this.code=code;this.retrySeconds=retrySeconds;}
    }
    private record Pending(String verifier,String binding,Instant expires) {}
    private final String clientId,redirect,api,accounts;
    private final ObjectMapper json;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();
    private final Map<String,Pending> pending=new HashMap<>();
    private volatile String access; private String refresh; private Instant expires=Instant.EPOCH,rateUntil=Instant.EPOCH;
    private String accountId;

    @org.springframework.beans.factory.annotation.Autowired
    public SpotifyClient(ObjectMapper json,@Value("${SPOTIFY_CLIENT_ID:}")String clientId,
            @Value("${SPOTIFY_REDIRECT_URI:http://127.0.0.1:3000/api/playlists/connection/callback}")String redirect){
        this(json,clientId,redirect,"https://api.spotify.com/v1","https://accounts.spotify.com");
    }
    // Test seam is constructor-only: no runtime environment variable can redirect credentials.
    SpotifyClient(ObjectMapper json,String clientId,String redirect,String api,String accounts){
        this.json=json;this.clientId=clientId;this.redirect=redirect;this.api=api;this.accounts=accounts;
        URI uri=URI.create(redirect);
        if(!"http".equals(uri.getScheme())||!"127.0.0.1".equals(uri.getHost())||!"/api/playlists/connection/callback".equals(uri.getPath())||uri.getQuery()!=null||uri.getFragment()!=null||uri.getUserInfo()!=null)
            throw new IllegalArgumentException("Spotify redirect must be the configured loopback callback");
    }
    public Connection connection(){return new Connection(!clientId.isBlank(),access!=null,redirect);}
    private static String random(){byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);}
    private static String encode(String value){return URLEncoder.encode(value,StandardCharsets.UTF_8);}
    public synchronized Start start(String binding){
        if(clientId.isBlank())throw new SongProblem(409,"Configure SPOTIFY_CLIENT_ID no servidor antes de conectar.");
        if(binding==null||!binding.matches("[0-9a-f-]{36}"))throw new SongProblem(422,"Sessão de conexão inválida.");
        pending.entrySet().removeIf(e->e.getValue().expires().isBefore(Instant.now()));
        if(pending.size()>=10)throw new SongProblem(429,"Há conexões pendentes. Aguarde dez minutos.");
        String state=random(),verifier=random(),challenge;
        try{challenge=Base64.getUrlEncoder().withoutPadding().encodeToString(MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}
        pending.put(state,new Pending(verifier,binding,Instant.now().plusSeconds(600)));
        return new Start(accounts+"/authorize?response_type=code&client_id="+encode(clientId)+"&redirect_uri="+encode(redirect)+"&scope=playlist-read-private%20playlist-read-collaborative&state="+state+"&code_challenge_method=S256&code_challenge="+challenge);
    }
    public synchronized void callback(Callback input){
        Pending value=pending.get(input.state());
        if(value==null||value.expires().isBefore(Instant.now())||!value.binding().equals(input.browserSession()))throw new SongProblem(422,"Conexão expirada ou estado inválido. Conecte novamente.");
        pending.remove(input.state());
        if(input.error()!=null||input.code()==null||input.code().isBlank()||input.code().length()>4096)throw new SongProblem(422,"Autorização Spotify não concluída. Conecte novamente.");
        token("grant_type=authorization_code&client_id="+encode(clientId)+"&code="+encode(input.code())+"&redirect_uri="+encode(redirect)+"&code_verifier="+encode(value.verifier()));
        try{String id=get("/me").path("id").asText("");if(id.isBlank())throw new Failure("invalid_response",0);accountId=id;}catch(RuntimeException e){access=null;refresh=null;throw e;}
    }
    public synchronized String accountId(){return accountId;}
    public synchronized void disconnect(){access=null;refresh=null;accountId=null;expires=Instant.EPOCH;pending.clear();}
    private JsonNode send(HttpRequest request){
        if(rateUntil.isAfter(Instant.now()))throw new Failure("rate_limited",(int)Math.max(1,Duration.between(Instant.now(),rateUntil).toSeconds()));
        try {
            var response=http.send(request,info->new LimitedBody());
            byte[] body=response.body();
            if(response.statusCode()==429){int seconds;try{seconds=Integer.parseInt(response.headers().firstValue("Retry-After").orElse("60"));}catch(NumberFormatException e){seconds=60;}seconds=Math.max(1,Math.min(86400,seconds));rateUntil=Instant.now().plusSeconds(seconds);throw new Failure("rate_limited",seconds);}
            if(response.statusCode()==401)throw new Failure("token_expired",0);
            if(response.statusCode()==403)throw new Failure("access_denied",0);
            if(response.statusCode()==404)throw new Failure("playlist_unavailable",0);
            if(response.statusCode()<200||response.statusCode()>=300)throw new Failure("provider_failed",0);
            if(body.length>2_000_000)throw new Failure("invalid_response",0);
            return json.readTree(body);
        }catch(Failure e){throw e;}catch(InterruptedException e){Thread.currentThread().interrupt();throw new Failure("provider_unavailable",0);}catch(Exception e){throw new Failure("provider_unavailable",0);}
    }
    private static final class LimitedBody implements HttpResponse.BodySubscriber<byte[]> {
        private final java.util.concurrent.CompletableFuture<byte[]> result=new java.util.concurrent.CompletableFuture<>();
        private final java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream();
        private java.util.concurrent.Flow.Subscription subscription;
        public java.util.concurrent.CompletionStage<byte[]> getBody(){return result;}
        public void onSubscribe(java.util.concurrent.Flow.Subscription s){subscription=s;s.request(1);}
        public void onNext(List<java.nio.ByteBuffer> buffers){for(var buffer:buffers){if(bytes.size()+buffer.remaining()>2_000_000){subscription.cancel();result.completeExceptionally(new Failure("invalid_response",0));return;}byte[] next=new byte[buffer.remaining()];buffer.get(next);bytes.writeBytes(next);}subscription.request(1);}
        public void onError(Throwable error){result.completeExceptionally(error);}
        public void onComplete(){result.complete(bytes.toByteArray());}
    }
    private void token(String body){
        var value=send(HttpRequest.newBuilder(URI.create(accounts+"/api/token")).timeout(Duration.ofSeconds(15)).header("Content-Type","application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(body)).build());
        String next=value.path("access_token").asText("");if(next.isBlank())throw new Failure("invalid_response",0);
        access=next;refresh=value.path("refresh_token").asText(refresh);expires=Instant.now().plusSeconds(Math.max(1,value.path("expires_in").asInt(3600)-30));
    }
    private JsonNode get(String path){
        if(access==null)throw new Failure("connection_required",0);
        if(expires.isBefore(Instant.now()))refresh();
        try{return send(HttpRequest.newBuilder(URI.create(api+path)).timeout(Duration.ofSeconds(15)).header("Authorization","Bearer "+access).GET().build());}
        catch(Failure e){if(!e.code.equals("token_expired"))throw e;refresh();return send(HttpRequest.newBuilder(URI.create(api+path)).timeout(Duration.ofSeconds(15)).header("Authorization","Bearer "+access).GET().build());}
    }
    private void refresh(){if(refresh==null){access=null;throw new Failure("connection_required",0);}try{token("grant_type=refresh_token&client_id="+encode(clientId)+"&refresh_token="+encode(refresh));}catch(Failure e){if(!e.code.equals("rate_limited")){access=null;refresh=null;}throw e;}}
    public static String playlistId(String input){
        if(input==null||input.length()>500)throw new SongProblem(422,"Cole uma URL https://open.spotify.com/playlist/ID.");
        try{URI u=URI.create(input);String path=u.getPath();if(!"https".equals(u.getScheme())||!"open.spotify.com".equals(u.getHost())||u.getPort()!=-1||u.getUserInfo()!=null||u.getFragment()!=null||!path.matches("/playlist/[A-Za-z0-9]{22}/?"))throw new IllegalArgumentException();return path.split("/")[2];}
        catch(Exception e){throw new SongProblem(422,"URL inválida. Use https://open.spotify.com/playlist/ID, sem encurtadores.");}
    }
    private static String text(JsonNode n,String field,int max){String v=n.path(field).asText("");return v.length()>max?v.substring(0,max):v;}
    public synchronized RemotePlaylist playlist(String id){
        if(!id.matches("[A-Za-z0-9]{22}"))throw new Failure("invalid_response",0);
        var meta=get("/playlists/"+id);String snapshot=text(meta,"snapshot_id",300);
        var rows=new ArrayList<RemoteItem>();int offset=0;
        while(true){
            var page=get("/playlists/"+id+"/items?limit=50&offset="+offset);var values=page.path("items");
            if(!values.isArray()||page.path("offset").asInt(-1)!=offset)throw new Failure("invalid_response",0);
            if(page.path("total").asInt(0)>200||rows.size()+values.size()>200)throw new Failure("playlist_too_large",0);
            for(var row:values){var track=row.path("item");if(track.isMissingNode())track=row.path("track");String trackId=text(track,"id",22),title=text(track,"name",300);
                // Availability is separate from possession of an authorized recording.
                boolean available=!row.path("is_local").asBoolean(false)&&"track".equals(track.path("type").asText())&&trackId.matches("[A-Za-z0-9]{22}")&&track.path("is_playable").asBoolean(true)&&!title.isBlank();
                var artists=new ArrayList<String>();if(track.path("artists").isArray())for(var artist:track.path("artists"))artists.add(text(artist,"name",150));String names=String.join(", ",artists);if(names.length()>300)names=names.substring(0,300);
                rows.add(new RemoteItem(rows.size(),trackId.matches("[A-Za-z0-9]{22}")?trackId:null,title.isBlank()?"Item indisponível":title,names,available,available?null:"item_unavailable"));
            }
            if(page.path("next").isNull()||page.path("next").isMissingNode())break;
            if(values.isEmpty()||rows.size()>=200)throw new Failure("playlist_too_large",0);
            offset+=values.size();
        }
        if(snapshot.isBlank()||!snapshot.equals(text(get("/playlists/"+id),"snapshot_id",300)))throw new Failure("playlist_changed",0);
        return new RemotePlaylist(text(meta,"name",300),snapshot,List.copyOf(rows));
    }
}
