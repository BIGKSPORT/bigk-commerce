-- Dedicated identity for feat/backoffice-foundation. No production grants.
-- Preparation only: NOLOGIN until explicitly provisioned with a new private password.
-- Rollback: disable this login and remove the branch-specific DATABASE_URL.
-- Retain the role and its records; do not change existing production/staging logins.
DO $migration$
BEGIN
 IF to_regclass('bigk_staging.shop_features') IS NULL THEN
  RETURN; -- This environment does not contain the isolated staging schema.
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='bigk_backoffice_preview') THEN
  CREATE ROLE bigk_backoffice_preview NOLOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 10;
 END IF;
 GRANT bigk_staging_server TO bigk_backoffice_preview;
END $migration$;
