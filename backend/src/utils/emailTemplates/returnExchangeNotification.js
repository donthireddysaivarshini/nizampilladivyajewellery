const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildReturnExchangeEmail(request, { headline, message, coupon }) {
  const itemName = request.productName || 'item'
  const sizeText = request.size ? ` (${request.size})` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5;max-width:600px;margin:0 auto;padding:20px;">
  <div style="font-weight:800;font-size:20px;letter-spacing:0.03em;margin-bottom:4px;">Sai Nakshatra Collections</div>
  <div style="color:#666;margin-bottom:18px;">${escapeHtml(headline)}</div>

  <div style="background:#f6f6f6;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
    <div style="font-size:16px;font-weight:800;">${escapeHtml(request.type === 'exchange' ? 'Exchange request' : 'Return request')} · ${escapeHtml(request.orderNumber)}</div>
    <div style="color:#666;font-size:0.9em;margin-top:2px;">${escapeHtml(itemName)}${escapeHtml(sizeText)}</div>
  </div>

  ${message ? `<div style="background:#fdf6ec;border:1px solid #f3e3c3;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:0.95em;">${escapeHtml(message)}</div>` : ''}

  ${coupon ? `
  <div style="border:2px dashed #111;border-radius:10px;padding:16px;text-align:center;margin-bottom:16px;">
    <div style="font-size:0.75em;text-transform:uppercase;letter-spacing:0.1em;color:#888;font-weight:700;margin-bottom:6px;">Your exchange coupon</div>
    <div style="font-size:22px;font-weight:800;letter-spacing:0.12em;">${escapeHtml(coupon.code)}</div>
    <div style="font-size:1.05em;font-weight:700;margin-top:6px;">${money(coupon.value)}</div>
    <div style="color:#777;font-size:0.85em;margin-top:4px;">Valid until ${escapeHtml(new Date(coupon.expiresAt).toLocaleDateString('en-IN'))}</div>
    <div style="color:#999;font-size:0.8em;margin-top:8px;">Apply this code at checkout on your next order. It also appears under Profile &rarr; Returns &amp; Exchanges.</div>
  </div>` : ''}

  ${request.adminRemarks ? `<p style="font-size:0.9em;color:#555;"><strong>Note from us:</strong> ${escapeHtml(request.adminRemarks)}</p>` : ''}

  <p style="margin-top:28px;font-size:0.78em;color:#999;">Questions? Reply to this email and we'll help you out.</p>
</body>
</html>`
}
