package br.com.strumlab.songs;

import java.util.*;
import java.time.OffsetDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@Service
public class SongService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final UUID owner;
    public SongService(JdbcTemplate jdbc, ObjectMapper json, @Value("${strumlab.workspace-id:00000000-0000-4000-8000-000000000001}") UUID owner) { this.jdbc = jdbc; this.json = json; this.owner = owner; }
    public record Summary(UUID id, String title, String artist, String status, UUID currentRevisionId, long draftVersion, OffsetDateTime updatedAt) {}
    public record Page(List<Summary> items, int total) {}
    public record Revision(UUID id, int revisionNo, SongContent content, String source, OffsetDateTime createdAt) {}
    public record Detail(Summary song, SongContent draft, UUID baseRevisionId, List<Revision> revisions) {}
    public record Edit(SongContent content, UUID baseRevisionId, Long draftVersion) {}
    private Summary map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Summary(rs.getObject("id", UUID.class), rs.getString("title"), rs.getString("artist"), rs.getString("status"), rs.getObject("current_revision_id", UUID.class), rs.getLong("draft_version"), rs.getObject("updated_at", OffsetDateTime.class));
    }
    private Summary owned(UUID id, boolean lock) {
        var rows = jdbc.query("SELECT * FROM song WHERE id=? AND owner_id=?" + (lock ? " FOR UPDATE" : ""), (rs, row) -> map(rs), id, owner);
        if (rows.isEmpty()) throw new SongProblem(404, "Música não encontrada.");
        return rows.getFirst();
    }
    private SongContent decode(String data) { return json.readValue(data, SongContent.class); }
    public Page list(String query, String status, int offset) {
        if (!Set.of("active","draft","reviewed","archived","all").contains(status) || offset < 0 || query.length() > 200) throw new SongProblem(422, "Filtro inválido.");
        String where = " WHERE owner_id=? AND (title ILIKE ? ESCAPE '\\' OR artist ILIKE ? ESCAPE '\\')";
        String pattern = "%" + query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        var args = new ArrayList<Object>(List.of(owner, pattern, pattern));
        if (status.equals("active")) where += " AND status <> 'archived'";
        else if (!status.equals("all")) { where += " AND status=?"; args.add(status); }
        int total = jdbc.queryForObject("SELECT COUNT(*) FROM song" + where, Integer.class, args.toArray());
        args.add(offset);
        var items = jdbc.query("SELECT * FROM song" + where + " ORDER BY updated_at DESC, id LIMIT 50 OFFSET ?", (rs, row) -> map(rs), args.toArray());
        return new Page(items, total);
    }
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public Detail detail(UUID id) {
        var song = owned(id, false);
        var draft = jdbc.queryForMap("SELECT content_json::text AS content, base_revision_id FROM song_draft WHERE song_id=?", id);
        var revisions = jdbc.query("SELECT * FROM song_revision WHERE song_id=? ORDER BY revision_no DESC", (rs, n) -> new Revision(rs.getObject("id", UUID.class), rs.getInt("revision_no"), decode(rs.getString("content_json")), rs.getString("source"), rs.getObject("created_at", OffsetDateTime.class)), id);
        return new Detail(song, decode((String) draft.get("content")), (UUID) draft.get("base_revision_id"), revisions);
    }
    @Transactional
    public Detail create(SongContent content) {
        Music.validate(content); UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO song(id,owner_id,title,artist,status) VALUES (?,?,?,?,'draft')", id, owner, content.title(), content.artist());
        jdbc.update("INSERT INTO song_draft(song_id,content_json) VALUES (?,?::jsonb)", id, json.writeValueAsString(content));
        return detail(id);
    }
    private Summary check(UUID id, Edit edit) {
        if (edit == null || edit.draftVersion() == null) throw new SongProblem(422, "Informe a versão do rascunho.");
        Music.validate(edit.content());
        var song = owned(id, true);
        if (song.status().equals("archived")) throw new SongProblem(409, "Música arquivada. Reabra na biblioteca antes de editar.");
        if (song.draftVersion() != edit.draftVersion() || !Objects.equals(song.currentRevisionId(), edit.baseRevisionId())) throw new SongProblem(409, "Outra edição alterou esta música. Seu rascunho foi preservado nesta tela.");
        return song;
    }
    @Transactional
    public Detail draft(UUID id, Edit edit) {
        check(id, edit);
        writeDraft(id, edit.content(), edit.baseRevisionId());
        return detail(id);
    }
    private void writeDraft(UUID id, SongContent content, UUID base) {
        jdbc.update("UPDATE song_draft SET content_json=?::jsonb, base_revision_id=?, updated_at=CURRENT_TIMESTAMP WHERE song_id=?", json.writeValueAsString(content), base, id);
        jdbc.update("UPDATE song SET title=?, artist=?, draft_version=draft_version+1, updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=?", content.title(), content.artist(), id, owner);
    }
    @Transactional
    public Detail save(UUID id, Edit edit) { check(id, edit); return revision(id, edit.content(), edit.content().sourceType()); }
    @Transactional
    public Detail acceptAnalysis(UUID id, Edit edit) { check(id, edit); return revision(id,edit.content(),"analysis_accepted"); }
    private Detail revision(UUID id, SongContent content, String source) {
        int number = jdbc.queryForObject("SELECT COALESCE(MAX(revision_no),0)+1 FROM song_revision WHERE song_id=?", Integer.class, id);
        UUID revision = UUID.randomUUID();
        jdbc.update("INSERT INTO song_revision(id,song_id,revision_no,content_json,source) VALUES (?,?,?,?::jsonb,?)", revision, id, number, json.writeValueAsString(content), source);
        jdbc.update("UPDATE song SET current_revision_id=?, status='reviewed' WHERE id=? AND owner_id=?", revision, id, owner);
        writeDraft(id, content, revision);
        return detail(id);
    }
    @Transactional
    public Detail restore(UUID id, UUID revisionId, Long draftVersion, UUID baseRevisionId) {
        var current = detail(id);
        var old = current.revisions().stream().filter(r -> r.id().equals(revisionId)).findFirst().orElseThrow(() -> new SongProblem(404, "Revisão não encontrada."));
        check(id, new Edit(old.content(), baseRevisionId, draftVersion));
        return revision(id, old.content(), "restored");
    }
    @Transactional
    public Detail archive(UUID id, boolean archived, Long draftVersion) {
        var song = owned(id, true);
        if (draftVersion == null || song.draftVersion() != draftVersion) throw new SongProblem(409, "A música mudou. Atualize a biblioteca antes de continuar.");
        jdbc.update("UPDATE song SET status=?, draft_version=draft_version+1, updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=?", archived ? "archived" : song.currentRevisionId() == null ? "draft" : "reviewed", id, owner);
        return detail(id);
    }
}
