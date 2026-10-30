export const shippingTestSchema=`CREATE TABLE IF NOT EXISTS shipping_test_attempts(
 reference TEXT PRIMARY KEY,
 state TEXT NOT NULL CHECK(state IN ('checking','submitting','created','rejected','uncertain')),
 shipment_id TEXT,
 diagnostic TEXT,
 updated_at TEXT NOT NULL
);`;
