/**
 * API Utility for Authenticated Requests
 * Centralizes API endpoint and automatically attaches JWT Bearer token.
 */

// Import environment configuration
import { getConfig } from '../config/environment.js'

const config = getConfig()
const API_BASE_URL = `${config.API_BASE_URL}/api`;
const API_TIMEOUT = config.API_TIMEOUT;

/**
 * Enhanced fetch function with automatic JWT authentication and timeout.
 * @param {string} url - API endpoint (e.g., '/queue')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} - The raw Fetch response object.
 */
export async function apiFetch(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const headers = { ...options.headers };

  if (!headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const finalOptions = { ...options, headers };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(fullUrl, { ...finalOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[API FETCH ERROR] ${fullUrl}:`, error);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw new Error("Server temporarily unavailable. Please try again.");
  }
}

/**
 * Helper to make API requests and parse the JSON response.
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Parsed JSON response body.
 */
export async function apiFetchJson(url, options = {}) {
  const response = await apiFetch(url, options);

  if (response.status === 204) {
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error(`[JSON PARSE ERROR] ${url}:`, error);
    throw new Error(`Invalid response format from server.`);
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `HTTP ${response.status} Error`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    console.error(`[API RESPONSE ERROR] ${url} failed with status ${response.status}:`, data);
    throw error;
  }

  return data;
}

/**
 * API request helper with common error handling.
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Function} onError - Optional error callback
 * @returns {Promise<Object|null>} - Response data or throws on error.
 */
export async function apiRequest(url, options = {}, onError = null) {
  try {
    return await apiFetchJson(url, options);
  } catch (error) {
    console.error(`[API REQUEST ERROR] ${url}:`, error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

export default apiFetch;
