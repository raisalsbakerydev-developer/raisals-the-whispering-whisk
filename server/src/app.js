import express from 'express'
import cors from 'cors'

import { securityMiddleware } from './middleware/security.js'
import cookieMiddleware from './middleware/cookies.js'
import { errorHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import mediaRoutes from './routes/mediaRoutes.js'
import homeRoutes from './routes/homeRoutes.js'
import adminHomeRoutes from './routes/adminHomeRoutes.js'
import bakeryReviewRoutes from './routes/bakeryReviewRoutes.js'
import adminBakeryReviewRoutes from './routes/adminBakeryReviewRoutes.js'
import productRoutes from './routes/productRoutes.js'
import adminProductRoutes from './routes/adminProductRoutes.js'
import aboutRoutes from './routes/aboutRoutes.js'
import adminAboutRoutes from './routes/adminAboutRoutes.js'
import bakeryRoutes from './routes/bakeryRoutes.js'
import adminBakeryRoutes from './routes/adminBakeryRoutes.js'

const app = express()

function validateProductionConfiguration() {
  if (process.env.NODE_ENV !== 'production') return

  const required = [
    'DATABASE_URL',
    'CLIENT_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'EMAIL_FROM',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'ADMIN_BOOTSTRAP_SECRET',
  ]

  const missing = required.filter((name) => !String(process.env[name] || '').trim())
  if (missing.length > 0) {
    const error = new Error(`Missing production configuration: ${missing.join(', ')}`)
    error.code = 'PRODUCTION_CONFIGURATION_ERROR'
    throw error
  }

  for (const name of ['CLIENT_URL', 'GOOGLE_REDIRECT_URI']) {
    let parsed
    try {
      parsed = new URL(process.env[name])
    } catch {
      const error = new Error(`${name} must be a valid URL.`)
      error.code = 'PRODUCTION_CONFIGURATION_ERROR'
      throw error
    }

    if (parsed.protocol !== 'https:') {
      const error = new Error(`${name} must use HTTPS in production.`)
      error.code = 'PRODUCTION_CONFIGURATION_ERROR'
      throw error
    }
  }

  if (process.env.ADMIN_BOOTSTRAP_SECRET.trim().length < 32) {
    const error = new Error('ADMIN_BOOTSTRAP_SECRET must be at least 32 characters in production.')
    error.code = 'PRODUCTION_CONFIGURATION_ERROR'
    throw error
  }
}

validateProductionConfiguration()

app.disable('x-powered-by')

// Vercel sits behind a trusted proxy. This makes req.ip reflect the
// originating client IP so rate limiting is applied per visitor rather
// than to the shared platform proxy.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

const allowedOrigins = (
  process.env.CLIENT_URL ||
  'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)


// Browser state-changing requests are protected by SameSite cookies and an
// explicit Origin check. This blocks cross-site POST/PATCH/PUT/DELETE/
// requests even if the browser would otherwise attach a session cookie.
app.use((req, res, next) => {
  const method = req.method.toUpperCase()
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next()
  }

  const origin = req.get('origin')
  if (!origin || allowedOrigins.includes(origin)) {
    return next()
  }

  const error = new Error('Request origin is not allowed.')
  error.code = 'CORS_ORIGIN_NOT_ALLOWED'
  return next(error)
})

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests such as Postman/curl.
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      const error = new Error(
        'Request origin is not allowed.',
      )
      error.code = 'CORS_ORIGIN_NOT_ALLOWED'

      return callback(error)
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '100kb' }))
app.use(cookieMiddleware)
app.use(securityMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/home', homeRoutes)
app.use('/api/bakery-reviews', bakeryReviewRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin/home', adminHomeRoutes)
app.use('/api/admin/bakery-reviews', adminBakeryReviewRoutes)
app.use('/api/admin/media', mediaRoutes)
app.use('/api/about', aboutRoutes)
app.use('/api/admin/about', adminAboutRoutes)
app.use('/api/bakery', bakeryRoutes)
app.use('/api/admin/bakery', adminBakeryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/admin/products', adminProductRoutes)

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Raisal's Bakery API is running",
  })
})

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested API endpoint was not found.',
    },
  })
})

/*
  Express error handler must be registered last.
  Without this, service errors such as INVALID_CREDENTIALS
  fall through to Express' default error response and the
  client cannot reliably display our API error structure.
*/
app.use(errorHandler)

export default app
