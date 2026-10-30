-- Staging only. Never grant this preview role access to the production schema.
CREATE TABLE IF NOT EXISTS bigk_staging.shipping_test_attempts (
 reference text PRIMARY KEY,
 state text NOT NULL CHECK(state IN ('checking','submitting','created','rejected','uncertain')),
 shipment_id text,
 diagnostic text,
 updated_at text NOT NULL
);
ALTER TABLE bigk_staging.shipping_test_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk_staging.shipping_test_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON bigk_staging.shipping_test_attempts TO bigk_staging_server;
DROP POLICY IF EXISTS staging_server ON bigk_staging.shipping_test_attempts;
CREATE POLICY staging_server ON bigk_staging.shipping_test_attempts TO bigk_staging_server USING(true) WITH CHECK(true);
