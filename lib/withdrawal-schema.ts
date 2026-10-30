export const withdrawalSchema=`
CREATE TABLE IF NOT EXISTS withdrawal_requests(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),request_key TEXT NOT NULL,request_hash TEXT NOT NULL,snapshot TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'requested',created_at TEXT NOT NULL,resolved_at TEXT,resolution TEXT,UNIQUE(order_id,request_key));
CREATE INDEX IF NOT EXISTS withdrawal_order ON withdrawal_requests(order_id,status);
`;
