-- Run: psql "$DATABASE_URL" -f db/migrations/011_product_variant_price_override.sql
--
-- Per-color + size price override for product variants.
-- Effective selling price  = products.sell_price + price_override
-- Effective MRP            = products.mrp + price_override
-- 0/null means "use the product's normal base price and MRP".

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS price_override numeric(12,2) NOT NULL DEFAULT 0 CHECK (price_override >= 0);
