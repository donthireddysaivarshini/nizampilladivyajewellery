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
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('staffarc/uploads'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  // Email notifications — all optional so the app still boots without them configured;
  // config/mailer.js treats a missing SMTP_HOST/USER/PASSWORD as "notifications disabled".
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: zBool(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM_EMAIL: z.string().optional(),
  MAIL_FROM_NAME: z.string().default('Sai Nakshatra Collections'),
  MAIL_ADMIN_RECIPIENTS: z.string().optional(),
  MAIL_NOTIFICATIONS_ENABLED: zBool(true),
  // Upload pipeline — generous ceiling since originals get compressed down after upload;
  // this just guards against something absurd, not against normal phone camera photos.
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().default(100),
  IMAGE_MAX_DIMENSION: z.coerce.number().default(2200),
  IMAGE_QUALITY: z.coerce.number().min(1).max(100).default(85),
  // Backblaze B2 (S3-compatible). When B2_ENDPOINT + B2_BUCKET + B2_KEY_ID +
  // B2_APPLICATION_KEY are set, uploads are stored in B2 instead of the local
  // backend/uploads folder. B2_PUBLIC_URL is the public origin that serves files
  // (e.g. https://my-bucket.s3.us-west-000.backblazeb2.com).
  B2_ENDPOINT: z.string().optional(),
  B2_REGION: z.string().default('us-west-000'),
  B2_BUCKET: z.string().optional(),
  B2_KEY_ID: z.string().optional(),
  B2_APPLICATION_KEY: z.string().optional(),
  B2_PUBLIC_URL: z.string().optional()
})

export const env = schema.parse(process.env)