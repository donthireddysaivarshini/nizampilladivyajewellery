import { query } from '../config/db.js'

export const notificationRepository = {
  async logEmail({ orderId, type = 'new_order', recipient, status, errorMessage }) {
    try {
      await query(
        `INSERT INTO email_notification_log(order_id, type, recipient, log_status, error_message)
         VALUES ($1,$2,$3,$4,$5)`,
        [orderId, type, recipient, status, errorMessage || null]
      )
    } catch (error) {
      // Logging the log failure would be circular — just don't let it blow up the caller.
      // The actual failure is already going to logger.error from notification.service.js.
    }
  }
}