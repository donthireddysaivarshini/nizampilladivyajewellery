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
    address.fullName || address.full_name,
    address.phone,
    address.addressLine1 || address.address_line1,
    address.addressLine2 || address.address_line2,
    [address.city, address.state, address.pincode].filter(Boolean).join(', ')
  ].filter(Boolean)
}

export function buildOrderNotificationEmail(order, adminUrl) {
  const created = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : ''
  const addressLines = formatAddress(order.shippingAddress || {})

  const itemRows = (order.products || []).map(item => `
    <tr>
      <td style="padding:8px 6px;border-bottom:1px solid #ececec;">
        ${escapeHtml(item.name)}
        <div style="color:#777;font-size:0.85em;margin-top:2px;">${escapeHtml(item.brand)} · ${escapeHtml(item.size)} · ${escapeHtml(item.color || '-')}</div>
      </td>
      <td style="padding:8px 6px;border-bottom:1px solid #ececec;text-align:center;">${item.qty}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #ececec;text-align:right;">${money(item.unitPrice)}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #ececec;text-align:right;">${money((item.unitPrice || 0) * (item.qty || 0))}</td>
    </tr>
  `).join('')

  const totalsRows = [
    ['Subtotal', money(order.subtotal), false]
  ]
  if (Number(order.discountAmount) > 0) {
    totalsRows.push([`Discount${order.promoCode ? ` (${escapeHtml(order.promoCode)})` : ''}`, `-${money(order.discountAmount)}`, false])
  }
  totalsRows.push(['Shipping', Number(order.shippingAmount) === 0 ? 'FREE' : money(order.shippingAmount), false])
  totalsRows.push(['Total', money(order.total), true])

  const totalsHtml = totalsRows.map(([label, amount, isGrandTotal]) => `
    <tr>
      <td align="left" style="padding:${isGrandTotal ? '10px 0 0' : '4px 0'};font-size:${isGrandTotal ? '1.1em' : '1em'};font-weight:${isGrandTotal ? '800' : '400'};${isGrandTotal ? 'border-top:1px solid #ddd;' : ''}">${label}</td>
      <td align="right" style="padding:${isGrandTotal ? '10px 0 0' : '4px 0'};font-size:${isGrandTotal ? '1.1em' : '1em'};font-weight:${isGrandTotal ? '800' : '700'};${isGrandTotal ? 'border-top:1px solid #ddd;' : ''}">${amount}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5;max-width:600px;margin:0 auto;padding:20px;">
  <div style="font-weight:800;font-size:20px;letter-spacing:0.03em;margin-bottom:4px;">Sai Nakshatra Collections</div>
  <div style="color:#666;margin-bottom:18px;">New order received · ${escapeHtml(created)}</div>

  <div style="background:#f6f6f6;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
    <div style="font-size:18px;font-weight:800;">${escapeHtml(order.orderNumber)}</div>
    <div style="color:#666;font-size:0.9em;margin-top:2px;">Payment: ${escapeHtml(order.paymentStatus || '-')} · Status: ${escapeHtml(order.status || '-')}</div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
    <tr><td style="padding:4px 0;color:#666;">Customer</td><td style="padding:4px 0;text-align:right;font-weight:700;">${escapeHtml(order.customerName)}</td></tr>
    <tr><td style="padding:4px 0;color:#666;">Email</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.customerEmail)}</td></tr>
    <tr><td style="padding:4px 0;color:#666;">Phone</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.customerPhone || '-')}</td></tr>
  </table>

  <p style="font-size:0.75em;text-transform:uppercase;letter-spacing:0.1em;color:#888;font-weight:700;margin:18px 0 6px;">Shipping Address</p>
  <div style="font-size:0.9em;color:#333;">
    ${addressLines.map(line => `<div>${escapeHtml(line)}</div>`).join('') || '<div style="color:#999;">Not available</div>'}
  </div>

  <p style="font-size:0.75em;text-transform:uppercase;letter-spacing:0.1em;color:#888;font-weight:700;margin:18px 0 6px;">Items</p>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="font-size:0.78em;text-transform:uppercase;letter-spacing:0.06em;color:#666;">
        <th style="text-align:left;padding:6px;">Item</th>
        <th style="text-align:center;padding:6px;">Qty</th>
        <th style="text-align:right;padding:6px;">Rate</th>
        <th style="text-align:right;padding:6px;">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table style="width:100%;border-collapse:collapse;margin-top:14px;border-top:2px solid #111;padding-top:10px;">
    ${totalsHtml}
  </table>

  ${adminUrl ? `<div style="margin-top:24px;text-align:center;">
    <a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:0.9em;">View in Admin Dashboard</a>
  </div>` : ''}
</body>
</html>`
}