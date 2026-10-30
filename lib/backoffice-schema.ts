export const backofficeSchema=`
CREATE TABLE IF NOT EXISTS product_content(product_id TEXT PRIMARY KEY REFERENCES products(id),content TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_returns(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),reference TEXT NOT NULL UNIQUE,request_hash TEXT NOT NULL,snapshot TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS admin_returns_order ON admin_returns(order_id);
`;
