-- Run: psql "$DATABASE_URL" -f db/migrations/013_product_color_videos.sql
--
-- Per-color variant videos for the product detail page (mirrors
-- product_color_images). A product can have zero or one video per color.

CREATE TABLE IF NOT EXISTS product_color_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_hex text NOT NULL,
  video_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

DROP TRIGGER IF EXISTS trg_product_color_videos_updated_at ON product_color_videos;
CREATE TRIGGER trg_product_color_videos_updated_at BEFORE UPDATE ON product_color_videos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
