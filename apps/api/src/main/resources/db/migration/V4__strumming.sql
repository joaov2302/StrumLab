CREATE TABLE strumming_pattern (
 id text NOT NULL, version integer NOT NULL CHECK(version>0), content_json jsonb NOT NULL,
 PRIMARY KEY(id,version)
);
CREATE FUNCTION protect_strumming_catalog() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Pattern versions are immutable'; END $$;
CREATE TRIGGER immutable_strumming_pattern BEFORE UPDATE OR DELETE ON strumming_pattern FOR EACH ROW EXECUTE FUNCTION protect_strumming_catalog();
CREATE TABLE song_strumming (
 song_id uuid PRIMARY KEY REFERENCES song(id), version bigint NOT NULL CHECK(version>0), snapshot_json jsonb
);
ALTER TABLE songbook_item ADD COLUMN strumming_snapshot_json jsonb;
INSERT INTO strumming_pattern VALUES ('pop-folk-basic',1,'{"id": "pop-folk-basic", "name": "Pop / Folk básico", "version": 1, "difficulty": "beginner", "style": "pop-folk", "timeSignature": "4/4", "defaultBpm": 90, "subdivisionsPerBar": 8, "events": [{"slot": 0, "direction": "down", "play": true, "accent": true, "velocity": 1.0}, {"slot": 1, "direction": "up", "play": false, "accent": false, "velocity": 0.75}, {"slot": 2, "direction": "down", "play": true, "accent": false, "velocity": 0.75}, {"slot": 3, "direction": "up", "play": true, "accent": false, "velocity": 0.75}, {"slot": 4, "direction": "down", "play": false, "accent": false, "velocity": 0.75}, {"slot": 5, "direction": "up", "play": true, "accent": false, "velocity": 0.75}, {"slot": 6, "direction": "down", "play": true, "accent": false, "velocity": 0.75}, {"slot": 7, "direction": "up", "play": true, "accent": false, "velocity": 0.75}]}'::jsonb);
