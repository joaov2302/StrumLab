package br.com.strumlab.songs;

import java.util.UUID;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/songs")
public class SongController {
    private final SongService songs;
    public SongController(SongService songs) { this.songs = songs; }
    @GetMapping public SongService.Page list(@RequestParam(defaultValue="") String q, @RequestParam(defaultValue="active") String status, @RequestParam(defaultValue="0") int offset) { return songs.list(q, status, offset); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public SongService.Detail create(@RequestBody SongContent content) { return songs.create(content); }
    @GetMapping("/{id}") public SongService.Detail detail(@PathVariable UUID id) { return songs.detail(id); }
    @PutMapping("/{id}/draft") public SongService.Detail draft(@PathVariable UUID id, @RequestBody SongService.Edit edit) { return songs.draft(id, edit); }
    @PostMapping("/{id}/revisions") public SongService.Detail save(@PathVariable UUID id, @RequestBody SongService.Edit edit) { return songs.save(id, edit); }
    public record RestoreRequest(UUID baseRevisionId, Long draftVersion) {}
    @PostMapping("/{id}/revisions/{revisionId}/restore") public SongService.Detail restore(@PathVariable UUID id, @PathVariable UUID revisionId, @RequestBody RestoreRequest request) { return songs.restore(id, revisionId, request.draftVersion(), request.baseRevisionId()); }
    public record ArchiveRequest(Boolean archived, Long draftVersion) {}
    @PatchMapping("/{id}") public SongService.Detail archive(@PathVariable UUID id, @RequestBody ArchiveRequest request) { if (request.archived() == null) throw new SongProblem(422, "Informe o estado de arquivo."); return songs.archive(id, request.archived(), request.draftVersion()); }
    public record TransposeRequest(SongContent content, int semitones, String spelling) {}
    @PostMapping("/transpose") public SongContent transpose(@RequestBody TransposeRequest request) { return Music.transpose(request.content(), request.semitones(), request.spelling()); }
}
