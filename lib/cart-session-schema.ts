export const cartSessionSchema=`CREATE TABLE IF NOT EXISTS cart_sessions(id TEXT PRIMARY KEY,items TEXT NOT NULL,stage TEXT NOT NULL,total INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,expires_at TEXT NOT NULL,order_id TEXT,contact_email TEXT,marketing_consent INTEGER NOT NULL DEFAULT 0,marketing_consent_at TEXT,marketing_consent_version TEXT);
CREATE INDEX IF NOT EXISTS cart_sessions_updated ON cart_sessions(updated_at);
CREATE INDEX IF NOT EXISTS cart_sessions_expires ON cart_sessions(expires_at);`;
