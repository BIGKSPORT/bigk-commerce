-- Cover order_lines' variant foreign key for inventory lookups and FK checks.
CREATE INDEX IF NOT EXISTS order_lines_variant ON bigk.order_lines(variant_id);
