const store = new Map<string, number[]>()

/**
 * Sliding window in-memory rate limiter.
 * Returns false (rate limit exceeded) when key has exceeded `limit` calls within `windowMs`.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= limit) {
    store.set(key, timestamps)
    return false
  }

  timestamps.push(now)
  store.set(key, timestamps)
  return true
}

export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}
