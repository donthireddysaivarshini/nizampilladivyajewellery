import { z } from 'zod'

export const createPaymentOrderSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    amount: z.number().int().positive()
  })
})

export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string()
  })
})
