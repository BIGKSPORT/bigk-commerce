/** SQLite test schema. PostgreSQL changes live in a new idempotent migration. */
export const operationsSchema = `
CREATE TABLE IF NOT EXISTS shop_features(name TEXT PRIMARY KEY,enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS staff_accounts(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,role TEXT NOT NULL CHECK(role IN ('stock_manager','warehouse_manager')),active INTEGER NOT NULL DEFAULT 1,password_hash TEXT,secret_encrypted TEXT,last_counter BIGINT NOT NULL DEFAULT -1,invite_hash TEXT UNIQUE,invite_expires TEXT,version INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS staff_sessions(hash TEXT PRIMARY KEY,staff_id TEXT NOT NULL REFERENCES staff_accounts(id),account_version INTEGER NOT NULL,expires_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS staff_sessions_staff ON staff_sessions(staff_id);
CREATE TABLE IF NOT EXISTS operations_audit(id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,actor_name TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL,details TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS operations_audit_created ON operations_audit(created_at);
CREATE TABLE IF NOT EXISTS customer_messages(id TEXT PRIMARY KEY,customer_id TEXT NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,body TEXT NOT NULL,request_hash TEXT NOT NULL,actor_id TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('prepared','accepted','failed')),created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS customer_messages_customer ON customer_messages(customer_id,created_at);
CREATE TABLE IF NOT EXISTS invoice_counters(year INTEGER PRIMARY KEY,last_number INTEGER NOT NULL CHECK(last_number>0));
CREATE TABLE IF NOT EXISTS order_invoices(order_id TEXT PRIMARY KEY REFERENCES orders(id),number TEXT NOT NULL UNIQUE,snapshot TEXT NOT NULL,created_at TEXT NOT NULL);
`;
