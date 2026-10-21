import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyStatic from '@fastify/static'

import { env } from './config/env.js'
import { errorHandler } from './middlewares/error.middleware.js'
import swaggerPlugin from './plugins/swagger.js'
import { authRoutes } from './routes/auth.routes.js'
import { userRoutes } from './routes/user.routes.js'
import { catalogRoutes } from './routes/catalog.routes.js'
import { orderRoutes } from './routes/order.routes.js'
import { paymentRoutes } from './routes/payment.routes.js'
import { uploadRoutes } from './routes/upload.routes.js'
import { adminRoutes } from './routes/admin.routes.js'
import { returnExchangeRoutes } from './routes/returnExchange.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function buildApp() {
  const app = Fastify({ logger: true })
  
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
    request.rawBody = body.toString('utf8')
    try {
      done(null, JSON.parse(request.rawBody || '{}'))
    } catch (err) {
      err.statusCode = 400
      done(err, undefined)
    }
  })

  // Global Core Middlewares & Config Plugins
  await app.register(helmet, {
  crossOriginResourcePolicy: { policy: "cross-origin" }
})
  await app.register(multipart, { limits: { fileSize: env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024 } })
  await app.register(swaggerPlugin)
  
  // Static Local Directory serving configuration
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'), 
    prefix: '/uploads/',                     
  })

  // CORS Configurations
  const baseOrigins = [
    env.FRONTEND_URL,
    'https://getyourstore.in',
    'https://www.getyourstore.in',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ]
  const allowedOrigins = new Set(baseOrigins.filter(Boolean))
  
  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true)
      app.log.warn({ origin, allowedOrigins: Array.from(allowedOrigins) }, 'CORS request rejected')
      return callback(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie']
  })

  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' })
  await app.register(jwt, { secret: env.JWT_ACCESS_SECRET })
  app.setErrorHandler(errorHandler)

  // System Utility and Service Routes
  app.get('/health', async () => ({ success: true, message: 'Success', data: { status: 'ok' } }))
  
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(userRoutes, { prefix: '/api/users' })
  await app.register(catalogRoutes, { prefix: '/api/catalog' })
  await app.register(orderRoutes, { prefix: '/api' })
  await app.register(paymentRoutes, { prefix: '/api/payments' })
  await app.register(uploadRoutes, { prefix: '/api/uploads' })
  await app.register(adminRoutes, { prefix: '/api/admin' })
  await app.register(returnExchangeRoutes, { prefix: '/api' })

  return app
}