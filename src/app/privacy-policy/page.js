import MainLayout from '@/components/layout/MainLayout'

export const metadata = { title: 'Privacy Policy — Nizampilla Divya Jewellery' }

export default function PrivacyPolicy() {
  return (
    <MainLayout>
      <div className="max-w-[820px] mx-auto px-4 md:px-6 py-14">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-faint mb-2">Policies</p>
        <h1 className="font-display text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-[12px] text-ink-faint mb-8">Last updated: July 2026</p>

        <div className="space-y-8 text-[14px] leading-relaxed text-ink-mid">
          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Information We Collect</h2>
            <p>When you create an account, place an order, or contact us, we collect information such as your name, email address, phone number, delivery address, and order history. We do not collect or store your card details — payments are processed securely by Razorpay.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To process and deliver your orders</li>
              <li>To handle returns, exchanges, and refunds</li>
              <li>To send order updates, invoices, and support communication</li>
              <li>To improve our website and product offering</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Sharing of Information</h2>
            <p>We do not sell your personal information. We share only what&apos;s necessary with trusted service providers who help us run the business — our payment gateway (Razorpay) for processing payments, and our courier partners (DTDC, India Post) for delivering your orders.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Cookies</h2>
            <p>We use cookies to keep you signed in, remember your cart, and understand how our site is used. You can disable cookies in your browser, though some features may not work correctly without them.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Data Security</h2>
            <p>We take reasonable technical and organizational measures to protect your information. No method of transmission over the internet is 100% secure, but we work to protect your data using industry-standard practices.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Your Rights</h2>
            <p>You can review and update your account details anytime from Profile → Settings. To request deletion of your account or data, contact us using the details below.</p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-ink uppercase tracking-wide mb-2">Contact Us</h2>
            <p>For any privacy-related questions, reach us at <a href="mailto:Chalasanidivya27@gmail.com" className="text-primary font-semibold hover:underline">Chalasanidivya27@gmail.com</a> or call <a href="tel:+919948342710" className="text-primary font-semibold hover:underline">+91 99483 42710</a>.</p>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}