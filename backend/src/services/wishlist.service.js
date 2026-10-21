import { wishlistRepository } from '../repositories/wishlist.repository.js'
import { catalogRepository } from '../repositories/catalog.repository.js'

export const wishlistService = {
  async getWishlist(userId) {
    const ids = await wishlistRepository.listProductIds(userId)
    if (!ids.length) return { ids: [], items: [] }
    const { items } = await catalogRepository.listProducts({ ids, page: 1, limit: ids.length })
    const order = new Map(ids.map((id, index) => [id, index]))
    return { ids, items: items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)) }
  },

  async toggle(userId, productId) {
    const ids = await wishlistRepository.listProductIds(userId)
    const wishlisted = ids.includes(productId)
    if (wishlisted) await wishlistRepository.remove(userId, productId)
    else await wishlistRepository.add(userId, productId)
    return { wishlisted: !wishlisted }
  },

  async add(userId, productId) {
    await wishlistRepository.add(userId, productId)
    return { wishlisted: true }
  },

  async remove(userId, productId) {
    await wishlistRepository.remove(userId, productId)
    return { wishlisted: false }
  },

  // Guest wishlist merge on login — adds whatever the anonymous user saved locally.
  async merge(userId, productIds = []) {
    const unique = [...new Set((productIds || []).filter(Boolean))]
    await wishlistRepository.addMany(userId, unique)
    return this.getWishlist(userId)
  }
}
