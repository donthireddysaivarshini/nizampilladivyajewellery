import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../.env.local')
]
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
}

// z.coerce.boolean() is a footgun: Boolean('false') === true in JS, so any non-empty
// string (including the literal text "false") coerces to true. This coerces correctly.
const zBool = (defaultValue) => z.string().optional().transform(v => (v === undefined ? defaultValue : v === 'true'))

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),
  ACCESS_TOKEN_TTL: z.string().default('7d'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  // Upload pipeline — generous ceiling since originals get compressed down after upload;
  // this just guards against something absurd, not against normal phone camera photos.
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().default(100),
  IMAGE_MAX_DIMENSION: z.coerce.number().default(2200),
  IMAGE_QUALITY: z.coerce.number().min(1).max(100).default(85)
})

export const env = schema.parse(process.env)