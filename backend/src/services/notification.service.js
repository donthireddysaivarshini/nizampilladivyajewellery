// Email integration decommissioned: safe no-op stubs to prevent unhandled call errors.
export const notificationService = {
  async sendNewOrderEmail(_orderId) {},
  async sendCustomerOrderEmail(_orderId, _type, _extra = {}) {},
  async sendReturnExchangeEmail(_requestId, _type, _extra = {}) {}
}
