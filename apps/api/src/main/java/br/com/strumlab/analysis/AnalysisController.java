package br.com.strumlab.analysis;
import java.util.*;
import java.io.IOException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import br.com.strumlab.songs.SongService;
import static br.com.strumlab.analysis.AnalysisModels.*;
@RestController
public class AnalysisController {
    private final AnalysisService service;public AnalysisController(AnalysisService service){this.service=service;}
    @GetMapping("/api/v1/songs/{songId}/audio-assets")public List<Detail> list(@PathVariable UUID songId){return service.list(songId);}
    @PostMapping(value="/api/v1/songs/{songId}/audio-assets",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)@ResponseStatus(HttpStatus.ACCEPTED)
    public Detail upload(@PathVariable UUID songId,@RequestParam("file")MultipartFile file,@RequestParam("rightsBasis")String rights)throws IOException{return service.upload(songId,file.getBytes(),file.getOriginalFilename(),file.getContentType(),rights);}
    @GetMapping("/api/v1/audio-assets/{id}")public Detail detail(@PathVariable UUID id){return service.detail(id);}
    @DeleteMapping("/api/v1/audio-assets/{id}")public Detail delete(@PathVariable UUID id){return service.delete(id);}
    @PostMapping("/api/v1/audio-assets/{id}/jobs")public Detail reprocess(@PathVariable UUID id,@RequestBody Reprocess request){return service.reprocess(id,request);}
    @GetMapping("/api/v1/audio-assets/{id}/audio")public ResponseEntity<byte[]> audio(@PathVariable UUID id){var asset=service.detail(id).asset();return ResponseEntity.ok().contentType(MediaType.parseMediaType(asset.mime())).header("Cache-Control","private, no-store").header("X-Content-Type-Options","nosniff").body(service.audio(id));}
    @GetMapping("/api/v1/jobs/{id}")public Job job(@PathVariable UUID id){return service.job(id);}
    @PostMapping("/api/v1/jobs/{id}/apply")public SongService.Detail apply(@PathVariable UUID id,@RequestBody Apply selection){return service.apply(id,selection);}
}
