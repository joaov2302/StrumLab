-- Account binding survives API restarts; tokens remain memory-only.
CREATE TABLE spotify_account_binding (
 owner_id uuid PRIMARY KEY REFERENCES workspace(id), account_hash text NOT NULL
);
