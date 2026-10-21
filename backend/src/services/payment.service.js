import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { razorpay } from '../config/razorpay.js'
import { orderRepository } from '../repositories/order.repository.js'
import { paymentRepository } from '../repositories/payment.repository.js'
import { notificationService } from './notification.service.js'
import { logger } from '../utils/logger.js'

export const paymentService = {
  async createOrder(userId, { orderId }) {
    if (!razorpay) throw Object.assign(new Error('Razorpay is not configured - missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET'), { statusCode: 503 })
    const order = await orderRepository.getOrder(userId, orderId)
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
    if (order.paymentStatus === 'paid') throw Object.assign(new Error('Order is already paid'), { statusCode: 409 })
    const amount = Math.round(Number(order.total) * 100)
    if (!amount || amount <= 0) throw Object.assign(new Error('Invalid amount'), { statusCode: 400 })
    try {
      const providerOrder = await razorpay.orders.create({ amount, currency: 'INR', receipt: orderId })
      const payment = await paymentRepository.createPayment({ orderId, userId, providerOrderId: providerOrder.id, amount, currency: 'INR' })
      return { keyId: env.RAZORPAY_KEY_ID, razorpayOrder: providerOrder, payment }
    } catch (error) {
      throw Object.assign(new Error(`Payment order creation failed: ${error.message}`), { statusCode: 502 })
    }
  },

  async verify(data) {
    if (!data.razorpayOrderId || !data.razorpayPaymentId || !data.razorpaySignature) {
      throw Object.assign(new Error('Missing required payment data'), { statusCode: 400 })
    }
    const body = `${data.razorpayOrderId}|${data.razorpayPaymentId}`
    const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(body).digest('hex')
    if (expected !== data.razorpaySignature) throw Object.assign(new Error('Payment signature verification failed'), { statusCode: 400 })
    let result
    try {
      result = await paymentRepository.markPaymentSuccess(data)
    } catch (error) {
      throw Object.assign(new Error(`Payment verification failed: ${error.message}`), { statusCode: 502 })
    }

    // The new-order email belongs here, not at order creation — this is the point
    // where payment_status actually becomes 'paid'. orderJustPaid guards against
    // sending a duplicate email if verify() is retried for an already-paid order.
    if (result.orderJustPaid) {
      notificationService.sendNewOrderEmail(data.orderId).catch(error =>
        logger.error('Unhandled error dispatching order email after payment', { orderId: data.orderId, error: error.message })
      )
      notificationService.sendCustomerOrderEmail(data.orderId, 'order_placed').catch(error =>
        logger.error('Unhandled error dispatching customer order email after payment', { orderId: data.orderId, error: error.message })
      )
    }

    return result
  },

  history: (userId, filters) => paymentRepository.history(userId, filters),

  async webhook(rawBody, signature) {
    const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET || '').update(rawBody).digest('hex')
    if (expected !== signature) throw Object.assign(new Error('Invalid webhook signature'), { statusCode: 400 })

    const event = JSON.parse(rawBody)
    const { payload, event: eventType } = event

    switch (eventType) {
      case 'payment.captured': {
        const paymentEntity = payload.payment.entity
        const providerOrderId = paymentEntity.order_id
        const providerPaymentId = paymentEntity.id
        const amount = paymentEntity.amount

        const existingPayment = await paymentRepository.findByProviderOrderId(providerOrderId)
        if (existingPayment) {
          if (existingPayment.status === 'success') {
            return { received: true, status: 'already_processed' }
          }
          await paymentRepository.markPaymentSuccess({
            razorpayOrderId: providerOrderId,
            razorpayPaymentId: providerPaymentId,
            razorpaySignature: signature,
            orderId: existingPayment.order_id
          })
        }
        break
      }
      case 'payment.failed': {
        const paymentEntity = payload.payment.entity
        const providerPaymentId = paymentEntity.id
        const errorDescription = paymentEntity.error_description || 'Payment failed'

        const existingPayment = await paymentRepository.findByProviderPaymentId(providerPaymentId)
        if (existingPayment && existingPayment.status !== 'success') {
          await paymentRepository.markPaymentFailed(existingPayment.id, { error: { description: errorDescription } })
        }
        break
      }
      case 'refund.processed':
      case 'refund.failed': {
        const refundEntity = payload.refund.entity
        const providerPaymentId = refundEntity.payment_id
        const refundId = refundEntity.id
        const status = eventType === 'refund.processed' ? 'refunded' : 'refund_failed'

        const existingPayment = await paymentRepository.findByProviderPaymentId(providerPaymentId)
        if (existingPayment) {
          await paymentRepository.createTransaction({
            paymentId: existingPayment.id,
            type: 'refund',
            status,
            amount: refundEntity.amount,
            payload: { refundId, ...refundEntity }
          })
        }
        break
      }
    }

    return { received: true }
  }
}