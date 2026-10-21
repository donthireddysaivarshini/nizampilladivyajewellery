import MainLayout from '@/components/layout/MainLayout'

export const metadata = { title: 'Shipping Policy — Nizampilla Divya Jewellery' }

export default function ShippingPolicy() {
  return (
    <MainLayout>
      <div className="max-w-[820px] mx-auto px-4 md:px-6 py-14">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-faint mb-2">Policies</p>
        <h1 className="font-display text-4xl font-bold mb-8">Shipping Policy</h1>

        <div className="space-y-8 text-[14px] leading-relaxed text-ink-mid">
          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Dispatch Time</h2>
            <p>Once your order is confirmed, we dispatch it within a maximum of 3 business days. Orders placed on weekends or public holidays are processed on the next working day.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Courier Partners</h2>
            <p>We ship orders through DTDC Courier and India Post, depending on your location and serviceability. You&apos;ll receive a tracking link once your order is dispatched — this is also visible under Profile → Orders.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Delivery Timelines</h2>
            <p>Delivery typically takes a few additional business days after dispatch, depending on your pin code and the courier partner&apos;s serviceability in your area. Remote or non-serviceable areas may take longer.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Shipping Charges</h2>
            <p>Shipping charges (if any) are calculated at checkout based on your order value and shown clearly before you complete payment. Any applicable shipping fee is also reflected in your order details and invoice.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Order Tracking</h2>
            <p>Once dispatched, you can track your order from Profile → Orders → Order Details, or using the tracking link shared with you via email/SMS.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Questions</h2>
            <p>For any shipping-related questions, reach us at <a href="mailto:Chalasanidivya27@gmail.com" className="text-primary font-semibold hover:underline">Chalasanidivya27@gmail.com</a> or call <a href="tel:+919948342710" className="text-primary font-semibold hover:underline">+91 99483 42710</a>.</p>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}