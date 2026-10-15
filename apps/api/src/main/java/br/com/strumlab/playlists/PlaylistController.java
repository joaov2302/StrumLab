package br.com.strumlab.playlists;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import static br.com.strumlab.playlists.PlaylistModels.*;

@RestController @RequestMapping("/api/v1/playlist-imports")
public class PlaylistController {
    private final PlaylistService service;private final SpotifyClient spotify;
    public PlaylistController(PlaylistService service,SpotifyClient spotify){this.service=service;this.spotify=spotify;}
    @GetMapping("/connection") public Connection connection(){return spotify.connection();}
    @PostMapping("/connection/start") public Start start(@RequestBody Session input){return spotify.start(input.browserSession());}
    @PostMapping("/connection/callback") public Connection callback(@RequestBody Callback input){try{spotify.callback(input);service.bindAccount();}catch(SpotifyClient.Failure e){throw new br.com.strumlab.songs.SongProblem(409,"Não foi possível conectar ao Spotify. Verifique a configuração e tente novamente.");}return spotify.connection();}
    @DeleteMapping("/connection") public Connection disconnect(){service.disconnect();return spotify.connection();}
    @GetMapping public List<Summary> list(){return service.list();}
    @PostMapping @ResponseStatus(HttpStatus.ACCEPTED) public Detail create(@RequestBody Create input){return service.create(input);}
    @GetMapping("/{id}") public Detail detail(@PathVariable UUID id){return service.detail(id);}
    @PatchMapping("/{id}") public Detail action(@PathVariable UUID id,@RequestBody Action input){return service.action(id,input);}
    @DeleteMapping("/{id}") public Map<String,Boolean> delete(@PathVariable UUID id){service.delete(id);return Map.of("deleted",true);}
    @PatchMapping("/{id}/items/{itemId}") public Detail item(@PathVariable UUID id,@PathVariable UUID itemId,@RequestBody Edit input){return service.edit(id,itemId,input);}
    @PostMapping("/{id}/songbooks") public br.com.strumlab.songbooks.BookModels.Detail export(@PathVariable UUID id,@RequestBody Export input){return service.export(id,input);}
}
