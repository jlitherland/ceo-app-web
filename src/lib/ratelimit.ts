/**
 * Rate Limiting Utilities
 * In-memory rate limiting for API routes
 *
 * For production with multiple servers, consider:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel Edge Config
 * - External rate limiting service
 */

interface RateLimitStore {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production for multi-server deployments)
const rateLimitStore = new Map<string, RateLimitStore>()

export interface RateLimitConfig {
  /**
   * Unique identifier for this rate limit (e.g., 'api:analyze')
   */
  id: string

  /**
   * Maximum number of requests allowed
   */
  limit: number

  /**
   * Time window in milliseconds
   */
  window: number
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier for the requester (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with success boolean and remaining count
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  success: boolean
  limit: number
  remaining: number
  reset: number
} {
  const key = `${config.id}:${identifier}`
  const now = Date.now()

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key)

  // Reset if window has passed
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.window
    }
    rateLimitStore.set(key, entry)
  }

  // Check if limit exceeded
  const success = entry.count < config.limit

  // Increment count if successful
  if (success) {
    entry.count++
  }

  return {
    success,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    reset: entry.resetTime
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimits = {
  // Contract analysis: 30 requests per hour per IP (more reasonable for testing/debugging)
  contractAnalysis: {
    id: 'api:contract:analyze',
    limit: 30,
    window: 60 * 60 * 1000 // 1 hour
  },

  // General API: 100 requests per minute per IP
  api: {
    id: 'api:general',
    limit: 100,
    window: 60 * 1000 // 1 minute
  },

  // Auth: 5 attempts per 15 minutes per IP
  auth: {
    id: 'api:auth',
    limit: 5,
    window: 15 * 60 * 1000 // 15 minutes
  },

  // Luminate proxy: 60 requests per minute per IP
  luminate: {
    id: 'api:luminate',
    limit: 60,
    window: 60 * 1000 // 1 minute
  },

  // Claude AI: 10 requests per hour per IP (expensive, uses web search)
  claude: {
    id: 'api:claude',
    limit: 10,
    window: 60 * 60 * 1000 // 1 hour
  }
} as const

/**
 * Get client identifier from request
 * Uses IP address with fallbacks
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a generic identifier
  return 'unknown'
}

/**
 * Cleanup old entries from rate limit store
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitStore() {
  const now = Date.now()

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 10 * 60 * 1000)
}
