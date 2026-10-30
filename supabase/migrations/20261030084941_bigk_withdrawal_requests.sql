-- Private customer withdrawal records; test on staging before remote application.

CREATE TABLE IF NOT EXISTS bigk.withdrawal_requests(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES bigk.orders(id),request_key TEXT NOT NULL,request_hash TEXT NOT NULL,snapshot TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'requested',created_at TEXT NOT NULL,resolved_at TEXT,resolution TEXT,UNIQUE(order_id,request_key));
CREATE INDEX IF NOT EXISTS withdrawal_order ON bigk.withdrawal_requests(order_id,status);

ALTER TABLE bigk.withdrawal_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk.withdrawal_requests FROM PUBLIC,anon,authenticated;
