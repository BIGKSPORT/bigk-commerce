-- Correct over-broad DELETE privileges on partner records.
-- Production only. This migration does not alter rows, table structure, or RLS policies.
-- The partner API currently has no delete operation; preserve records and audit history.
BEGIN;

DO $migration$
BEGIN
  IF to_regclass('bigk.ambassador_applications') IS NULL
     OR to_regclass('bigk.ambassadors') IS NULL
     OR to_regclass('bigk.ambassador_attributions') IS NULL
     OR to_regclass('bigk.ambassador_commissions') IS NULL
     OR to_regclass('bigk.ambassador_payouts') IS NULL
     OR to_regclass('bigk.ambassador_team_bonus_ledger') IS NULL THEN
    RAISE EXCEPTION
      'Production partner tables are missing from schema bigk; refusing privilege correction.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'bigk_production_web'
  ) THEN
    RAISE EXCEPTION
      'Required production role bigk_production_web does not exist; refusing privilege correction.';
  END IF;
END
$migration$;

REVOKE DELETE ON TABLE
  bigk.ambassador_applications,
  bigk.ambassadors,
  bigk.ambassador_attributions,
  bigk.ambassador_commissions,
  bigk.ambassador_payouts,
  bigk.ambassador_team_bonus_ledger
FROM bigk_production_web;

COMMIT;
