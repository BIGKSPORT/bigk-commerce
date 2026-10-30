/** Append-only warehouse return receipt. Deployment requires explicit DB migration. */
export const warehouseReceiptSchema=`
CREATE TABLE IF NOT EXISTS warehouse_return_receipts (
 id TEXT PRIMARY KEY,
 request_key TEXT NOT NULL UNIQUE,
 return_id TEXT NOT NULL,
 order_id TEXT NOT NULL,
 variant_id TEXT NOT NULL,
 received_quantity INTEGER NOT NULL CHECK(received_quantity >= 0),
 staff_id TEXT NOT NULL,
 condition_snapshot TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS warehouse_return_receipts_return
ON warehouse_return_receipts(return_id,created_at);
`;
