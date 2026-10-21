// Single source of truth for the delivery fee.
// Change SHIPPING_FEE to update it sitewide — nothing else needs to change.
// Set FREE_ABOVE_SUBTOTAL to a number to make orders at/above that subtotal free; null disables the threshold.
export const SHIPPING_FEE = 99
export const FREE_ABOVE_SUBTOTAL = null
// forceFree: used for promo codes of type 'shipping' (free-shipping coupons).
export function computeShippingFee(subtotal, { forceFree = false } = {}) {
  if (forceFree) return 0
  if (FREE_ABOVE_SUBTOTAL != null && Number(subtotal) >= FREE_ABOVE_SUBTOTAL) return 0
  return SHIPPING_FEE
}