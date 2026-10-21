import { returnExchangeRepository } from '../repositories/returnExchange.repository.js'
import { generateCouponCode } from '../utils/couponCode.js'
import { logger } from '../utils/logger.js'

const DELIVERED_STATUS = 'delivered'

export const returnExchangeService = {
  // ---------- Customer-facing ----------

  async create(userId, orderId, orderItemId, data) {
    const item = await returnExchangeRepository.getEligibleOrderItem(userId, orderId, orderItemId)
    if (!item) throw Object.assign(new Error('Order item not found'), { statusCode: 404 })

    if (item.status !== DELIVERED_STATUS || !item.deliveredAt) {
      throw Object.assign(new Error('Return or exchange is only available once the order is delivered'), { statusCode: 400 })
    }

    const windowDays = await returnExchangeRepository.getReturnWindowDays()
    const deadline = new Date(item.deliveredAt)
    deadline.setDate(deadline.getDate() + windowDays)
    if (new Date() > deadline) {
      throw Object.assign(new Error(`The ${windowDays}-day return/exchange window for this item has ended`), { statusCode: 400 })
    }

    if (await returnExchangeRepository.hasOpenRequest(orderItemId)) {
      throw Object.assign(new Error('A return/exchange request is already open for this item'), { statusCode: 409 })
    }

    const request = await returnExchangeRepository.createRequest(userId, orderId, orderItemId, data)
    return request
  },

  list: (userId, filters) => returnExchangeRepository.listOwnRequests(userId, filters),

  get: async (userId, id) => {
    const request = await returnExchangeRepository.getOwnRequest(userId, id)
    if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 })
    return request
  },

  listCoupons: (userId, filters) => returnExchangeRepository.listOwnCoupons(userId, filters),

  // ---------- Admin-facing ----------

  adminList: (filters) => returnExchangeRepository.adminListRequests(filters),

  adminGet: async (id) => {
    const request = await returnExchangeRepository.adminGetRequest(id)
    if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 })
    return request
  },

  // decision: 'approved' | 'rejected'
  async adminDecide(id, adminUserId, decision, remarks) {
    if (!['approved', 'rejected'].includes(decision)) {
      throw Object.assign(new Error('status must be approved or rejected'), { statusCode: 400 })
    }

    const request = await returnExchangeRepository.adminGetRequest(id)
    if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 })
    if (request.status !== 'requested') {
      throw Object.assign(new Error('This request has already been resolved'), { statusCode: 409 })
    }

    if (decision === 'rejected') {
      const updated = await returnExchangeRepository.markRejected(id, adminUserId, remarks)
      if (!updated) throw Object.assign(new Error('Unable to reject this request'), { statusCode: 409 })
      return { status: updated.status }
    }

    if (request.type === 'return') {
      const updated = await returnExchangeRepository.approveReturn(id, adminUserId, remarks)
      if (!updated) throw Object.assign(new Error('Unable to approve this request'), { statusCode: 409 })
      return { status: updated.status }
    }

    // type === 'exchange' — coupon value = the amount the customer actually PAID for this
    // item, not its pre-discount price. Order-level discounts (promo codes) aren't stored
    // per item, so we allocate the order's discount_amount across items proportionally by
    // each item's share of the order subtotal, then subtract that share from the item total.
    // This matches standard practice (Amazon/Flipkart/Myntra all refund/exchange based on
    // amount paid, never MRP). With multiple items, per-item rounding means the sum of all
    // shares may be off by a rupee or two from the order's total discount — normal and
    // expected, not a bug.
    const orderSubtotal = Number(request.orderSubtotal) || 0
    const orderDiscount = Number(request.orderDiscount) || 0
    const itemTotal = Number(request.itemTotal) || 0
    const itemDiscountShare = orderSubtotal > 0 ? Math.round((orderDiscount * itemTotal) / orderSubtotal) : 0
    const paidForItem = Math.max(itemTotal - itemDiscountShare, 0)

    // Shipping is only credited once per order: if an earlier item from the same order was
    // already exchanged (a coupon already exists for this order_id), this coupon only covers
    // the item's paid amount. Manual return refunds (outside the system) aren't tracked here,
    // so if an order mixes a manual return refund with a later exchange, double-check shipping
    // wasn't already paid out manually before approving.
    const windowDays = await returnExchangeRepository.getReturnWindowDays()
    const shippingAlreadyCredited = await returnExchangeRepository.hasIssuedCouponForOrder(request.orderId)
    const value = paidForItem + (shippingAlreadyCredited ? 0 : Number(request.shippingAmount || 0))
    if (value <= 0) {
      throw Object.assign(new Error('This item has no remaining value to exchange (fully discounted, shipping already credited elsewhere)'), { statusCode: 409 })
    }
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + windowDays)

    let result = null
    let lastError = null
    for (let attempt = 0; attempt < 3 && !result; attempt++) {
      try {
        result = await returnExchangeRepository.approveExchange(id, adminUserId, remarks, {
          code: generateCouponCode(),
          value,
          expiresAt
        })
      } catch (error) {
        lastError = error
        if (error.code !== '23505') throw error // only retry on coupon code collisions
      }
    }
    if (!result) {
      if (lastError) throw lastError
      throw Object.assign(new Error('Unable to approve this request'), { statusCode: 409 })
    }
    return { status: result.request.status, coupon: result.coupon }
  },

  async adminRefundReturn(id, adminUserId, remarks) {
    const updated = await returnExchangeRepository.markRefunded(id, adminUserId, remarks)
    if (!updated) throw Object.assign(new Error('Only an approved return can be marked as refunded'), { statusCode: 409 })
    return updated
  },

  adminListCoupons: (filters) => returnExchangeRepository.adminListCoupons(filters)
}