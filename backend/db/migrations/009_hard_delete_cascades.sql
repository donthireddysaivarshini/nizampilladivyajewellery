-- Task 1: permanent order deletion requires fixing FK cascade behavior first.
-- Without this, `DELETE FROM orders` throws a foreign key violation on any order
-- that has a return/exchange request, a redeemed exchange coupon, or a logged email
-- (return_exchange_requests / exchange_coupons / email_notification_log currently
-- have no ON DELETE action, i.e. implicit NO ACTION, which blocks the delete).

ALTER TABLE return_exchange_requests DROP CONSTRAINT IF EXISTS return_exchange_requests_order_id_fkey;
ALTER TABLE return_exchange_requests ADD CONSTRAINT return_exchange_requests_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE return_exchange_requests DROP CONSTRAINT IF EXISTS return_exchange_requests_order_item_id_fkey;
ALTER TABLE return_exchange_requests ADD CONSTRAINT return_exchange_requests_order_item_id_fkey
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE;

ALTER TABLE exchange_coupons DROP CONSTRAINT IF EXISTS exchange_coupons_request_id_fkey;
ALTER TABLE exchange_coupons ADD CONSTRAINT exchange_coupons_request_id_fkey
  FOREIGN KEY (request_id) REFERENCES return_exchange_requests(id) ON DELETE CASCADE;

-- Deliberately SET NULL, not CASCADE: a coupon "used" on the order being deleted may
-- have been *issued* from a completely different order. Deleting it would erase that
-- other order's return history; cascading its status back to reusable would be worse.
-- SET NULL keeps coupon_status='used' (permanently non-reusable) while dropping the
-- now-dangling pointer.
ALTER TABLE exchange_coupons DROP CONSTRAINT IF EXISTS exchange_coupons_used_order_id_fkey;
ALTER TABLE exchange_coupons ADD CONSTRAINT exchange_coupons_used_order_id_fkey
  FOREIGN KEY (used_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- A pure audit log of that specific order — once the order is gone, a log row that
-- can no longer say which order it was about isn't useful evidence, it's exactly the
-- kind of orphaned leftover the client asked to avoid. CASCADE, not SET NULL.
ALTER TABLE email_notification_log DROP CONSTRAINT IF EXISTS email_notification_log_order_id_fkey;
ALTER TABLE email_notification_log ADD CONSTRAINT email_notification_log_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- NOTE: constraint names above assume the default Postgres auto-naming convention
-- (<table>_<column>_fkey), which is what unnamed inline REFERENCES produces — true for
-- these tables since they were created via the migrations already in this project. If
-- any of these were later renamed manually, check with:
--   SELECT conname FROM pg_constraint WHERE conrelid = 'exchange_coupons'::regclass;
-- and adjust the DROP CONSTRAINT lines accordingly before running this.
