import { ok } from '../utils/response.js'
import { wishlistService } from '../services/wishlist.service.js'

export const wishlistController = {
  list: async (request, reply) => ok(reply, 'Success', await wishlistService.getWishlist(request.user.sub)),
  toggle: async (request, reply) => ok(reply, 'Success', await wishlistService.toggle(request.user.sub, request.validated.body.productId)),
  add: async (request, reply) => ok(reply, 'Added to wishlist', await wishlistService.add(request.user.sub, request.validated.body.productId)),
  remove: async (request, reply) => ok(reply, 'Removed from wishlist', await wishlistService.remove(request.user.sub, request.validated.params.productId)),
  merge: async (request, reply) => ok(reply, 'Wishlist synced', await wishlistService.merge(request.user.sub, request.validated.body.productIds))
}
