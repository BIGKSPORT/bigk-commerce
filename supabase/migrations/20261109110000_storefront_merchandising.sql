-- Additive private draft and separately published homepage document.
-- Rollback: switch off in Admin > Storefront and deploy the previous application.
-- Retain this table and saved campaigns. No product, stock or order data changes.
DO $migration$
DECLARE target text; permission_role text;
BEGIN
 FOREACH target IN ARRAY ARRAY['bigk','bigk_staging'] LOOP
  IF to_regclass(format('%I.orders',target)) IS NULL THEN CONTINUE; END IF;
  permission_role:=CASE WHEN target='bigk' THEN 'bigk_server' ELSE 'bigk_staging_server' END;
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.storefront_merchandising(id TEXT PRIMARY KEY CHECK(id=''homepage''),draft TEXT NOT NULL,published TEXT,version INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL,published_at TEXT)',target);
  EXECUTE format('ALTER TABLE %I.storefront_merchandising ENABLE ROW LEVEL SECURITY',target);
  EXECUTE format('REVOKE ALL ON %I.storefront_merchandising FROM PUBLIC,anon,authenticated',target);
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname=target AND tablename='storefront_merchandising' AND policyname='server_access') THEN
   EXECUTE format('CREATE POLICY server_access ON %I.storefront_merchandising TO %I USING(true) WITH CHECK(true)',target,permission_role);
  END IF;
  EXECUTE format('GRANT SELECT,INSERT,UPDATE ON %I.storefront_merchandising TO %I',target,permission_role);
 END LOOP;
END $migration$;
