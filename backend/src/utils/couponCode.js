import crypto from 'crypto'

export function generateCouponCode(prefix = 'EXC') {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}-${random}`
}