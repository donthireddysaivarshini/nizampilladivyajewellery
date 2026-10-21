'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { HiArrowLongLeft, HiArrowLongRight } from 'react-icons/hi2'
import { useStore } from '@/context/StoreContext'
import { formatPrice, promoDiscount, promoShipping } from '@/lib/utils'
import { authApi } from '@/lib/api'

export default function CartPage() {
  const { cart, hydrated, removeFromCart, updateQty, cartTotal, appliedPromo } = useStore()
  const [signedIn, setSignedIn] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const syncAuth = async () => {
      try {
        await authApi.me()
        if (!cancelled) setSignedIn(true)
      } catch (_) {
        if (!cancelled) setSignedIn(false)
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    }
    syncAuth()
    window.addEventListener('storage', syncAuth)
    window.addEventListener('staffarc-auth', syncAuth)
    return () => {
      cancelled = true
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('staffarc-auth', syncAuth)
    }
  }, [])

  const discount = promoDiscount(appliedPromo, cartTotal)
  const shipping = promoShipping(appliedPromo, cartTotal)
  const total = cartTotal - discount + shipping

  if (!hydrated) return (
    <div className="cart-page max-w-[1360px] mx-auto px-4 md:px-6 py-10">
      <div className="mb-8 h-12 w-64 animate-pulse rounded-lg bg-surface-alt" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {[1, 2, 3].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface-alt" />)}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-surface-alt" />
      </div>
    </div>
  )

  if (cart.length === 0) return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-6 py-24 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingCart size={34} className="text-primary"/>
      </div>
      <h1 className="font-display text-4xl font-bold mb-3">YOUR CART IS EMPTY</h1>
      <p className="text-ink-muted mb-8">Looks like you haven&apos;t added anything yet.</p>
      <Link href="/plp" className="inline-block bg-primary hover:bg-primary-dark text-white px-10 py-3.5 rounded-xl font-semibold text-[14px] transition-colors shadow-lg shadow-primary/30">
        Start Shopping
      </Link>
    </div>
  )

  return (
    <div className="cart-page max-w-[1360px] mx-auto px-4 md:px-6 py-10">
      <h1 className="cart-title font-display text-5xl font-bold tracking-wide mb-8">
        MY CART <span className="text-ink-muted text-2xl font-normal">({cart.length} item{cart.length > 1 ? 's' : ''})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <div className="space-y-0">
          {cart.map(item => (
            <div key={item.key} className="cart-item flex gap-5 py-5 border-b border-line">
              <Link href={`/pdp?id=${item.product.id}`} className="flex-shrink-0">
                <div className="cart-item-media relative w-24 h-28 md:w-28 md:h-36 bg-surface-alt rounded-xl overflow-hidden">
                  <Image src={item.product.images[0]} alt={item.product.name} fill sizes="112px" className="object-cover"/>
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-0.5">{item.product.brand}</p>
                <Link href={`/pdp?id=${item.product.id}`}>
                  <p className="text-[15px] font-semibold text-ink hover:text-primary transition-colors line-clamp-2 mb-1">{item.product.name}</p>
                </Link>
                <div className="cart-item-options flex gap-3 text-[12px] text-ink-muted mb-3">
                  <span className="bg-surface-alt px-2 py-0.5 rounded-md">Size: {item.size}</span>
                  <span className="flex items-center gap-1.5">
                    Colour: <span style={{ background: item.color.hex }} className="inline-block w-3 h-3 rounded-full border border-line"/>
                  </span>
                </div>
                <div className="cart-item-actions flex items-center justify-between flex-wrap gap-3">
                  <div className="inline-flex items-center border-2 border-line rounded-xl overflow-hidden">
                    <button onClick={() => updateQty(item.key, item.qty - 1)} className="w-9 h-9 text-ink-muted hover:text-primary hover:bg-surface-alt transition-all text-lg">-</button>
                    <span className="w-10 h-9 flex items-center justify-center text-[14px] font-bold border-x-2 border-line">{item.qty}</span>
                    <button onClick={() => updateQty(item.key, item.qty + 1)} className="w-9 h-9 text-ink-muted hover:text-primary hover:bg-surface-alt transition-all text-lg">+</button>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => removeFromCart(item.key)} className="flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-red-500 transition-colors">
                      <Trash2 size={13}/> Remove
                    </button>
                    <span className="text-[16px] font-bold text-ink">{formatPrice((Number(item.product.sellPrice) + Number(item.priceOverride || 0)) * item.qty)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Link href="/plp" className="group inline-flex items-center gap-2 mt-5 text-[13px] text-primary font-semibold hover:underline">
            <HiArrowLongLeft className="text-base shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden />
            Continue Shopping
          </Link>
        </div>

        <div>
          <div className="bg-surface-alt border border-line rounded-2xl p-6 sticky top-20">
            <h2 className="font-display text-2xl font-bold mb-5">ORDER SUMMARY</h2>

            <div className="space-y-3 text-[14px] mb-5">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal ({cart.reduce((sum, item) => sum + item.qty, 0)} items)</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Promo discount</span><span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-muted">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-[18px] font-bold text-ink pt-3 border-t border-line mt-1">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-line bg-white p-3 text-center text-[12px] text-ink-muted">
              Promo codes and coupons can be applied during checkout.
            </div>

            <Link href={authReady && signedIn ? '/checkout' : '/login?next=/checkout'} className={`group flex w-full items-center justify-center gap-2 py-4 text-white text-center font-bold text-[14px] rounded-xl transition-all shadow-lg shadow-primary/25 mb-3 ${authReady ? 'bg-primary hover:bg-primary-dark' : 'pointer-events-none bg-primary/60'}`}>
              {!authReady ? 'Checking Account...' : signedIn ? 'Proceed to Checkout' : 'Sign In to Checkout'}
              <HiArrowLongRight className="text-lg shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <div className="cart-summary-notes flex items-center justify-center gap-4 text-[11px] text-ink-faint">
              <span>Secure checkout</span><span>|</span><span>Free returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}