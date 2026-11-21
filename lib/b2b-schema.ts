export const b2bSchema=`
CREATE TABLE IF NOT EXISTS b2b_accounts(id TEXT PRIMARY KEY,name TEXT NOT NULL,vat TEXT UNIQUE NOT NULL,email TEXT UNIQUE NOT NULL,contact TEXT NOT NULL,phone TEXT NOT NULL,address TEXT NOT NULL,postal TEXT NOT NULL,city TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS b2b_links(hash TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES b2b_accounts(id),account_version INTEGER NOT NULL,expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS b2b_sessions(hash TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES b2b_accounts(id),account_version INTEGER NOT NULL,expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS b2b_orders(id TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES b2b_accounts(id),version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL CHECK(status IN ('requested','confirmed','paid','fulfilled','cancelled')),customer TEXT NOT NULL,quote TEXT NOT NULL,request_key TEXT UNIQUE NOT NULL,request_hash TEXT NOT NULL,agreement TEXT NOT NULL,invoice_reference TEXT NOT NULL DEFAULT '',payment_instructions TEXT NOT NULL DEFAULT '',payment_url TEXT NOT NULL DEFAULT '',payment_reference TEXT NOT NULL DEFAULT '',tracking TEXT NOT NULL DEFAULT '',commission_seller_id TEXT,commission_rate REAL NOT NULL DEFAULT 0,commission_cents INTEGER NOT NULL DEFAULT 0,commission_bonus_cents INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS b2b_events(id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS b2b_orders_account ON b2b_orders(account_id,created_at);
CREATE INDEX IF NOT EXISTS b2b_orders_status ON b2b_orders(status,updated_at);
CREATE INDEX IF NOT EXISTS b2b_sessions_account ON b2b_sessions(account_id);
CREATE INDEX IF NOT EXISTS b2b_links_account ON b2b_links(account_id);
`;
