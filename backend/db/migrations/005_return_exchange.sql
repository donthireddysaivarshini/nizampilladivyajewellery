-- Return & Exchange feature
-- Additive migration — does not modify or drop any existing table/column.
-- Rename this file to match your existing db/migrations numbering convention before running.

-- 1. Orders needs a delivery timestamp so the return/exchange window can be computed.
--    (Nothing in the current schema tracks *when* an order became 'delivered'.)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- 2. Unified return + exchange requests, scoped to a single order item.
CREATE TABLE IF NOT EXISTS return_exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  order_item_id uuid NOT NULL REFERENCES order_items(id),
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('return','exchange')),
  reason_category text NOT NULL CHECK (reason_category IN ('damaged','wrong_item','size_issue','not_as_described','quality_issue','other')),
  reason_notes text,
  evidence_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  drive_link text,
  request_status text NOT NULL DEFAULT 'requested' CHECK (request_status IN ('requested','approved','rejected','refunded')),
  admin_remarks text,
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Only one open (requested/approved) request allowed per order item at a time —
-- prevents duplicate/spam submissions on the same item.
CREATE UNIQUE INDEX IF NOT EXISTS idx_rer_one_open_per_item
  ON return_exchange_requests(order_item_id)
  WHERE request_status IN ('requested','approved') AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rer_user ON return_exchange_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rer_admin_queue ON return_exchange_requests(type, request_status, created_at DESC);

-- 3. Exchange coupons — separate from promo_codes because these have per-user
--    ownership, one-time consumption, and system-generated origin rather than
--    admin-authored campaign rules.
CREATE TABLE IF NOT EXISTS exchange_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES return_exchange_requests(id),
  user_id uuid NOT NULL REFERENCES users(id),
  code text UNIQUE NOT NULL,
  value numeric(12,2) NOT NULL CHECK (value > 0),
  coupon_status text NOT NULL DEFAULT 'active' CHECK (coupon_status IN ('active','used','expired','cancelled')),
  expires_at timestamptz NOT NULL,
  used_order_id uuid REFERENCES orders(id),
  used_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exchange_coupons_user ON exchange_coupons(user_id, coupon_status);

-- 4. Configurable return/exchange window, reusing the existing site_settings pattern
--    (same shape as your footer_marquee / announcement_bar entries).
INSERT INTO site_settings(key, value)
VALUES ('return_window_days', '{"days": 10}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. Wire the two new tables into the existing updated_at trigger convention.
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trg_return_exchange_requests_updated_at ON return_exchange_requests;
  CREATE TRIGGER trg_return_exchange_requests_updated_at BEFORE UPDATE ON return_exchange_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  DROP TRIGGER IF EXISTS trg_exchange_coupons_updated_at ON exchange_coupons;
  CREATE TRIGGER trg_exchange_coupons_updated_at BEFORE UPDATE ON exchange_coupons FOR EACH ROW EXECUTE FUNCTION set_updated_at();
END $$;