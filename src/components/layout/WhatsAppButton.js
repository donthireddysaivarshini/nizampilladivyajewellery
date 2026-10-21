import { Hand } from 'lucide-react'
import { whatsappLink } from '@/lib/siteConfig'

const GENERIC_MESSAGE =
  'Hi Nizampilla Divya Jewellery! I came across your jewellery collection and would like to know more about your products. Could you please help me?'

// Floating contact button, fixed to the bottom-right of the viewport. Opens WhatsApp
// (the configured number) with a pre-filled, URL-encoded message. Pure anchor —
// keyboard accessible, no client state required.
//
// Props:
//  - variant="floating" (default)  : fixed bottom-right pill button
//  - variant="inline"              : a static button used inside page content
//  - productName                   : when provided (e.g. on a PDP), the pre-filled message
//                                    becomes product-aware instead of the generic enquiry.
export default function WhatsAppButton({ variant = 'floating', productName, className = '' }) {
  const message = productName
    ? `Hi Nizampilla Divya Jewellery! I'm interested in the product ${productName}. Could you please help me with more details?`
    : GENERIC_MESSAGE

  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us"
      className={variant === 'inline'
        ? `whatsapp-button whatsapp-button--inline ${className}`.trim()
        : 'whatsapp-button'}
    >
      <Hand size={18} strokeWidth={2.2} aria-hidden="true" className="whatsapp-button-icon" />
      <span className="whatsapp-button-label">{variant === 'inline' ? 'Chat with us' : 'Chat'}</span>
    </a>
  )
}
