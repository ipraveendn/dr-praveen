/**
 * Environment Configuration
 * Centralized configuration for frontend
 * 
 * API: All requests to Render production backend
 */

const ENV = import.meta.env.MODE || 'development'

const config = {
  development: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://dr-praveen.onrender.com',
    API_TIMEOUT: 30000, // 30 seconds
  },
  production: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://dr-praveen.onrender.com',
    API_TIMEOUT: 30000,
  },
  staging: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://staging-api.example.com',
    API_TIMEOUT: 30000,
  }
}

export const getConfig = () => config[ENV] || config.development

export default {
  ENV,
  getConfig
}
