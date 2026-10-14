ALTER TABLE song_revision DROP CONSTRAINT song_revision_source_check;
ALTER TABLE song_revision ALTER COLUMN source TYPE varchar(24);
ALTER TABLE song_revision ADD CONSTRAINT song_revision_source_check CHECK(source IN ('manual','chordpro','restored','analysis_accepted'));
CREATE TABLE audio_asset (
 id uuid PRIMARY KEY, song_id uuid NOT NULL REFERENCES song(id), owner_id uuid NOT NULL REFERENCES workspace(id),
 sha256 text NOT NULL, extension text NOT NULL CHECK(extension IN ('wav','mp3')), mime text NOT NULL,
 rights_basis text NOT NULL CHECK(rights_basis IN ('own','permission','public_domain')),
 size_bytes integer NOT NULL CHECK(size_bytes BETWEEN 44 AND 20971520), audio_bytes bytea,
 duration_seconds double precision, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','valid','invalid','deleted')),
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at timestamptz,
 UNIQUE(song_id,sha256)
);
CREATE INDEX audio_asset_owner ON audio_asset(owner_id);
CREATE TABLE processing_job (
 id uuid PRIMARY KEY, asset_id uuid NOT NULL REFERENCES audio_asset(id), generation integer NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','needs_input','cancelled')),
 attempts integer NOT NULL DEFAULT 0, lease_token uuid, lease_until timestamptz,
 error_code text, algorithm_version text NOT NULL, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 finished_at timestamptz, UNIQUE(asset_id,generation)
);
CREATE INDEX processing_job_queue ON processing_job(status,created_at);
CREATE TABLE analysis_result (
 id uuid PRIMARY KEY, job_id uuid UNIQUE NOT NULL REFERENCES processing_job(id), result_json jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE FUNCTION protect_analysis_result() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Analysis results are immutable'; END $$;
CREATE TRIGGER immutable_analysis_result BEFORE UPDATE OR DELETE ON analysis_result FOR EACH ROW EXECUTE FUNCTION protect_analysis_result();
CREATE TABLE analysis_acceptance (
 id uuid PRIMARY KEY, job_id uuid NOT NULL REFERENCES processing_job(id), request_key uuid NOT NULL,
 song_revision_id uuid NOT NULL REFERENCES song_revision(id), selection_json jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(job_id,request_key)
);
