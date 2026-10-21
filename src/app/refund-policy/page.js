import MainLayout from '@/components/layout/MainLayout'

export const metadata = { title: 'Refund Policy — Sai Nakshatra Collections' }

export default function RefundPolicy() {
  return (
    <MainLayout>
      <div className="max-w-[820px] mx-auto px-4 md:px-6 py-14">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-faint mb-2">Policies</p>
        <h1 className="font-display text-4xl font-bold mb-8">Refund &amp; Return Policy</h1>

        <div className="space-y-8 text-[14px] leading-relaxed text-ink-mid">
          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">When a Refund or Exchange Applies</h2>
            <p>Once your order status shows Delivered, you can raise a return or exchange request from Profile → Orders within the return window shown on your order. We accept requests for:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Item damaged in transit</li>
              <li>Item(s) missing from your order</li>
              <li>Wrong item delivered</li>
              <li>Size or fit issue</li>
              <li>Product not matching its description</li>
              <li>Quality issue</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">How to Raise a Request</h2>
            <p>Open the delivered order from your Profile, choose Return or Exchange on the relevant item, select a reason, and attach a photo or a Google Drive link with your unboxing video — this helps us verify and approve requests faster.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Return — Refund Process</h2>
            <p>Once your return is approved, we&apos;ll process your refund to your original payment method. You can track the status of your request from Profile → Returns &amp; Exchanges at any time.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Exchange — Coupon Process</h2>
            <p>Once your exchange is approved, we automatically issue a one-time exchange coupon worth the amount you paid for that item (plus shipping, where applicable). This coupon is tied to your account, has an expiry date, and can be applied at checkout on your next order.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Not Eligible</h2>
            <p>Requests raised after the return window has closed, or for items showing signs of use beyond inspection, are not eligible. Each item can only have one active return or exchange request at a time.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Questions</h2>
            <p>For help with a return or exchange, reach us at <a href="mailto:nakshatrasaigowda@ail.com" className="text-primary font-semibold hover:underline">nakshatrasaigowda@ail.com</a> or call <a href="tel:+918073380149" className="text-primary font-semibold hover:underline">+91 80733 80149</a>.</p>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}