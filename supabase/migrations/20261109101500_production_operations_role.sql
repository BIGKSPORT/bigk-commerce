-- Connect the existing production server login to the additive operations role.
-- Tested with staging's equivalent role membership; no browser-role access is added.
-- Rollback: revert the application before REVOKE bigk_server FROM bigk_production_web.
-- Keep all tables, invoice counters and audit records.
DO $migration$
BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='bigk_production_web')
 AND EXISTS(SELECT 1 FROM pg_roles WHERE rolname='bigk_server')
 AND to_regclass('bigk.shop_features') IS NOT NULL THEN
  GRANT bigk_server TO bigk_production_web;
 END IF;
END $migration$;
