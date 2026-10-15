CREATE TABLE playlist_import (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES workspace(id),
 provider text NOT NULL DEFAULT 'spotify' CHECK(provider='spotify'), external_id varchar(22) NOT NULL,
 source_url text NOT NULL, title varchar(300) NOT NULL DEFAULT 'Playlist Spotify', snapshot_id text,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','ready','failed','cancelled')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3), error_code text,
 lease_token uuid, lease_until timestamptz, retry_after timestamptz,
 version bigint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(owner_id,external_id)
);
CREATE TABLE playlist_import_item (
 id uuid PRIMARY KEY, import_id uuid NOT NULL REFERENCES playlist_import(id) ON DELETE CASCADE,
 position integer NOT NULL CHECK(position>=0), external_id varchar(22), title varchar(300) NOT NULL,
 artist varchar(300) NOT NULL DEFAULT '', available boolean NOT NULL,
 selected boolean NOT NULL DEFAULT false,
 status text NOT NULL CHECK(status IN ('needs_input','pending','processing','ready','failed','skipped','cancelled')),
 error_code text, attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3),
 lease_token uuid, lease_until timestamptz,
 song_id uuid, revision_id uuid,
 FOREIGN KEY(song_id,revision_id) REFERENCES song_revision(song_id,id),
 UNIQUE(import_id,position)
);
CREATE TABLE playlist_export_selection (
 import_id uuid NOT NULL REFERENCES playlist_import(id) ON DELETE CASCADE,
 request_key uuid NOT NULL, songbook_id uuid NOT NULL REFERENCES songbook(id),
 selection_json jsonb NOT NULL, PRIMARY KEY(import_id,request_key)
);
CREATE INDEX playlist_import_queue ON playlist_import(status,created_at);
CREATE INDEX playlist_item_queue ON playlist_import_item(status,import_id,position);
