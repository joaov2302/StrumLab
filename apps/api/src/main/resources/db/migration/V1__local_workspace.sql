CREATE TABLE workspace (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Synthetic local workspace. This is not an authenticated user identity.
INSERT INTO workspace (id, name)
VALUES ('00000000-0000-4000-8000-000000000001', 'Biblioteca local');
