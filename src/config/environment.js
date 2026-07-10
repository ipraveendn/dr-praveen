/**
 * Environment Configuration
 * Centralized configuration for frontend
 *
 * API: All requests use the deployed Render backend only.
 */

const RENDER_API_BASE_URL = 'https://dr-praveen.onrender.com'

const ENV = import.meta.env.MODE || 'development'

const config = {
  development: {
    API_BASE_URL: RENDER_API_BASE_URL,
    API_TIMEOUT: 30000, // 30 seconds
  },
  production: {
    API_BASE_URL: RENDER_API_BASE_URL,
    API_TIMEOUT: 30000,
  },
  staging: {
    API_BASE_URL: RENDER_API_BASE_URL,
    API_TIMEOUT: 30000,
  }
}

export const getConfig = () => config[ENV] || config.development

export default {
  ENV,
  getConfig
}
