package br.com.strumlab.strumming;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import static br.com.strumlab.strumming.StrummingModels.*;
@RestController
public class StrummingController {
    private final StrummingService service;public StrummingController(StrummingService service){this.service=service;}
    @GetMapping("/api/v1/strumming-patterns")public List<Pattern> catalog(){return service.catalog();}
    @GetMapping("/api/v1/songs/{id}/strumming")public Binding binding(@PathVariable UUID id){return service.binding(id);}
    @PutMapping("/api/v1/songs/{id}/strumming")public Binding save(@PathVariable UUID id,@RequestBody Edit edit){return service.save(id,edit);}
}
