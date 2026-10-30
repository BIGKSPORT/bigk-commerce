-- Durable media for serverless hosting. Local/staging review first.

CREATE TABLE IF NOT EXISTS bigk.media_assets(id TEXT PRIMARY KEY,metadata TEXT NOT NULL,original BYTEA NOT NULL,web BYTEA NOT NULL,original_bytes INTEGER NOT NULL CHECK(original_bytes>0),web_bytes INTEGER NOT NULL CHECK(web_bytes>0),created_at TEXT NOT NULL);

ALTER TABLE bigk.media_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk.media_assets FROM PUBLIC,anon,authenticated;
