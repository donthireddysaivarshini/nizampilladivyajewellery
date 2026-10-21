-- Run: psql "$DATABASE_URL" -f db/migrations/014_wishlist.sql
--
-- User wishlist. Soft-deleted like the rest of the schema; the composite
-- primary key keeps one entry per user/product. Re-adding a previously
-- removed item just re-activates the same row.

CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON wishlist_items(user_id);
