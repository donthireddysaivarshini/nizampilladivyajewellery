import { adminRepository } from '../repositories/admin.repository.js'
import { catalogRepository } from '../repositories/catalog.repository.js'
import { userRepository } from '../repositories/user.repository.js'
import { returnExchangeService } from '../services/returnExchange.service.js'
import { logger } from '../utils/logger.js'


export const adminService = {
  dashboard: () => adminRepository.dashboard(),
  products: (filters) => catalogRepository.listProducts(filters),
  product: async (id) => {
    const product = await adminRepository.product(id)
    if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
    return product
  },
  createProduct: (data) => adminRepository.saveProduct(data),
  updateProduct: (id, data) => adminRepository.saveProduct(data, id),
  deleteProduct: async (id) => {
    const product = await adminRepository.deleteProduct(id)
    if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
    return product
  },
  categories: () => adminRepository.categories(),
  createCategory: (data) => adminRepository.saveCategory(data),
  updateCategory: (id, data) => adminRepository.saveCategory(data, id),
  categoryDeleteImpact: (id) => adminRepository.categoryDeleteImpact(id),
  deleteCategory: async (id) => {
    const category = await adminRepository.deleteCategory(id)
    if (!category) throw Object.assign(new Error('Category not found'), { statusCode: 404 })
    return category
  },
  colors: () => adminRepository.colors(),
  createColor: (data) => adminRepository.saveColor(data),
  updateColor: (id, data) => adminRepository.saveColor(data, id),
  deleteColor: (id) => adminRepository.deleteColor(id),
  sizes: () => adminRepository.sizes(),
  createSize: (data) => adminRepository.saveSize(data),
  updateSize: (id, data) => adminRepository.saveSize(data, id),
  deleteSize: (id) => adminRepository.deleteSize(id),
  heroBanners: () => adminRepository.heroBanners(),
  createHeroBanner: (data) => adminRepository.saveHeroBanner(data),
  updateHeroBanner: (id, data) => adminRepository.saveHeroBanner(data, id),
  deleteHeroBanner: (id) => adminRepository.deleteHeroBanner(id),
  users: (filters) => userRepository.listUsers(filters),
  updateUser: (id, data) => adminRepository.updateUser(id, data),
  orders: (filters) => adminRepository.orders(filters),
  order: async (id) => {
    const order = await adminRepository.getOrder(id)
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
    return order
  },
  exportOrdersCsv: (filters) => adminRepository.exportOrdersCsv(filters),
  bulkUpdateOrders: async (body) => {
    const ids = Array.isArray(body.ids) ? body.ids : []
    if (!ids.length) throw Object.assign(new Error('Select at least one order'), { statusCode: 400 })
    const result = await adminRepository.bulkUpdateOrders(ids, body)
    return result
  },
  updateOrder: async (id, patch) => {
    const order = await adminRepository.updateOrder(id, patch)
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
    return order
  },
  deleteOrder: async (id, adminUserId) => {
    const order = await adminRepository.deleteOrder(id)
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
    logger.info('Order permanently deleted', { orderId: id, orderNumber: order.orderNumber, deletedBy: adminUserId })
    return order
  },

  bulkDeleteOrders: async (body, adminUserId) => {
    const ids = Array.isArray(body.ids) ? body.ids : []
    if (!ids.length) throw Object.assign(new Error('Select at least one order'), { statusCode: 400 })
    const result = await adminRepository.bulkDeleteOrders(ids)
    logger.info('Orders bulk deleted', { deleted: result.deleted, orderNumbers: result.orderNumbers, deletedBy: adminUserId })
    return result
  },
  settings: () => adminRepository.settings(),
  subscriptions: (filters) => adminRepository.subscriptions(filters),
  createSubscription: (data) => adminRepository.saveSubscription(data),
  updateSubscription: (id, data) => adminRepository.saveSubscription(data, id),
  deleteSubscription: (id) => adminRepository.deleteSubscription(id),
  coupons: (filters) => adminRepository.coupons(filters),
  createCoupon: (data) => adminRepository.saveCoupon(data),
  updateCoupon: (id, data) => adminRepository.saveCoupon(data, id),
  deleteCoupon: (id) => adminRepository.deleteCoupon(id),
  updateFooterMarquee: (message) => adminRepository.updateSetting('footer_marquee', { message }),
  updateAnnouncementBar: (messages) => adminRepository.updateSetting('announcement_bar', { messages }),
  updateBranding: (branding) => adminRepository.updateSetting('branding', branding || {}),
  updateTheme: (theme) => adminRepository.updateTheme(theme),
  updateSalePopup: (popup) => adminRepository.updateSetting('sale_popup', sanitizeSalePopup(popup || {})),
  returnExchangeRequests: (filters) => returnExchangeService.adminList(filters),
  returnExchangeRequest: (id) => returnExchangeService.adminGet(id),
  decideReturnExchangeRequest: (id, adminUserId, body) => returnExchangeService.adminDecide(id, adminUserId, body.status, body.remarks),
  markReturnRefunded: (id, adminUserId, body) => returnExchangeService.adminRefundReturn(id, adminUserId, body.remarks),
  exchangeCoupons: (filters) => returnExchangeService.adminListCoupons(filters),
  updateReturnWindow: (days) => adminRepository.updateSetting('return_window_days', { days: Number(days) })
}

// Mirrors the storefront-safe normalization in catalog.repository so whatever the
// admin saves round-trips with the exact same shape the public endpoint returns.
function sanitizeSalePopup(input) {
  const delaySeconds = Number(input.delaySeconds)
  return {
    enabled: Boolean(input.enabled),
    title: String(input.title || '').trim().slice(0, 120),
    description: String(input.description || '').trim().slice(0, 1000),
    buttonText: String(input.buttonText || '').trim().slice(0, 60),
    buttonUrl: String(input.buttonUrl || '').trim().slice(0, 300),
    color: /^#[0-9a-fA-F]{6}$/.test(input.color || '') ? input.color : '#F97316',
    delaySeconds: Number.isFinite(delaySeconds) ? Math.min(60, Math.max(0, delaySeconds)) : 5,
    repeatAfterDays: Math.max(1, Number(input.repeatAfterDays) || 1)
  }
}