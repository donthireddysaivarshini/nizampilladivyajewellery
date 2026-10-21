// Mirrors backend src/config/shipping.js — used only for the live checkout preview before
// the real total is confirmed server-side (validatePromo / order creation). The backend
// value is always authoritative; keep this in sync manually when you change the backend one.
export const SHIPPING_FEE = 99
export const FREE_ABOVE_SUBTOTAL = null
// Above HIGH_VALUE_THRESHOLD the higher fee applies (bulk / premium orders).
export const HIGH_VALUE_SHIPPING_FEE = 350
export const HIGH_VALUE_THRESHOLD = 10000