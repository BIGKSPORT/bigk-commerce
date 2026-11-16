export const salesSchema=`
CREATE TABLE IF NOT EXISTS seller_accounts(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,active INTEGER NOT NULL DEFAULT 1,version INTEGER NOT NULL DEFAULT 1,password_hash TEXT,secret_encrypted TEXT,last_counter BIGINT NOT NULL DEFAULT -1,invite_hash TEXT,invite_expires TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS seller_sessions(hash TEXT PRIMARY KEY,seller_id TEXT NOT NULL REFERENCES seller_accounts(id),account_version INTEGER NOT NULL,expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS seller_customers(id TEXT PRIMARY KEY,seller_id TEXT NOT NULL REFERENCES seller_accounts(id),name TEXT NOT NULL,vat TEXT UNIQUE NOT NULL,contact TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,address TEXT NOT NULL,credit_approved INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS seller_orders(id TEXT PRIMARY KEY,version INTEGER NOT NULL DEFAULT 1,seller_id TEXT NOT NULL REFERENCES seller_accounts(id),customer_id TEXT NOT NULL REFERENCES seller_customers(id),status TEXT NOT NULL CHECK(status IN ('draft','submitted','paid','cancelled')),terms TEXT NOT NULL CHECK(terms IN ('proforma','net30')),quote TEXT NOT NULL,earned_cents INTEGER NOT NULL DEFAULT 0,request_key TEXT UNIQUE NOT NULL,request_hash TEXT NOT NULL,payment_reference TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS seller_events(id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS seller_orders_owner ON seller_orders(seller_id,created_at);
CREATE INDEX IF NOT EXISTS seller_orders_customer ON seller_orders(customer_id,status);
CREATE INDEX IF NOT EXISTS seller_customers_owner ON seller_customers(seller_id);
`;
