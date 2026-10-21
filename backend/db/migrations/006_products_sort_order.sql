ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order, created_at);
