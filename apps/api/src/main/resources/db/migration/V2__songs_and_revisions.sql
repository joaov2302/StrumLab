CREATE TABLE song (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES workspace(id),
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(200) NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL CHECK (status IN ('draft', 'reviewed', 'archived')),
    current_revision_id UUID,
    draft_version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX song_owner_updated ON song(owner_id, updated_at DESC);
CREATE TABLE song_revision (
    id UUID PRIMARY KEY,
    song_id UUID NOT NULL REFERENCES song(id),
    revision_no INTEGER NOT NULL CHECK (revision_no > 0),
    content_json JSONB NOT NULL,
    source VARCHAR(16) NOT NULL CHECK (source IN ('manual', 'chordpro', 'restored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (song_id, revision_no),
    UNIQUE (song_id, id)
);
ALTER TABLE song ADD CONSTRAINT song_current_revision_fk
    FOREIGN KEY (id, current_revision_id) REFERENCES song_revision(song_id, id);
CREATE TABLE song_draft (
    song_id UUID PRIMARY KEY REFERENCES song(id),
    base_revision_id UUID,
    content_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (song_id, base_revision_id) REFERENCES song_revision(song_id, id)
);
CREATE FUNCTION protect_song_revision() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Song revisions are immutable';
END;
$$;
CREATE TRIGGER immutable_song_revision BEFORE UPDATE OR DELETE ON song_revision
    FOR EACH ROW EXECUTE FUNCTION protect_song_revision();
