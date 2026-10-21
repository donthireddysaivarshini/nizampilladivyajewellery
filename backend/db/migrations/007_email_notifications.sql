-- Email notification send-log — separate from the existing `notifications` table,
-- which is customer-facing in-app notifications (user_id, title, body, read_at) and
-- isn't shaped for this: no order reference, no send-status/error tracking.
CREATE TABLE IF NOT EXISTS email_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  type text NOT NULL DEFAULT 'new_order',
  recipient text NOT NULL,
  log_status text NOT NULL CHECK (log_status IN ('sent','failed')),
  error_message text,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_email_notification_log_order ON email_notification_log(order_id);

DROP TRIGGER IF EXISTS trg_email_notification_log_updated_at ON email_notification_log;
CREATE TRIGGER trg_email_notification_log_updated_at BEFORE UPDATE ON email_notification_log FOR EACH ROW EXECUTE FUNCTION set_updated_at();
