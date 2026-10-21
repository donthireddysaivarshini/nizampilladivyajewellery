import MainLayout from '@/components/layout/MainLayout'

export const metadata = { title: 'Terms & Conditions — Sai Nakshatra Collections' }

export default function TermsConditions() {
  return (
    <MainLayout>
      <div className="max-w-[820px] mx-auto px-4 md:px-6 py-14">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-faint mb-2">Policies</p>
        <h1 className="font-display text-4xl font-bold mb-3">Terms &amp; Conditions</h1>
        <p className="text-[12px] text-ink-faint mb-8">Last updated: July 2026</p>

        <div className="space-y-8 text-[14px] leading-relaxed text-ink-mid">
          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">About Us</h2>
            <p>Sai Nakshatra Collections offers premium silver jewellery, artificial jewellery, and gemstone pieces. By using this website or placing an order, you agree to the terms below.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Orders &amp; Pricing</h2>
            <p>All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to correct pricing errors and to cancel an order affected by such an error, in which case any amount paid will be refunded in full.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Payments</h2>
            <p>Orders are paid for online through Razorpay at checkout. Your order is confirmed once payment is successfully verified.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Shipping</h2>
            <p>Please see our <a href="/shipping-policy" className="text-primary font-semibold hover:underline">Shipping Policy</a> for dispatch times, courier partners, and delivery information.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Returns, Exchanges &amp; Refunds</h2>
            <p>Please see our <a href="/refund-policy" className="text-primary font-semibold hover:underline">Refund Policy</a> for eligibility, process, and timelines.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Product Information</h2>
            <p>We aim to display product colours, materials, and details as accurately as possible. Minor variations may occur due to the handcrafted nature of some pieces or differences in device displays.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Intellectual Property</h2>
            <p>All content on this site — including product photography, logos, and text — belongs to Sai Nakshatra Collections and may not be reproduced without permission.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Limitation of Liability</h2>
            <p>We are not liable for indirect or incidental damages arising from the use of this website or our products, to the extent permitted by applicable law.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Governing Law</h2>
            <p>These terms are governed by the laws of India, and any disputes will be subject to the jurisdiction of the courts in Bangalore, Karnataka.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Contact Us</h2>
            <p>Questions about these terms? Reach us at <a href="mailto:nakshatrasaigowda@ail.com" className="text-primary font-semibold hover:underline">nakshatrasaigowda@ail.com</a> or call <a href="tel:+918073380149" className="text-primary font-semibold hover:underline">+91 80733 80149</a>.</p>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}