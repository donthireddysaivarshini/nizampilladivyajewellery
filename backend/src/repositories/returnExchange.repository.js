import { query, transaction } from '../config/db.js'

const DEFAULT_RETURN_WINDOW_DAYS = 10

const pageParams = ({ page = 1, limit = 20 }) => {
  const safePage = Math.max(Number(page) || 1, 1)
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
  return { limit: safeLimit, offset: (safePage - 1) * safeLimit }
}

export const returnExchangeRepository = {
  async getReturnWindowDays() {
    const { rows } = await query(
      `SELECT value->>'days' AS days FROM site_settings WHERE key='return_window_days'`
    )
    const days = Number(rows[0]?.days)
    return Number.isFinite(days) && days > 0 ? days : DEFAULT_RETURN_WINDOW_DAYS
  },

  // ---------- Customer-facing ----------

  async getEligibleOrderItem(userId, orderId, orderItemId) {
    const { rows } = await query(
      `SELECT oi.id AS "orderItemId", oi.order_id AS "orderId", oi.product_name AS "productName",
        oi.unit_price AS "unitPrice", oi.quantity, oi.total_price AS "totalPrice",
        o.status, o.delivered_at AS "deliveredAt", o.shipping_amount AS "shippingAmount"
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.id=$1 AND o.id=$2 AND o.user_id=$3 AND o.deleted_at IS NULL`,
      [orderItemId, orderId, userId]
    )
    return rows[0] || null
  },

  // Used to avoid crediting the order's shipping_amount more than once if a customer
  // exchanges a second item from the same order later.
  async hasIssuedCouponForOrder(orderId) {
    const { rows } = await query(
      `SELECT 1 FROM exchange_coupons ec
       JOIN return_exchange_requests rer ON rer.id = ec.request_id
       WHERE rer.order_id=$1
       LIMIT 1`,
      [orderId]
    )
    return Boolean(rows[0])
  },

  async hasOpenRequest(orderItemId) {
    const { rows } = await query(
      `SELECT id FROM return_exchange_requests
       WHERE order_item_id=$1 AND request_status IN ('requested','approved') AND deleted_at IS NULL`,
      [orderItemId]
    )
    return Boolean(rows[0])
  },

  async createRequest(userId, orderId, orderItemId, data) {
    try {
      const { rows } = await query(
        `INSERT INTO return_exchange_requests(order_id, order_item_id, user_id, type, reason_category, reason_notes, evidence_images, drive_link)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, order_id AS "orderId", order_item_id AS "orderItemId", type,
           reason_category AS "reasonCategory", reason_notes AS "reasonNotes",
           evidence_images AS "evidenceImages", drive_link AS "driveLink",
           request_status AS "status", created_at AS "createdAt"`,
        [orderId, orderItemId, userId, data.type, data.reasonCategory, data.reasonNotes || null, JSON.stringify(data.images || []), data.driveLink || null]
      )
      return rows[0]
    } catch (error) {
      if (error.code === '23505') {
        throw Object.assign(new Error('A return/exchange request is already open for this item'), { statusCode: 409 })
      }
      throw error
    }
  },

  async listOwnRequests(userId, { page = 1, limit = 20, type, status } = {}) {
    const offset = (page - 1) * limit
    const { rows } = await query(
      `SELECT rer.id, rer.order_id AS "orderId", o.order_number AS "orderNumber", rer.order_item_id AS "orderItemId",
        oi.product_name AS "productName", oi.size, oi.color,
        rer.type, rer.reason_category AS "reasonCategory", rer.reason_notes AS "reasonNotes",
        rer.evidence_images AS "evidenceImages", rer.drive_link AS "driveLink",
        rer.request_status AS "status", rer.admin_remarks AS "adminRemarks",
        rer.created_at AS "createdAt", rer.resolved_at AS "resolvedAt",
        count(*) OVER()::int AS total_count
       FROM return_exchange_requests rer
       JOIN orders o ON o.id = rer.order_id
       JOIN order_items oi ON oi.id = rer.order_item_id
       WHERE rer.user_id=$1 AND rer.deleted_at IS NULL
         AND ($2::text IS NULL OR rer.type=$2)
         AND ($3::text IS NULL OR rer.request_status=$3)
       ORDER BY rer.created_at DESC LIMIT $4 OFFSET $5`,
      [userId, type || null, status || null, limit, offset]
    )
    return { items: rows.map(({ total_count, ...row }) => row), total: rows[0]?.total_count || 0 }
  },

  async getOwnRequest(userId, id) {
    const { rows } = await query(
      `SELECT rer.id, rer.order_id AS "orderId", o.order_number AS "orderNumber", rer.order_item_id AS "orderItemId",
        oi.product_name AS "productName", oi.size, oi.color,
        rer.type, rer.reason_category AS "reasonCategory", rer.reason_notes AS "reasonNotes",
        rer.evidence_images AS "evidenceImages", rer.drive_link AS "driveLink",
        rer.request_status AS "status", rer.admin_remarks AS "adminRemarks",
        rer.created_at AS "createdAt", rer.resolved_at AS "resolvedAt"
       FROM return_exchange_requests rer
       JOIN orders o ON o.id = rer.order_id
       JOIN order_items oi ON oi.id = rer.order_item_id
       WHERE rer.id=$1 AND rer.user_id=$2 AND rer.deleted_at IS NULL`,
      [id, userId]
    )
    return rows[0] || null
  },

  async listOwnCoupons(userId, { status } = {}) {
    const { rows } = await query(
      `SELECT id, code, value, coupon_status AS "status", expires_at AS "expiresAt",
        used_order_id AS "usedOrderId", used_at AS "usedAt", created_at AS "createdAt"
       FROM exchange_coupons
       WHERE user_id=$1 AND ($2::text IS NULL OR coupon_status=$2)
       ORDER BY created_at DESC`,
      [userId, status || null]
    )
    return rows
  },

  // ---------- Admin-facing ----------

  async adminListRequests(filters = {}) {
    const { limit, offset } = pageParams(filters)
    const { rows } = await query(
      `SELECT rer.id, rer.order_id AS "orderId", o.order_number AS "orderNumber", rer.order_item_id AS "orderItemId",
        oi.product_name AS "productName", oi.size, oi.color, oi.quantity, oi.total_price AS "itemTotal",
        o.shipping_amount AS "shippingAmount",
        u.name AS "customerName", u.email AS "customerEmail",
        rer.type, rer.reason_category AS "reasonCategory", rer.reason_notes AS "reasonNotes",
        rer.evidence_images AS "evidenceImages", rer.drive_link AS "driveLink",
        rer.request_status AS "status", rer.admin_remarks AS "adminRemarks",
        rer.created_at AS "createdAt", rer.resolved_at AS "resolvedAt",
        count(*) OVER()::int AS total_count
       FROM return_exchange_requests rer
       JOIN orders o ON o.id = rer.order_id
       JOIN order_items oi ON oi.id = rer.order_item_id
       JOIN users u ON u.id = rer.user_id
       WHERE rer.deleted_at IS NULL
         AND ($1::text IS NULL OR rer.type=$1)
         AND ($2::text IS NULL OR rer.request_status=$2)
         AND ($3::text IS NULL OR o.order_number ILIKE $3 OR u.email ILIKE $3 OR u.name ILIKE $3)
       ORDER BY rer.created_at DESC LIMIT $4 OFFSET $5`,
      [filters.type || null, filters.status || null, filters.search ? `%${filters.search}%` : null, limit, offset]
    )
    return { items: rows.map(({ total_count, ...row }) => row), total: rows[0]?.total_count || 0 }
  },

  async adminGetRequest(id) {
    const { rows } = await query(
      `SELECT rer.id, rer.order_id AS "orderId", o.order_number AS "orderNumber", rer.order_item_id AS "orderItemId", rer.user_id AS "userId",
        oi.product_name AS "productName", oi.size, oi.color, oi.quantity, oi.unit_price AS "unitPrice", oi.total_price AS "itemTotal",
        o.shipping_amount AS "shippingAmount", o.subtotal AS "orderSubtotal", o.discount_amount AS "orderDiscount",
        u.name AS "customerName", u.email AS "customerEmail", u.phone AS "customerPhone",
        rer.type, rer.reason_category AS "reasonCategory", rer.reason_notes AS "reasonNotes",
        rer.evidence_images AS "evidenceImages", rer.drive_link AS "driveLink",
        rer.request_status AS "status", rer.admin_remarks AS "adminRemarks",
        rer.created_at AS "createdAt", rer.resolved_at AS "resolvedAt"
       FROM return_exchange_requests rer
       JOIN orders o ON o.id = rer.order_id
       JOIN order_items oi ON oi.id = rer.order_item_id
       JOIN users u ON u.id = rer.user_id
       WHERE rer.id=$1 AND rer.deleted_at IS NULL`,
      [id]
    )
    return rows[0] || null
  },

  async approveReturn(id, adminUserId, remarks) {
    const { rows } = await query(
      `UPDATE return_exchange_requests
       SET request_status='approved', admin_remarks=$3, resolved_by=$2, resolved_at=now(), updated_at=now()
       WHERE id=$1 AND type='return' AND request_status='requested' AND deleted_at IS NULL
       RETURNING id, request_status AS "status"`,
      [id, adminUserId, remarks || null]
    )
    return rows[0]
  },

  async markRejected(id, adminUserId, remarks) {
    const { rows } = await query(
      `UPDATE return_exchange_requests
       SET request_status='rejected', admin_remarks=$3, resolved_by=$2, resolved_at=now(), updated_at=now()
       WHERE id=$1 AND request_status='requested' AND deleted_at IS NULL
       RETURNING id, request_status AS "status"`,
      [id, adminUserId, remarks || null]
    )
    return rows[0]
  },

  async markRefunded(id, adminUserId, remarks) {
    const { rows } = await query(
      `UPDATE return_exchange_requests
       SET request_status='refunded', admin_remarks=COALESCE($3, admin_remarks), resolved_by=COALESCE(resolved_by,$2), updated_at=now()
       WHERE id=$1 AND type='return' AND request_status='approved' AND deleted_at IS NULL
       RETURNING id, request_status AS "status"`,
      [id, adminUserId, remarks || null]
    )
    return rows[0]
  },

  // Approves an exchange request AND issues the coupon in the same transaction —
  // a request can never end up "approved" without a coupon, or vice versa.
  async approveExchange(id, adminUserId, remarks, coupon) {
    return transaction(async (client) => {
      const request = await client.query(
        `UPDATE return_exchange_requests
         SET request_status='approved', admin_remarks=$3, resolved_by=$2, resolved_at=now(), updated_at=now()
         WHERE id=$1 AND type='exchange' AND request_status='requested' AND deleted_at IS NULL
         RETURNING id, user_id AS "userId", request_status AS "status"`,
        [id, adminUserId, remarks || null]
      )
      if (!request.rows[0]) return null
      const couponRow = await client.query(
        `INSERT INTO exchange_coupons(request_id, user_id, code, value, expires_at)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, code, value, expires_at AS "expiresAt", coupon_status AS "status"`,
        [id, request.rows[0].userId, coupon.code, coupon.value, coupon.expiresAt]
      )
      return { request: request.rows[0], coupon: couponRow.rows[0] }
    })
  },

  async adminListCoupons(filters = {}) {
    const { limit, offset } = pageParams(filters)
    const { rows } = await query(
      `SELECT ec.id, ec.code, ec.value, ec.coupon_status AS "status", ec.expires_at AS "expiresAt",
        ec.used_order_id AS "usedOrderId", ec.used_at AS "usedAt", ec.created_at AS "createdAt",
        u.name AS "customerName", u.email AS "customerEmail",
        count(*) OVER()::int AS total_count
       FROM exchange_coupons ec
       JOIN users u ON u.id = ec.user_id
       WHERE ($1::text IS NULL OR ec.coupon_status=$1)
       ORDER BY ec.created_at DESC LIMIT $2 OFFSET $3`,
      [filters.status || null, limit, offset]
    )
    return { items: rows.map(({ total_count, ...row }) => row), total: rows[0]?.total_count || 0 }
  }
}