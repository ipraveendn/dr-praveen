/**
 * Backend Connection Checker
 * Helps diagnose connection issues and verify backend availability
 */

import { apiFetch } from './api'
import { getConfig } from '../config/environment'

const { API_BASE_URL } = getConfig()

/**
 * Check if backend is reachable
 * @returns {Promise<boolean>} - True if backend is available
 */
export async function checkBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      timeout: 5000
    })
    return response.ok
  } catch (error) {
    console.warn('[CONNECTION CHECK FAILED]', error.message)
    return false
  }
}

/**
 * Get detailed connection diagnostics
 * @returns {Promise<Object>} - Diagnostic information
 */
export async function getConnectionDiagnostics() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    backendAvailable: false,
    localStorageToken: !!localStorage.getItem('token'),
    corsEnabled: false,
    errorDetails: null
  }

  try {
    // Check health endpoint
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET'
    })
    diagnostics.backendAvailable = healthResponse.ok
    
    if (healthResponse.ok) {
      const data = await healthResponse.json()
      diagnostics.backendInfo = data
    }

    // Check CORS by making a simple authenticated request
    if (localStorage.getItem('token')) {
      try {
        const corsResponse = await apiFetch('/api', {
          method: 'GET'
        })
        diagnostics.corsEnabled = corsResponse.ok
      } catch (error) {
        diagnostics.corsEnabled = false
        diagnostics.errorDetails = error.message
      }
    }
  } catch (error) {
    diagnostics.errorDetails = error.message
    if (error.message.includes('fetch')) {
      diagnostics.errorDetails = `Cannot reach backend at ${API_BASE_URL}. Ensure backend is running.`
    }
  }

  return diagnostics
}

/**
 * Log connection diagnostics to console
 */
export async function logConnectionDiagnostics() {
  const diagnostics = await getConnectionDiagnostics()
  
  console.group('[CONNECTION DIAGNOSTICS]')
  console.table(diagnostics)
  
  if (!diagnostics.backendAvailable) {
    console.error(`❌ Backend unavailable at ${API_BASE_URL}`)
    console.error('Please ensure:')
    console.error('1. Backend is running: npm run dev (in backend folder)')
    console.error(`2. Backend is on port 5000 or configured in environment`)
    console.error('3. No firewall is blocking the connection')
  } else {
    console.log(`✅ Backend available at ${API_BASE_URL}`)
  }
  
  if (!diagnostics.corsEnabled && diagnostics.localStorageToken) {
    console.warn('⚠️ CORS may not be properly configured')
  }
  
  console.groupEnd()
}

export default {
  checkBackendConnection,
  getConnectionDiagnostics,
  logConnectionDiagnostics
}
