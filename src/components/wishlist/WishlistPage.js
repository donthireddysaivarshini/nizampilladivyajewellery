'use client'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/context/WishlistContext'
import ProductCard from '@/components/ui/ProductCard'

export default function WishlistPage() {
  const { map, order, count, ready } = useWishlist()
  const items = order.map(id => map[id]).filter(Boolean)

  return (
    <div className="mx-auto max-w-[1360px] px-4 pb-16 pt-6 md:px-6 md:pt-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(24px,4vw,38px)] font-bold text-ink">My Wishlist</h1>
          <p className="mt-1 text-sm text-ink-muted">{count > 0 ? `${count} ${count === 1 ? 'item' : 'items'} saved` : 'Save your favourite styles for later.'}</p>
        </div>
      </div>

      {!ready ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-surface-alt" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface-alt/40 px-6 py-20 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <Heart size={28} className="text-ink-faint" />
          </span>
          <p className="font-display text-xl font-bold text-ink">Your wishlist is empty</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">
            Tap the heart on any product to save it here — sign in to keep your wishlist synced across devices.
          </p>
          <Link
            href="/plp"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
