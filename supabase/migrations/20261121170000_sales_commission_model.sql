BEGIN;
DO $$
BEGIN
 IF to_regclass('bigk.seller_accounts') IS NOT NULL
    AND to_regclass('bigk.seller_customers') IS NOT NULL THEN
  CREATE TABLE IF NOT EXISTS bigk.seller_customer_activities(
   id TEXT PRIMARY KEY,
   seller_id TEXT NOT NULL REFERENCES bigk.seller_accounts(id),
   customer_id TEXT NOT NULL REFERENCES bigk.seller_customers(id),
   activity_at TEXT NOT NULL,
   note TEXT NOT NULL,
   created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS seller_customer_activities_recent
   ON bigk.seller_customer_activities(customer_id,seller_id,activity_at DESC);
  ALTER TABLE bigk.seller_customer_activities ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON bigk.seller_customer_activities FROM PUBLIC,anon,authenticated;
  GRANT SELECT,INSERT,UPDATE,DELETE ON bigk.seller_customer_activities TO bigk_server;
  DROP POLICY IF EXISTS seller_server_access ON bigk.seller_customer_activities;
  CREATE POLICY seller_server_access ON bigk.seller_customer_activities
   TO bigk_server USING (true) WITH CHECK (true);
 END IF;
END $$;
COMMIT;
