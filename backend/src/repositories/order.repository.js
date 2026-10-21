import { query, transaction } from '../config/db.js'

const COLOR_NAME_JOIN = `
  LEFT JOIN LATERAL (
    SELECT color_name FROM product_variants
    WHERE product_id = oi.product_id
      AND deleted_at IS NULL AND is_active = true
      AND (lower(color_name) = lower(oi.color) OR lower(color_hex) = lower(oi.color))
    LIMIT 1
  ) color_variant ON true`

export const orderRepository = {
  async getPromo(code, userId = null) {
    const { rows } = await query(
      `SELECT * FROM promo_codes WHERE code=$1 AND deleted_at IS NULL AND is_active=true AND status='active'
       AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now())`,
      [code]
    )
    if (rows[0]) return rows[0]

    // Not a regular promo code — check if it's an active exchange coupon belonging to this user.
    // Exchange coupons require a logged-in user; if there's no userId (guest preview), treat as not found.
    if (!userId) return null
    const { rows: couponRows } = await query(
      `SELECT id, code, value FROM exchange_coupons
       WHERE code=$1 AND user_id=$2 AND coupon_status='active' AND expires_at > now()`,
      [code, userId]
    )
    if (!couponRows[0]) return null
    return {
      id: couponRows[0].id,
      code: couponRows[0].code,
      type: 'exchange',
      value: couponRows[0].value,
      min_cart: couponRows[0].value, // enforces "new order total >= coupon value" via the existing computePromo guard
      description: 'Exchange coupon'
    }
  },

  async createOrder(userId, data, totals) {
    return transaction(async (client) => {
      const number = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
      const isFreeOrder = Number(totals.total) <= 0
      const paymentStatus = isFreeOrder ? 'paid' : 'pending'
      const orderStatus = isFreeOrder ? 'confirmed' : 'pending'
      const shippingAddress = data.addressId
        ? await getAddressSnapshot(client, userId, data.addressId)
        : data.address
      const order = await client.query(
        `INSERT INTO orders(user_id, order_number, address_id, shipping_address, subtotal, discount_amount, shipping_amount, total, promo_code, payment_method, payment_status, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [userId, number, data.addressId || null, shippingAddress || null, totals.subtotal, totals.discount, totals.shipping, totals.total, data.promoCode || null, data.paymentMethod, paymentStatus, orderStatus]
      )

      // Exchange coupon consumption happens here, inside the same transaction as the order
      // insert — lock the row, re-verify it's still active (it may have expired or been used
      // by another request between checkout preview and this call), then burn it atomically.
      if (totals.promo?.type === 'exchange') {
        const locked = await client.query(
          `SELECT id, coupon_status, expires_at FROM exchange_coupons WHERE id=$1 AND user_id=$2 FOR UPDATE`,
          [totals.promo.id, userId]
        )
        const couponRow = locked.rows[0]
        if (!couponRow || couponRow.coupon_status !== 'active' || new Date(couponRow.expires_at) < new Date()) {
          throw Object.assign(new Error('This exchange coupon is no longer available'), { statusCode: 409 })
        }
        await client.query(
          `UPDATE exchange_coupons SET coupon_status='used', used_order_id=$1, used_at=now(), updated_at=now() WHERE id=$2`,
          [order.rows[0].id, totals.promo.id]
        )
      }

      for (const item of totals.items) {
        await client.query(
          `INSERT INTO order_items(order_id, product_id, product_name, brand_name, size, color, quantity, unit_price, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [order.rows[0].id, item.product_id, item.name, item.brand, item.size, item.color, item.quantity, item.sell_price, item.sell_price * item.quantity]
        )
        if (isFreeOrder) {
          await client.query(`UPDATE products SET stock=GREATEST(stock-$1,0), updated_at=now() WHERE id=$2`, [item.quantity, item.product_id])
          await client.query(`UPDATE product_sizes SET stock=GREATEST(stock-$1,0), updated_at=now() WHERE product_id=$2 AND size=$3`, [item.quantity, item.product_id, item.size])
        }
      }
      return order.rows[0]
    })
  },

  async priceItems(items) {
    if (!items?.length) throw Object.assign(new Error('Your cart is empty'), { statusCode: 400 })
    const ids = [...new Set(items.map(item => item.productId))]
    const slugs = [...new Set(items.map(item => item.productSlug).filter(Boolean))]
    const sizes = [...new Set(items.map(item => item.size))]
    const { rows } = await query(
      `SELECT p.id AS product_id, p.slug, p.name, b.name AS brand, p.sell_price, p.stock, ps.size, ps.stock AS size_stock
       FROM products p
       JOIN brands b ON b.id=p.brand_id
       LEFT JOIN product_sizes ps ON ps.product_id=p.id AND ps.size = ANY($2::text[]) AND ps.deleted_at IS NULL AND ps.is_active=true
       WHERE (p.id = ANY($1::uuid[]) OR p.slug = ANY($3::text[])) AND p.deleted_at IS NULL AND p.is_active=true`,
      [ids, sizes, slugs]
    )
    // Per-color + size price overrides. The override is authoritative on the backend so
    // the client cannot influence the final order/payment amount. Legacy variants that
    // predate this feature simply have no matching row -> override 0.
    const variantRows = rows.length ? (await query(
      `SELECT product_id, color_name, color_hex, size, price_override
       FROM product_variants
       WHERE product_id = ANY($1::uuid[]) AND size = ANY($2::text[])
         AND deleted_at IS NULL AND is_active=true`,
      [rows.map(row => row.product_id), sizes]
    )).rows : []
    return items.map(item => {
      const product = rows.find(row => (row.product_id === item.productId || row.slug === item.productSlug) && (!row.size || row.size === item.size))
      if (!product) throw Object.assign(new Error('A product in your cart is no longer available. Please remove it and try again.'), { statusCode: 400, code: 'CART_PRODUCT_UNAVAILABLE' })
      if (product.stock < item.quantity) throw Object.assign(new Error('Insufficient stock'), { statusCode: 400 })
      if (product.size_stock !== null && Number(product.size_stock) < item.quantity) throw Object.assign(new Error(`Insufficient stock for size ${item.size}`), { statusCode: 400 })
      const variant = variantRows.find(row =>
        row.product_id === product.product_id
        && row.size === item.size
        && (row.color_name.toLowerCase() === String(item.color).toLowerCase()
          || row.color_hex.toLowerCase() === String(item.color).toLowerCase())
      )
      const priceOverride = Number(variant?.price_override || 0)
      return { ...product, sell_price: Number(product.sell_price) + priceOverride, size: item.size, color: item.color, quantity: item.quantity }
    })
  },

  async listOrders(userId, { page = 1, limit = 20, status }) {
    const offset = (page - 1) * limit
    const { rows } = await query(
      `SELECT id, order_number AS "orderNumber", created_at AS date, total, status, payment_status AS "paymentStatus",
        (SELECT COALESCE(sum(quantity),0)::int FROM order_items oi WHERE oi.order_id=orders.id) AS items,
        tracking_url AS "trackingLink", count(*) OVER()::int AS total_count
       FROM orders
       WHERE user_id=$1 AND deleted_at IS NULL AND ($2::text IS NULL OR status=$2)
       ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [userId, status || null, limit, offset]
    )
    return { items: rows.map(({ total_count, ...row }) => row), total: rows[0]?.total_count || 0 }
  },

  async getOrder(userId, id) {
    const order = await query(
      `SELECT orders.id, orders.order_number AS "orderNumber", orders.created_at AS date, orders.subtotal, orders.discount_amount AS "discountAmount",
        orders.shipping_amount AS "shippingAmount", orders.total, orders.status, orders.payment_status AS "paymentStatus", orders.tracking_url AS "trackingLink",
        orders.promo_code AS "promoCode", orders.delivered_at AS "deliveredAt",
        COALESCE(
          orders.shipping_address,
          CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object(
            'label', a.label,
            'fullName', a.full_name,
            'phone', a.phone,
            'addressLine1', a.address_line1,
            'addressLine2', a.address_line2,
            'city', a.city,
            'state', a.state,
            'pincode', a.pincode
          ) END
        ) AS "shippingAddress"
       FROM orders
       LEFT JOIN user_addresses a ON a.id=orders.address_id
       WHERE orders.id=$1 AND orders.user_id=$2 AND orders.deleted_at IS NULL`,
      [id, userId]
    )
    if (!order.rows[0]) return null
    const items = await query(
      `SELECT oi.id AS "orderItemId", oi.product_id AS "productId", oi.product_name AS name, oi.brand_name AS brand,
        oi.size, COALESCE(color_variant.color_name, oi.color) AS color, oi.quantity AS qty, oi.unit_price AS "unitPrice",
        (SELECT image_url FROM product_images pi WHERE pi.product_id=oi.product_id ORDER BY sort_order LIMIT 1) AS image
       FROM order_items oi
       ${COLOR_NAME_JOIN}
       WHERE oi.order_id=$1`,
      [id]
    )
    return { ...order.rows[0], products: items.rows }
  },

  async getOrderForNotification(id) {
    const order = await query(
      `SELECT o.id, o.order_number AS "orderNumber", o.created_at AS "createdAt", o.subtotal,
        o.discount_amount AS "discountAmount", o.shipping_amount AS "shippingAmount", o.total,
        o.status, o.payment_status AS "paymentStatus", o.promo_code AS "promoCode", o.tracking_url AS "trackingUrl",
        COALESCE(
          o.shipping_address,
          CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object(
            'fullName', a.full_name, 'phone', a.phone, 'email', a.email, 'addressLine1', a.address_line1,
            'addressLine2', a.address_line2, 'city', a.city, 'state', a.state, 'pincode', a.pincode
          ) END
        ) AS "shippingAddress",
        u.name AS "customerName",
        COALESCE(NULLIF(o.shipping_address->>'email', ''), NULLIF(a.email, ''), u.email) AS "customerEmail",
        COALESCE(u.phone, o.shipping_address->>'phone', a.phone) AS "customerPhone"
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN user_addresses a ON a.id = o.address_id
       WHERE o.id=$1`,
      [id]
    )
    if (!order.rows[0]) return null
    const items = await query(
      `SELECT oi.product_id AS "productId", oi.product_name AS name, oi.brand_name AS brand,
        oi.size, COALESCE(color_variant.color_name, oi.color) AS color, oi.quantity AS qty, oi.unit_price AS "unitPrice"
       FROM order_items oi
       ${COLOR_NAME_JOIN}
       WHERE oi.order_id=$1`,
      [id]
    )
    return { ...order.rows[0], products: items.rows }
  },

  async cancelOrder(userId, id) {
    const { rows } = await query(
      `UPDATE orders SET status='cancelled', updated_at=now()
       WHERE id=$1 AND user_id=$2 AND status IN ('pending','paid')
       RETURNING id, status`,
      [id, userId]
    )
    return rows[0]
  }
}

async function getAddressSnapshot(client, userId, addressId) {
  const { rows } = await client.query(
    `SELECT label, full_name AS "fullName", phone, email, address_line1 AS "addressLine1",
      address_line2 AS "addressLine2", city, state, pincode
     FROM user_addresses
     WHERE id=$1 AND user_id=$2
     LIMIT 1`,
    [addressId, userId]
  )
  if (!rows[0]) throw Object.assign(new Error('Delivery address not found'), { statusCode: 400 })
  return rows[0]
}