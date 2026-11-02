export const backofficeSchema=`
CREATE TABLE IF NOT EXISTS product_content(product_id TEXT PRIMARY KEY REFERENCES products(id),content TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_returns(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),reference TEXT NOT NULL UNIQUE,request_hash TEXT NOT NULL,snapshot TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS admin_returns_order ON admin_returns(order_id);
`;
export const productHistorySchema=`
CREATE TABLE IF NOT EXISTS product_revisions(id TEXT PRIMARY KEY,product_id TEXT NOT NULL REFERENCES products(id),version INTEGER NOT NULL,snapshot TEXT NOT NULL,action TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS product_revisions_product ON product_revisions(product_id,created_at);
`;
export const adminCredentialSchema=`
CREATE TABLE IF NOT EXISTS admin_credentials(id TEXT PRIMARY KEY,password_hash TEXT NOT NULL,recovery_hash TEXT NOT NULL,updated_at TEXT NOT NULL);
`;

export const adminMfaSchema=`CREATE TABLE IF NOT EXISTS admin_mfa(id TEXT PRIMARY KEY,secret_encrypted TEXT NOT NULL,last_counter BIGINT NOT NULL,backup_hashes TEXT NOT NULL,updated_at TEXT NOT NULL);`;
