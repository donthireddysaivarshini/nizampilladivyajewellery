import { userController } from '../controllers/user.controller.js'
import { wishlistController } from '../controllers/wishlist.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validation.middleware.js'
import { addressSchema, idParamSchema, notificationPrefsSchema, updateProfileSchema, wishlistBodySchema, wishlistIdParamSchema, wishlistMergeSchema } from '../validators/user.validator.js'

export async function userRoutes(app) {
  app.addHook('preHandler', requireAuth)
  app.get('/me', userController.me)
  app.patch('/me', { preHandler: validate(updateProfileSchema) }, userController.updateMe)
  app.get('/me/addresses', userController.addresses)
  app.post('/me/addresses', { preHandler: validate(addressSchema) }, userController.createAddress)
  app.patch('/me/addresses/:id', { preHandler: validate(addressSchema.merge(idParamSchema)) }, userController.updateAddress)
  app.delete('/me/addresses/:id', { preHandler: validate(idParamSchema) }, userController.deleteAddress)
  app.post('/me/addresses/:id/default', { preHandler: validate(idParamSchema) }, userController.defaultAddress)
  app.get('/me/preferences', userController.prefs)
  app.patch('/me/preferences', { preHandler: validate(notificationPrefsSchema) }, userController.updatePrefs)
  app.get('/me/wishlist', wishlistController.list)
  app.post('/me/wishlist', { preHandler: validate(wishlistBodySchema) }, wishlistController.add)
  app.post('/me/wishlist/toggle', { preHandler: validate(wishlistBodySchema) }, wishlistController.toggle)
  app.post('/me/wishlist/merge', { preHandler: validate(wishlistMergeSchema) }, wishlistController.merge)
  app.delete('/me/wishlist/:productId', { preHandler: validate(wishlistIdParamSchema) }, wishlistController.remove)
}
