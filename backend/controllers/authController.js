import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { getISTISOString } from '../utils/dateUtils.js'

// Credentials (hardcoded for development - move to database in production)
const VALID_CREDENTIALS = {
  admin: '1234',
  doctor: '5678'
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m'
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30)
const REFRESH_COOKIE_NAME = 'drp_refresh_token'
const prisma = new PrismaClient()

function signAccessToken({ username, role }) {
  return jwt.sign(
    {
      username,
      role,
      loginTime: getISTISOString()
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  )
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString('base64url')
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=')
      if (separatorIndex === -1) return cookies
      const key = part.slice(0, separatorIndex)
      const value = part.slice(separatorIndex + 1)
      cookies[key] = decodeURIComponent(value)
      return cookies
    }, {})
}

function buildRefreshCookie(value, maxAgeMs) {
  const secure = process.env.REFRESH_COOKIE_SECURE
    ? process.env.REFRESH_COOKIE_SECURE !== 'false'
    : true
  const sameSite = secure ? 'None' : 'Lax'

  return [
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
    'Path=/api/auth',
    'HttpOnly',
    secure ? 'Secure' : '',
    `SameSite=${sameSite}`
  ].filter(Boolean).join('; ')
}

async function issueRefreshSession(res, username, role) {
  const refreshToken = createRefreshToken()
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)

  await prisma.refreshSession.create({
    data: {
      username,
      role,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt
    }
  })

  res.setHeader('Set-Cookie', buildRefreshCookie(refreshToken, expiresAt.getTime() - Date.now()))
  return refreshToken
}

function clearRefreshCookie(res) {
  res.setHeader('Set-Cookie', buildRefreshCookie('', 0))
}

// Authentication Controller
// Handles user login, logout, token verification, and refresh

/**
 * Login user and return JWT token
 * @param {Object} req - Express request object with body {username, password}
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required'
      })
    }

    // Check credentials
    if (VALID_CREDENTIALS[username] && VALID_CREDENTIALS[username] === password) {
      // Determine role based on username
      const role = username === 'admin' ? 'admin' : 'doctor'

      const token = signAccessToken({ username, role })
      await issueRefreshSession(res, username, role)

      return res.status(200).json({
        success: true,
        token,
        accessToken: token,
        expiresIn: JWT_EXPIRE,
        role,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} logged in successfully`
      })
    }

    // Invalid credentials
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid username or password'
    })
  } catch (error) {
    console.error('[LOGIN ERROR]', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie)
    const refreshToken = cookies[REFRESH_COOKIE_NAME]

    if (refreshToken) {
      await prisma.refreshSession.updateMany({
        where: {
          tokenHash: hashRefreshToken(refreshToken),
          revokedAt: null
        },
        data: { revokedAt: new Date() }
      })
    }

    clearRefreshCookie(res)
    res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * Verify user token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyToken = async (req, res) => {
  try {
    // TODO: Implement token verification logic
    res.status(200).json({ message: 'Token verified', user: req.user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * Refresh expired token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const refreshToken = async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie)
    const refreshToken = cookies[REFRESH_COOKIE_NAME]

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        code: 'NO_REFRESH_TOKEN',
        message: 'Refresh token is missing'
      })
    }

    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) }
    })

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      clearRefreshCookie(res)
      return res.status(401).json({
        success: false,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired'
      })
    }

    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() }
    })

    await issueRefreshSession(res, session.username, session.role)
    const token = signAccessToken({ username: session.username, role: session.role })

    res.status(200).json({
      success: true,
      token,
      accessToken: token,
      role: session.role,
      expiresIn: JWT_EXPIRE,
      message: 'Token refreshed'
    })
  } catch (error) {
    console.error('[REFRESH TOKEN ERROR]', error)
    res.status(500).json({ error: error.message })
  }
}
