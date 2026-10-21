import nodemailer from 'nodemailer'
import { env } from './env.js'

// Same pattern as config/razorpay.js: null when unconfigured, so the app boots fine
// without email set up, and callers just check truthiness before using it.
export const mailer = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000
    })
  : null