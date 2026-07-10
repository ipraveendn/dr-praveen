/**
 * API Utility for Authenticated Requests
 * Centralizes API endpoint and automatically attaches JWT Bearer token.
 * Includes request deduplication and caching.
 */

// Import environment configuration
import { getConfig } from '../config/environment.js'

const config = getConfig()
const API_BASE_URL = `${config.API_BASE_URL}/api`;
const API_TIMEOUT = config.API_TIMEOUT;

// Cache for GET requests (simple in-memory cache)
const requestCache = new Map()
const pendingRequests = new Map()

const CACHE_DURATION = 100 // 100ms - very short cache to prevent stale data
const CACHE_WHITELIST = ['/queue'] // Only cache these endpoints

/**
 * Generate cache key from URL and options
 */
function getCacheKey(url, options) {
  return `${options?.method || 'GET'}:${url}`
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(cacheEntry) {
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION
}

/**
 * Invalidate cache for a specific endpoint
 */
function invalidateCache(url) {
  // Invalidate exact match and variations
  for (const [key] of requestCache) {
    if (key.includes(url)) {
      requestCache.delete(key)
    }
  }
}

/**
 * Enhanced fetch function with automatic JWT authentication, timeout, deduplication, and caching.
 * @param {string} url - API endpoint (e.g., '/queue')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} - The raw Fetch response object.
 */
export async function apiFetch(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const method = options.method || 'GET'
  const cacheKey = getCacheKey(url, options)

  // REQUEST DEDUPLICATION: If same request is already pending, return that promise
  if (pendingRequests.has(cacheKey) && method === 'GET') {
    return pendingRequests.get(cacheKey)
  }

  // CACHE CHECK: For GET requests, check cache first
  if (method === 'GET' && CACHE_WHITELIST.some(ep => url.includes(ep))) {
    const cached = requestCache.get(cacheKey)
    if (cached && isCacheValid(cached)) {
      // Create a fake response from cache - return clone for each caller
      const response = new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      return response.clone()
    } else if (cached) {
      requestCache.delete(cacheKey)
    }
  }

  const headers = { ...options.headers };

  if (!headers['Content-Type'] && options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const finalOptions = { ...options, headers };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  // Create the fetch promise
  const fetchPromise = (async () => {
    try {
      const response = await fetch(fullUrl, { ...finalOptions, signal: controller.signal });
      clearTimeout(timeoutId);
      
      // CRITICAL: Invalidate cache after successful mutations on queue endpoints
      if (response.ok && (method === 'POST' || method === 'PATCH') && url.includes('/queue')) {
        invalidateCache('/queue')
      }
      
      // Cache successful GET responses
      if (response.ok && method === 'GET' && CACHE_WHITELIST.some(ep => url.includes(ep))) {
        try {
          const clonedResponse = response.clone()
          const data = await clonedResponse.json()
          requestCache.set(cacheKey, {
            data,
            timestamp: Date.now()
          })
          // Return a clone so each caller gets their own readable stream
          return response.clone()
        } catch (e) {
          // Cache storage failed, continue
        }
      }
      
      // Always return a clone to prevent stream consumption issues with deduplication
      return response.clone();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[API FETCH ERROR] ${fullUrl}:`, error);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw new Error("Server temporarily unavailable. Please try again.");
    } finally {
      // Remove from pending requests
      if (method === 'GET') {
        pendingRequests.delete(cacheKey)
      }
    }
  })();

  // Track pending request for deduplication
  if (method === 'GET') {
    pendingRequests.set(cacheKey, fetchPromise)
  }

  return fetchPromise;
}

/**
 * Helper to make API requests and parse the JSON response.
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Parsed JSON response body.
 */
export async function apiFetchJson(url, options = {}) {
  console.log(`[apiFetchJson] Calling apiFetch for ${url}`)
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
    const result = await apiFetchJson(url, options)
    return result
  } catch (error) {
    console.error(`[apiRequest] FAILED: ${url}`, error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

export default apiFetch;
