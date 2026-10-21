// Single source of truth for the delivery fee.
// Change SHIPPING_FEE to update it sitewide — nothing else needs to change.
// Set FREE_ABOVE_SUBTOTAL to a number to make orders at/above that subtotal free; null disables the threshold.
export const SHIPPING_FEE = 99
export const FREE_ABOVE_SUBTOTAL = null
// Above HIGH_VALUE_THRESHOLD the higher fee applies (bulk / premium orders).
export const HIGH_VALUE_SHIPPING_FEE = 350
export const HIGH_VALUE_THRESHOLD = 10000

// forceFree: used for promo codes of type 'shipping' (free-shipping coupons) — independent of the threshold above.
export function computeShippingFee(subtotal, { forceFree = false } = {}) {
  if (forceFree) return 0
  if (FREE_ABOVE_SUBTOTAL != null && Number(subtotal) >= FREE_ABOVE_SUBTOTAL) return 0
  if (Number(subtotal) > HIGH_VALUE_THRESHOLD) return HIGH_VALUE_SHIPPING_FEE
  return SHIPPING_FEE
}