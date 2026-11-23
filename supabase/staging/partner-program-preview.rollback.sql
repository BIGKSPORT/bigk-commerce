-- PREVIEW/STAGING ONLY. Run only if the preview schema change must be reverted.
-- Refuses to remove any object that already contains business/test data.
BEGIN;
DO $rollback$
DECLARE t TEXT; n BIGINT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ambassador_team_bonus_ledger','ambassador_payouts','ambassador_commissions',
    'ambassador_attributions','ambassadors','ambassador_applications',
    'discount_redemptions','discount_codes'
  ] LOOP
    IF to_regclass(format('bigk_staging.%I',t)) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM bigk_staging.%I',t) INTO n;
      IF n>0 THEN RAISE EXCEPTION 'Rollback stopped: bigk_staging.% contains % rows; export/reconcile first.',t,n; END IF;
    END IF;
  END LOOP;
END
$rollback$;
DROP TABLE IF EXISTS bigk_staging.ambassador_team_bonus_ledger;
DROP TABLE IF EXISTS bigk_staging.ambassador_payouts;
DROP TABLE IF EXISTS bigk_staging.ambassador_commissions;
DROP TABLE IF EXISTS bigk_staging.ambassador_attributions;
DROP TABLE IF EXISTS bigk_staging.ambassadors;
DROP TABLE IF EXISTS bigk_staging.ambassador_applications;
DROP TABLE IF EXISTS bigk_staging.discount_redemptions;
DROP TABLE IF EXISTS bigk_staging.discount_codes;
COMMIT;
