const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatAddress(address = {}) {
  return [
    address.fullName || address.full_name || address.name,
    address.phone || address.phone_number || address.mobile,
    address.addressLine1 || address.address_line1 || address.street,
    address.addressLine2 || address.address_line2 || address.landmark,
    [address.city, address.state, address.pincode || address.zip_code].filter(Boolean).join(', ')
  ].filter(Boolean)
}

function resolveCustomerInfo(order) {
  const billing = order.billingAddress || order.billing_address || {}
  const shipping = order.shippingAddress || order.shipping_address || {}
  const user = order.user || {}

  const name =
    order.customerName ||
    order.customer_name ||
    billing.fullName ||
    billing.full_name ||
    shipping.fullName ||
    shipping.full_name ||
    user.fullName ||
    user.full_name ||
    user.name ||
    'Valued Customer'

  const email =
    order.customerEmail ||
    order.customer_email ||
    billing.email ||
    shipping.email ||
    user.email ||
    ''

  const phone =
    order.customerPhone ||
    order.customer_phone ||
    billing.phone ||
    shipping.phone ||
    user.phone ||
    ''

  return { name, email, phone }
}

function itemRows(order, compact = false) {
  return (order.products || order.items || []).map(item => {
    const name = item.name || item.title || 'Product'
    const qty = item.qty || item.quantity || 1
    const unitPrice = item.unitPrice || item.unit_price || item.price || 0
    const brand = item.brand || ''
    const size = item.size || ''
    const color = item.color || ''

    return `
    <tr>
      <td>
        ${escapeHtml(name)}
        ${compact ? '' : `<div class="muted">${[brand, size, color].filter(Boolean).map(escapeHtml).join(' · ')}</div>`}
      </td>
      <td class="center">${qty}</td>
      <td class="right">${money(unitPrice)}</td>
      <td class="right">${money(unitPrice * qty)}</td>
    </tr>
  `
  }).join('')
}

function totalsBlock(order) {
  const subtotal = order.subtotal ?? order.sub_total ?? order.total
  const discountAmount = Number(order.discountAmount || order.discount_amount || 0)
  const shippingAmount = Number(order.shippingAmount || order.shipping_amount || 0)
  const total = order.total || 0

  return `
    <div class="totals">
      <div><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
      ${discountAmount > 0 ? `<div><span>Discount${order.promoCode ? ` (${escapeHtml(order.promoCode)})` : ''}</span><strong>-${money(discountAmount)}</strong></div>` : ''}
      <div><span>Shipping</span><strong>${shippingAmount === 0 ? 'FREE' : money(shippingAmount)}</strong></div>
      <div class="grand"><span>Total</span><strong>${money(total)}</strong></div>
    </div>
  `
}

export function buildInvoiceHtml(order, format = 'a4') {
  const thermal = format === 'thermal'
  const created = order.createdAt || order.created_at || order.date
    ? new Date(order.createdAt || order.created_at || order.date).toLocaleString('en-IN')
    : ''
  
  const customer = resolveCustomerInfo(order)
  const shippingAddressLines = formatAddress(order.shippingAddress || order.shipping_address || {})
  const billingAddressLines = formatAddress(order.billingAddress || order.billing_address || {})

  const pageCss = thermal
    ? `@page { size: 80mm auto; margin: 4mm; } body { width: 72mm; font-size: 10px; } .brand { font-size: 14px; } table { font-size: 9px; }`
    : `@page { size: A4; margin: 14mm; } body { max-width: 180mm; margin: 0 auto; font-size: 12px; } .brand { font-size: 24px; }`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(order.orderNumber || order.id)}</title>
  <style>
    ${pageCss}
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; line-height: 1.45; }
    .brand { font-weight: 800; letter-spacing: 0.04em; }
    .meta { color: #666; margin: 8px 0 16px; }
    .grid { display: grid; grid-template-columns: ${thermal ? '1fr' : '1fr 1fr'}; gap: 12px; margin-bottom: 16px; }
    .box { border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
    .label { font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.12em; color: #888; margin-bottom: 6px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border-bottom: 1px solid #ececec; padding: ${thermal ? '4px 2px' : '8px 6px'}; vertical-align: top; }
    th { text-align: left; font-size: 0.78em; text-transform: uppercase; letter-spacing: 0.08em; color: #666; }
    .center { text-align: center; }
    .right { text-align: right; white-space: nowrap; }
    .muted { color: #777; font-size: 0.85em; margin-top: 2px; }
    .totals { margin-top: 14px; border-top: 2px solid #111; padding-top: 10px; }
    .totals div { display: flex; justify-content: space-between; gap: 12px; margin: 4px 0; }
    .totals .grand { font-size: 1.15em; font-weight: 800; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; }
    .footer { margin-top: 18px; color: #777; font-size: 0.85em; text-align: center; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="brand">Nizampilla Divya Jewellery</div>
  <div class="meta">Tax Invoice / Order Receipt · ${escapeHtml(order.orderNumber || order.id)} · ${escapeHtml(created)}</div>

  <div class="grid">
    <div class="box">
      <div class="label">Bill To</div>
      <div style="font-weight: 600;">${escapeHtml(customer.name)}</div>
      ${customer.phone ? `<div class="muted">${escapeHtml(customer.phone)}</div>` : ''}
      ${customer.email ? `<div class="muted">${escapeHtml(customer.email)}</div>` : ''}
      ${billingAddressLines.length > 0 ? billingAddressLines.slice(2).map(line => `<div class="muted">${escapeHtml(line)}</div>`).join('') : '<div class="muted" style="margin-top:4px;">Same as shipping address</div>'}
    </div>
    <div class="box">
      <div class="label">Ship To</div>
      ${shippingAddressLines.map(line => `<div>${escapeHtml(line)}</div>`).join('') || '<div class="muted">Address not available</div>'}
    </div>
  </div>

  <div class="grid">
    <div class="box">
      <div class="label">Payment</div>
      <div>${escapeHtml(order.paymentMethod || order.payment_method || '-')} ${escapeHtml(order.paymentStatus || order.payment_status || 'Paid')}</div>
    </div>
    <div class="box">
      <div class="label">Order Status</div>
      <div>${escapeHtml(order.status || '-')}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="center">Qty</th>
        <th class="right">Rate</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows(order, thermal)}
    </tbody>
  </table>

  ${totalsBlock(order)}

  <div class="footer">Thank you for shopping with Nizampilla Divya Jewellery.</div>
  <div class="no-print" style="margin-top:16px;text-align:center;">
    <button onclick="window.print()" style="padding:10px 16px;border:none;border-radius:8px;background:#111;color:#fff;font-weight:700;cursor:pointer;">Print / Save as PDF</button>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 350); }<\/script>
</body>
</html>`
}

export function downloadInvoice(order, format = 'a4') {
  const html = buildInvoiceHtml(order, format)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const filename = `${order.orderNumber || order.id || 'order'}-${format}-invoice.html`
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (!popup) URL.revokeObjectURL(url)
  else popup.onload = () => URL.revokeObjectURL(url)
}