'use client'
import { useEffect, useState } from 'react'
import { Package2 } from 'lucide-react'
import { returnExchangeApi } from '@/lib/api'
import { formatPrice, returnExchangeStatusColor, returnExchangeStatusLabel, reasonCategoryLabel } from '@/lib/utils'

const COUPON_BADGE = {
  active: 'bg-emerald-100 text-emerald-700',
  used: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-100 text-red-600',
  cancelled: 'bg-red-100 text-red-600'
}

export default function ReturnsSection() {
  const [requests, setRequests] = useState([])
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      returnExchangeApi.list().then(data => data.items || []).catch(() => []),
      returnExchangeApi.coupons().catch(() => [])
    ]).then(([reqs, cps]) => { setRequests(reqs); setCoupons(cps) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-surface-alt" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface-alt" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface-alt" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-4xl font-bold tracking-wide mb-7">RETURNS &amp; EXCHANGES</h2>

      {coupons.length > 0 && (
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted font-semibold mb-3">Your Exchange Coupons</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {coupons.map(coupon => (
              <div key={coupon.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-[14px] text-ink">{coupon.code}</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${COUPON_BADGE[coupon.status] || 'bg-gray-100 text-gray-600'}`}>
                    {coupon.status}
                  </span>
                </div>
                <p className="text-[18px] font-bold text-ink">{formatPrice(coupon.value)}</p>
                <p className="text-[12px] text-ink-muted mt-1">
                  {coupon.status === 'active' && `Valid until ${new Date(coupon.expiresAt).toLocaleDateString('en-IN')}`}
                  {coupon.status === 'used' && 'Used on a previous order'}
                  {(coupon.status === 'expired' || coupon.status === 'cancelled') && 'No longer available'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted font-semibold mb-3">Your Requests</p>
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-16 text-center">
          <Package2 size={34} className="mb-3 text-ink-faint" />
          <p className="font-bold text-ink">No return or exchange requests yet</p>
          <p className="mt-1 text-sm text-ink-muted">Open a delivered order to start a return or exchange.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map(request => (
            <div key={request.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-[13px] font-bold text-ink">{request.orderNumber}</p>
                  <p className="text-[13px] text-ink-mid">{request.productName} · {request.size}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 ${returnExchangeStatusColor(request.status)}`}>
                  {returnExchangeStatusLabel(request.status)}
                </span>
              </div>
              <p className="text-[12px] text-ink-muted">{request.type === 'return' ? 'Return' : 'Exchange'} · {reasonCategoryLabel(request.reasonCategory)}</p>
              {request.adminRemarks && (
                <p className="mt-2 text-[12px] text-ink-mid bg-surface-alt rounded-lg px-3 py-2">{request.adminRemarks}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}