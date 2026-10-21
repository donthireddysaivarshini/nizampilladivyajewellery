import { orderRepository } from '../repositories/order.repository.js'
import { computeShippingFee } from '../config/shipping.js'
import { logger } from '../utils/logger.js'

// shipping is only relevant for 'exchange' coupons — their value bundles the original
// order's shipping fee, so both the minimum-cart gate and the discount cap must compare
// against (subtotal + shipping), not subtotal alone, or a same-price re-purchase can fail
// the minimum-cart check by exactly the shipping amount. Regular admin promo codes
// ('percentage' / 'fixed') are unaffected — their min_cart still checks subtotal only.
function computePromo(promo, subtotal, shipping = 0) {
  if (!promo) return 0
  const eligibleAmount = promo.type === 'exchange' ? subtotal + shipping : subtotal
  if (eligibleAmount < Number(promo.min_cart || 0)) {
    throw Object.assign(new Error(`Minimum order ₹${promo.min_cart} required to use this code`), { statusCode: 400 })
  }
  if (promo.type === 'percentage') return Math.round(subtotal * (Number(promo.value) / 100))
  if (promo.type === 'fixed') return Math.min(Number(promo.value), subtotal)
  if (promo.type === 'exchange') return Math.min(Number(promo.value), subtotal + shipping)
  return 0
}

export const orderService = {
  async validatePromo(userId, code, cartTotal) {
    const promo = await orderRepository.getPromo(code.toUpperCase(), userId)
    if (!promo) throw Object.assign(new Error('Invalid or expired promo code'), { statusCode: 404 })
    const shipping = computeShippingFee(cartTotal, { forceFree: promo.type === 'shipping' })
    const discount = computePromo(promo, cartTotal, shipping)
    return { code: promo.code, type: promo.type, value: Number(promo.value), desc: promo.description, discount, shipping, total: cartTotal - discount + shipping }
  },

  async create(userId, data) {
    const mergedItems = Object.values(data.items.reduce((acc, item) => {
      const normalized = {
        ...item,
        size: String(item.size || '').trim(),
        color: String(item.color || '').trim(),
        quantity: Number(item.quantity) || 1
      }
      const key = `${normalized.productId}|${normalized.size.toLowerCase()}|${normalized.color.toLowerCase()}`
      acc[key] = acc[key] ? { ...acc[key], quantity: acc[key].quantity + normalized.quantity } : normalized
      return acc
    }, {}))
    const items = await orderRepository.priceItems(mergedItems)
    const subtotal = items.reduce((sum, item) => sum + Number(item.sell_price) * item.quantity, 0)
    const promo = data.promoCode ? await orderRepository.getPromo(data.promoCode.toUpperCase(), userId) : null
    if (data.promoCode && !promo) throw Object.assign(new Error('Invalid or expired promo code'), { statusCode: 400 })
    const shipping = computeShippingFee(subtotal, { forceFree: promo?.type === 'shipping' })
    const discount = computePromo(promo, subtotal, shipping)
    const order = await orderRepository.createOrder(userId, data, { items, subtotal, discount, shipping, total: subtotal - discount + shipping, promo })
    return order
  },

  list: (userId, filters) => orderRepository.listOrders(userId, filters),
  get: async (userId, id) => {
    const order = await orderRepository.getOrder(userId, id)
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
    return order
  },
  cancel: async (userId, id) => {
    const result = await orderRepository.cancelOrder(userId, id)
    return result
  }
}