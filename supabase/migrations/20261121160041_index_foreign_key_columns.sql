BEGIN;
DO $$
BEGIN
 IF to_regclass('bigk.approvals') IS NOT NULL THEN CREATE INDEX IF NOT EXISTS approvals_task_id_idx ON bigk.approvals(task_id); END IF;
 IF to_regclass('bigk.artifacts') IS NOT NULL THEN CREATE INDEX IF NOT EXISTS artifacts_task_id_idx ON bigk.artifacts(task_id); END IF;
 IF to_regclass('bigk.discount_redemptions') IS NOT NULL THEN CREATE INDEX IF NOT EXISTS discount_redemptions_code_idx ON bigk.discount_redemptions(code); END IF;
 IF to_regclass('bigk.runs') IS NOT NULL THEN CREATE INDEX IF NOT EXISTS runs_agent_id_idx ON bigk.runs(agent_id); CREATE INDEX IF NOT EXISTS runs_task_id_idx ON bigk.runs(task_id); END IF;
 IF to_regclass('bigk.seller_sessions') IS NOT NULL THEN CREATE INDEX IF NOT EXISTS seller_sessions_seller_id_idx ON bigk.seller_sessions(seller_id); END IF;
 IF to_regclass('bigk.tasks') IS NOT NULL THEN CREATE INDEX IF NOT EXISTS tasks_agent_id_idx ON bigk.tasks(agent_id); END IF;
 IF to_regnamespace('bigk_staging') IS NOT NULL AND to_regclass('bigk_staging.seller_sessions') IS NOT NULL THEN CREATE INDEX IF NOT EXISTS seller_sessions_seller_id_idx ON bigk_staging.seller_sessions(seller_id); END IF;
 IF to_regclass('public.products') IS NOT NULL THEN CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id); END IF;
END $$;
COMMIT;
