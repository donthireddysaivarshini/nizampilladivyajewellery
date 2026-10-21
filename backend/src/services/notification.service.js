import { env } from '../config/env.js'
import { mailer } from '../config/mailer.js'
import { logger } from '../utils/logger.js'
import { orderRepository } from '../repositories/order.repository.js'
import { returnExchangeRepository } from '../repositories/returnExchange.repository.js'
import { notificationRepository } from '../repositories/notification.repository.js'
import { buildOrderNotificationEmail } from '../utils/emailTemplates/orderNotification.js'
import { buildCustomerOrderEmail } from '../utils/emailTemplates/customerOrderNotification.js'
import { buildReturnExchangeEmail } from '../utils/emailTemplates/returnExchangeNotification.js'

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`
const MAX_ATTEMPTS = 2
const RETRY_DELAY_MS = 1500

function isEmailEnabled() {
  if (!env.MAIL_NOTIFICATIONS_ENABLED) {
    logger.info('Email notifications disabled, skipping')
    return false
  }
  if (!mailer) {
    logger.error('Email notification skipped — SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD)')
    return false
  }
  return true
}

// Shared send helper: fire-and-forget from the caller's perspective. Never throws,
// retries once, and logs the outcome to email_notification_log on final success/failure.
async function sendEmail({ orderId = null, type = 'generic', to, subject, html }) {
  if (!isEmailEnabled()) return
  if (!to) {
    logger.error('Email notification skipped — no recipient available', { orderId, type })
    return
  }
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await mailer.sendMail({
        from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_EMAIL}>`,
        to,
        subject,
        html
      })
      await notificationRepository.logEmail({ orderId, type, recipient: to, status: 'sent' })
      logger.info('Email sent', { orderId, type, to })
      return
    } catch (error) {
      const isLastAttempt = attempt === MAX_ATTEMPTS
      logger.error('Email send attempt failed', { orderId, type, attempt, error: error.message })
      if (isLastAttempt) {
        await notificationRepository.logEmail({ orderId, type, recipient: to, status: 'failed', errorMessage: error.message })
      } else {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      }
    }
  }
}

async function loadOrderForEmail(orderId) {
  const order = await orderRepository.getOrderForNotification(orderId)
  if (!order) throw new Error('Order not found')
  return order
}

export const notificationService = {
  // ---------- Admin notifications ----------

  // Fire-and-forget from the caller's perspective — this function catches everything
  // itself and never throws, so order creation can never fail because of email.
  async sendNewOrderEmail(orderId) {
    const recipients = (env.MAIL_ADMIN_RECIPIENTS || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!recipients.length) {
      logger.error('Email notification skipped — MAIL_ADMIN_RECIPIENTS is not configured', { orderId })
      return
    }
    let order
    try {
      order = await loadOrderForEmail(orderId)
    } catch (error) {
      logger.error('Could not load order for email notification', { orderId, error: error.message })
      return
    }
    const adminUrl = env.FRONTEND_URL ? `${env.FRONTEND_URL}/admin?tab=orders` : undefined
    const html = buildOrderNotificationEmail(order, adminUrl)
    const subject = `New Order ${order.orderNumber} — ${money(order.total)}`
    await sendEmail({ orderId, type: 'new_order', to: recipients.join(','), subject, html })
  },

  // ---------- Customer notifications ----------

  // Customer-facing order status emails. type ∈ {order_placed, order_shipped,
  // order_delivered, order_cancelled}. Never throws — order flows can't break on email.
  async sendCustomerOrderEmail(orderId, type, extra = {}) {
    let order
    try {
      order = await loadOrderForEmail(orderId)
    } catch (error) {
      logger.error('Could not load order for customer email', { orderId, type, error: error.message })
      return
    }
    const config = {
      order_placed: {
        headline: 'Your order has been placed',
        message: 'Thank you for shopping with us! We have received your order and will update you once it ships.',
        subject: `Order Confirmed ${order.orderNumber}`
      },
      order_shipped: {
        headline: 'Your order is on its way',
        message: 'Great news — your order has been shipped and is on its way to you.',
        subject: `Your order ${order.orderNumber} has shipped`
      },
      order_delivered: {
        headline: 'Your order has been delivered',
        message: 'We hope you love your new purchase! If anything isn\u2019t right, you can start a return or exchange from your profile within the return window.',
        subject: `Your order ${order.orderNumber} has been delivered`
      },
      order_cancelled: {
        headline: 'Your order has been cancelled',
        message: extra.cancelReason || 'As requested, your order has been cancelled. Any payment made will be refunded to your original payment method within 5\u20137 business days.',
        subject: `Your order ${order.orderNumber} has been cancelled`
      }
    }[type]
    if (!config) {
      logger.error('Unknown customer email type', { orderId, type })
      return
    }
    const html = buildCustomerOrderEmail(order, {
      headline: config.headline,
      message: config.message,
      trackingUrl: type === 'order_shipped' ? order.trackingUrl || undefined : undefined
    })
    await sendEmail({ orderId, type, to: order.customerEmail, subject: config.subject, html })
  },

  // Customer-facing return/exchange emails.
  // type ∈ {request_submitted, request_approved, request_rejected}
  // coupon (for approved exchanges) carries { code, value, expiresAt }.
  async sendReturnExchangeEmail(requestId, type, extra = {}) {
    let request
    try {
      request = await returnExchangeRepository.adminGetRequest(requestId)
      if (!request) throw new Error('Request not found')
    } catch (error) {
      logger.error('Could not load return/exchange request for email', { requestId, type, error: error.message })
      return
    }
    const config = {
      request_submitted: {
        headline: 'We received your request',
        message: `Your ${request.type} request for ${request.productName}${request.size ? ` (${request.size})` : ''} has been submitted. Our team will review it and update you by email.`,
        subject: `${request.type === 'exchange' ? 'Exchange' : 'Return'} request received · ${request.orderNumber}`
      },
      request_approved: {
        headline: 'Your request has been approved',
        message: request.type === 'exchange'
          ? 'Your exchange has been approved. Your exchange coupon is ready to use on your next order.'
          : 'Your return has been approved. We will process your refund to the original payment method within 5\u20137 business days.',
        subject: `${request.type === 'exchange' ? 'Exchange' : 'Return'} approved · ${request.orderNumber}`
      },
      request_rejected: {
        headline: 'Update on your request',
        message: `Unfortunately, your ${request.type} request for ${request.productName} could not be approved.`,
        subject: `${request.type === 'exchange' ? 'Exchange' : 'Return'} update · ${request.orderNumber}`
      }
    }[type]
    if (!config) {
      logger.error('Unknown return/exchange email type', { requestId, type })
      return
    }
    const html = buildReturnExchangeEmail(request, {
      headline: config.headline,
      message: extra.adminRemarks ? `${config.message} ${extra.adminRemarks}` : config.message,
      coupon: extra.coupon || null
    })
    await sendEmail({ orderId: request.orderId, type, to: request.customerEmail, subject: config.subject, html })
  }
}
