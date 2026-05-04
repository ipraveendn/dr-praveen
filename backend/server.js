import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import queueRoutes from './routes/queue.js'
import paymentRoutes from './routes/payment.js'
import { seedDemoQueue } from './controllers/queueController.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 5000

// ============================================
// LOGGING (no external libs)
// ============================================
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
}

const colorize = (text, color) => `${color}${text}${COLORS.reset}`

const ts = () => new Date().toISOString()

const methodColor = (method) => {
  if (method === 'GET') return COLORS.cyan
  if (method === 'POST') return COLORS.green
  if (method === 'PUT' || method === 'PATCH') return COLORS.yellow
  if (method === 'DELETE') return COLORS.red
  return COLORS.dim
}

const statusColor = (status) => {
  if (status >= 500) return COLORS.red
  if (status >= 400) return COLORS.yellow
  if (status >= 300) return COLORS.cyan
  return COLORS.green
}

const safeStringify = (value) => {
  try {
    return JSON.stringify(value)
  } catch {
    return '"[unserializable]"'
  }
}

// ============================================
// MIDDLEWARE
// ============================================
// CORS configuration - Allow frontend to communicate
const corsOptions = {
  origin: [
    'http://localhost:3000',       // Frontend dev server (PRIMARY)
    'http://localhost:3001',       // Frontend dev server (FALLBACK)
    'http://localhost:5173',       // Vite default port
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'https://dr-praveen.onrender.com'  // Production frontend
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging middleware (route, method, timestamp + status + duration)
app.use((req, res, next) => {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const durationMs = Number(end - start) / 1e6

    const time = colorize(ts(), COLORS.dim)
    const method = colorize(req.method, methodColor(req.method))
    const route = req.originalUrl
    const status = colorize(String(res.statusCode), statusColor(res.statusCode))
    const dur = colorize(`${durationMs.toFixed(1)}ms`, COLORS.dim)

    console.log(`${time} ${method} ${route} ${status} ${dur}`)
  })

  next()
})

// ============================================
// ROOT ROUTE
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: 'API Running...',
    status: 'active',
    timestamp: new Date().toISOString()
  })
})

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes)
app.use('/api/queue', queueRoutes)
app.use('/api/payment', paymentRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Dr. Praveen Backend API is running',
    timestamp: new Date().toISOString()
  })
})

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Dr. Praveen Healthcare Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      root: '/',
      health: '/api/health',
      auth: '/api/auth',
      queue: '/api/queue',
      payment: '/api/payment'
    },
    documentation: 'See individual route files for endpoint details'
  })
})

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
// 404 handler
app.use((req, res) => {
  const time = colorize(ts(), COLORS.dim)
  const method = colorize(req.method, methodColor(req.method))
  const route = req.originalUrl
  const status = colorize('404', statusColor(404))
  console.warn(`${time} ${method} ${route} ${status} ${colorize('Route not found', COLORS.yellow)}`)

  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    status: 404
  })
})

// Global error handler
app.use((err, req, res, next) => {
  const statusGuess = err?.status || 500
  const time = colorize(ts(), COLORS.dim)
  const method = colorize(req.method, methodColor(req.method))
  const route = req.originalUrl
  const status = colorize(String(statusGuess), statusColor(statusGuess))
  const name = err?.name || 'Error'
  const msg = err?.message || 'Unknown error'

  console.error(
    `${time} ${method} ${route} ${status} ${colorize(`[${name}]`, COLORS.red)} ${msg}`
  )

  if (process.env.NODE_ENV === 'development' && err?.stack) {
    console.error(colorize(err.stack, COLORS.dim))
  }
  
  // Determine appropriate status code
  let statusCode = err.status || 500
  if (err.name === 'ValidationError') statusCode = 400
  if (err.name === 'UnauthorizedError') statusCode = 401
  if (err.name === 'ForbiddenError') statusCode = 403
  if (err.name === 'NotFoundError') statusCode = 404
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An error occurred processing your request',
    status: statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Global error handlers (exact messages requested)
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err))
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err))

// ============================================
// START SERVER
// ============================================
console.log('Server starting...')

const startServer = (port) => {
  let didError = false

  const server = app.listen(port, () => {
    if (didError) return

    seedDemoQueue()
    // Log exactly as requested
    console.log(`Server running on port ${port}`)
    console.log(`
╔════════════════════════════════════════════════╗
║  🏥 Dr. Praveen Backend Server                ║
║  ✅ Running on http://localhost:${port}        ║
║  📚 API Docs: http://localhost:${port}/api     ║
║  🏠 Home: http://localhost:${port}/            ║
║  💚 Health: http://localhost:${port}/api/health║
╚════════════════════════════════════════════════╝
  `)
  })

  server.on('error', (err) => {
    didError = true
    if (err?.code === 'EADDRINUSE') {
      console.warn(
        `${colorize(ts(), COLORS.dim)} ${colorize('[PORT IN USE]', COLORS.yellow)} Port ${port} is busy; trying ${port + 1}...`
      )
      // This server never actually started listening, so don't print a "running" banner for it.
      // Ensure seed only happens once we successfully bind a port.
      // If the listen failed, close may be a no-op; start next port regardless.
      try {
        server.close(() => startServer(port + 1))
      } catch {
        setTimeout(() => startServer(port + 1), 0)
      }
      return
    }

    console.error(`${colorize(ts(), COLORS.dim)} ${colorize('[SERVER ERROR]', COLORS.red)} ${err?.message || err}`)
  })

  server.on('close', () => {
    console.warn(`${colorize(ts(), COLORS.dim)} ${colorize('[SERVER CLOSED]', COLORS.yellow)} HTTP server closed`)
  })
}

// app.listen(PORT) is invoked here at the end (via startServer).
// If PORT is busy, we retry the next port instead of exiting immediately.
startServer(PORT)

export default app
