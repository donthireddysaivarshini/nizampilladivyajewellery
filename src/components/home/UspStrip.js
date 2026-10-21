'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Heart, ShieldCheck, ArrowUpRight } from 'lucide-react'

const highlights = [
  {
    id: 'craft',
    Icon: Sparkles,
    title: 'Pure Silver & Fine Artistry',
    subtitle: 'Timeless Elegance',
    desc: 'Every piece in our collection is curated with high-quality silver, brilliant crystals, and meticulous craftsmanship designed to shine with you on every occasion.'
  },
  {
    id: 'trust',
    Icon: ShieldCheck,
    title: 'The Nizampilla Divya Promise',
    subtitle: 'Secure & Seamless Shopping',
    desc: 'We guarantee authentic quality across our jewelry lines, complete with 100% encrypted checkouts via Razorpay, simple size exchanges, and free delivery on orders over ₹999.'
  },
  {
    id: 'community',
    Icon: Heart,
    title: 'Designed To Make You Sparkle',
    subtitle: 'Modern Luxury Aesthetics',
    desc: 'We blend classic celestial inspirations with modern, wearable jewelry trends. Our pieces are crafted to celebrate your unique grace and personal style storytelling.'
  }
]

export default function BrandStory() {
  const [activeTab, setActiveTab] = useState('craft')

  return (
    <section className="bg-white border-t border-line py-12 md:py-20 overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* ── LEFT COLUMN: CREATIVE BRAND MANIFESTO (5 Cols) ── */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
              <Sparkles size={12}/> Discover Our Sparkle
            </div>
            
            <h2 className="font-display text-[clamp(28px,4vw,44px)] font-black leading-[1.1] text-ink tracking-tight">
              Jewelry that mirrors <br/>
              <span className="text-primary">your inner radiance.</span>
            </h2>
            
            <p className="text-[15px] leading-relaxed text-ink-muted">
              At Nizampilla Divya Jewellery, we believe jewelry isn’t just an accessory—it’s an extension of your persona. We bridge the gap between high-end luxury aesthetics and accessible, premium silver designs that stand the test of time.
            </p>

            <div className="pt-2">
              <Link 
                href="/plp" 
                className="inline-flex items-center gap-2 group text-sm font-black uppercase tracking-wider text-ink hover:text-primary transition-colors"
              >
                Explore The Collections 
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                  <ArrowUpRight size={14}/>
                </span>
              </Link>
            </div>
          </div>

          {/* ── RIGHT COLUMN: INTERACTIVE HIGHLIGHTS GRID (7 Cols) ── */}
          <div className="lg:col-span-7 grid grid-cols-1 gap-4">
            {highlights.map(({ id, Icon, title, subtitle, desc }) => {
              const isActive = activeTab === id
              
              return (
                <div
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`cursor-pointer rounded-2xl border p-5 md:p-6 transition-all duration-300 transform ${
                    isActive 
                      ? 'border-primary bg-primary/[0.02] shadow-md translate-x-1' 
                      : 'border-line bg-surface-alt/40 hover:bg-surface-alt/80 hover:border-line-dark'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? 'bg-primary text-white' : 'bg-white text-ink-muted border border-line'
                    }`}>
                      <Icon size={22} />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-wider text-primary">{subtitle}</p>
                      <h3 className="text-lg font-bold text-ink">{title}</h3>
                      
                      {/* Dynamic Description Expand/Collapse */}
                      <div className={`grid transition-all duration-300 ease-in-out ${
                        isActive ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                      }`}>
                        <div className="overflow-hidden">
                          <p className="text-[13px] leading-relaxed text-ink-muted">{desc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}