import { ok } from '../utils/response.js'
import { adminService } from '../services/admin.service.js'

export const adminController = {
  dashboard: async (_request, reply) => ok(reply, 'Success', await adminService.dashboard()),
  products: async (request, reply) => ok(reply, 'Success', await adminService.products(request.query)),
  product: async (request, reply) => ok(reply, 'Success', await adminService.product(request.params.id)),
  createProduct: async (request, reply) => ok(reply, 'Product created', await adminService.createProduct(request.body || {}), 201),
  updateProduct: async (request, reply) => ok(reply, 'Product updated', await adminService.updateProduct(request.params.id, request.body || {})),
  deleteProduct: async (request, reply) => ok(reply, 'Product deleted', await adminService.deleteProduct(request.params.id)),
  categories: async (_request, reply) => ok(reply, 'Success', await adminService.categories()),
  createCategory: async (request, reply) => ok(reply, 'Category created', await adminService.createCategory(request.body || {}), 201),
  updateCategory: async (request, reply) => ok(reply, 'Category updated', await adminService.updateCategory(request.params.id, request.body || {})),
  categoryDeleteImpact: async (request, reply) => ok(reply, 'Success', await adminService.categoryDeleteImpact(request.params.id)),
  deleteCategory: async (request, reply) => ok(reply, 'Category deleted', await adminService.deleteCategory(request.params.id)),
  colors: async (_request, reply) => ok(reply, 'Success', await adminService.colors()),
  createColor: async (request, reply) => ok(reply, 'Color created', await adminService.createColor(request.body || {}), 201),
  updateColor: async (request, reply) => ok(reply, 'Color updated', await adminService.updateColor(request.params.id, request.body || {})),
  deleteColor: async (request, reply) => ok(reply, 'Color deleted', await adminService.deleteColor(request.params.id)),
  sizes: async (_request, reply) => ok(reply, 'Success', await adminService.sizes()),
  createSize: async (request, reply) => ok(reply, 'Size created', await adminService.createSize(request.body || {}), 201),
  updateSize: async (request, reply) => ok(reply, 'Size updated', await adminService.updateSize(request.params.id, request.body || {})),
  deleteSize: async (request, reply) => ok(reply, 'Size deleted', await adminService.deleteSize(request.params.id)),
  heroBanners: async (_request, reply) => ok(reply, 'Success', await adminService.heroBanners()),
  createHeroBanner: async (request, reply) => ok(reply, 'Hero banner created', await adminService.createHeroBanner(request.body || {}), 201),
  updateHeroBanner: async (request, reply) => ok(reply, 'Hero banner updated', await adminService.updateHeroBanner(request.params.id, request.body || {})),
  deleteHeroBanner: async (request, reply) => ok(reply, 'Hero banner deleted', await adminService.deleteHeroBanner(request.params.id)),
  users: async (request, reply) => ok(reply, 'Success', await adminService.users(request.query)),
  updateUser: async (request, reply) => ok(reply, 'User updated', await adminService.updateUser(request.params.id, request.body || {})),
  orders: async (request, reply) => ok(reply, 'Success', await adminService.orders(request.query)),
  order: async (request, reply) => ok(reply, 'Success', await adminService.order(request.params.id)),
  exportOrdersCsv: async (request, reply) => {
    const csv = await adminService.exportOrdersCsv(request.query)
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="staffarc-orders-${Date.now()}.csv"`)
      .send(csv)
  },
  bulkUpdateOrders: async (request, reply) => ok(reply, 'Orders updated', await adminService.bulkUpdateOrders(request.body || {})),
  updateOrder: async (request, reply) => ok(reply, 'Order updated', await adminService.updateOrder(request.params.id, request.body || {})),
  deleteOrder: async (request, reply) => ok(reply, 'Order deleted', await adminService.deleteOrder(request.params.id, request.user.sub)),
  bulkDeleteOrders: async (request, reply) => ok(reply, 'Orders deleted', await adminService.bulkDeleteOrders(request.body || {}, request.user.sub)),
  settings: async (_request, reply) => ok(reply, 'Success', await adminService.settings()),
  subscriptions: async (request, reply) => ok(reply, 'Success', await adminService.subscriptions(request.query)),
  createSubscription: async (request, reply) => ok(reply, 'Subscription created', await adminService.createSubscription(request.body || {}), 201),
  updateSubscription: async (request, reply) => ok(reply, 'Subscription updated', await adminService.updateSubscription(request.params.id, request.body || {})),
  deleteSubscription: async (request, reply) => ok(reply, 'Subscription deleted', await adminService.deleteSubscription(request.params.id)),
  coupons: async (request, reply) => ok(reply, 'Success', await adminService.coupons(request.query)),
  createCoupon: async (request, reply) => ok(reply, 'Coupon created', await adminService.createCoupon(request.body || {}), 201),
  updateCoupon: async (request, reply) => ok(reply, 'Coupon updated', await adminService.updateCoupon(request.params.id, request.body || {})),
  deleteCoupon: async (request, reply) => ok(reply, 'Coupon deleted', await adminService.deleteCoupon(request.params.id)),
  updateFooterMarquee: async (request, reply) => ok(reply, 'Footer marquee updated', await adminService.updateFooterMarquee(request.body?.message || '')),
  updateAnnouncementBar: async (request, reply) => ok(reply, 'Announcement bar updated', await adminService.updateAnnouncementBar(request.body?.messages || [])),
  updateBranding: async (request, reply) => ok(reply, 'Branding updated', await adminService.updateBranding(request.body || {})),
  updateTheme: async (request, reply) => ok(reply, 'Theme updated', await adminService.updateTheme(request.body || {})),
  updateSalePopup: async (request, reply) => ok(reply, 'Sale popup updated', await adminService.updateSalePopup(request.body || {})),
  returnExchangeRequests: async (request, reply) => ok(reply, 'Success', await adminService.returnExchangeRequests(request.query)),
  returnExchangeRequest: async (request, reply) => ok(reply, 'Success', await adminService.returnExchangeRequest(request.params.id)),
  decideReturnExchangeRequest: async (request, reply) => ok(reply, 'Request updated', await adminService.decideReturnExchangeRequest(request.params.id, request.user.sub, request.body || {})),
  markReturnRefunded: async (request, reply) => ok(reply, 'Marked as refunded', await adminService.markReturnRefunded(request.params.id, request.user.sub, request.body || {})),
  exchangeCoupons: async (request, reply) => ok(reply, 'Success', await adminService.exchangeCoupons(request.query)),
  updateReturnWindow: async (request, reply) => ok(reply, 'Return window updated', await adminService.updateReturnWindow(request.body?.days))
}