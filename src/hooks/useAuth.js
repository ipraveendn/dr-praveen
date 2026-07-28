import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'

/**
 * Custom hook to protect dashboard routes with token authentication
 * Checks for JWT token in localStorage and redirects to login if not found
 * 
 * @param {string} role - Expected role: 'admin' or 'doctor'
 * @returns {object} - { token, role, username, isAuthenticated, logout }
 * 
 * Usage:
 * const { isAuthenticated, token } = useAuth('admin')
 */
export const useAuth = (role) => {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token')
    const storedRole = localStorage.getItem('drp_role')
    const username = localStorage.getItem('username')

    // If no token, redirect to login
    if (!token) {
      console.warn('[AUTH] No token found. Redirecting to login.')
      navigate('/login')
      return
    }

    // If role is specified and doesn't match, redirect to login
    if (role && storedRole !== role) {
      console.warn(`[AUTH] Role mismatch. Expected ${role}, got ${storedRole}. Redirecting to login.`)
      navigate('/login')
      return
    }

    console.log(`[AUTH] User authenticated as: ${username} (${storedRole})`)
  }, [navigate, role])

  useEffect(() => {
    const handleSessionExpired = () => {
      navigate('/login')
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [navigate])

  /**
   * Logout function - clears token and redirects to login
   */
  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch (error) {
      console.warn('[AUTH] Logout request failed; clearing local session anyway.', error)
    }

    localStorage.removeItem('token')
    localStorage.removeItem('drp_role')
    localStorage.removeItem('username')
    console.log('[AUTH] User logged out')
    navigate('/login')
  }

  // Get current auth data
  const token = localStorage.getItem('token')
  const storedRole = localStorage.getItem('drp_role')
  const username = localStorage.getItem('username')

  return {
    token,
    role: storedRole,
    username,
    isAuthenticated: !!token,
    logout
  }
}
