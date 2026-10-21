-- Run: psql "$DATABASE_URL" -f db/migrations/012_user_address_email.sql
--
-- Customer email for order updates. Kept nullable so existing saved addresses
-- remain valid — when a saved address has no email we fall back to the user's
-- account email when composing order-status emails.

ALTER TABLE user_addresses
  ADD COLUMN IF NOT EXISTS email text;
