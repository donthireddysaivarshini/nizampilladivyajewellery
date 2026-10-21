'use client'
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Play, Star, X, Heart } from 'lucide-react'
import { catalogApi } from '@/lib/api'
import { useStore } from '@/context/StoreContext'
import { useWishlist } from '@/context/WishlistContext'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import { colorSwatchClass, formatPrice } from '@/lib/utils'
import Breadcrumb from '@/components/ui/Breadcrumb'
import ProductCard from '@/components/ui/ProductCard'

const titleCase = value =>
  value
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase()) || 'Regular'

const topwear = ['t-shirts', 'blazers', 'sweaters', 'tops', 'jackets']
const bottomwear = ['jeans', 'trousers', 'skirts', 'joggers']

function getHighlightCategory(product) {
  if (topwear.includes(product.subcategory)) return 'Topwear'
  if (bottomwear.includes(product.subcategory)) return 'Bottomwear'
  if (product.category === 'dresses') return 'Dress'
  if (product.subcategory === 'co-ords') return 'Co-ord Set'
  return titleCase(product.category)
}

function getProductType(product) {
  if (product.subcategory === 't-shirts') return product.name.includes('Oversized') ? 'Oversized Tshirt' : 'Tshirt'
  return titleCase(product.subcategory)
}

function getFit(product) {
  const text = `${product.name} ${product.description}`.toLowerCase()
  if (text.includes('oversized')) return 'Oversized Fit'
  if (text.includes('slim')) return 'Slim Fit'
  if (text.includes('wide leg')) return 'Wide Leg Fit'
  if (text.includes('relaxed')) return 'Relaxed Fit'
  if (text.includes('flowy')) return 'Flowy Fit'
  return 'Regular Fit'
}

function getClosure(product) {
  const text = `${product.name} ${product.description}`.toLowerCase()
  if (text.includes('zip')) return 'Zip Closure'
  if (text.includes('button')) return 'Button Closure'
  if (text.includes('drawstring')) return 'Drawstring Closure'
  if (text.includes('tie')) return 'Tie Closure'
  return 'No Closure'
}

function getLength(product) {
  const text = `${product.name} ${product.description}`.toLowerCase()
  if (text.includes('cropped')) return 'Cropped'
  if (text.includes('midi')) return 'Midi'
  if (text.includes('maxi')) return 'Maxi'
  if (text.includes('ankle')) return 'Ankle Length'
  return 'Regular'
}


const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const TAG_CYCLE_MS = 3200
const getTouchDistance = (touches) => {
  const [a, b] = touches
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function highResImage(src) {
  if (!src) return ''
  if (src.includes('images.unsplash.com')) {
    return src.replace(/([?&])w=\d+/i, '$1w=1800').replace(/([?&])q=\d+/i, '$1q=90')
  }
  return src
}

function getSizesForColor(product, color) {
  if (!product || !color) return product?.sizes || []
  if (product.variants?.length) {
    return product.variants
      .filter(variant => variant.color === color.name && variant.hex === color.hex)
      .map(variant => ({ size: variant.size, stock: Number(variant.stock || 0), priceOverride: Number(variant.priceOverride || 0) }))
  }
  return product.sizes || []
}

function getProductTags(product) {
  const tags = [
    ...(Array.isArray(product.tags) ? product.tags : []),
    product.offerTag,
    product.tag,
  ]
    .filter(Boolean)
    .map((tag) => String(tag).trim())
    .filter(Boolean)

  return [...new Set(tags)]
}

function ProductGallery({ product, media, mediaIdx, setMediaIdx, isOOS }) {
  const { isWishlisted, toggle } = useWishlist()
  const wishlisted = isWishlisted(product?.id)
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 })
  const [viewerOpen, setViewerOpen] = useState(false)
  const [tagIdx, setTagIdx] = useState(0)
  const swipeRef = useRef({ active: false, startX: 0, startY: 0, didSwipe: false })
  const productTags = useMemo(() => getProductTags(product), [product])

  const mediaCount = media.length
  const current = media[mediaIdx]
  const isVideoItem = current?.type === 'video'

  const imageIndexes = useMemo(() => media.map((item, i) => (item.type === 'image' ? i : -1)).filter(i => i >= 0), [media])
  const imageUrls = useMemo(() => media.filter(item => item.type === 'image').map(item => item.url), [media])
  const imagePos = current?.type === 'image' ? imageIndexes.indexOf(mediaIdx) : 0

  const isFinePointer = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches

  const openViewer = () => {
    if (swipeRef.current.didSwipe) {
      swipeRef.current.didSwipe = false
      return
    }
    if (!isVideoItem && !isFinePointer()) setViewerOpen(true)
  }

  const goToMedia = useCallback((index) => {
    if (mediaCount <= 1) return
    setMediaIdx((index + mediaCount) % mediaCount)
  }, [mediaCount, setMediaIdx])

  useEffect(() => {
    setTagIdx(0)
    if (productTags.length <= 1) return undefined

    const timer = setInterval(() => {
      setTagIdx((i) => (i + 1) % productTags.length)
    }, TAG_CYCLE_MS)

    return () => clearInterval(timer)
  }, [productTags.length])

  const handleMouseMove = (event) => {
    if (!isFinePointer() || isVideoItem) return
    const rect = event.currentTarget.getBoundingClientRect()
    setZoom({
      active: true,
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    })
  }

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1 || mediaCount <= 1) return
    const touch = event.touches[0]
    swipeRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      didSwipe: false,
    }
  }

  const handleTouchMove = (event) => {
    if (!swipeRef.current.active || event.touches.length !== 1) return
    const touch = event.touches[0]
    const dx = touch.clientX - swipeRef.current.startX
    const dy = touch.clientY - swipeRef.current.startY

    if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      event.preventDefault()
    }
  }

  const handleTouchEnd = (event) => {
    if (!swipeRef.current.active) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - swipeRef.current.startX
    const dy = touch.clientY - swipeRef.current.startY
    swipeRef.current.active = false

    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      swipeRef.current.didSwipe = true
      goToMedia(mediaIdx + (dx < 0 ? 1 : -1))
    }
  }

  return (
    <>
      <div
        className={`group/gallery relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl bg-surface-alt shadow-card ${isVideoItem ? '' : 'cursor-zoom-in md:cursor-crosshair'}`}
        onClick={openViewer}
        onMouseEnter={() => !isVideoItem && isFinePointer() && setZoom((z) => ({ ...z, active: true }))}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isVideoItem ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full bg-surface-alt object-cover"
          />
        ) : current ? (
          <>
            <Image
              src={current.url}
              alt={product.name}
              fill
              priority
              sizes="(max-width:768px)100vw,50vw"
              className="object-cover transition-transform duration-500 ease-out md:group-hover/gallery:scale-[1.015]"
            />

            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-10 hidden bg-no-repeat opacity-0 transition-opacity duration-200 ease-out md:block ${zoom.active ? 'opacity-100' : ''}`}
              style={{
                backgroundImage: `url(${highResImage(current.url)})`,
                backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                backgroundSize: '230%',
              }}
            />
          </>
        ) : null}

        {isOOS && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/75">
            <span className="rounded-full border border-line bg-white px-6 py-2 text-[13px] font-semibold text-ink-mid shadow">Out of Stock</span>
          </div>
        )}
        {productTags.length > 0 && (
          <div className="absolute left-4 top-4 z-30 h-[38px] max-w-[calc(100%-2rem)] overflow-hidden pointer-events-none">
            <span
              key={productTags[tagIdx]}
              className={`${productTags.length > 1 ? 'product-card-tag-slide' : ''} inline-flex max-w-full items-center rounded-md bg-white px-3 py-2 text-[11px] font-extrabold uppercase leading-none tracking-normal text-green-700 shadow-[0_2px_10px_rgba(0,0,0,0.12)] ring-1 ring-black/5 sm:text-xs`}
            >
              <span className="truncate">{productTags[tagIdx]}</span>
            </span>
          </div>
        )}

        <button
          onClick={(event) => {
            event.stopPropagation()
            toggle(product)
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          className="absolute right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 transition-all hover:scale-110 active:scale-95"
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} strokeWidth={wishlisted ? 2.2 : 2} style={{ color: wishlisted ? 'var(--color-primary)' : 'currentColor' }} />
        </button>

        {mediaCount > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center gap-1.5 md:hidden" aria-label={`Media ${mediaIdx + 1} of ${mediaCount}`}>
            {media.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full shadow-sm transition-all duration-300 ${
                  i === mediaIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {mediaCount > 1 && (
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {media.map((item, i) => (
            <button key={`${item.type}-${i}`} onClick={() => setMediaIdx(i)} aria-label={`View ${item.type} ${i + 1}`}
              className={`relative h-[88px] w-[72px] flex-none overflow-hidden rounded-xl border-2 bg-surface-alt transition-all ${mediaIdx===i?'border-primary':'border-transparent hover:border-line-dark'}`}>
              {item.type === 'video' ? (
                <>
                  <video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow">
                      <Play size={11} className="ml-0.5 text-ink" fill="currentColor" />
                    </span>
                  </span>
                </>
              ) : (
                <Image src={item.url} alt="" fill sizes="72px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {viewerOpen && (
        <MobileImageViewer
          images={imageUrls}
          productName={product.name}
          index={Math.max(0, imagePos)}
          setIndex={pos => setMediaIdx(imageIndexes[pos] ?? mediaIdx)}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}

function MobileImageViewer({ images, productName, index, setIndex, onClose }) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [closing, setClosing] = useState(false)
  const gesture = useRef({})
  const lastTap = useRef(0)

  const resetZoom = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const close = useCallback(() => {
    setClosing(true)
    window.setTimeout(onClose, 180)
  }, [onClose])

  const goTo = useCallback((nextIndex) => {
    setIndex((nextIndex + images.length) % images.length)
    resetZoom()
  }, [images.length, resetZoom, setIndex])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') goTo(index - 1)
      if (event.key === 'ArrowRight') goTo(index + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [close, goTo, index])

  const handleTouchStart = (event) => {
    if (event.touches.length === 2) {
      gesture.current = {
        mode: 'pinch',
        startDistance: getTouchDistance(event.touches),
        startScale: scale,
      }
      return
    }

    const touch = event.touches[0]
    gesture.current = {
      mode: scale > 1 ? 'pan' : 'swipe',
      startX: touch.clientX,
      startY: touch.clientY,
      startOffset: offset,
    }
  }

  const handleTouchMove = (event) => {
    if (event.touches.length === 2 && gesture.current.mode === 'pinch') {
      event.preventDefault()
      const nextScale = clamp((getTouchDistance(event.touches) / gesture.current.startDistance) * gesture.current.startScale, 1, 4)
      setScale(nextScale)
      if (nextScale === 1) setOffset({ x: 0, y: 0 })
      return
    }

    if (event.touches.length !== 1) return
    const touch = event.touches[0]
    const dx = touch.clientX - gesture.current.startX
    const dy = touch.clientY - gesture.current.startY

    if (gesture.current.mode === 'pan') {
      event.preventDefault()
      const limit = 130 * scale
      setOffset({
        x: clamp(gesture.current.startOffset.x + dx, -limit, limit),
        y: clamp(gesture.current.startOffset.y + dy, -limit, limit),
      })
    }
  }

  const handleTouchEnd = (event) => {
    const now = Date.now()
    const wasDoubleTap = now - lastTap.current < 280
    const dx = (event.changedTouches[0]?.clientX || 0) - (gesture.current.startX || 0)
    const dy = (event.changedTouches[0]?.clientY || 0) - (gesture.current.startY || 0)

    if (wasDoubleTap && Math.abs(dx) < 28 && Math.abs(dy) < 28) {
      if (scale > 1) resetZoom()
      else setScale(2.5)
      lastTap.current = 0
      return
    }

    lastTap.current = now
    if (gesture.current.mode === 'swipe' && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      goTo(index + (dx < 0 ? 1 : -1))
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex touch-none flex-col bg-black transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute right-4 top-4 z-20">
        <button onClick={close} aria-label="Close image viewer" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.12] text-white backdrop-blur-md transition-colors hover:bg-white/20">
          <X size={22} />
        </button>
      </div>

      {images.length > 1 && (
        <>
          <button onClick={() => goTo(index - 1)} aria-label="Previous image" className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.12] text-white backdrop-blur-md sm:flex">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => goTo(index + 1)} aria-label="Next image" className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.12] text-white backdrop-blur-md sm:flex">
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <Image
          src={images[index]}
          alt={productName}
          fill
          sizes="100vw"
          className="object-contain transition-transform duration-200 ease-out"
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})` }}
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
          {images.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`View image ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/45'}`} />
          ))}
        </div>
      )}
    </div>
  )
}


function PDPContent() {
  const sp = useSearchParams()
  const id = sp?.get?.('id')
  const { addToCart } = useStore()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])

  const [selColor, setSelColor] = useState({ name: 'Unknown', hex: '#000000' })
  const [selSize,  setSelSize]  = useState({ size: 'One Size', stock: 1 })
  const [qty,      setQty]      = useState(1)
  const [mediaIdx, setMediaIdx] = useState(0)
  const [tab,      setTab]      = useState('desc')


  const productColors = useMemo(() => {
    const seen = new Set()
    return (product?.colors || []).filter(color => {
      const key = `${color.name}::${color.hex}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [product?.colors])
  const sizesForColor = useMemo(() => getSizesForColor(product, selColor), [product, selColor])
  const isOOS     = !product || product.stock === 0
  const sizeStock = selSize?.stock || 0
  const priceOverride = Number(selSize?.priceOverride || 0)
  const effectiveSellPrice = Number(product?.sellPrice || 0) + priceOverride
  const effectiveMrp = Number(product?.mrp || 0) + priceOverride
  const effectiveOff = effectiveMrp > effectiveSellPrice ? Math.round(((effectiveMrp - effectiveSellPrice) / effectiveMrp) * 100) : 0

  const galleryMedia = useMemo(() => {
    if (!product) return []
    const colorImages = (product.colorImages || []).filter(
      img => img.colorName === selColor?.name || img.colorHex === selColor?.hex
    )
    const colorVideos = (product.colorVideos || []).filter(
      vid => vid.colorName === selColor?.name || vid.colorHex === selColor?.hex
    )
    const imageUrls = colorImages.length ? colorImages.map(img => img.imageUrl).filter(Boolean) : (product.images || []).filter(Boolean)
    const videoUrls = colorVideos.map(vid => vid.videoUrl).filter(Boolean)
    return [
      ...imageUrls.map(url => ({ type: 'image', url })),
      ...videoUrls.map(url => ({ type: 'video', url })),
    ]
  }, [product, selColor])

  useEffect(() => {
    if (!id) return
    catalogApi.product(id).then(setProduct).catch(() => setProduct(null))
  }, [id])

  useEffect(() => {
    if (!product) return
    const firstColor = product?.colors?.[0] || { name: 'Unknown', hex: '#000000' }
    setSelColor(firstColor)
    const initialSizes = getSizesForColor(product, firstColor)
    setSelSize(initialSizes.find(s => s?.stock > 0) || initialSizes[0] || { size: 'One Size', stock: 1, priceOverride: 0 })
    setQty(1)
    setMediaIdx(0)
    catalogApi.products({ category: product.category, limit: 6 }).then(data => {
      setRelated((data.items || []).filter(p => p.id !== product.id))
    }).catch(() => setRelated([]))
  }, [product])

  const handleColorSelect = (color) => {
    setSelColor(color)
    const nextSizes = getSizesForColor(product, color)
    setSelSize(nextSizes.find(s => s?.stock > 0) || nextSizes[0] || { size: 'One Size', stock: 0, priceOverride: 0 })
    setQty(1)
    setMediaIdx(0)
  }

  const handleCart = () => { if (isOOS || sizeStock === 0) return; addToCart(product, selSize.size, selColor, qty, Number(selSize.priceOverride || 0)) }

  if (!product) return <div className="py-20 text-center text-ink-muted">Loading product...</div>
  const ph = product.highlights || {}
  const highlights = [
    ['Product Category', ph.category || getHighlightCategory(product)],
    ['Product Type', ph.type || getProductType(product)],
    ['Fit', ph.fit || getFit(product)],
    ['Closure', ph.closure || getClosure(product)],
    ['Length', ph.length || getLength(product)],
  ]

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: product.category.charAt(0).toUpperCase() + product.category.slice(1), href: `/plp?category=${product.category}` },
    { label: product.name },
  ]
    const hasDescription = Boolean(product.description?.trim())
  const hasMaterial = Boolean(product.material?.trim())
  const hasCare = Boolean(product.care?.trim())

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-6 pb-16">
      <Breadcrumb crumbs={crumbs} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
        {/* ── GALLERY ── */}
        <div className="md:sticky md:top-20 self-start">
          <ProductGallery
            product={product}
            media={galleryMedia}
            mediaIdx={mediaIdx}
            setMediaIdx={setMediaIdx}
            isOOS={isOOS}
          />
        </div>

        {/* ── INFO ── */}
        <div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-ink-faint font-medium mb-1">{product.brand}</p>
          <h1 className="font-display text-[clamp(24px,3.5vw,38px)] font-bold leading-tight text-ink mb-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-primary">
              {[1,2,3,4,5].map(n => <Star key={n} size={14} fill={n<=Math.round(product.rating)?'currentColor':'none'} strokeWidth={1.5}/>)}
            </div>
            <span className="text-[13px] text-ink-muted font-medium">{product.rating} · {product.reviews} reviews</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-[30px] font-bold text-ink">{formatPrice(effectiveSellPrice)}</span>
            <span className="text-[16px] text-ink-faint line-through">{formatPrice(effectiveMrp)}</span>
            <span className="text-[13px] font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-lg">{effectiveOff}% OFF</span>
          </div>
          <p className="text-[12px] text-ink-faint mb-6">Inclusive of all taxes</p>

          {/* Color */}
          <div className="mb-5">
            <p className="text-[12px] uppercase tracking-[0.12em] font-semibold text-ink-mid mb-2.5">
              Colour — <span className="text-ink font-semibold">{selColor.name}</span>
            </p>
            <div className="flex gap-2.5">
              {productColors.map(c => (
                <button key={`${c.name}-${c.hex}`} title={c.name} onClick={() => handleColorSelect(c)} aria-label={`Select ${c.name}`}
                  style={{ background: c.hex }}
                  className={`h-9 w-9 ${colorSwatchClass(c.hex, selColor.hex === c.hex && selColor.name === c.name)}`}/>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[12px] uppercase tracking-[0.12em] font-semibold text-ink-mid">
                Size — <span className="text-ink font-semibold">{selSize?.size}</span>
              </p>
              
            </div>
            <div className="flex gap-2 flex-wrap">
              {sizesForColor.map(s => (
                <button key={s.size} onClick={() => s.stock>0 && setSelSize(s)} disabled={s.stock===0}
                  className={`min-w-[46px] h-11 px-3 rounded-xl text-[13px] font-semibold border-2 transition-all relative ${
                    s.stock===0 ? 'border-line text-ink-faint line-through cursor-not-allowed bg-surface-alt'
                    : selSize?.size===s.size ? 'border-primary bg-primary text-white shadow-md'
                    : 'border-line text-ink-mid hover:border-primary hover:text-primary'
                  }`}>
                  {s.size}
                  {s.stock>0 && s.stock<=3 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"/>}
                </button>
              ))}
            </div>
            {sizeStock > 0 && sizeStock <= 5 && (
              <p className="text-[12px] text-red-500 font-medium mt-2">⚡ Only {sizeStock} left in this size!</p>
            )}
          </div>

          {/* Qty */}
          <div className="mb-6">
            <p className="text-[12px] uppercase tracking-[0.12em] font-semibold text-ink-mid mb-2.5">Quantity</p>
            <div className="inline-flex items-center border-2 border-line rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-11 h-11 text-ink-mid hover:text-primary hover:bg-surface-alt transition-all text-xl font-light">−</button>
              <span className="w-12 h-11 flex items-center justify-center text-[15px] font-bold border-x-2 border-line">{qty}</span>
              <button onClick={() => setQty(q => Math.min(sizeStock||99, q+1))} className="w-11 h-11 text-ink-mid hover:text-primary hover:bg-surface-alt transition-all text-xl font-light">+</button>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 mb-6">
            <button onClick={handleCart} disabled={isOOS||sizeStock===0}
              className="w-full py-4 border-2 border-primary text-primary font-bold text-[13px] rounded-xl hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary">
              {isOOS||sizeStock===0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <Link href="/checkout" onClick={() => !isOOS && handleCart()}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-[13px] rounded-xl transition-all text-center shadow-lg shadow-primary/30">
              Buy Now
            </Link>
            <WhatsAppButton variant="inline" productName={product.name} className="w-full justify-center" />
          </div>

          {/* Notify me OOS */}
          {(isOOS || sizeStock===0) && (
            <div className="mb-6 bg-surface-alt border border-line rounded-xl p-4">
              <p className="text-[13px] font-medium text-ink mb-1">Notify me when available</p>
              <div className="flex gap-2">
                <input type="email" placeholder="your@email.com"
                  className="flex-1 bg-white border border-line text-[13px] px-3.5 py-2.5 rounded-lg outline-none focus:border-primary/60 transition-colors"/>
                <button className="bg-primary text-white text-[12px] font-semibold px-4 rounded-lg hover:bg-primary-dark transition-colors whitespace-nowrap">Notify Me</button>
              </div>
            </div>
          )}

          {/* Key Highlights */}
          <div className="bg-surface-alt border border-line rounded-xl p-5 md:p-6 mb-6">
            <h2 className="text-[15px] font-bold uppercase tracking-wide text-ink mb-6">Key Highlights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {highlights.map(([label, value]) => (
                <div key={label} className="border-b border-line pb-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
                  <p className="text-[14px] text-ink-muted mb-1">{label}</p>
                  <p className="text-[15px] font-semibold text-ink leading-snug">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          {(hasDescription || hasMaterial || hasCare) && (
  <div className="border border-line rounded-xl overflow-hidden">
    <div className="flex border-b border-line">
      {(hasDescription || hasMaterial) && (
        <button
          onClick={() => setTab('desc')}
          className={`flex-1 py-3 text-[12px] font-semibold transition-all ${
            tab === 'desc' || !hasCare
              ? 'bg-primary text-white'
              : 'text-ink-mid hover:text-primary hover:bg-surface-alt'
          }`}
        >
          Description
        </button>
      )}
      {hasCare && (
        <button
          onClick={() => setTab('care')}
          className={`flex-1 py-3 text-[12px] font-semibold transition-all ${
            tab === 'care' && (hasDescription || hasMaterial)
              ? 'bg-primary text-white'
              : !hasDescription && !hasMaterial
              ? 'bg-primary text-white'
              : 'text-ink-mid hover:text-primary hover:bg-surface-alt'
          }`}
        >
          Care
        </button>
      )}
    </div>
    <div className="p-5 text-[14px] text-ink-mid leading-relaxed space-y-3">
      {(tab === 'desc' || !hasCare) && (hasDescription || hasMaterial) && (
        <>
          {hasDescription && <p>{product.description}</p>}
          {hasMaterial && (
            <p>
              <strong className="text-ink">Material:</strong> {product.material}
            </p>
          )}
        </>
      )}
      {(tab === 'care' || (!hasDescription && !hasMaterial)) && hasCare && (
        <p>{product.care}</p>
      )}
    </div>
  </div>
)}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="font-display text-[32px] font-bold tracking-wide mb-7">YOU MAY ALSO LIKE</h2>
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
            {related.map(p => (
              <div key={p.id} className="flex-none w-[220px]"><ProductCard product={p}/></div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function PDPPage() {
  return <Suspense fallback={<div className="py-20 text-center text-ink-muted">Loading product…</div>}><PDPContent/></Suspense>
}