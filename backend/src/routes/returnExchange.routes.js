import { returnExchangeController } from '../controllers/returnexchange.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validation.middleware.js'
import { createReturnExchangeSchema, listReturnExchangeSchema, listExchangeCouponsSchema } from '../validators/Returnexchange.validator.js'

export async function returnExchangeRoutes(app) {
  app.post(
    '/return-exchange/upload-image',
    { preHandler: requireAuth },
    returnExchangeController.uploadImage
  )
  app.post(
    '/orders/:orderId/items/:itemId/return-exchange-requests',
    { preHandler: [requireAuth, validate(createReturnExchangeSchema)] },
    returnExchangeController.create
  )
  app.get(
    '/return-exchange-requests',
    { preHandler: [requireAuth, validate(listReturnExchangeSchema)] },
    returnExchangeController.list
  )
  app.get(
    '/return-exchange-requests/:id',
    { preHandler: requireAuth },
    returnExchangeController.get
  )
  app.get(
    '/exchange-coupons',
    { preHandler: [requireAuth, validate(listExchangeCouponsSchema)] },
    returnExchangeController.coupons
  )
}