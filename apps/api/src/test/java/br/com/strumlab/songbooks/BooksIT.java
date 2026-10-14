package br.com.strumlab.songbooks;
import java.util.*;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import br.com.strumlab.songs.*;
import static br.com.strumlab.songbooks.BookModels.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
class BooksIT {
    @Autowired BookService books;@Autowired SongService songs;@Autowired JdbcTemplate jdbc;
    Config config(String title){return new Config(title,"Subtítulo autoral","Organizador fictício",new Cover(true,"","unspecified"),new Layout("serif",11,15,1.1,1));}
    SongContent content(String title){return new SongContent(1,title,"Autor fictício","G",90,"4/4",0,"manual","Fixture sintética","own",List.of(new SongContent.Section(UUID.randomUUID().toString(),"verse","Verso",List.of(new SongContent.Line(UUID.randomUUID().toString(),List.of(new SongContent.Token("chord","G/B",null),new SongContent.Token("text",null,"ação e coração")))))));}
    SongService.Detail song(String title){var value=songs.create(content(title));return songs.save(value.song().id(),new SongService.Edit(value.draft(),value.baseRevisionId(),value.song().draftVersion()));}
    Detail add(Detail book,SongService.Detail song,boolean duplicate){return books.add(book.book().id(),book.book().version(),song.song().id(),song.song().currentRevisionId(),duplicate);}
    @Test void oneSongTwoBooksPinnedSnapshotsSelectiveUpdateAndOrder(){
        var first=song("Autoral A "+UUID.randomUUID());var second=song("Autoral B "+UUID.randomUUID());
        var a=add(books.create(config("Livro A")),first,false);var b=add(books.create(config("Livro B")),first,false);
        a=add(a,second,false);UUID id=a.book().id();long stale=a.book().version();
        var reordered=books.reorder(id,stale,List.of(a.items().get(1).id(),a.items().get(0).id()));
        assertThat(books.detail(id).items().stream().map(i->i.content().title()).toList()).containsExactly(second.draft().title(),first.draft().title());
        assertThatThrownBy(()->books.reorder(id,stale,List.of())).isInstanceOf(SongProblem.class).hasMessageContaining("outra aba");
        assertThatThrownBy(()->books.reorder(id,reordered.book().version(),List.of(reordered.items().getFirst().id(),reordered.items().getFirst().id()))).isInstanceOf(SongProblem.class);
        var changed=songs.save(first.song().id(),new SongService.Edit(Music.transpose(first.draft(),2,"sharps"),first.baseRevisionId(),first.song().draftVersion()));
        var pinned=books.detail(id);assertThat(pinned.items().get(1).revisionId()).isEqualTo(first.song().currentRevisionId());assertThat(pinned.items().get(1).latestRevisionId()).isEqualTo(changed.song().currentRevisionId());assertThat(pinned.items().get(1).content()).isEqualTo(first.draft());
        var updated=books.updateItem(id,pinned.book().version(),pinned.items().get(1).id(),changed.song().currentRevisionId(),"Ensaio");
        assertThat(updated.items().get(1).content()).isEqualTo(changed.draft());assertThat(books.detail(b.book().id()).items().getFirst().content()).isEqualTo(first.draft());
        var duplicated=books.add(id,updated.book().version(),second.song().id(),second.song().currentRevisionId(),true);assertThat(duplicated.items()).hasSize(3);
        var removed=books.remove(id,duplicated.book().version(),duplicated.items().getFirst().id());assertThat(removed.items().stream().map(Item::position).toList()).containsExactly(0,1);assertThat(songs.detail(second.song().id()).revisions()).hasSize(1);
    }
    @Test void exportManifestLeaseRetryImmutableBytesAndInvalidation(){
        var song=song("Export autoral");var book=add(books.create(config("Livro de exportação")),song,false);var id=book.book().id();
        var first=books.begin(id,book.book().version());assertThat(first.leaseToken()).isNotNull();
        var pending=books.begin(id,book.book().version());assertThat(pending.export().id()).isEqualTo(first.export().id());assertThat(pending.leaseToken()).isNull();
        books.fail(id,first.export().id(),first.leaseToken());var retry=books.begin(id,book.book().version());assertThat(retry.export().id()).isEqualTo(first.export().id());assertThat(retry.leaseToken()).isNotEqualTo(first.leaseToken());
        byte[] bytes="%PDF-1.4\nSynthetic API storage fixture\n%%EOF\n".getBytes(StandardCharsets.US_ASCII);
        var index=List.of(new PageIndex(book.items().getFirst().id(),song.draft().title(),3,1));
        var complete=books.complete(id,retry.export().id(),new Result(retry.leaseToken(),retry.export().manifestHash(),Base64.getEncoder().encodeToString(bytes),3,index));
        assertThat(books.pdf(id,complete.id())).isEqualTo(bytes);assertThat(books.begin(id,book.book().version()).export().id()).isEqualTo(complete.id());
        assertThatThrownBy(()->jdbc.update("UPDATE songbook_export SET manifest_json='{}'::jsonb WHERE id=?",complete.id())).hasMessageContaining("immutable");
        var revised=songs.save(song.song().id(),new SongService.Edit(Music.transpose(song.draft(),2,"sharps"),song.baseRevisionId(),song.song().draftVersion()));
        assertThat(books.begin(id,book.book().version()).export().manifestHash()).isEqualTo(complete.manifestHash());
        var next=books.update(id,book.book().version(),config("Livro alterado"));var newExport=books.begin(id,next.book().version());assertThat(newExport.export().id()).isNotEqualTo(complete.id());assertThat(books.export(id,complete.id()).bookVersion()).isEqualTo(book.book().version());assertThat(books.pdf(id,complete.id())).isEqualTo(bytes);assertThat(newExport.manifest().items().getFirst().revisionId()).isNotEqualTo(revised.song().currentRevisionId());
    }
    @Test void isolationEmptyBooksAndInvalidCover(){
        var empty=books.create(config("Livro vazio"));assertThatThrownBy(()->books.begin(empty.book().id(),0L)).isInstanceOf(SongProblem.class).hasMessageContaining("Adicione");
        UUID foreignOwner=UUID.randomUUID(),foreignSong=UUID.randomUUID(),foreignRevision=UUID.randomUUID(),foreignBook=UUID.randomUUID();jdbc.update("INSERT INTO workspace(id,name) VALUES (?,?)",foreignOwner,"Outro dono");jdbc.update("INSERT INTO song(id,owner_id,title,status) VALUES (?,?,?,'reviewed')",foreignSong,foreignOwner,"Música privada");jdbc.update("INSERT INTO song_revision(id,song_id,revision_no,content_json,source) VALUES (?,?,1,'{}'::jsonb,'manual')",foreignRevision,foreignSong);
        assertThatThrownBy(()->books.add(empty.book().id(),0L,foreignSong,foreignRevision,false)).isInstanceOf(SongProblem.class).hasMessageContaining("não encontrada");
        jdbc.update("INSERT INTO songbook(id,owner_id,title,cover_json,layout_json) VALUES (?,?,?,'{}'::jsonb,'{}'::jsonb)",foreignBook,foreignOwner,"Livro privado");assertThatThrownBy(()->books.detail(foreignBook)).isInstanceOf(SongProblem.class).hasMessageContaining("não encontrado");
        var bad=config("Imagem inválida");assertThatThrownBy(()->books.update(empty.book().id(),0L,new Config(bad.title(),bad.subtitle(),bad.organizer(),new Cover(true,"data:image/png;base64,broken","own"),bad.layout()))).isInstanceOf(SongProblem.class);
        var archived=books.archive(empty.book().id(),0L,true);assertThatThrownBy(()->books.update(archived.book().id(),archived.book().version(),config("Não salvar"))).isInstanceOf(SongProblem.class);
    }
}
