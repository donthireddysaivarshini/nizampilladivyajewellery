import { z } from 'zod'

export const REASON_CATEGORIES = ['damaged', 'wrong_item', 'size_issue', 'not_as_described', 'quality_issue', 'other']

export const createReturnExchangeSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
    itemId: z.string().uuid()
  }),
  body: z.object({
    type: z.enum(['return', 'exchange']),
    reasonCategory: z.enum(REASON_CATEGORIES),
    reasonNotes: z.string().max(1000).optional(),
    images: z.array(z.string().url()).max(5).optional(),
    driveLink: z.string().url().optional()
  }).refine(data => (data.images && data.images.length > 0) || Boolean(data.driveLink), {
    message: 'Attach at least one image or a Drive link with the unboxing video',
    path: ['images']
  })
})

export const listReturnExchangeSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['return', 'exchange']).optional(),
    status: z.enum(['requested', 'approved', 'rejected', 'refunded']).optional()
  })
})

export const listExchangeCouponsSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'used', 'expired', 'cancelled']).optional()
  })
})