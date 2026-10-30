export const mediaSchema=`
CREATE TABLE IF NOT EXISTS media_assets(id TEXT PRIMARY KEY,metadata TEXT NOT NULL,original BLOB NOT NULL,web BLOB NOT NULL,original_bytes INTEGER NOT NULL CHECK(original_bytes>0),web_bytes INTEGER NOT NULL CHECK(web_bytes>0),created_at TEXT NOT NULL);
`;
