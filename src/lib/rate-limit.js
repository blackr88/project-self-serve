/**
 * Simple in-memory rate limiter
 * For production, consider using Redis
 */

const rateLimitMap = new Map();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.windowStart > value.windowMs) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Check rate limit for a given identifier
 * @param {string} identifier - Unique identifier (e.g., IP address)
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Window size in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
export function checkRateLimit(identifier, maxRequests = 60, windowMs = 60000) {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitMap.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    entry = {
      count: 0,
      windowStart: now,
      windowMs,
    };
    rateLimitMap.set(key, entry);
  }

  entry.count++;

  const remaining = Math.max(0, maxRequests - entry.count);
  const resetAt = entry.windowStart + windowMs;

  return {
    allowed: entry.count <= maxRequests,
    remaining,
    resetAt,
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  AUTH: { maxRequests: 10, windowMs: 15 * 60 * 1000 },     // 10 per 15 min
  UPLOAD: { maxRequests: 20, windowMs: 60 * 60 * 1000 },   // 20 per hour
  API: { maxRequests: 120, windowMs: 60 * 1000 },           // 120 per min
  DELETE: { maxRequests: 30, windowMs: 60 * 60 * 1000 },    // 30 per hour
};

/**
 * Get client IP from request headers
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
