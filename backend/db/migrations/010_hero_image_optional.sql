-- Run: psql "$DATABASE_URL" -f db/migrations/010_hero_image_optional.sql
--
-- Hero banners may now be created with a video only (image no longer required).
-- Existing image-only records are unaffected.

ALTER TABLE hero_banners ALTER COLUMN image_url DROP NOT NULL;
