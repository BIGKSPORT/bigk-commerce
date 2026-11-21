BEGIN;
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['agents','tasks','approvals','runs','artifacts','settings','preview_checks'] LOOP
  IF to_regclass('bigk.'||t) IS NOT NULL THEN
   EXECUTE format('DROP POLICY IF EXISTS deny_non_owner ON bigk.%I',t);
   EXECUTE format('CREATE POLICY deny_non_owner ON bigk.%I FOR ALL TO PUBLIC USING (false) WITH CHECK (false)',t);
  END IF;
 END LOOP;
 IF to_regclass('bigk_staging.warehouse_return_receipts') IS NOT NULL THEN
  DROP POLICY IF EXISTS deny_non_owner ON bigk_staging.warehouse_return_receipts;
  CREATE POLICY deny_non_owner ON bigk_staging.warehouse_return_receipts FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
 END IF;
END $$;
COMMIT;
