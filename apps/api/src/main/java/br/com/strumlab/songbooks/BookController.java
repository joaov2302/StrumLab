package br.com.strumlab.songbooks;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import static br.com.strumlab.songbooks.BookModels.*;

@RestController @RequestMapping("/api/v1/songbooks")
public class BookController {
    private final BookService books;public BookController(BookService books){this.books=books;}
    @GetMapping public Page list(@RequestParam(defaultValue="")String q,@RequestParam(defaultValue="active")String status,@RequestParam(defaultValue="0")int offset){return books.list(q,status,offset);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)public Detail create(@RequestBody Config config){return books.create(config);}
    @GetMapping("/{id}")public Detail detail(@PathVariable UUID id){return books.detail(id);}
    public record Edit(Long version,Config config){}
    @PutMapping("/{id}")public Detail update(@PathVariable UUID id,@RequestBody Edit edit){return books.update(id,edit.version(),edit.config());}
    public record Archive(Long version,boolean archived){}
    @PatchMapping("/{id}")public Detail archive(@PathVariable UUID id,@RequestBody Archive archive){return books.archive(id,archive.version(),archive.archived());}
    public record Add(Long version,UUID songId,UUID revisionId,boolean duplicate){}
    @PostMapping("/{id}/items")public Detail add(@PathVariable UUID id,@RequestBody Add add){return books.add(id,add.version(),add.songId(),add.revisionId(),add.duplicate());}
    public record Order(Long version,List<UUID> itemIds){}
    @PutMapping("/{id}/items/order")public Detail order(@PathVariable UUID id,@RequestBody Order order){return books.reorder(id,order.version(),order.itemIds());}
    public record ItemEdit(Long version,UUID revisionId,String notes){}
    @PatchMapping("/{id}/items/{itemId}")public Detail item(@PathVariable UUID id,@PathVariable UUID itemId,@RequestBody ItemEdit edit){return books.updateItem(id,edit.version(),itemId,edit.revisionId(),edit.notes());}
    public record StrummingEdit(Long version,boolean refresh,Boolean showInPdf){}
    @PatchMapping("/{id}/items/{itemId}/strumming")public Detail strumming(@PathVariable UUID id,@PathVariable UUID itemId,@RequestBody StrummingEdit edit){return books.updateStrumming(id,edit.version(),itemId,edit.refresh(),edit.showInPdf());}
    public record Version(Long version){}
    @DeleteMapping("/{id}/items/{itemId}")public Detail remove(@PathVariable UUID id,@PathVariable UUID itemId,@RequestBody Version version){return books.remove(id,version.version(),itemId);}
    @PostMapping("/{id}/exports")public RenderClaim begin(@PathVariable UUID id,@RequestBody Version version){return books.begin(id,version.version());}
    @GetMapping("/{id}/exports/{exportId}")public Export export(@PathVariable UUID id,@PathVariable UUID exportId){return books.export(id,exportId);}
    @PutMapping("/{id}/exports/{exportId}/result")public Export result(@PathVariable UUID id,@PathVariable UUID exportId,@RequestBody Result result){return books.complete(id,exportId,result);}
    public record Failure(UUID leaseToken){}
    @PatchMapping("/{id}/exports/{exportId}/result")public Export fail(@PathVariable UUID id,@PathVariable UUID exportId,@RequestBody Failure failure){return books.fail(id,exportId,failure.leaseToken());}
    @GetMapping("/{id}/exports/{exportId}/pdf")public ResponseEntity<byte[]> pdf(@PathVariable UUID id,@PathVariable UUID exportId){var value=books.export(id,exportId);return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).header(HttpHeaders.CONTENT_DISPOSITION,"inline; filename=\"strumlab-cancioneiro.pdf\"").header("X-Content-Type-Options","nosniff").header("X-PDF-SHA256",value.pdfSha256()).body(books.pdf(id,exportId));}
}
