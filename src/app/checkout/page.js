import MainLayout    from '@/components/layout/MainLayout'
import CheckoutPage  from '@/components/checkout/CheckoutPage'
export const metadata = { title: 'Checkout — Nizampilla Divya Jewellery' }
export default function Checkout() { return <MainLayout hideFooter><CheckoutPage/></MainLayout> }
