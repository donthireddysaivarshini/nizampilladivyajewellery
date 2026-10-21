import { ok } from '../utils/response.js'
import { returnExchangeService } from '../services/returnExchange.service.js'

export const returnExchangeController = {
  create: async (request, reply) => ok(
    reply,
    'Request submitted',
    await returnExchangeService.create(request.user.sub, request.validated.params.orderId, request.validated.params.itemId, request.validated.body),
    201
  ),
  list: async (request, reply) => ok(reply, 'Success', await returnExchangeService.list(request.user.sub, request.validated.query)),
  get: async (request, reply) => ok(reply, 'Success', await returnExchangeService.get(request.user.sub, request.params.id)),
  coupons: async (request, reply) => ok(reply, 'Success', await returnExchangeService.listCoupons(request.user.sub, request.validated.query))
}