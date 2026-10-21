// Central contact/chat configuration for the storefront.
//
// Everything that links to a human (floating WhatsApp button, footer contact panel,
// footer socials) reads from here so the number/URL is configured in exactly one
// place instead of being scattered through components. The chat destination can be
// overridden without a code deploy via NEXT_PUBLIC_CHAT_URL (e.g. wa.me/<number>,
// a Facebook Messenger link, or any support URL).
export const SITE_CONTACT = {
  phone: '+918073380149',
  phoneDisplay: '+91 80733 80149',
  chatUrl: process.env.NEXT_PUBLIC_CHAT_URL || 'https://wa.me/918073380149',
  // Digits only (no +, spaces or dashes) — used to build the WhatsApp click-to-chat link.
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918073380149'
}

// Standard WhatsApp click-to-chat URL with an optional URL-encoded pre-filled message.
export function whatsappLink(message = '') {
  const base = `https://wa.me/${SITE_CONTACT.whatsappNumber}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
