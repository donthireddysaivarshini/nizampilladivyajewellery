import { query } from '../config/db.js'
import { normalizeTheme } from '../utils/theme.js'

const activeChild = 'deleted_at IS NULL AND is_active=true'

function dedupeColors(colors = []) {
  const seen = new Set()
  return colors.filter(color => {
    const key = `${color.name}::${color.hex}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function dedupeSizes(sizes = []) {
  const map = new Map()
  for (const size of sizes) {
    if (!size?.size) continue
    if (!map.has(size.size)) map.set(size.size, { size: size.size, stock: Number(size.stock || 0) })
  }
  return [...map.values()]
}

function mapListProduct({ total, image_rows, colors, sizes, ...row }) {
  const images = [...new Set((image_rows || []).map(item => item.url).filter(Boolean))]
  return { ...row, images, colors: dedupeColors(colors), sizes: dedupeSizes(sizes) }
}

function mapDetailProduct({ image_rows, colors, sizes, ...row }) {
  const images = [...new Set((image_rows || []).map(item => item.url).filter(Boolean))]
  return { ...row, images, colors: dedupeColors(colors), sizes: dedupeSizes(sizes) }
}

function csv(value) {
  if (!value) return []
  return Array.isArray(value) ? value : String(value).split(',').filter(Boolean)
}

const DEFAULT_SALE_POPUP = {
  enabled: false,
  title: '',
  description: '',
  buttonText: 'Shop Now',
  buttonUrl: '/plp',
  color: '#F97316',
  delaySeconds: 5,
  repeatAfterDays: 1
}

function normalizeSalePopup(input) {
  const delaySeconds = Number(input?.delaySeconds)
  return {
    enabled: Boolean(input?.enabled),
    title: String(input?.title || '').trim().slice(0, 120),
    description: String(input?.description || '').trim().slice(0, 1000),
    buttonText: String(input?.buttonText || '').trim().slice(0, 60),
    buttonUrl: String(input?.buttonUrl || '').trim().slice(0, 300),
    color: /^#[0-9a-fA-F]{6}$/.test(input?.color || '') ? input.color : '#F97316',
    delaySeconds: Number.isFinite(delaySeconds) ? Math.min(60, Math.max(0, delaySeconds)) : 5,
    repeatAfterDays: Math.max(1, Number(input?.repeatAfterDays) || 1)
  }
}

export const catalogRepository = {
  async getHome() {
    const [categories, banners, featured, newest, settings] = await Promise.all([
      query(`SELECT c.id, c.name, c.slug, c.image_url AS img,
        COALESCE((SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'slug', s.slug) ORDER BY s.sort_order, s.name) FROM category_subcategories s WHERE s.category_id=c.id AND s.deleted_at IS NULL AND s.is_active=true), '[]') AS subcategories
       FROM categories c
       WHERE c.deleted_at IS NULL AND c.is_active=true
       ORDER BY c.sort_order, c.name`),
      query(`SELECT id, kicker, title, subtitle AS sub, cta_label AS cta, cta_link AS "ctaLink", image_url AS img FROM hero_banners WHERE deleted_at IS NULL AND is_active=true ORDER BY sort_order`),
      this.listProducts({ page: 1, limit: 8, featured: true }),
      this.listProducts({ page: 1, limit: 4, tag: 'NEW', sort: 'newest' }),
      query(`SELECT key, value FROM site_settings WHERE key IN ('footer_marquee','announcement_bar','branding') AND deleted_at IS NULL AND is_active=true`).catch(() => ({ rows: [] }))
    ])
    return {
      categories: categories.rows,
      heroBanners: banners.rows,
      featured: featured.items,
      newArrivals: newest.items,
      footerMarquee: settings.rows.find(row => row.key === 'footer_marquee')?.value || { message: 'Free shipping on orders above Rs. 999' },
      announcementBar: settings.rows.find(row => row.key === 'announcement_bar')?.value || { messages: [] },
      branding: settings.rows.find(row => row.key === 'branding')?.value || {}
    }
  },

  async getFilters(filters = {}) {
    const { rows } = await query(
      `SELECT
        (SELECT json_agg(DISTINCT b.name) FROM brands b JOIN products p ON p.brand_id=b.id JOIN categories c ON c.id=p.category_id WHERE p.deleted_at IS NULL AND p.is_active=true AND ($1::text IS NULL OR c.slug=$1)) AS brands,
        (SELECT json_agg(DISTINCT jsonb_build_object('name', pc.name, 'hex', pc.hex)) FROM product_colors pc JOIN products p ON p.id=pc.product_id JOIN categories c ON c.id=p.category_id WHERE pc.deleted_at IS NULL AND pc.is_active=true AND p.deleted_at IS NULL AND p.is_active=true AND ($1::text IS NULL OR c.slug=$1)) AS colors,
        (SELECT json_agg(DISTINCT ps.size) FROM product_sizes ps JOIN products p ON p.id=ps.product_id JOIN categories c ON c.id=p.category_id WHERE ps.deleted_at IS NULL AND ps.is_active=true AND p.deleted_at IS NULL AND p.is_active=true AND ($1::text IS NULL OR c.slug=$1)) AS sizes,
        (SELECT json_agg(DISTINCT p.subcategory) FROM products p JOIN categories c ON c.id=p.category_id WHERE p.deleted_at IS NULL AND p.is_active=true AND ($1::text IS NULL OR c.slug=$1)) AS subcategories`,
      [filters.category || null]
    )
    return rows[0]
  },

  async listCategories() {
    const { rows } = await query(
      `SELECT c.id, c.name, c.slug, c.image_url AS img,
        COALESCE((SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'slug', s.slug) ORDER BY s.sort_order, s.name) FROM category_subcategories s WHERE s.category_id=c.id AND s.deleted_at IS NULL AND s.is_active=true), '[]') AS subcategories
       FROM categories c
       WHERE c.deleted_at IS NULL AND c.is_active=true
       ORDER BY c.sort_order, c.name`
    )
    return rows
  },

  async listProducts(filters) {
    filters = { page: 1, limit: 20, ...filters }
    const brands = csv(filters.brand)
    const colors = csv(filters.color)
    const sizes = csv(filters.size)
    const subcategories = csv(filters.subcategory)
    const offset = (filters.page - 1) * filters.limit
    const sortKey = filters.sort || (filters.featured ? 'manual' : 'newest')
    const order = {
      manual: 'pr.sort_order ASC, pr.created_at DESC',
      'price-asc': 'pr."sellPrice" ASC, pr.sort_order ASC, pr.created_at DESC',
      'price-desc': 'pr."sellPrice" DESC, pr.sort_order ASC, pr.created_at DESC',
      discount: 'pr.off DESC, pr.sort_order ASC, pr.created_at DESC',
      rating: 'pr.rating DESC, pr.sort_order ASC, pr.created_at DESC',
      newest: 'pr.created_at DESC, pr.sort_order ASC'
    }[sortKey]
    const params = [
      filters.category || null, subcategories, filters.tag || null,
      filters.q ? `%${filters.q}%` : null, filters.maxPrice || null, filters.featured ?? null,
      brands, colors, sizes, filters.limit, offset, filters.ids || []
    ]
    const { rows } = await query(
      `WITH product_rows AS (
        SELECT p.id, p.name, COALESCE(b.name, 'Generic') AS brand, p.slug, c.slug AS category, p.subcategory,
          p.sell_price AS "sellPrice", p.mrp, p.discount_percent AS off, p.tag, p.offer_tag AS "offerTag",
          p.stock, p.material, p.care, p.description, p.is_featured AS "isFeatured", p.rating, p.reviews,
          p.created_at, p.sort_order AS sort_order
        FROM products p
        JOIN categories c ON c.id=p.category_id
        LEFT JOIN brands b ON b.id=p.brand_id -- 🌸 Changed to LEFT JOIN so items don't disappear
        WHERE p.deleted_at IS NULL AND p.is_active=true
          AND ($1::text IS NULL OR c.slug=$1)
          AND (cardinality($2::text[]) = 0 OR p.subcategory = ANY($2::text[]))
          AND ($3::text IS NULL OR p.tag=$3 OR p.offer_tag=$3)
          AND ($4::text IS NULL OR p.name ILIKE $4 OR b.name ILIKE $4 OR p.description ILIKE $4)
          AND ($5::numeric IS NULL OR p.sell_price <= $5)
          AND ($6::boolean IS NULL OR p.is_featured=$6)
          AND (cardinality($7::text[]) = 0 OR b.name = ANY($7::text[]))
          AND (cardinality($8::text[]) = 0 OR EXISTS(
  SELECT 1 FROM product_colors pc 
  WHERE pc.product_id=p.id AND pc.deleted_at IS NULL AND pc.name=ANY($8::text[])
))
AND (cardinality($9::text[]) = 0 OR EXISTS(
  SELECT 1 FROM product_sizes ps 
  WHERE ps.product_id=p.id AND ps.deleted_at IS NULL AND ps.size=ANY($9::text[])
))
AND (cardinality($12::uuid[]) = 0 OR p.id = ANY($12::uuid[]))
      )
      SELECT pr.*,
        COALESCE((SELECT json_agg(json_build_object('url', image_url, 'alt', alt_text) ORDER BY sort_order) FROM product_images WHERE product_id=pr.id AND ${activeChild}), '[]') AS image_rows,
        COALESCE((SELECT json_agg(json_build_object('name', name, 'hex', hex, 'imageIndex', image_index) ORDER BY sort_order) FROM product_colors WHERE product_id=pr.id AND ${activeChild}), '[]') AS colors,
        COALESCE((SELECT json_agg(json_build_object('size', size, 'stock', stock) ORDER BY sort_order) FROM product_sizes WHERE product_id=pr.id AND ${activeChild}), '[]') AS sizes,
        COALESCE((SELECT json_agg(json_build_object('color', color_name, 'hex', color_hex, 'size', size, 'stock', stock, 'priceOverride', price_override) ORDER BY sort_order) FROM product_variants WHERE product_id=pr.id AND ${activeChild}), '[]') AS variants,
        count(*) OVER()::int AS total
      FROM product_rows pr
      ORDER BY ${order}
      LIMIT $10 OFFSET $11`,
      params
    )
    return {
      items: rows.map(row => mapListProduct(row)),
      total: rows[0]?.total || 0
    }
  },

  async getProduct(id) {
    const { rows } = await query(
      `SELECT p.id, p.name, COALESCE(b.name, 'Generic') AS brand, p.slug, c.slug AS category, p.subcategory,
        p.sell_price AS "sellPrice", p.mrp, p.discount_percent AS off, p.tag, p.offer_tag AS "offerTag",
        p.stock, p.material, p.care, p.description, p.is_featured AS "isFeatured", p.rating, p.reviews,
        
        -- Safe Image retrieval (using explicit p.id and checking the product_images table fields directly)
        COALESCE((SELECT json_agg(json_build_object('url', image_url, 'alt', alt_text) ORDER BY sort_order) 
                  FROM product_images 
                  WHERE product_id=p.id AND deleted_at IS NULL AND is_active=true), '[]') AS image_rows,
        
        -- Safe Color and Size retrieval
        COALESCE((SELECT json_agg(json_build_object('name', name, 'hex', hex, 'imageIndex', image_index) ORDER BY sort_order) 
                  FROM product_colors 
                  WHERE product_id=p.id AND deleted_at IS NULL), '[]') AS colors,
        COALESCE((SELECT json_agg(json_build_object('size', size, 'stock', stock) ORDER BY sort_order) 
                  FROM product_sizes 
                  WHERE product_id=p.id AND deleted_at IS NULL), '[]') AS sizes,
        
        -- Safe Variant retrieval
        COALESCE((SELECT json_agg(json_build_object('color', color_name, 'hex', color_hex, 'size', size, 'stock', stock, 'priceOverride', price_override) ORDER BY sort_order) 
                  FROM product_variants 
                  WHERE product_id=p.id AND deleted_at IS NULL AND is_active=true), '[]') AS variants,
                  
        -- Safe Color Images retrieval
        COALESCE((SELECT json_agg(json_build_object('colorName', color_name, 'colorHex', color_hex, 'imageUrl', image_url, 'sortOrder', sort_order) ORDER BY sort_order) 
                  FROM product_color_images 
                  WHERE product_id=p.id AND deleted_at IS NULL AND is_active=true), '[]') AS "colorImages"
                  
       FROM products p
       JOIN categories c ON c.id=p.category_id
       LEFT JOIN brands b ON b.id=p.brand_id
       WHERE p.id=$1 AND p.deleted_at IS NULL AND p.is_active=true`,
      [id]
    )
    if (!rows[0]) return null
    return mapDetailProduct(rows[0])
  },

  async getProductBySlug(slug) {
    const { rows } = await query(`SELECT id FROM products WHERE slug=$1 AND deleted_at IS NULL AND is_active=true`, [slug])
    return rows[0] ? this.getProduct(rows[0].id) : null
  },

  async listActivePromos() {
    const { rows } = await query(
      `SELECT code, type, value, min_cart AS "minCart", description
       FROM promo_codes
       WHERE deleted_at IS NULL AND is_active=true AND status='active'
         AND (starts_at IS NULL OR starts_at <= now())
         AND (ends_at IS NULL OR ends_at >= now())
       ORDER BY created_at DESC
       LIMIT 20`
    )
    return rows
  },

  async getTheme() {
    const { rows } = await query(
      `SELECT value FROM site_settings WHERE key='store_theme' AND deleted_at IS NULL AND is_active=true LIMIT 1`
    )
    return normalizeTheme(rows[0]?.value)
  },

  // Sale/promotional popup config driven live from the admin panel. Missing config
  // (or a disabled popup) returns a safe default so the storefront never errors.
  async getPopup() {
    const { rows } = await query(
      `SELECT value FROM site_settings WHERE key='sale_popup' AND deleted_at IS NULL AND is_active=true LIMIT 1`
    )
    return normalizeSalePopup(rows[0]?.value ?? DEFAULT_SALE_POPUP)
  },

  async createStockNotification(data) {
    const { rows } = await query(
      `INSERT INTO stock_notifications(product_id, email, size, color)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [data.productId, data.email, data.size || null, data.color || null]
    )
    return rows[0]
  },

  async createNewsletterSubscription(data) {
    const { rows } = await query(
      `INSERT INTO newsletter_subscriptions(email, source)
       VALUES ($1,$2)
       ON CONFLICT (email) DO UPDATE SET status='active', is_active=true, source=EXCLUDED.source, updated_at=now()
       RETURNING id, email, status`,
      [data.email.toLowerCase(), data.source || 'footer']
    )
    return rows[0]
  }
}
