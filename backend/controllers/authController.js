import jwt from 'jsonwebtoken'
import { getISTISOString } from '../utils/dateUtils.js'

// Credentials (hardcoded for development - move to database in production)
const VALID_CREDENTIALS = {
  admin: '1234',
  doctor: '5678'
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d'

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

      // Generate JWT token
      const token = jwt.sign(
        {
          username,
          role,
          loginTime: getISTISOString()
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
      )

      return res.status(200).json({
        success: true,
        token,
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
    // TODO: Implement logout logic
    res.status(200).json({ message: 'Logout endpoint' })
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
    // TODO: Implement token refresh logic
    res.status(200).json({ message: 'Token refreshed' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
