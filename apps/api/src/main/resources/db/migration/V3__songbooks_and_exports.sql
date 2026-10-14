CREATE TABLE songbook (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES workspace(id),
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300) NOT NULL DEFAULT '',
    organizer VARCHAR(200) NOT NULL DEFAULT '',
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    cover_json JSONB NOT NULL,
    layout_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX songbook_owner_updated ON songbook(owner_id,updated_at DESC);
CREATE TABLE songbook_item (
    id UUID PRIMARY KEY,
    songbook_id UUID NOT NULL REFERENCES songbook(id),
    song_id UUID NOT NULL REFERENCES song(id),
    song_revision_id UUID NOT NULL,
    position INTEGER NOT NULL CHECK(position >= 0),
    notes VARCHAR(1000) NOT NULL DEFAULT '',
    FOREIGN KEY(song_id,song_revision_id) REFERENCES song_revision(song_id,id),
    CONSTRAINT songbook_position_unique UNIQUE(songbook_id,position) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE songbook_export (
    id UUID PRIMARY KEY,
    songbook_id UUID NOT NULL REFERENCES songbook(id),
    book_version BIGINT NOT NULL,
    manifest_json JSONB NOT NULL,
    manifest_hash CHAR(64) NOT NULL,
    renderer_version VARCHAR(40) NOT NULL,
    status VARCHAR(16) NOT NULL CHECK(status IN ('pending','completed','failed')),
    lease_token UUID NOT NULL,
    lease_started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pdf_bytes BYTEA,
    pdf_sha256 CHAR(64),
    page_count INTEGER,
    page_index_json JSONB,
    error_code VARCHAR(40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(songbook_id,manifest_hash)
);
CREATE FUNCTION protect_songbook_export() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP='DELETE' OR OLD.status='completed' OR
       NEW.manifest_json IS DISTINCT FROM OLD.manifest_json OR
       NEW.manifest_hash IS DISTINCT FROM OLD.manifest_hash OR
       NEW.songbook_id IS DISTINCT FROM OLD.songbook_id OR
       NEW.book_version IS DISTINCT FROM OLD.book_version OR
       NEW.renderer_version IS DISTINCT FROM OLD.renderer_version THEN
        RAISE EXCEPTION 'Songbook export snapshots are immutable';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER immutable_songbook_export BEFORE UPDATE OR DELETE ON songbook_export
    FOR EACH ROW EXECUTE FUNCTION protect_songbook_export();
