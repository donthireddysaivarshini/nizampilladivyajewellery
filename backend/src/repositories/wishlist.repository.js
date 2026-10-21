import { query } from '../config/db.js'

export const wishlistRepository = {
  async listProductIds(userId) {
    const { rows } = await query(
      `SELECT product_id AS id
       FROM wishlist_items
       WHERE user_id=$1 AND deleted_at IS NULL AND is_active=true
       ORDER BY created_at DESC`,
      [userId]
    )
    return rows.map(row => row.id)
  },

  async add(userId, productId) {
    const { rows } = await query(
      `INSERT INTO wishlist_items(user_id, product_id)
       VALUES ($1,$2)
       ON CONFLICT (user_id, product_id) DO UPDATE
         SET deleted_at=NULL, is_active=true, updated_at=now()
       RETURNING product_id AS id`,
      [userId, productId]
    )
    return rows[0]
  },

  async addMany(userId, productIds) {
    if (!productIds.length) return
    const values = productIds.map((_, index) => `($1, $${index + 2})`).join(', ')
    await query(
      `INSERT INTO wishlist_items(user_id, product_id)
       VALUES ${values}
       ON CONFLICT (user_id, product_id) DO UPDATE
         SET deleted_at=NULL, is_active=true, updated_at=now()`,
      [userId, ...productIds]
    )
  },

  async remove(userId, productId) {
    await query(
      `UPDATE wishlist_items
       SET deleted_at=now(), is_active=false, updated_at=now()
       WHERE user_id=$1 AND product_id=$2`,
      [userId, productId]
    )
  }
}
