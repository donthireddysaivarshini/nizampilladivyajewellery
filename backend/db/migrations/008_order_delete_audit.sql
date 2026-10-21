-- Orders already have `deleted_at` (soft-delete). This adds who deleted it, mirroring
-- the resolved_by/resolved_at pattern already used on return_exchange_requests.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id);
