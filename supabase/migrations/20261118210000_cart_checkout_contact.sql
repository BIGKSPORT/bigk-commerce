-- Apply only to an explicitly approved environment.
ALTER TABLE IF EXISTS bigk.cart_sessions
 ADD COLUMN IF NOT EXISTS contact_email text,
 ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
 ADD COLUMN IF NOT EXISTS marketing_consent_version text;
ALTER TABLE IF EXISTS bigk_staging.cart_sessions
 ADD COLUMN IF NOT EXISTS contact_email text,
 ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
 ADD COLUMN IF NOT EXISTS marketing_consent_version text;
