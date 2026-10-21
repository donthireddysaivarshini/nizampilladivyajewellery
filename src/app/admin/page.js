'use client'
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3, Box, CheckCircle2, CheckSquare, ChevronRight, Clock, Download, Eye, ImageIcon, LayoutDashboard, LogOut,
  Megaphone, Menu, PackageSearch, Palette, Plus, RefreshCw, RotateCcw, Save, Search, ShoppingBag, Table2, Ticket, Trash2, Upload,
  UserCog, Users, X, XCircle, TicketPercent, Star, Link as LinkIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/lib/api'
import { downloadBlob } from '@/lib/csv'
import { downloadInvoice } from '@/lib/invoice'
import { applyTheme, buildThemeFromPrimary, DEFAULT_THEME, normalizeTheme, THEME_PRESETS } from '@/lib/theme'
import { computeDiscountPercent, formatPrice } from '@/lib/utils'


const money = (value) => formatPrice(Number(value || 0))
const emptyColorVariant = { name: 'Black', hex: '#111111', images: [''], sizes: [{ size: 'M', stock: 10, priceOverride: 0 }] }
const emptyProduct = {
  name: '', slug: '', category: '', brand: 'Nizampilla Divya Jewellery', subcategory: 'general',
  sellPrice: 999, mrp: 1299, off: 0, sortOrder: 0, tag: '', offerTag: '', stock: 10,
  rating: 0, reviews: 0,
  material: '', care: '', description: '', isFeatured: false, status: 'active', isActive: true,
  highlights: {},
  colorVariants: [emptyColorVariant]
}
const emptyHero = { title: '', kicker: '', subtitle: '', ctaLabel: 'Shop Now', ctaLink: '/plp', imageUrl: '', sortOrder: 0, status: 'active', isActive: true }
const emptyCategory = { name: '', slug: '', imageUrl: '', sortOrder: 0, status: 'active', isActive: true, subcategories: [{ name: '', slug: '', sortOrder: 0 }] }
const emptyCatalogColor = { name: '', hex: '#111111', sortOrder: 0, status: 'active', isActive: true }
const emptyCatalogSize = { size: '', sortOrder: 0, status: 'active', isActive: true }
const emptyCoupon = { code: '', type: 'percentage', value: 10, minCart: 0, description: '', startsAt: '', endsAt: '', status: 'active', isActive: true }
const emptySalePopup = { enabled: false, title: '', description: '', buttonText: '', buttonUrl: '', color: '#F97316', delaySeconds: 5, repeatAfterDays: 1 }
const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded']
const DATE_PRESETS = [
  ['', 'All time'],
  ['2', 'Last 2 days'],
  ['4', 'Last 4 days'],
  ['7', 'Last 7 days'],
  ['14', 'Last 2 weeks'],
  ['30', 'Last month'],
]

const NAV = [
  ['products', 'Products', Box],
  ['storefront', 'Storefront', ImageIcon],
  ['orders', 'Orders', ShoppingBag],
  ['returns', 'Returns & Exchanges', RotateCcw],
  ['users', 'Users', Users],
  ['coupons', 'Coupons', TicketPercent],
]
const RETURN_REQUEST_STATUS_OPTIONS = ['requested', 'approved', 'rejected', 'refunded']
const RETURN_REASON_LABELS = {
  damaged: 'Damaged product',
  wrong_item: 'Wrong item delivered',
  size_issue: 'Size / fit issue',
  not_as_described: 'Not as described',
  quality_issue: 'Quality issue',
  other: 'Other'
}

function toProductForm(product) {
  const colorVariants = product.colorVariants?.length
    ? product.colorVariants.map(color => ({
      name: color.name || '',
      hex: color.hex || '#111111',
      images: (color.images || []).map(item => item.url || item).filter(Boolean).length
        ? (color.images || []).map(item => item.url || item).filter(Boolean)
        : [''],
      sizes: color.sizes?.length ? color.sizes.map(size => ({ size: size.size || '', stock: Number(size.stock || 0), priceOverride: Number(size.priceOverride || 0) })) : [{ size: 'M', stock: 0, priceOverride: 0 }]
    }))
    : buildLegacyColorVariants(product)
  const totalStock = colorVariants.reduce((sum, color) => sum + color.sizes.reduce((inner, size) => inner + Number(size.stock || 0), 0), 0)
  return {
    ...emptyProduct,
    ...product,
    sellPrice: Number(product.sellPrice || 0),
    mrp: Number(product.mrp || 0),
    off: Number(product.off || 0),
    sortOrder: Number(product.sortOrder || 0),
    stock: Number(product.stock || totalStock || 0),
    rating: Number(product.rating || 0),
    reviews: Number(product.reviews || 0),
    isFeatured: Boolean(product.isFeatured),
    isActive: product.isActive !== false,
    colorVariants: colorVariants.length ? colorVariants : [emptyColorVariant],
  }
}

function buildLegacyColorVariants(product) {
  const images = (product.images || []).map(item => item.url || item).filter(Boolean)
  const colors = product.colors || []
  const sizes = (product.sizes || []).map(size => ({ size: size.size || '', stock: Number(size.stock || 0), priceOverride: Number(size.priceOverride || 0) }))
  if (!colors.length) return [emptyColorVariant]
  return colors.map(color => ({
    name: color.name,
    hex: color.hex,
    images: [images[Number(color.imageIndex || 0)] || images[0] || ''].filter(Boolean).length
      ? [images[Number(color.imageIndex || 0)] || images[0] || ''].filter(Boolean)
      : [''],
    sizes: sizes.length ? sizes : [{ size: 'One Size', stock: Number(product.stock || 0), priceOverride: 0 }]
  }))
}

function buildVariantRows(colorVariants = []) {
  return colorVariants.flatMap(color => (color.sizes || [])
    .filter(size => size?.size)
    .map(size => ({
      color: color.name,
      hex: color.hex,
      size: size.size,
      stock: Number(size.stock || 0),
      images: (color.images || []).filter(Boolean).length
    })))
}

export default function AdminPage() {
  const router = useRouter()
  const [authState, setAuthState] = useState('checking')
  const [tab, setTab] = useState('products')
  const [dashboard, setDashboard] = useState({})
  const [orders, setOrders] = useState({ items: [], total: 0 })
  const [products, setProducts] = useState({ items: [], total: 0 })
  const [users, setUsers] = useState({ items: [], total: 0 })
  const [coupons, setCoupons] = useState({ items: [], total: 0 })
  const [orderFilters, setOrderFilters] = useState({ search: '', status: '', paymentStatus: '', days: '', month: '' })
  const [selectedOrders, setSelectedOrders] = useState([])
  const [orderDetail, setOrderDetail] = useState(null)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [catalogColors, setCatalogColors] = useState([])
  const [catalogSizes, setCatalogSizes] = useState([])
  const [heroes, setHeroes] = useState([])
  const [settings, setSettings] = useState({ marquee: '', announcements: [''], theme: DEFAULT_THEME, branding: {} })
  const [salePopup, setSalePopup] = useState(emptySalePopup)
  const [modal, setModal] = useState(null)
  const [preview, setPreview] = useState(null)
  const [categoryDeleteImpact, setCategoryDeleteImpact] = useState(null)
  const [orderDeleteTarget, setOrderDeleteTarget] = useState(null)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(null)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [categoryForm, setCategoryForm] = useState(emptyCategory)
  const [heroForm, setHeroForm] = useState(emptyHero)
  const [couponForm, setCouponForm] = useState(emptyCoupon)
  const [colorForm, setColorForm] = useState(emptyCatalogColor)
  const [sizeForm, setSizeForm] = useState(emptyCatalogSize)
  const [variantMappingOpen, setVariantMappingOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingHeroId, setEditingHeroId] = useState(null)
  const [editingCouponId, setEditingCouponId] = useState(null)
  const [editingColorId, setEditingColorId] = useState(null)
  const [editingSizeId, setEditingSizeId] = useState(null)
  const [returnRequests, setReturnRequests] = useState({ items: [], total: 0 })
const [returnFilters, setReturnFilters] = useState({ type: '', status: '' })
const [exchangeCoupons, setExchangeCoupons] = useState({ items: [], total: 0 })
const [returnRequestDetail, setReturnRequestDetail] = useState(null)
const [returnRequestDetailLoading, setReturnRequestDetailLoading] = useState(false)
const [returnWindowDays, setReturnWindowDays] = useState(10)

  const loadOrders = useCallback(async (filters = orderFilters) => {
    const orderData = await adminApi.orders({ page: 1, limit: 50, ...filters })
    setOrders(orderData)
    setSelectedOrders([])
  }, [orderFilters])
  const loadReturnRequests = useCallback(async (filters = returnFilters) => {
  const data = await adminApi.returnExchangeRequests({ page: 1, limit: 50, ...filters })
  setReturnRequests(data)
}, [returnFilters])

  const load = useCallback(async () => {
    setAuthState(current => current === 'ready' ? 'refreshing' : 'checking')
    try {
      const me = await adminApi.me()
      if (me.role_name !== 'admin') throw new Error('Admin access only')
      const [dash, orderData, productData, userData, couponData, cats, colorData, sizeData, heroData, rawSettings, returnRequestData, exchangeCouponData] = await Promise.all([
        adminApi.dashboard(),
        adminApi.orders({ page: 1, limit: 50 }),
        adminApi.products({ page: 1, limit: 20 }),
        adminApi.users({ page: 1, limit: 20 }),
        adminApi.coupons({ page: 1, limit: 20 }),
        adminApi.categories(),
        adminApi.colors(),
        adminApi.sizes(),
        adminApi.heroBanners(),
        adminApi.settings(),
        adminApi.returnExchangeRequests({ page: 1, limit: 50 }),
        adminApi.exchangeCoupons({ page: 1, limit: 50 }),
      ])
      setDashboard(dash || {})
      setOrders(orderData)
      setProducts(productData)
      setUsers(userData)
      setCoupons(couponData)
      setCategories(cats || [])
      setCatalogColors(colorData || [])
      setCatalogSizes(sizeData || [])
      setHeroes(heroData || [])
      setReturnRequests(returnRequestData)
      setExchangeCoupons(exchangeCouponData)
      setReturnWindowDays(Number(rawSettings.return_window_days?.days) || 10)
      setSettings({
        marquee: rawSettings.footer_marquee?.message || '',
        announcements: rawSettings.announcement_bar?.messages?.length ? rawSettings.announcement_bar.messages : [''],
        theme: normalizeTheme(rawSettings.store_theme),
        branding: rawSettings.branding || {}
      })
      setSalePopup({ ...emptySalePopup, ...(rawSettings.sale_popup || {}) })
      applyTheme(normalizeTheme(rawSettings.store_theme))
      setAuthState('ready')
    } catch (_) {
      await adminApi.logout()
      router.replace('/admin/login')
    }
  }, [router])

  useEffect(() => { load() }, [load])

  const stats = useMemo(() => [
    ['Revenue', money(dashboard.revenue), BarChart3],
    ['Orders', dashboard.orders || 0, ShoppingBag],
    ['Products', dashboard.products || 0, Box],
    ['Customers', dashboard.customers || 0, Users],
  ], [dashboard])

  const openProduct = async (row = null) => {
    if (row?.id) {
      const product = await adminApi.product(row.id)
      setProductForm(toProductForm(product))
      setEditingProductId(row.id)
    } else {
      setProductForm(emptyProduct)
      setEditingProductId(null)
    }
    setModal('product')
  }

  const openProductPreview = async (row) => {
    try {
      const product = await adminApi.product(row.id)
      setProductForm(toProductForm(product))
      setEditingProductId(null)
      setModal('product-view')
    } catch (error) {
      toast.error(error.message || 'Could not load product details')
    }
  }

  const openCategory = (row = null) => {
    setCategoryForm(row ? { ...emptyCategory, ...row, subcategories: row.subcategories?.length ? row.subcategories : [{ name: '', slug: '', sortOrder: 0 }] } : emptyCategory)
    setEditingCategoryId(row?.id || null)
    setModal('category')
  }

  const openCategoryDelete = async (row) => {
    setSaving('category-impact')
    try {
      const impact = await adminApi.categoryDeleteImpact(row.id)
      setCategoryDeleteImpact(impact)
    } catch (error) {
      toast.error(error.message || 'Could not calculate category impact')
    } finally {
      setSaving(null)
    }
  }

  const openColor = (row = null) => {
    setColorForm(row ? { ...emptyCatalogColor, ...row } : emptyCatalogColor)
    setEditingColorId(row?.id || null)
    setModal('color')
  }

  const openSize = (row = null) => {
    setSizeForm(row ? { ...emptyCatalogSize, ...row } : emptyCatalogSize)
    setEditingSizeId(row?.id || null)
    setModal('size')
  }

  const openHero = (row = null) => {
    setHeroForm(row ? { ...emptyHero, ...row } : emptyHero)
    setEditingHeroId(row?.id || null)
    setModal('hero')
  }

  const openCoupon = (row = null) => {
    setCouponForm(row ? { ...emptyCoupon, ...row, startsAt: toDateInput(row.startsAt), endsAt: toDateInput(row.endsAt) } : emptyCoupon)
    setEditingCouponId(row?.id || null)
    setModal('coupon')
  }

  const closeModal = () => setModal(null)

  const saveProduct = async () => {
    const colorVariants = productForm.colorVariants
      .filter(color => color.name && color.hex)
      .map(color => ({
        ...color,
        images: (color.images || []).filter(Boolean),
        sizes: (color.sizes || []).filter(size => size.size)
      }))
    const mrp = Number(productForm.mrp) || 0
    const sellPrice = Number(productForm.sellPrice) || 0
    const payload = {
  ...productForm,
  colorVariants,
  images: Array.from(new Set(colorVariants.flatMap(cv => cv.images).filter(Boolean))),
  mrp: Math.max(mrp, sellPrice),
  sellPrice,
      off: computeDiscountPercent(Math.max(mrp, sellPrice), sellPrice),
      stock: colorVariants.reduce((sum, color) => sum + color.sizes.reduce((inner, size) => inner + Number(size.stock || 0), 0), 0)
    }
    payload.slug = payload.slug || slugifyClient(payload.name)
    if (!payload.name || !payload.slug) return toast.error('Product name and slug are required')
    if (!colorVariants.length) return toast.error('Add at least one color variant')
    if (!colorVariants.some(color => color.images.length)) return toast.error('Upload at least one image for a color')
    if (!colorVariants.some(color => color.sizes.length)) return toast.error('Add at least one size with stock')
    setSaving('product')
try {
  if (editingProductId) await adminApi.updateProduct(editingProductId, payload)
  else await adminApi.createProduct(payload)
  toast.success(editingProductId ? 'Product updated' : 'Product created')
  closeModal(); await load()
} catch (error) {
  toast.error(error.message || 'Could not save product')
} finally {
  setSaving(null)
}
  }

  const saveCategory = async () => {
    if (!categoryForm.name || !categoryForm.slug) return toast.error('Category name and slug are required')
    setSaving('category')
    try {
      if (editingCategoryId) await adminApi.updateCategory(editingCategoryId, categoryForm)
      else await adminApi.createCategory(categoryForm)
      toast.success(editingCategoryId ? 'Category updated' : 'Category created')
      closeModal(); await load()
    } finally {
      setSaving(null)
    }
  }

  const confirmCategoryDelete = async () => {
    if (!categoryDeleteImpact?.category?.id) return
    setSaving('category-delete')
    try {
      const result = await adminApi.deleteCategory(categoryDeleteImpact.category.id)
      toast.success(`Category deleted with ${result.impact?.totalProducts || 0} product(s)`)
      setCategoryDeleteImpact(null)
      await load()
    } finally {
      setSaving(null)
    }
  }

  const confirmOrderDelete = async () => {
    if (!orderDeleteTarget?.id) return
    setSaving('order-delete')
    try {
      await adminApi.deleteOrder(orderDeleteTarget.id)
      toast.success('Order deleted')
      setOrderDeleteTarget(null)
      await loadOrders()
    } finally {
      setSaving(null)
    }
  }

  const confirmBulkDelete = async () => {
    if (!selectedOrders.length) return
    setSaving('bulk-order-delete')
    try {
      await adminApi.bulkDeleteOrders(selectedOrders)
      toast.success(`${selectedOrders.length} order(s) permanently deleted`)
      setBulkDeleteConfirmOpen(false)
      setSelectedOrders([])
      await loadOrders()
    } catch (error) {
      toast.error(error.message || 'Could not delete orders')
    } finally {
      setSaving(null)
    }
  }

  const saveColor = async () => {
    if (!colorForm.name || !colorForm.hex) return toast.error('Color name and swatch are required')
    setSaving('color')
    try {
      if (editingColorId) await adminApi.updateColor(editingColorId, colorForm)
      else await adminApi.createColor(colorForm)
      toast.success(editingColorId ? 'Color updated' : 'Color created')
      closeModal(); await load()
    } finally {
      setSaving(null)
    }
  }

  const saveSize = async () => {
    if (!sizeForm.size) return toast.error('Size is required')
    setSaving('size')
    try {
      if (editingSizeId) await adminApi.updateSize(editingSizeId, sizeForm)
      else await adminApi.createSize(sizeForm)
      toast.success(editingSizeId ? 'Size updated' : 'Size created')
      closeModal(); await load()
    } finally {
      setSaving(null)
    }
  }

  const saveHero = async () => {
    if (!heroForm.title) return toast.error('Hero title is required')
    if (!heroForm.imageUrl) return toast.error('Hero banner image is required')
    setSaving('hero')
    try {
      if (editingHeroId) await adminApi.updateHeroBanner(editingHeroId, heroForm)
      else await adminApi.createHeroBanner(heroForm)
      toast.success(editingHeroId ? 'Hero updated' : 'Hero created')
      closeModal(); await load()
    } finally {
      setSaving(null)
    }
  }

  const saveCoupon = async () => {
    if (!couponForm.code) return toast.error('Coupon code is required')
    setSaving('coupon')
    try {
      if (editingCouponId) await adminApi.updateCoupon(editingCouponId, couponForm)
      else await adminApi.createCoupon(couponForm)
      toast.success(editingCouponId ? 'Coupon updated' : 'Coupon created')
      closeModal(); await load()
    } finally {
      setSaving(null)
    }
  }

  const saveSettings = async () => {
    setSaving('settings')
    try {
      await adminApi.updateFooterMarquee(settings.marquee || 'Free shipping on orders above Rs. 999')
      await adminApi.updateAnnouncementBar(settings.announcements.map(item => item.trim()).filter(Boolean))
      await adminApi.updateBranding(settings.branding || {})
      toast.success('Storefront settings updated')
    } finally {
      setSaving(null)
    }
  }

  const saveSalePopup = async () => {
    if (!String(salePopup.title || '').trim()) return toast.error('Sale popup title is required')
    setSaving('sale-popup')
    try {
      const delaySeconds = Number(salePopup.delaySeconds)
      await adminApi.updateSalePopup({
        ...salePopup,
        delaySeconds: Number.isFinite(delaySeconds) ? delaySeconds : 5,
        repeatAfterDays: Number(salePopup.repeatAfterDays) || 1
      })
      toast.success('Sale popup updated')
    } finally {
      setSaving(null)
    }
  }

  const saveTheme = async () => {
    setSaving('theme')
    try {
      const theme = normalizeTheme(settings.theme)
      await adminApi.updateTheme(theme)
      applyTheme(theme)
      setSettings(current => ({ ...current, theme }))
      window.dispatchEvent(new Event('staffarc-theme'))
      toast.success('Brand theme updated across storefront and admin')
    } finally {
      setSaving(null)
    }
  }

  const exportOrdersCsv = async () => {
    try {
      const params = selectedOrders.length
        ? { ids: selectedOrders.join(',') }
        : { ...orderFilters, limit: 5000 }
      const blob = await adminApi.exportOrdersCsv(params)
      downloadBlob(blob, `staffarc-orders-${Date.now()}.csv`)
      toast.success(selectedOrders.length ? `Exported ${selectedOrders.length} selected order(s)` : 'Exported filtered orders')
    } catch (error) {
      toast.error(error.message || 'Could not export orders')
    }
  }

  if (authState !== 'ready' && authState !== 'refreshing') return <AdminLoading />

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-line bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col p-5">
            <div className="mb-8 rounded-lg border border-line bg-[#111318] p-4 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Nizampilla Divya Jewellery</p>
              <h1 className="mt-1 font-display text-2xl font-black">Admin Panel</h1>
            </div>
            <nav className="space-y-1">
              {NAV.map(([id, label, Icon]) => (
                <button key={id} onClick={() => setTab(id)} className={`flex h-11 w-full items-center justify-between rounded-lg px-3 text-sm font-bold transition ${tab === id ? 'bg-primary text-white shadow-sm' : 'text-ink-muted hover:bg-surface-alt hover:text-ink'}`}>
                  <span className="flex items-center gap-3"><Icon size={17}/>{label}</span>
                  {tab === id && <ChevronRight size={16}/>}
                </button>
              ))}
            </nav>
            <div className="mt-auto space-y-2">
              <button onClick={load} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-line text-sm font-bold hover:border-primary hover:text-primary"><RefreshCw size={15}/>Refresh</button>
              <button onClick={async () => { await adminApi.logout(); router.push('/admin/login') }} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-bold text-white hover:bg-primary"><LogOut size={15}/>Logout</button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-line bg-white/90 px-4 py-4 backdrop-blur md:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Operations Console</p>
                <h2 className="font-display text-3xl font-black">{NAV.find(item => item[0] === tab)?.[1] || 'Dashboard'}</h2>
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <button onClick={() => setNavOpen(true)} aria-label="Open navigation" className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink-mid hover:border-primary hover:text-primary"><Menu size={20}/></button>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 md:px-7">
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {stats.map(([label, value, Icon]) => <StatCard key={label} label={label} value={value} Icon={Icon} />)}
            </section>

            {tab === 'products' && (
              <Panel title="Product Catalog" icon={PackageSearch} action={<ActionButton onClick={() => openProduct()} label="Add Product" />}>
                <DataTable rows={products.items} columns={['name','brand','category','sellPrice','stock','rating','reviews','tag','isFeatured']} actions={(row) => <RowActions onView={() => openProductPreview(row)} onEdit={() => openProduct(row)} onDelete={async () => { await adminApi.deleteProduct(row.id); toast.success('Product deleted'); await load() }} />} />
              </Panel>
            )}

            {tab === 'storefront' && (
              <div className="mt-5 grid gap-5">
                <Panel title="Brand Theme" icon={Palette} action={<button onClick={saveTheme} disabled={saving === 'theme'} className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-75">{saving === 'theme' ? <RefreshCw size={16} className="animate-spin"/> : <Save size={16}/>} {saving === 'theme' ? 'Saving...' : 'Apply Theme'}</button>}>
                  <ThemeEditor theme={settings.theme} onChange={theme => { setSettings({ ...settings, theme }); applyTheme(theme) }} />
                </Panel>
                <div className="grid gap-5 xl:grid-cols-2">
                <Panel title="Branding & Messages" icon={Megaphone} action={<button onClick={saveSettings} disabled={saving === 'settings'} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-75">{saving === 'settings' ? <RefreshCw size={16} className="animate-spin"/> : <Save size={16}/>} {saving === 'settings' ? 'Saving...' : 'Save'}</button>}>
                  <FileUpload label="Upload logo" onUploaded={url => setSettings({ ...settings, branding: { ...(settings.branding || {}), logoUrl: url } })} />
                  {settings.branding?.logoUrl && <MediaGrid items={[settings.branding.logoUrl]} onPreview={(url) => setPreview({ type: 'image', url, title: 'Logo' })} onRemove={() => setSettings({ ...settings, branding: { ...(settings.branding || {}), logoUrl: '' } })} />}
                  <Field label="Footer scrolling text" value={settings.marquee} onChange={value => setSettings({ ...settings, marquee: value })} />
                  <AnnouncementEditor value={settings.announcements} onChange={announcements => setSettings({ ...settings, announcements })} />
                </Panel>
                <Panel title="Categories" icon={Box} action={<ActionButton onClick={() => openCategory()} label="Add Category" />}>
                  <MiniList rows={categories} primary="name" secondary="slug" onEdit={openCategory} onDelete={openCategoryDelete} />
                </Panel>
                <Panel title="Colors" icon={Palette} action={<ActionButton onClick={() => openColor()} label="Add Color" />}>
                  <MiniList rows={catalogColors} primary="name" secondary="hex" onEdit={openColor} onDelete={async (row) => { await adminApi.deleteColor(row.id); toast.success('Color deleted'); await load() }} />
                </Panel>
                <Panel title="Sizes" icon={Box} action={<ActionButton onClick={() => openSize()} label="Add Size" />}>
                  <MiniList rows={catalogSizes} primary="size" secondary="status" onEdit={openSize} onDelete={async (row) => { await adminApi.deleteSize(row.id); toast.success('Size deleted'); await load() }} />
                </Panel>
                <Panel title="Hero Banners" icon={ImageIcon} action={<ActionButton onClick={() => openHero()} label="Add Hero" />}>
                  <MiniList rows={heroes} primary="title" secondary="ctaLink" onEdit={openHero} onDelete={async (row) => { await adminApi.deleteHeroBanner(row.id); toast.success('Hero deleted'); await load() }} />
                </Panel>
                </div>
                <Panel title="Sale Popup" icon={Megaphone} action={<button onClick={saveSalePopup} disabled={saving === 'sale-popup'} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-75">{saving === 'sale-popup' ? <RefreshCw size={16} className="animate-spin"/> : <Save size={16}/>} {saving === 'sale-popup' ? 'Saving...' : 'Save'}</button>}>
                  <PopupEditor value={salePopup} onChange={setSalePopup} />
                </Panel>
              </div>
            )}

            {tab === 'orders' && (
              <OrdersPanel
                orders={orders.items}
                filters={orderFilters}
                selectedOrders={selectedOrders}
                onFiltersChange={setOrderFilters}
                onApplyFilters={loadOrders}
                onExportCsv={exportOrdersCsv}
                onToggleOrder={(id) => setSelectedOrders(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])}
                onToggleAll={(ids) => setSelectedOrders(current => current.length === ids.length ? [] : ids)}
                onOpenOrder={async (row) => {
                  setOrderDetailLoading(true)
                  try { setOrderDetail(await adminApi.order(row.id)) }
                  catch (error) { toast.error(error.message || 'Could not load order details') }
                  finally { setOrderDetailLoading(false) }
                }}
                onBulkUpdate={async (patch) => {
                  if (!selectedOrders.length) return toast.error('Select at least one order')
                  await adminApi.bulkUpdateOrders({ ids: selectedOrders, ...patch })
                  toast.success(`${selectedOrders.length} order(s) updated`)
                  await loadOrders()
                }}
                onBulkDelete={() => {
                  if (!selectedOrders.length) return toast.error('Select at least one order')
                  setBulkDeleteConfirmOpen(true)
                }}
                onDeleteOrder={(row) => setOrderDeleteTarget(row)}
                reload={() => loadOrders()}
              />
            )}
            {tab === 'returns' && (
  <ReturnsPanel
    requests={returnRequests.items}
    coupons={exchangeCoupons.items}
    filters={returnFilters}
    windowDays={returnWindowDays}
    onFiltersChange={setReturnFilters}
    onApplyFilters={loadReturnRequests}
    onWindowDaysChange={setReturnWindowDays}
    onSaveWindow={async () => {
      await adminApi.updateReturnWindow(returnWindowDays)
      toast.success('Return window updated')
    }}
    onOpenRequest={async (row) => {
      setReturnRequestDetailLoading(true)
      try { setReturnRequestDetail(await adminApi.returnExchangeRequest(row.id)) }
      catch (error) { toast.error(error.message || 'Could not load request details') }
      finally { setReturnRequestDetailLoading(false) }
    }}
  />
)}
            {tab === 'users' && <Panel title="Users" icon={UserCog}><DataTable rows={users.items} columns={['name','email','phone','status','is_active','created_at']} actions={(row) => <UserActions row={row} reload={load} />} /></Panel>}
            {tab === 'coupons' && <Panel title="Coupons" icon={TicketPercent} action={<ActionButton onClick={() => openCoupon()} label="Add Coupon" />}><DataTable rows={coupons.items} columns={['code','type','value','minCart','status','startsAt','endsAt']} actions={(row) => <RowActions onEdit={() => openCoupon(row)} onDelete={async () => { await adminApi.deleteCoupon(row.id); toast.success('Coupon deleted'); await load() }} />} /></Panel>}
          </div>
        </section>
      </div>

      {modal === 'product-view' && <Modal title="View Product" onClose={closeModal}><ProductForm form={productForm} setForm={setProductForm} categories={categories} catalogColors={catalogColors} catalogSizes={catalogSizes} onPreview={setPreview} onCancel={closeModal} onShowMapping={() => setVariantMappingOpen(true)} readOnly /></Modal>}
      {modal === 'product' && <Modal title={editingProductId ? 'Edit Product' : 'Add Product'} onClose={closeModal}><ProductForm form={productForm} setForm={setProductForm} categories={categories} catalogColors={catalogColors} catalogSizes={catalogSizes} onPreview={setPreview} onSave={saveProduct} onCancel={closeModal} onShowMapping={() => setVariantMappingOpen(true)} saving={saving === 'product'} /></Modal>}
      {variantMappingOpen && <VariantMappingModal rows={buildVariantRows(productForm.colorVariants)} onClose={() => setVariantMappingOpen(false)} />}
      {modal === 'category' && <Modal title={editingCategoryId ? 'Edit Category' : 'Add Category'} onClose={closeModal}><CategoryForm form={categoryForm} setForm={setCategoryForm} onPreview={setPreview} onSave={saveCategory} onCancel={closeModal} saving={saving === 'category'} /></Modal>}
      {modal === 'color' && <Modal title={editingColorId ? 'Edit Color' : 'Add Color'} onClose={closeModal}><ColorForm form={colorForm} setForm={setColorForm} onSave={saveColor} onCancel={closeModal} saving={saving === 'color'} /></Modal>}
      {modal === 'size' && <Modal title={editingSizeId ? 'Edit Size' : 'Add Size'} onClose={closeModal}><SizeForm form={sizeForm} setForm={setSizeForm} onSave={saveSize} onCancel={closeModal} saving={saving === 'size'} /></Modal>}
      {modal === 'hero' && <Modal title={editingHeroId ? 'Edit Hero Banner' : 'Add Hero Banner'} onClose={closeModal}><HeroForm form={heroForm} setForm={setHeroForm} onPreview={setPreview} onSave={saveHero} onCancel={closeModal} saving={saving === 'hero'} /></Modal>}
      {modal === 'coupon' && <Modal title={editingCouponId ? 'Edit Coupon' : 'Add Coupon'} onClose={closeModal}><CouponForm form={couponForm} setForm={setCouponForm} onSave={saveCoupon} onCancel={closeModal} saving={saving === 'coupon'} /></Modal>}
      {preview && <PreviewModal preview={preview} onClose={() => setPreview(null)} />}
      {categoryDeleteImpact && <CategoryDeleteModal impact={categoryDeleteImpact} saving={saving === 'category-delete'} onCancel={() => setCategoryDeleteImpact(null)} onConfirm={confirmCategoryDelete} />}
      {orderDeleteTarget && <OrderDeleteModal order={orderDeleteTarget} saving={saving === 'order-delete'} onCancel={() => setOrderDeleteTarget(null)} onConfirm={confirmOrderDelete} />}
      {bulkDeleteConfirmOpen && <BulkOrderDeleteModal count={selectedOrders.length} saving={saving === 'bulk-order-delete'} onCancel={() => setBulkDeleteConfirmOpen(false)} onConfirm={confirmBulkDelete} />}
      {orderDetailLoading && <LoadingOverlay message="Loading order details..." />}
      {orderDetail && <OrderDetailModal order={orderDetail} onClose={() => setOrderDetail(null)} onUpdated={async () => { await loadOrders(); setOrderDetail(null) }} />}
      {returnRequestDetailLoading && <LoadingOverlay message="Loading request details..." />}
      {returnRequestDetail && (
        <ReturnRequestDetailModal
          request={returnRequestDetail}
          onClose={() => setReturnRequestDetail(null)}
          onDecided={async () => { await loadReturnRequests(); setReturnRequestDetail(null) }}
        />
      )}
      {navOpen && (
        <MobileNav
          tab={tab}
          onNavigate={(id) => { setTab(id); setNavOpen(false) }}
          onRefresh={() => { setNavOpen(false); load() }}
          onLogout={async () => { setNavOpen(false); await adminApi.logout(); router.push('/admin/login') }}
          onClose={() => setNavOpen(false)}
        />
      )}
    </main>
  )
}

function toDateInput(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function slugifyClient(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function StatCard({ label, value, Icon }) {
  return <div className="rounded-lg border border-line bg-white p-4 shadow-sm"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={18}/></div><p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>
}

function Panel({ title, icon: Icon, children, action }) {
  return <section className="mt-5 rounded-lg border border-line bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4"><div className="flex items-center gap-2"><Icon size={18} className="text-primary"/><h3 className="font-display text-xl font-black">{title}</h3></div>{action}</div><div className="p-5">{children}</div></section>
}

function ActionButton({ onClick, label }) {
  return <button onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white hover:bg-primary"><Plus size={16}/>{label}</button>
}

function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 z-[900] flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-6 backdrop-blur-sm"><div className="w-full max-w-4xl rounded-lg border border-line bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-line px-5 py-4"><h3 className="font-display text-2xl font-black">{title}</h3><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-primary hover:text-primary"><X size={18}/></button></div><div className="p-5">{children}</div></div></div>
}

function Field({ label, value, onChange, type = 'text', placeholder = '', readOnly = false }) {
  return <label className="block"><span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">{label}</span><input type={type} value={value ?? ''} placeholder={placeholder || label} readOnly={readOnly} disabled={readOnly} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface-alt px-3 text-sm font-semibold outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-[#eef0f3] disabled:text-ink-muted" /></label>
}

function Area({ label, value, onChange, readOnly = false }) {
  return <label className="mt-4 block"><span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">{label}</span><textarea value={value ?? ''} readOnly={readOnly} disabled={readOnly} onChange={e => onChange(e.target.value)} rows={4} className="mt-1.5 w-full rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm font-semibold outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-[#eef0f3] disabled:text-ink-muted" /></label>
}

function SelectField({ label, value, onChange, children, readOnly = false }) {
  return <label className="block"><span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">{label}</span><select value={value ?? ''} disabled={readOnly} onChange={e => onChange(e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface-alt px-3 text-sm font-semibold outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-[#eef0f3] disabled:text-ink-muted">{children}</select></label>
}

function FileUpload({ label, kind = 'image', onUploaded }) {
  const [busy, setBusy] = useState(false)
  const upload = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const uploaded = await adminApi.uploadMedia(file)
      onUploaded(uploaded.url)
      toast.success('Image uploaded')
    } catch (error) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }
  return <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-alt px-4 py-5 text-center hover:border-primary"><Upload size={22} className="mb-2 text-primary"/><span className="text-sm font-black">{busy ? 'Uploading...' : label}</span><span className="mt-1 text-xs text-ink-muted">Choose from device. Hosted URL is saved automatically.</span><input disabled={busy} type="file" accept="image/*" onChange={e => upload(e.target.files?.[0])} className="hidden" /></label>
}

function updateProductPricing(form, patch) {
  const nextForm = { ...form, ...patch }
  let mrp = Number(nextForm.mrp ?? form.mrp) || 0
  let sellPrice = Number(nextForm.sellPrice ?? form.sellPrice) || 0
  let off = Number(nextForm.off ?? form.off) || 0

  if (patch.off != null) {
    const normalizedOff = Math.max(0, Math.min(100, Number(patch.off) || 0))
    off = normalizedOff
    if (normalizedOff > 0) {
      mrp = sellPrice / (1 - normalizedOff / 100)
    } else {
      mrp = sellPrice
    }
  } else if (patch.sellPrice != null) {
    off = computeDiscountPercent(mrp, sellPrice)
    if (sellPrice > mrp) mrp = sellPrice
  } else if (patch.mrp != null) {
    mrp = Math.max(mrp, sellPrice)
    off = computeDiscountPercent(mrp, sellPrice)
  }

  return {
    ...nextForm,
    mrp: Math.max(mrp, sellPrice),
    sellPrice,
    off,
  }
}

function ProductForm({ form, setForm, categories, catalogColors = [], catalogSizes = [], onPreview, onSave, onCancel, onShowMapping, saving = false, readOnly = false }) {
  useEffect(() => {
    if (readOnly || !categories.length) return
    if (categories.some(cat => cat.slug === form.category)) return
    setForm({ ...form, category: categories[0].slug, categoryId: categories[0]?.id || null, subcategory: categories[0]?.subcategories?.[0]?.slug || '' })
  }, [categories, form.category])

  const set = (key, value) => setForm({ ...form, [key]: value })
  const setPricing = (patch) => setForm(updateProductPricing(form, patch))
  const setProductName = (value) => {
    const nextSlug = (!form.slug || form.slug === slugifyClient(form.name)) ? slugifyClient(value) : form.slug
    setForm({ ...form, name: value, slug: nextSlug })
  }
  const totalStock = buildVariantRows(form.colorVariants).reduce((sum, row) => sum + row.stock, 0)
  const selectedCategory = categories.find(cat => cat.slug === form.category) || categories[0]
  const subcategories = selectedCategory?.subcategories || []
  const setCategory = (slug) => {
    const nextCategory = categories.find(cat => cat.slug === slug)
    const nextSubcategory = nextCategory?.subcategories?.[0]?.slug || ''
    setForm({ ...form, category: slug, categoryId: nextCategory?.id || null, subcategory: nextSubcategory })
  }
  return <div className="grid gap-5">
    <div className="grid gap-3 md:grid-cols-2"><Field label="Name" value={form.name} onChange={setProductName} readOnly={readOnly} /><Field label="Slug" value={form.slug} onChange={v => set('slug', v)} readOnly={readOnly} /></div>
    <div className="grid gap-3 md:grid-cols-3">
      <SelectField label="Category" value={form.category} onChange={setCategory} readOnly={readOnly}>{categories.map(cat => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}</SelectField>
      <SelectField label="Subcategory" value={form.subcategory} onChange={v => set('subcategory', v)} readOnly={readOnly}>
        <option value="">Select subcategory</option>
        {subcategories.map(sub => <option key={sub.id || sub.slug} value={sub.slug}>{sub.name}</option>)}
      </SelectField>
      <Field label="Brand" value={form.brand} onChange={v => set('brand', v)} readOnly={readOnly} />
    </div>
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5"><Field label="Sell price" type="number" value={form.sellPrice} onChange={v => setPricing({ sellPrice: v })} readOnly={readOnly} /><Field label="MRP" type="number" value={form.mrp} onChange={v => setPricing({ mrp: v })} readOnly={readOnly} /><Field label="Discount %" type="number" value={form.off} onChange={v => setPricing({ off: v })} readOnly={readOnly} /><Field label="Sort order" type="number" value={form.sortOrder} onChange={v => set('sortOrder', v)} readOnly={readOnly} /><Field label="Total stock" type="number" value={totalStock} onChange={() => {}} readOnly /></div>
    {!readOnly && <p className="-mt-2 text-xs text-ink-muted">Discount % updates the MRP while keeping the selling price fixed. Use sort order to control frontend display order.</p>}
    <div className="grid gap-3 md:grid-cols-2"><Field label="Rating" type="number" value={form.rating} onChange={v => set('rating', Math.min(5, Math.max(0, v)))} readOnly={readOnly} /><Field label="Reviews" type="number" value={form.reviews} onChange={v => set('reviews', Math.max(0, v))} readOnly={readOnly} /></div>
    <Area label="Description" value={form.description} onChange={v => set('description', v)} readOnly={readOnly} />
    <div className="grid gap-3 md:grid-cols-2"><Field label="Material" value={form.material} onChange={v => set('material', v)} readOnly={readOnly} /><Field label="Care" value={form.care} onChange={v => set('care', v)} readOnly={readOnly} /></div>
    <div className="mt-3">
      <SectionLabel label="Highlights (optional)" />
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Product Category" value={form.highlights?.category || ''} onChange={v => set('highlights', { ...(form.highlights || {}), category: v })} readOnly={readOnly} />
        <Field label="Product Type" value={form.highlights?.type || ''} onChange={v => set('highlights', { ...(form.highlights || {}), type: v })} readOnly={readOnly} />
        <Field label="Fit" value={form.highlights?.fit || ''} onChange={v => set('highlights', { ...(form.highlights || {}), fit: v })} readOnly={readOnly} />
      </div>
      <div className="grid gap-3 md:grid-cols-3 mt-3">
        <Field label="Closure" value={form.highlights?.closure || ''} onChange={v => set('highlights', { ...(form.highlights || {}), closure: v })} readOnly={readOnly} />
        <Field label="Length" value={form.highlights?.length || ''} onChange={v => set('highlights', { ...(form.highlights || {}), length: v })} readOnly={readOnly} />
        <Field label="Fabric" value={form.highlights?.fabric || ''} onChange={v => set('highlights', { ...(form.highlights || {}), fabric: v })} readOnly={readOnly} />
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-2"><Field label="Tag" value={form.tag} onChange={v => set('tag', v)} readOnly={readOnly} /><Field label="Offer tag" value={form.offerTag} onChange={v => set('offerTag', v)} readOnly={readOnly} /></div>
    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isFeatured} disabled={readOnly} onChange={e => set('isFeatured', e.target.checked)} className="disabled:cursor-not-allowed" /> Featured product</label>
    <ColorVariantEditor rows={form.colorVariants} colors={catalogColors} sizes={catalogSizes} onChange={rows => set('colorVariants', rows)} onPreview={onPreview} readOnly={readOnly} />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-alt px-4 py-3">
      <div>
        <p className="text-sm font-black text-ink">Variant mapping</p>
        <p className="text-xs text-ink-muted">Review color, size, stock and image mapping before saving.</p>
      </div>
      <button type="button" onClick={onShowMapping} className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-black hover:border-primary hover:text-primary">
        <Table2 size={16}/> View mapping table
      </button>
    </div>
    <FormActions onSave={onSave} onCancel={onCancel} saving={saving} readOnly={readOnly} />
  </div>
}

function CategoryForm({ form, setForm, onPreview, onSave, onCancel, saving = false }) {
  const set = (key, value) => setForm({ ...form, [key]: value })
  const subcategories = form.subcategories?.length ? form.subcategories : [{ name: '', slug: '', sortOrder: 0 }]
  const setSubcategories = (rows) => set('subcategories', rows)
  return <div className="grid gap-4">
    <div className="grid gap-3 md:grid-cols-2"><Field label="Name" value={form.name} onChange={v => set('name', v)} /><Field label="Slug" value={form.slug} onChange={v => set('slug', v)} /></div>
    <SubcategoryEditor rows={subcategories} onChange={setSubcategories} />
    <FileUpload label="Upload category image" onUploaded={url => set('imageUrl', url)} />
    {form.imageUrl && <MediaGrid items={[form.imageUrl]} onPreview={(url) => onPreview({ type: 'image', url, title: form.name || 'Category image' })} onRemove={() => set('imageUrl', '')} />}
    <div className="grid gap-3 md:grid-cols-2"><Field label="Sort order" type="number" value={form.sortOrder} onChange={v => set('sortOrder', v)} /><SelectField label="Status" value={form.status} onChange={v => set('status', v)}><option>active</option><option>draft</option><option>inactive</option></SelectField></div>
    <FormActions onSave={onSave} onCancel={onCancel} saving={saving} />
  </div>
}

function ColorForm({ form, setForm, onSave, onCancel, saving = false }) {
  const set = (key, value) => setForm({ ...form, [key]: value })
  return <div className="grid gap-4">
    <div className="grid gap-3 md:grid-cols-[1fr_5rem]"><Field label="Name" value={form.name} onChange={v => set('name', v)} /><label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Swatch</span><input type="color" value={form.hex} onChange={e => set('hex', e.target.value)} className="h-11 w-full rounded-lg border border-line bg-white p-1" /></label></div>
    <div className="grid gap-3 md:grid-cols-2"><Field label="Sort order" type="number" value={form.sortOrder} onChange={v => set('sortOrder', v)} /><SelectField label="Status" value={form.status} onChange={v => set('status', v)}><option>active</option><option>draft</option><option>inactive</option></SelectField></div>
    <FormActions onSave={onSave} onCancel={onCancel} saving={saving} />
  </div>
}

function SizeForm({ form, setForm, onSave, onCancel, saving = false }) {
  const set = (key, value) => setForm({ ...form, [key]: value })
  return <div className="grid gap-4">
    <Field label="Size" value={form.size} onChange={v => set('size', v)} />
    <div className="grid gap-3 md:grid-cols-2"><Field label="Sort order" type="number" value={form.sortOrder} onChange={v => set('sortOrder', v)} /><SelectField label="Status" value={form.status} onChange={v => set('status', v)}><option>active</option><option>draft</option><option>inactive</option></SelectField></div>
    <FormActions onSave={onSave} onCancel={onCancel} saving={saving} />
  </div>
}

function SubcategoryEditor({ rows, onChange }) {
  const update = (index, patch) => onChange(rows.map((row, i) => i === index ? { ...row, ...patch } : row))
  return <div>
    <SectionLabel label="Subcategories" />
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_5rem_auto]">
          <input value={row.name || ''} onChange={e => update(index, { name: e.target.value, slug: row.slug || slugifyClient(e.target.value) })} placeholder="Subcategory name" className="h-10 rounded-lg border border-line bg-surface-alt px-3 text-sm font-semibold outline-none focus:border-primary" />
          <input value={row.slug || ''} onChange={e => update(index, { slug: e.target.value })} placeholder="slug" className="h-10 rounded-lg border border-line bg-surface-alt px-3 text-sm font-semibold outline-none focus:border-primary" />
          <input type="number" value={row.sortOrder ?? index} onChange={e => update(index, { sortOrder: Number(e.target.value) })} className="h-10 rounded-lg border border-line bg-surface-alt px-3 text-sm font-semibold outline-none focus:border-primary" />
          <button onClick={() => onChange(rows.filter((_, i) => i !== index))} className="flex h-10 w-10 items-center justify-center justify-self-end rounded-lg border border-red-200 text-red-500 hover:bg-red-50" aria-label="Remove subcategory"><Trash2 size={14}/></button>
        </div>
      ))}
    </div>
    <button onClick={() => onChange([...rows, { name: '', slug: '', sortOrder: rows.length }])} className="mt-2 h-10 rounded-lg border border-line px-4 text-sm font-bold hover:border-primary hover:text-primary">Add subcategory</button>
  </div>
}

function HeroForm({ form, setForm, onPreview, onSave, onCancel, saving = false }) {
  const set = (key, value) => setForm({ ...form, [key]: value })
  return <div className="grid gap-4"><div className="grid gap-3 md:grid-cols-2"><Field label="Title" value={form.title} onChange={v => set('title', v)} /><Field label="Kicker" value={form.kicker} onChange={v => set('kicker', v)} /></div><Area label="Subtitle" value={form.subtitle} onChange={v => set('subtitle', v)} /><div className="grid gap-3 md:grid-cols-2"><Field label="CTA label" value={form.ctaLabel} onChange={v => set('ctaLabel', v)} /><Field label="CTA link" value={form.ctaLink} onChange={v => set('ctaLink', v)} /></div><div className="grid gap-3"><FileUpload label="Upload hero image" onUploaded={url => set('imageUrl', url)} /></div>{form.imageUrl && <MediaGrid items={[form.imageUrl]} onPreview={(url) => onPreview({ type: 'image', url, title: form.title || 'Hero image' })} onRemove={() => set('imageUrl', '')} />}<div className="grid gap-3 md:grid-cols-2"><Field label="Sort order" type="number" value={form.sortOrder} onChange={v => set('sortOrder', v)} /><SelectField label="Status" value={form.status} onChange={v => set('status', v)}><option>active</option><option>draft</option><option>inactive</option></SelectField></div><FormActions onSave={onSave} onCancel={onCancel} saving={saving} /></div>
}

function CouponForm({ form, setForm, onSave, onCancel, saving = false }) {
  const set = (key, value) => setForm({ ...form, [key]: value })
  return <div className="grid gap-4">
    <div className="grid gap-3 md:grid-cols-2"><Field label="Code" value={form.code} onChange={v => set('code', v.toUpperCase())} /><SelectField label="Type" value={form.type} onChange={v => set('type', v)}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option><option value="shipping">Free shipping</option></SelectField></div>
    <div className="grid gap-3 md:grid-cols-2"><Field label={form.type === 'percentage' ? 'Discount percent' : 'Value'} type="number" value={form.value} onChange={v => set('value', v)} /><Field label="Minimum cart" type="number" value={form.minCart} onChange={v => set('minCart', v)} /></div>
    <Area label="Description" value={form.description} onChange={v => set('description', v)} />
    <div className="grid gap-3 md:grid-cols-2"><Field label="Starts at" type="date" value={form.startsAt} onChange={v => set('startsAt', v)} /><Field label="Ends at" type="date" value={form.endsAt} onChange={v => set('endsAt', v)} /></div>
    <SelectField label="Status" value={form.status} onChange={v => set('status', v)}><option>active</option><option>draft</option><option>inactive</option></SelectField>
    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> Available to customers</label>
    <FormActions onSave={onSave} onCancel={onCancel} saving={saving} />
  </div>
}

function AnnouncementEditor({ value, onChange }) {
  const rows = value?.length ? value : ['']
  return <div className="mt-4">
    <SectionLabel label="Announcement bars" />
    <div className="space-y-2">
      {rows.map((message, index) => (
        <div key={index} className="flex gap-2">
          <input value={message} onChange={e => onChange(rows.map((item, i) => i === index ? e.target.value : item))} placeholder={`Announcement ${index + 1}`} className="h-10 flex-1 rounded-lg border border-line bg-surface-alt px-3 text-sm font-semibold outline-none focus:border-primary" />
          <button onClick={() => onChange(rows.filter((_, i) => i !== index))} className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50" aria-label="Remove announcement"><Trash2 size={15}/></button>
        </div>
      ))}
    </div>
    <button onClick={() => onChange([...rows, ''])} className="mt-2 h-10 rounded-lg border border-line px-4 text-sm font-bold hover:border-primary hover:text-primary">Add announcement</button>
  </div>
}

function PopupEditor({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next })
  const accent = String(value.color || '').match(/^#[0-9a-fA-F]{6}$/) ? value.color : '#F97316'
  const href = String(value.buttonUrl || '').trim()
  const normalizedHref = href ? (href.startsWith('/') ? href : `/${href}`) : ''
  const showPreviewCta = Boolean(String(value.buttonText || '').trim()) && Boolean(normalizedHref)
  const title = String(value.title || '').trim()
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
    <div>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={Boolean(value.enabled)} onChange={e => set('enabled', e.target.checked)} className="h-4 w-4 rounded" /> Show popup across the storefront</label>
      <div className="mt-4 space-y-4">
        <Field label="Title" value={value.title} onChange={v => set('title', v)} placeholder="MEGA SALE — Flat 30% Off" />
        <Area label="Description" value={value.description} onChange={v => set('description', v)} />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Button text" value={value.buttonText} onChange={v => set('buttonText', v)} placeholder="Shop the Sale" />
          <Field label="Button URL" value={value.buttonUrl} onChange={v => set('buttonUrl', v)} placeholder="/plp?tag=SALE" />
        </div>
        <p className="-mt-2 text-xs leading-5 text-ink-muted">Destination is a storefront path — e.g. <code className="rounded bg-surface-raised px-1">plp?tag=SALE</code> or <code className="rounded bg-surface-raised px-1">/plp?category=earrings&amp;subcategory=general</code>. The leading slash and everything after it is kept as the page link.</p>
        <div className="grid gap-3 md:grid-cols-[1fr_3rem_3rem]">
          <Field label="Accent color" value={value.color || '#F97316'} onChange={v => set('color', v)} />
          <label className="flex flex-col justify-end"><span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Pick</span><input type="color" value={accent} onChange={e => set('color', e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white p-1" title="Pick popup accent color" /></label>
          <label className="flex flex-col justify-end"><span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Swatch</span><span className="mt-1.5 h-11 rounded-lg border" style={{ background: accent }} /></label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Delay (seconds)" type="number" value={value.delaySeconds} onChange={v => set('delaySeconds', v)} />
          <Field label="Repeat interval (days)" type="number" value={value.repeatAfterDays} onChange={v => set('repeatAfterDays', v)} />
        </div>
        <p className="text-xs leading-5 text-ink-muted">Shows after the delay, then waits at least 24 hours before the same visitor sees it again.</p>
      </div>
    </div>

    <div>
      <SectionLabel label="Live preview" />
      <div className="rounded-xl border border-line bg-surface-alt p-4">
        <div className="mx-auto max-w-xs overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          {showPreviewCta && (
            <div className="px-6 pb-5 pt-6 text-white" style={{ background: accent }}>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-85">Exclusive Offer</p>
              <p className="font-display text-xl font-black leading-tight">{title || 'Sale heading'}</p>
            </div>
          )}
          <div className="p-6">
            {!showPreviewCta && <p className="font-display text-xl font-black leading-tight" style={{ color: 'var(--color-ink)' }}>{title || 'Sale heading'}</p>}
            <p className="mt-2 text-sm text-ink-mid">{String(value.description || '').trim() || 'Pop up description text sits here.'}</p>
            {showPreviewCta && <span className="mt-4 flex h-11 items-center justify-center rounded-lg text-sm font-black text-white" style={{ background: accent }}>{String(value.buttonText || '').trim()} →</span>}
          </div>
        </div>
      </div>
    </div>
  </div>
}

function MediaGrid({ items, type = 'image', onPreview, onRemove, readOnly = false }) {
  if (!items?.length) return null
  return <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
    {items.map((url, index) => (
      <div key={`${url}-${index}`} className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="relative aspect-[4/3] bg-surface-alt">
          <img src={url} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex items-center justify-between gap-2 p-2">
          <span className="truncate text-xs font-bold text-ink-muted">{`Image ${index + 1}`}</span>
          <div className="flex gap-1">
            <button onClick={() => onPreview(url)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line hover:border-primary hover:text-primary" aria-label="Preview media"><Eye size={15}/></button>
            {!readOnly && <button onClick={() => onRemove(index)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50" aria-label="Remove media"><Trash2 size={14}/></button>}
          </div>
        </div>
      </div>
    ))}
  </div>
}

function ColorVariantEditor({ rows, colors = [], sizes = [], onChange, onPreview, readOnly = false }) {
  const updateColor = (index, patch) => onChange(rows.map((row, i) => i === index ? { ...row, ...patch } : row))
  const updateSizes = (index, sizes) => updateColor(index, { sizes })
  const updateImages = (index, images) => updateColor(index, { images })

  return <div>
    <SectionLabel label="Colors, images & stock" />
    <p className="mb-3 text-xs text-ink-muted">For each color, upload one or more images, then add sizes with stock for that color.</p>
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div key={index} className="rounded-xl border border-line bg-surface-alt p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_4rem]">
            <select value={row.name ?? ''} disabled={readOnly} onChange={e => {
              const color = colors.find(item => item.name === e.target.value)
              updateColor(index, { name: e.target.value, hex: color?.hex || row.hex || '#111111' })
            }} className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-[#eef0f3] disabled:text-ink-muted">
              <option value="">Select color</option>
              {colors.map(color => <option key={color.id || `${color.name}-${color.hex}`} value={color.name}>{color.name}</option>)}
            </select>
            <input type="color" value={row.hex || '#111111'} disabled={readOnly} onChange={e => updateColor(index, { hex: e.target.value })} className="h-10 rounded-lg border border-line bg-white p-1 disabled:cursor-not-allowed disabled:opacity-70" title="Color swatch" />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-ink-muted">Images for {row.name || 'this color'}</p>
            {!readOnly && <FileUpload label={`Upload image for ${row.name || 'color'}`} onUploaded={url => updateImages(index, [...(row.images || []).filter(Boolean), url])} />}
            <MediaGrid items={(row.images || []).filter(Boolean)} onPreview={(url) => onPreview({ type: 'image', url, title: `${row.name || 'Color'} image` })} onRemove={(imageIndex) => updateImages(index, (row.images || []).filter(Boolean).filter((_, i) => i !== imageIndex))} readOnly={readOnly} />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-ink-muted">Sizes, stock & price</p>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_88px_110px_auto]">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Size</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Stock</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Price override (₹)</span>
                <span className="hidden sm:block" />
              </div>
              {(row.sizes || []).map((size, sizeIndex) => (
                <div key={sizeIndex} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_88px_110px_auto]">
                  <select value={size.size ?? ''} disabled={readOnly} onChange={e => updateSizes(index, row.sizes.map((item, i) => i === sizeIndex ? { ...item, size: e.target.value } : item))} className="col-span-2 h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-[#eef0f3] disabled:text-ink-muted sm:col-span-1">
                    <option value="">Select size</option>
                    {sizes.map(option => <option key={option.id || option.size} value={option.size}>{option.size}</option>)}
                  </select>
                  <input type="number" min="0" value={size.stock ?? 0} disabled={readOnly} onChange={e => updateSizes(index, row.sizes.map((item, i) => i === sizeIndex ? { ...item, stock: Number(e.target.value) } : item))} placeholder="Stock" className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-[#eef0f3] disabled:text-ink-muted" />
                  <input type="number" min="0" step="1" value={size.priceOverride ?? 0} disabled={readOnly} onChange={e => updateSizes(index, row.sizes.map((item, i) => i === sizeIndex ? { ...item, priceOverride: Number(e.target.value) } : item))} placeholder="0" className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-[#eef0f3] disabled:text-ink-muted" />
                  {!readOnly && <button onClick={() => updateSizes(index, row.sizes.filter((_, i) => i !== sizeIndex))} className="flex h-10 w-10 items-center justify-center justify-self-end rounded-lg border border-red-200 text-red-500 hover:bg-red-50 sm:justify-self-auto" aria-label="Remove size"><Trash2 size={14}/></button>}
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-muted">Price override adds to the product price &amp; MRP for this size. Leave empty/0 to use the base price.</p>
            {!readOnly && <button onClick={() => updateSizes(index, [...(row.sizes || []), { size: '', stock: 0, priceOverride: 0 }])} className="mt-2 h-9 rounded-lg border border-line px-3 text-xs font-bold hover:border-primary hover:text-primary">Add size</button>}
          </div>

          {!readOnly && rows.length > 1 && <button onClick={() => onChange(rows.filter((_, i) => i !== index))} className="mt-4 text-xs font-bold text-red-500">Remove color</button>}
        </div>
      ))}
    </div>
    {!readOnly && <button onClick={() => onChange([...rows, { name: '', hex: '#111111', images: [''], sizes: [{ size: '', stock: 0, priceOverride: 0 }] }])} className="mt-3 h-10 w-full rounded-lg border border-line text-sm font-bold hover:border-primary hover:text-primary">Add color</button>}
  </div>
}

function VariantMappingModal({ rows, onClose }) {
  return <div className="fixed inset-0 z-[960] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm">
    <div className="w-full max-w-3xl rounded-lg border border-line bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h3 className="font-display text-2xl font-black">Variant mapping</h3>
          <p className="text-xs text-ink-muted">Color + size combinations with stock and image count.</p>
        </div>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-primary hover:text-primary"><X size={18}/></button>
      </div>
      <div className="max-h-[70vh] overflow-auto p-5">
        {!rows.length ? <Empty /> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-xs uppercase tracking-[0.12em] text-ink-muted">
              <tr>
                {['Color', 'Size', 'Stock', 'Images'].map(label => <th key={label} className="px-4 py-3 font-black">{label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row, index) => (
                <tr key={`${row.color}-${row.size}-${index}`}>
                  <td className="px-4 py-3 font-semibold"><span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full border border-line" style={{ background: row.hex }} />{row.color}</span></td>
                  <td className="px-4 py-3 font-semibold">{row.size}</td>
                  <td className="px-4 py-3 font-semibold">{row.stock}</td>
                  <td className="px-4 py-3 font-semibold">{row.images}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
}

function PreviewModal({ preview, onClose }) {
  return <div className="fixed inset-0 z-[950] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm"><div className="w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-line px-5 py-4"><h3 className="font-display text-xl font-black">{preview.title || 'Preview'}</h3><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-primary hover:text-primary"><X size={18}/></button></div><div className="bg-[#111318] p-4">{preview.type === 'product' ? <ProductPreview product={preview.product} /> : <img src={preview.url} alt="" className="mx-auto max-h-[72vh] rounded-lg object-contain" />}</div></div></div>
}

function OrderDeleteModal({ order, saving, onCancel, onConfirm }) {
  return <div className="fixed inset-0 z-[970] flex items-center justify-center overflow-y-auto bg-black/55 px-4 py-6 backdrop-blur-sm">
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-red-100 bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">Delete order</p>
          <h3 className="font-display text-2xl font-black">{order.orderNumber}</h3>
        </div>
        <button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-primary hover:text-primary" aria-label="Close delete warning"><X size={18}/></button>
      </div>
      <div className="p-5">
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-700">This permanently deletes the order and all related records — order items, payment records, transactions, and any linked return/exchange requests or coupons.</p>
          <p className="mt-1 text-xs font-semibold text-red-600">This cannot be undone. Consider exporting to CSV first (Export CSV button above) if you may need this record later.</p>
        </div>
        <div className="mt-4 rounded-lg border border-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Customer</span>
            <span className="text-sm font-bold text-ink">{order.customerName}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Total</span>
            <span className="text-sm font-bold text-ink">{money(order.total)}</span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button onClick={onCancel} disabled={saving} className="h-10 rounded-lg border border-line px-4 text-sm font-bold hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
          <button onClick={onConfirm} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70">{saving ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete order</button>
        </div>
      </div>
    </div>
  </div>
}

function CategoryDeleteModal({ impact, saving, onCancel, onConfirm }) {
  const total = impact.totalProducts || 0
  const categoryName = impact.category?.name || 'this category'
  return <div className="fixed inset-0 z-[970] flex items-center justify-center overflow-y-auto bg-black/55 px-4 py-6 backdrop-blur-sm">
    <div className="w-full max-w-xl overflow-hidden rounded-lg border border-red-100 bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">Delete category</p>
          <h3 className="font-display text-2xl font-black">{categoryName}</h3>
        </div>
        <button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-primary hover:text-primary" aria-label="Close delete warning"><X size={18}/></button>
      </div>
      <div className="p-5">
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-700">This will delete the category, its subcategories, and {total} related product{total === 1 ? '' : 's'}.</p>
          <p className="mt-1 text-xs font-semibold text-red-600">Products are removed from the storefront and admin catalog with this category.</p>
        </div>
        <div className="mt-4 rounded-lg border border-line">
          <div className="flex items-center justify-between border-b border-line bg-surface-alt px-4 py-3">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Subcategory</span>
            <span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Products</span>
          </div>
          {(impact.subcategories || []).length ? impact.subcategories.map(item => (
            <div key={item.slug} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0">
              <span className="text-sm font-bold text-ink">{item.name}</span>
              <span className="rounded-lg bg-surface-alt px-2.5 py-1 text-xs font-black text-ink-mid">{item.productCount}</span>
            </div>
          )) : (
            <div className="px-4 py-6 text-center text-sm font-semibold text-ink-muted">No products are currently attached to this category.</div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button onClick={onCancel} disabled={saving} className="h-10 rounded-lg border border-line px-4 text-sm font-bold hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
          <button onClick={onConfirm} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70">{saving ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete category and products</button>
        </div>
      </div>
    </div>
  </div>
}

function BulkOrderDeleteModal({ count, saving, onCancel, onConfirm }) {
  return <div className="fixed inset-0 z-[970] flex items-center justify-center overflow-y-auto bg-black/55 px-4 py-6 backdrop-blur-sm">
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-red-100 bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">Delete orders</p>
          <h3 className="font-display text-2xl font-black">{count} order{count === 1 ? '' : 's'} selected</h3>
        </div>
        <button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-primary hover:text-primary" aria-label="Close delete warning"><X size={18}/></button>
      </div>
      <div className="p-5">
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-700">This permanently deletes {count} order{count === 1 ? '' : 's'} and all related records — order items, payment records and transactions.</p>
          <p className="mt-1 text-xs font-semibold text-red-600">This cannot be undone. Export to CSV first if you may need these records later.</p>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button onClick={onCancel} disabled={saving} className="h-10 rounded-lg border border-line px-4 text-sm font-bold hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
          <button onClick={onConfirm} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70">{saving ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete {count} order{count === 1 ? '' : 's'}</button>
        </div>
      </div>
    </div>
  </div>
}

function ProductPreview({ product }) {
  const image = product.colorVariants?.[0]?.images?.[0] || product.images?.filter(Boolean)?.[0]
  const rating = Number(product.rating || 0)
  const variantRows = buildVariantRows(product.colorVariants || [])
  return <div className="mx-auto grid max-w-4xl overflow-hidden rounded-xl bg-white md:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
    <div className="relative aspect-[3/4] bg-surface-alt">
      {image ? <img src={image} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm font-bold text-ink-muted">No image</div>}
    </div>
    <div className="p-6 md:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint">{product.brand}</p>
      <h4 className="mt-2 font-display text-3xl font-black leading-tight text-ink">{product.name}</h4>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex text-primary">
          {[1, 2, 3, 4, 5].map(n => <Star key={n} size={15} fill={n <= Math.round(rating) ? 'currentColor' : 'none'} strokeWidth={1.6} />)}
        </div>
        <span className="text-sm font-semibold text-ink-muted">{rating.toFixed(1)} · {Number(product.reviews || 0)} reviews</span>
      </div>
      <div className="mt-5 flex items-baseline gap-3">
        <span className="text-3xl font-black text-ink">{money(product.sellPrice)}</span>
        <span className="text-base font-semibold text-ink-faint line-through">{money(product.mrp)}</span>
        <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-black text-green-700">{product.off}% OFF</span>
      </div>
      <p className="mt-5 text-sm leading-6 text-ink-mid">{product.description || 'No description added yet.'}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {variantRows.map(row => <span key={`${row.color}-${row.size}`} className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink-mid">{row.color} · {row.size} · {row.stock}</span>)}
      </div>
    </div>
  </div>
}

function ListEditor({ label, rows, onChange, columns, empty, readOnly = false }) {
  return <div><SectionLabel label={label} /><div className="space-y-2">{rows.map((row, index) => <div key={index} className="rounded-lg border border-line bg-surface-alt p-3"><div className="grid gap-2">{columns.map(([key, placeholder, type]) => <input key={key} type={type || 'text'} value={row[key] ?? ''} disabled={readOnly} onChange={e => onChange(rows.map((item, i) => i === index ? { ...item, [key]: type === 'number' ? Number(e.target.value) : e.target.value } : item))} placeholder={placeholder} className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-[#eef0f3] disabled:text-ink-muted" />)}</div>{!readOnly && <button onClick={() => onChange(rows.filter((_, i) => i !== index))} className="mt-2 text-xs font-bold text-red-500">Remove</button>}</div>)}</div>{!readOnly && <button onClick={() => onChange([...rows, empty])} className="mt-2 h-10 w-full rounded-lg border border-line text-sm font-bold">Add {label}</button>}</div>
}

function SectionLabel({ label }) {
  return <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">{label}</p>
}

function FormActions({ onSave, onCancel, saving = false, readOnly = false }) {
  return <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4"><button onClick={onCancel} disabled={saving} className="h-10 rounded-lg border border-line px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">{readOnly ? 'Close' : 'Cancel'}</button>{!readOnly && <button onClick={onSave} disabled={saving} className="inline-flex h-10 min-w-[105px] items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-75">{saving ? <RefreshCw size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>} {saving ? 'Saving...' : 'Save'}</button>}</div>
}

function MiniList({ rows, primary, secondary, onEdit, onDelete }) {
  if (!rows?.length) return <Empty />
  return <div className="divide-y divide-line rounded-lg border border-line">{rows.map(row => <div key={row.id} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate font-bold">{row[primary]}</p><p className="truncate text-xs text-ink-muted">{row[secondary]}</p></div><RowActions onEdit={() => onEdit(row)} onDelete={onDelete ? () => onDelete(row) : null} /></div>)}</div>
}

function DataTable({ rows, columns, actions }) {
  if (!rows?.length) return <Empty />
  return <div className="overflow-x-auto rounded-lg border border-line"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#f8f9fb] text-xs uppercase tracking-[0.12em] text-ink-muted"><tr>{columns.map(col => <th key={col} className="px-4 py-3 font-black">{col.replace(/_/g, ' ')}</th>)}{actions && <th className="px-4 py-3 font-black">Actions</th>}</tr></thead><tbody className="divide-y divide-line bg-white">{rows.map(row => <tr key={row.id} className="hover:bg-surface-alt/70">{columns.map(col => <td key={col} className="px-4 py-3 font-semibold text-ink-mid">{col.toLowerCase().includes('price') || col === 'total' ? money(row[col]) : String(row[col] ?? '-')}</td>)}{actions && <td className="px-4 py-3">{actions(row)}</td>}</tr>)}</tbody></table></div>
}

function RowActions({ onView, onEdit, onDelete }) {
  return <div className="flex gap-2">{onView && <button onClick={onView} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:border-primary hover:text-primary" aria-label="Preview product"><Eye size={14}/></button>}<button onClick={onEdit} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary">Edit</button>{onDelete && <button onClick={onDelete} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50"><Trash2 size={13}/></button>}</div>
}

function ThemeEditor({ theme, onChange }) {
  const current = normalizeTheme(theme)
  const setPrimary = (primary, name) => onChange(buildThemeFromPrimary(primary, name || 'Custom'))
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Current theme</p>
      <div className="mt-3 rounded-xl border border-line bg-surface-alt p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-xl border border-line shadow-sm" style={{ background: current.primary }} />
          <div>
            <p className="font-display text-xl font-black">{current.name}</p>
            <p className="text-xs font-semibold text-ink-muted">{current.primary} · {current.primaryDark} · {current.primaryLight}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-lg px-3 py-2 text-xs font-black text-white" style={{ background: current.primary }}>Primary button</span>
          <span className="rounded-lg border px-3 py-2 text-xs font-black" style={{ borderColor: current.primary, color: current.primary }}>Outline button</span>
          <span className="rounded-lg px-3 py-2 text-xs font-black" style={{ background: current.primaryLight, color: current.primaryDark }}>Accent badge</span>
        </div>
      </div>

      <p className="mt-5 mb-2 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Custom brand color</p>
      <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
        <input type="color" value={current.primary} onChange={e => setPrimary(e.target.value, 'Custom')} className="h-12 w-14 rounded-lg border border-line bg-white p-1" title="Pick brand color" />
        <input value={current.primary} onChange={e => setPrimary(e.target.value, 'Custom')} className="h-11 flex-1 rounded-lg border border-line bg-surface-alt px-3 text-sm font-semibold uppercase outline-none focus:border-primary" placeholder="#F97316" />
      </div>
    </div>

    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Premium presets</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {THEME_PRESETS.map(preset => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onChange(buildThemeFromPrimary(preset.primary, preset.name))}
            className={`rounded-xl border p-3 text-left transition ${current.primary === buildThemeFromPrimary(preset.primary).primary ? 'border-primary bg-primary/5 shadow-sm' : 'border-line bg-white hover:border-primary/40'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full border border-line" style={{ background: preset.primary }} />
              <span className="text-sm font-black text-ink">{preset.name}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-ink-muted">Theme updates buttons, links, accents, and highlights across the customer storefront and this admin panel instantly after you click Apply Theme.</p>
    </div>
  </div>
}

function OrdersPanel({ orders, filters, selectedOrders, onFiltersChange, onApplyFilters, onExportCsv, onToggleOrder, onToggleAll, onOpenOrder, onBulkUpdate, onBulkDelete, onDeleteOrder, reload }) {
  const allIds = orders.map(row => row.id)
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length
  const setFilter = (key, value) => onFiltersChange({ ...filters, [key]: value, ...(key === 'days' && value ? { month: '' } : {}), ...(key === 'month' && value ? { days: '' } : {}) })

  return <Panel title="Orders" icon={ShoppingBag}>
    <div className="mb-5 space-y-3 rounded-lg border border-line bg-surface-alt p-4">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Search name or mobile</span>
          <div className="relative mt-1.5">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder="Customer name or phone" className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-primary" />
          </div>
        </label>
        <SelectField label="Order status" value={filters.status} onChange={v => setFilter('status', v)}>
          <option value="">All statuses</option>
          {ORDER_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
        </SelectField>
        <SelectField label="Payment status" value={filters.paymentStatus} onChange={v => setFilter('paymentStatus', v)}>
          <option value="">All payments</option>
          {PAYMENT_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
        </SelectField>
        <SelectField label="Date range" value={filters.days} onChange={v => setFilter('days', v)}>
          {DATE_PRESETS.map(([value, label]) => <option key={value || 'all'} value={value}>{label}</option>)}
        </SelectField>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[180px]">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Month</span>
          <input type="month" value={filters.month} onChange={e => setFilter('month', e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-semibold outline-none focus:border-primary" />
        </label>
        <button onClick={() => onApplyFilters(filters)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white hover:bg-primary"><Search size={15}/>Apply filters</button>
        <button onClick={onExportCsv} className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-black hover:border-primary hover:text-primary"><Download size={15}/>{selectedOrders.length ? `Export ${selectedOrders.length} selected` : 'Export CSV'}</button>
        <button onClick={() => { onFiltersChange({ search: '', status: '', paymentStatus: '', days: '', month: '' }); onApplyFilters({ search: '', status: '', paymentStatus: '', days: '', month: '' }) }} className="inline-flex h-11 items-center rounded-lg border border-line bg-white px-4 text-sm font-bold hover:border-primary hover:text-primary">Clear</button>
      </div>
    </div>

    {selectedOrders.length > 0 && (
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <span className="text-sm font-black text-primary">{selectedOrders.length} selected</span>
        {ORDER_STATUS_OPTIONS.map(status => (
          <button key={status} onClick={() => onBulkUpdate({ status })} className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold capitalize hover:border-primary hover:text-primary">{status}</button>
        ))}
        <button onClick={onBulkDelete} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50">Delete</button>
      </div>
    )}

    {!orders.length ? <Empty /> : (
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#f8f9fb] text-xs uppercase tracking-[0.12em] text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-black">
                <button onClick={() => onToggleAll(allIds)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white hover:border-primary hover:text-primary" aria-label="Select all orders">
                  {allSelected ? <CheckSquare size={16}/> : <span className="h-4 w-4 rounded border-2 border-line" />}
                </button>
              </th>
              {['Order', 'Customer', 'Phone', 'Items', 'Total', 'Payment', 'Status', 'Actions'].map(label => <th key={label} className="px-4 py-3 font-black">{label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {orders.map(row => {
              const selected = selectedOrders.includes(row.id)
              return (
                <tr key={row.id} className={selected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-alt/70'}>
                  <td className="px-4 py-3">
                    <button onClick={() => onToggleOrder(row.id)} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${selected ? 'border-primary bg-primary text-white' : 'border-line bg-white hover:border-primary hover:text-primary'}`} aria-label={`Select order ${row.orderNumber}`}>
                      {selected ? <CheckSquare size={16}/> : <span className="h-4 w-4 rounded border-2 border-line" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => onOpenOrder(row)} className="font-black text-primary hover:underline">{row.orderNumber}</button>
                    <p className="text-xs text-ink-muted">{row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN') : '-'}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-mid">
                    <p>{row.customerName}</p>
                    <p className="text-xs text-ink-muted">{row.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-mid">{row.customerPhone || '-'}</td>
                  <td className="px-4 py-3 font-semibold text-ink-mid">{row.itemCount || 0}</td>
                  <td className="px-4 py-3 font-semibold text-ink-mid">{money(row.total)}</td>
                  <td className="px-4 py-3 font-semibold text-ink-mid">{row.paymentStatus}</td>
                  <td className="px-4 py-3 font-semibold text-ink-mid">{row.status}</td>
                  <td className="px-4 py-3"><OrderActions row={row} reload={reload} onDeleteRequest={onDeleteOrder} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )}
  </Panel>
}

function OrderDetailModal({ order, onClose, onUpdated }) {
  const address = order.shippingAddress || {}
  const addressLines = formatAddressLines(address)
  return <div className="fixed inset-0 z-[950] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm">
    <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-line bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Order details</p>
          <h3 className="font-display text-2xl font-black">{order.orderNumber}</h3>
          <p className="text-sm text-ink-muted">{order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : ''}</p>
        </div>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-primary hover:text-primary"><X size={18}/></button>
      </div>
      <div className="max-h-[75vh] overflow-auto p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <InfoCard title="Customer" lines={[order.customerName, order.customerEmail, order.customerPhone || order.shippingAddress?.phone]} />
          <InfoCard title="Shipping" lines={addressLines} emptyText="Shipping address not available" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <InfoCard title="Payment" lines={[order.paymentMethod, order.paymentStatus]} />
          <InfoCard title="Status" lines={[order.status]} />
          <InfoCard title="Total" lines={[money(order.total)]} />
        </div>

        <p className="mt-6 mb-3 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Ordered items</p>
        <div className="overflow-hidden rounded-lg border border-line">
          {(order.products || []).map((item, index) => (
            <div key={index} className="flex gap-4 border-b border-line p-4 last:border-0">
              {item.image ? <img src={item.image} alt="" className="h-16 w-14 rounded-lg object-cover" /> : <div className="flex h-16 w-14 items-center justify-center rounded-lg bg-surface-alt text-xs font-bold text-ink-muted">No img</div>}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{item.brand}</p>
                <p className="font-bold text-ink">{item.name}</p>
                <p className="text-xs text-ink-muted">Color: {item.color || '-'} · Size: {item.size} · Qty: {item.qty}</p>
              </div>
              <p className="font-black">{money((item.unitPrice || 0) * (item.qty || 0))}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          <InvoiceDownloadMenu order={order} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <SelectField label="Update status" value={order.status} onChange={async status => { await adminApi.updateOrder(order.id, { status }); toast.success('Order updated'); onUpdated() }}>
            {ORDER_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
          </SelectField>
          <SelectField label="Payment status" value={order.paymentStatus} onChange={async paymentStatus => { await adminApi.updateOrder(order.id, { paymentStatus }); toast.success('Payment status updated'); onUpdated() }}>
            {PAYMENT_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
          </SelectField>
        </div>
      </div>
    </div>
  </div>
}
// ─── APPEND TO THE ABSOLUTE BOTTOM OF THE FILE ─────────────────────────

function ReturnsPanel({ requests, coupons, filters, windowDays, onFiltersChange, onApplyFilters, onWindowDaysChange, onSaveWindow, onOpenRequest }) {
  return <>
    <Panel title="Return / Exchange Window" icon={Clock} action={<button onClick={onSaveWindow} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-white hover:bg-primary-dark"><Save size={16}/> Save</button>}>
      <label className="block max-w-xs">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Days after delivery customers can request a return or exchange</span>
        <input type="number" min={1} value={windowDays} onChange={e => onWindowDaysChange(Number(e.target.value))} className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface-alt px-3 text-sm font-semibold outline-none focus:border-primary" />
      </label>
    </Panel>

    <Panel title="Return & Exchange Requests" icon={RotateCcw}>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <SelectField label="Type" value={filters.type} onChange={v => onFiltersChange({ ...filters, type: v })}>
          <option value="">All types</option>
          <option value="return">Return</option>
          <option value="exchange">Exchange</option>
        </SelectField>
        <SelectField label="Status" value={filters.status} onChange={v => onFiltersChange({ ...filters, status: v })}>
          <option value="">All statuses</option>
          {RETURN_REQUEST_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
        </SelectField>
        <button onClick={() => onApplyFilters(filters)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white hover:bg-primary"><Search size={15}/>Apply</button>
      </div>
      {!requests.length ? <Empty /> : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#f8f9fb] text-xs uppercase tracking-[0.12em] text-ink-muted">
              <tr>{['Order', 'Customer', 'Item', 'Type', 'Reason', 'Status', 'Requested', 'Actions'].map(label => <th key={label} className="px-4 py-3 font-black">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {requests.map(row => (
                <tr key={row.id} className="hover:bg-surface-alt/70">
                  <td className="px-4 py-3 font-black text-primary">{row.orderNumber}</td>
                  <td className="px-4 py-3 font-semibold text-ink-mid">{row.customerName}<p className="text-xs text-ink-muted">{row.customerEmail}</p></td>
                  <td className="px-4 py-3 font-semibold text-ink-mid">{row.productName}<p className="text-xs text-ink-muted">{row.size} · Qty {row.quantity}</p></td>
                  <td className="px-4 py-3 font-semibold capitalize text-ink-mid">{row.type}</td>
                  <td className="px-4 py-3 font-semibold text-ink-mid">{RETURN_REASON_LABELS[row.reasonCategory] || row.reasonCategory}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                      row.status === 'requested' ? 'bg-yellow-100 text-yellow-700' :
                      row.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      row.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-mid">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '-'}</td>
                  <td className="px-4 py-3"><button onClick={() => onOpenRequest(row)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>

    <Panel title="Exchange Coupons" icon={Ticket}>
      <DataTable
        rows={coupons.map(c => ({
          ...c,
          customer: c.customerName,
          value: money(c.value),
          expiresAt: c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '-'
        }))}
        columns={['code', 'customer', 'value', 'status', 'expiresAt']}
      />
    </Panel>
  </>
}

function ReturnRequestDetailModal({ request, onClose, onDecided }) {
  const [remarks, setRemarks] = useState(request.adminRemarks || '')
  const [deciding, setDeciding] = useState(false)

  const decide = async (status) => {
    setDeciding(true)
    try {
      const result = await adminApi.decideReturnExchangeRequest(request.id, { status, remarks: remarks.trim() || undefined })
      toast.success(result?.coupon
        ? `Approved — coupon ${result.coupon.code} issued (${money(result.coupon.value)})`
        : (status === 'approved' ? 'Request approved' : 'Request rejected'))
      onDecided()
    } catch (error) {
      toast.error(error.message || 'Could not update request')
    } finally {
      setDeciding(false)
    }
  }

  const markRefunded = async () => {
    setDeciding(true)
    try {
      await adminApi.markReturnRefunded(request.id, { remarks: remarks.trim() || undefined })
      toast.success('Marked as refunded')
      onDecided()
    } catch (error) {
      toast.error(error.message || 'Could not update request')
    } finally {
      setDeciding(false)
    }
  }

  return <div className="fixed inset-0 z-[950] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm">
    <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-line bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">{request.type === 'return' ? 'Return' : 'Exchange'} request</p>
          <h3 className="font-display text-2xl font-black">{request.orderNumber}</h3>
          <p className="text-sm text-ink-muted">{request.createdAt ? new Date(request.createdAt).toLocaleString('en-IN') : ''}</p>
        </div>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-primary hover:text-primary"><X size={18}/></button>
      </div>
      <div className="max-h-[75vh] overflow-auto p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <InfoCard title="Customer" lines={[request.customerName, request.customerEmail, request.customerPhone]} />
          <InfoCard title="Item" lines={[request.productName, `Size: ${request.size} · Qty: ${request.quantity}`, money(request.itemTotal)]} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <InfoCard title="Reason" lines={[RETURN_REASON_LABELS[request.reasonCategory] || request.reasonCategory, request.reasonNotes]} />
          <InfoCard title="Status" lines={[request.status]} />
        </div>

        <p className="mt-6 mb-3 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Evidence</p>
        <div className="flex flex-wrap gap-3">
          {(request.evidenceImages || []).map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer" className="h-24 w-24 overflow-hidden rounded-lg border border-line">
              <img src={url} alt="" className="h-full w-full object-cover" />
            </a>
          ))}
          {request.driveLink && (
            <a href={request.driveLink} target="_blank" rel="noreferrer" className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-center text-xs font-bold text-primary hover:border-primary">
              <LinkIcon size={16}/> Drive link
            </a>
          )}
          {!request.evidenceImages?.length && !request.driveLink && <p className="text-sm text-ink-muted">No evidence attached.</p>}
        </div>

        <label className="mt-6 block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Admin remarks</span>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} className="mt-1.5 w-full rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm font-semibold outline-none focus:border-primary" />
        </label>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          {request.status === 'requested' && (
            <>
              <button onClick={() => decide('approved')} disabled={deciding} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"><CheckCircle2 size={16}/> Approve</button>
              <button onClick={() => decide('rejected')} disabled={deciding} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-black text-red-600 hover:bg-red-50 disabled:opacity-60"><XCircle size={16}/> Reject</button>
            </>
          )}
          {request.status === 'approved' && request.type === 'return' && (
            <button onClick={markRefunded} disabled={deciding} className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white hover:bg-primary disabled:opacity-60"><CheckCircle2 size={16}/> Mark Refunded</button>
          )}
        </div>
      </div>
    </div>
  </div>
}

function formatAddressLines(address = {}) {
  return [
    address.fullName || address.full_name,
    address.phone,
    [address.addressLine1 || address.address_line1, address.addressLine2 || address.address_line2].filter(Boolean).join(', '),
    [address.city, address.state, address.pincode].filter(Boolean).join(', ')
  ].filter(Boolean)
}

function InvoiceDownloadMenu({ order }) {
  return <details className="relative">
    <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white hover:bg-primary">
      <Download size={15}/> Download Invoice
    </summary>
    <div className="absolute left-0 top-12 z-10 w-48 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-xl">
      <button type="button" onClick={() => downloadInvoice(order, 'a4')} className="block w-full px-4 py-2.5 text-left text-sm font-bold text-ink-mid hover:bg-surface-alt hover:text-primary">A4 invoice</button>
      <button type="button" onClick={() => downloadInvoice(order, 'thermal')} className="block w-full px-4 py-2.5 text-left text-sm font-bold text-ink-mid hover:bg-surface-alt hover:text-primary">Thermal invoice</button>
    </div>
  </details>
}

function InfoCard({ title, lines = [], emptyText = 'Not available' }) {
  const visibleLines = lines.filter(Boolean)
  return <div className="rounded-lg border border-line bg-surface-alt p-4">
    <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">{title}</p>
    {visibleLines.length
      ? visibleLines.map((line, index) => <p key={index} className="mt-1 text-sm font-semibold text-ink-mid">{line}</p>)
      : <p className="mt-1 text-sm font-semibold text-ink-muted">{emptyText}</p>}
  </div>
}

function LoadingOverlay({ message }) {
  return <div className="fixed inset-0 z-[940] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
    <div className="rounded-lg bg-white px-6 py-5 text-center shadow-2xl">
      <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-primary" />
      <p className="text-sm font-semibold text-ink-muted">{message}</p>
    </div>
  </div>
}

function OrderActions({ row, reload, onDeleteRequest }) {
  return <div className="flex items-center gap-2">
    <select defaultValue={row.status} onChange={async e => { await adminApi.updateOrder(row.id, { status: e.target.value }); toast.success('Order updated'); await reload() }} className="h-9 rounded-lg border border-line bg-white px-2 text-xs font-bold">{ORDER_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}</select>
    <button onClick={() => onDeleteRequest(row)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50" aria-label={`Delete order ${row.orderNumber}`}><Trash2 size={14}/></button>
  </div>
}

function UserActions({ row, reload }) {
  return <button onClick={async () => { await adminApi.updateUser(row.id, { isActive: !row.is_active, status: row.is_active ? 'blocked' : 'active' }); toast.success('User updated'); await reload() }} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary">{row.is_active ? 'Block' : 'Activate'}</button>
}

function MobileNav({ tab, onNavigate, onRefresh, onLogout, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  return (
    <div className="fixed inset-0 z-[980] lg:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line p-4">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-ink-muted">Nizampilla Divya Jewellery</p>
            <p className="font-display text-lg font-black">Admin Panel</p>
          </div>
          <button onClick={onClose} aria-label="Close navigation" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line hover:border-primary hover:text-primary"><X size={18}/></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(([id, label, Icon]) => (
            <button key={id} onClick={() => onNavigate(id)} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${tab === id ? 'bg-primary text-white shadow-sm' : 'text-ink-muted hover:bg-surface-alt hover:text-ink'}`}>
              <Icon size={17}/>{label}
            </button>
          ))}
        </nav>
        <div className="space-y-2 border-t border-line p-3">
          <button onClick={onRefresh} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-line text-sm font-bold hover:border-primary hover:text-primary"><RefreshCw size={15}/>Refresh</button>
          <button onClick={onLogout} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-bold text-white hover:bg-primary"><LogOut size={15}/>Logout</button>
        </div>
      </div>
    </div>
  )
}

function Empty() {
  return <div className="flex flex-col items-center justify-center py-14 text-center"><Search size={30} className="mb-3 text-ink-faint" /><p className="font-bold text-ink-muted">No records found</p></div>
}

function AdminLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f4f5f7] px-5 text-ink"><div className="admin-loading-card w-full max-w-sm rounded-2xl border border-line bg-white p-7 text-center shadow-xl"><div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><span className="admin-loading-ring absolute inset-0 rounded-2xl border-2 border-primary/15 border-t-primary" /><LayoutDashboard size={22}/></div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Checking Access</p><h1 className="mt-2 font-display text-2xl font-black">Loading admin panel</h1><p className="mt-2 text-sm text-ink-muted">Please wait while your admin session is verified.</p><div className="mt-5 flex justify-center gap-1.5"><span className="auth-loader-dot h-2 w-2 rounded-full bg-primary" /><span className="auth-loader-dot h-2 w-2 rounded-full bg-primary" /><span className="auth-loader-dot h-2 w-2 rounded-full bg-primary" /></div></div></main>
}