'use client'
import { useEffect, useState } from 'react'
import {
  Instagram,
  Facebook,
  Youtube,
  Phone,
  Mail,
  MapPin,
  MessageCircle
} from 'lucide-react'
import { catalogApi } from '@/lib/api'
import { SITE_CONTACT } from '@/lib/siteConfig'
import Link from 'next/link'

export default function Footer() {
  const staticCols = {
    Company: [
      ['Privacy Policy', '/privacy-policy'],
      ['Terms & Conditions', '/terms-conditions'],
    ],
    Customers: [
      ['Shipping Policy', '/shipping-policy'],
      ['Refund Policy', '/refund-policy'],
    ],
  }

  const socials = [
    [
      'Instagram',
      Instagram,
      'https://www.instagram.com/sai_nakshatra_collections?igsh=aGIzYWw4anl0bDNl&utm_source=qr'
    ],
    [
      'Facebook',
      Facebook,
      'https://www.facebook.com/share/1C11sgZwFe/?mibextid=wwXIfr'
    ],
    [
      'YouTube',
      Youtube,
      'https://www.youtube.com/@nakshatrasaigowda'
    ],
    [
      'WhatsApp',
      MessageCircle,
      SITE_CONTACT.chatUrl
    ],
  ]

  const [categories, setCategories] = useState([])
  const [branding, setBranding] = useState({})
  const [storeTheme, setStoreTheme] = useState(null)
  const marqueeMessage = 'Free shipping on orders above ₹599'

  useEffect(() => {
    // 1. Fetch main catalog layout data
    catalogApi.home()
      .then(data => {
        setCategories(data.categories || [])
        setBranding(data.branding || {})
      })
      .catch(() => {})

    // 2. Fetch the active backend theme variables directly
    catalogApi.theme()
      .then(themeData => {
        setStoreTheme(themeData)
      })
      .catch(() => {})
  }, [])

  // Maps directly to the admin color choice or falls back gracefully to your code
  const footerBgColor = storeTheme?.primary || '#5A1C1C'

  return (
    <footer 
      className="site-footer text-white mt-16 border-t border-white/10 transition-colors duration-300" 
      style={{ backgroundColor: footerBgColor }}
    >
      <div className="max-w-[1360px] mx-auto px-6 pt-10 pb-8">
        
        {/* ── MAIN INFORMATION GRID ── */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] pb-8 border-b border-white/10">
          
          {/* Brand Presentation Column */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            
            {/* Separate Isolated White Logo Box (Tight Box, Big Logo) */}
            <div className="shrink-0 bg-white p-1.5 rounded-xl shadow-md flex items-center justify-center">
              {branding.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt="Nizampilla Divya Jewellery" 
                  className="h-28 w-auto max-w-[260px] object-contain" 
                />
              ) : (
                <div className="h-14 w-14 bg-primary/10 rounded flex items-center justify-center text-primary font-bold text-center text-[10px] leading-tight uppercase">
                  ND <br/> Jew.
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="text-[15px] leading-relaxed text-white/90 font-medium max-w-xl">
                Discover absolute elegance with premium silver jewellery, fine artificial jewellery, and genuine real gemstone arrangements customized to perfectly reflect your style.
              </p>
            </div>
          </div>

          {/* Contact Details Panel */}
          <div className="bg-black/15 p-4 rounded-xl border border-white/5 space-y-2.5 text-xs text-white/90 font-medium self-center">
            <div className="flex items-center gap-3">
              <Phone size={14} className="shrink-0 text-white/70" />
              <a href={`tel:${SITE_CONTACT.phone}`} className="hover:underline">{SITE_CONTACT.phoneDisplay}</a>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={14} className="shrink-0 text-white/70" />
              <a href={`mailto:${SITE_CONTACT.email}`} className="hover:underline break-all">{SITE_CONTACT.email}</a>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={14} className="mt-0.5 shrink-0 text-white/70" />
              <span className="leading-relaxed text-white/80">
                {SITE_CONTACT.address}
              </span>
            </div>
          </div>
        </div>

        {/* ── SPOT US ON / BIG SOCIAL MEDIA BANNER STRIP ── */}
        <div className="my-8">
          <p className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-3">
            SPOT US ON
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 border border-white/20 divide-x divide-y md:divide-y-0 divide-white/20">
            {socials.map(([label, Icon, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 py-4 px-2 hover:bg-white/10 transition-colors group"
              >
                <Icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xs tracking-wider uppercase text-white">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* ── NAVIGATION LINKS ── */}
        <div className="mt-8 grid gap-6 grid-cols-2 sm:grid-cols-3">
          {Object.entries({
            Categories: categories.map(category => [category.name, `/plp?category=${category.slug}`]),
            ...staticCols
          }).map(([title, links]) => (
            <div key={title} className="space-y-3">
              <h5 className="text-[11px] font-black uppercase tracking-widest text-white/50 border-b border-white/5 pb-1">{title}</h5>
              <ul className="space-y-2">
                {links.slice(0, 4).map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-[11px] font-bold uppercase tracking-wide text-white/80 transition-colors hover:text-white block">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── THE STRUCTURAL SCROLLING MARQUEE BANNER LAYER ── */}
        <div className="relative left-1/2 w-screen -translate-x-1/2 mb-6 mt-12">
          <div 
            className="marquee py-4 shadow-inner border-y border-white/5 transition-colors duration-300" 
            style={{ backgroundColor: footerBgColor }}
          >
            <div className="marquee__track" aria-hidden>
              <span className="marquee__item font-extrabold text-white text-xs uppercase tracking-widest">{marqueeMessage}</span>
              <span className="marquee__item font-extrabold text-white text-xs uppercase tracking-widest">{marqueeMessage}</span>
            </div>
          </div>
        </div>

        {/* ── BOTTOM CREDIT STRIP (Centered & Scaled) ── */}
        <div className="flex items-center justify-center pt-5 border-t border-white/5 text-center w-full">
          <p className="text-[12px] font-semibold tracking-wide text-white/60">
            &copy; 2026 Nizampilla Divya Jewellery. All rights reserved.
          </p>
        </div>
        
      </div>
    </footer>
  )
}