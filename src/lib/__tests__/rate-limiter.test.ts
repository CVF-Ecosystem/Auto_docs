import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { checkRateLimit, getClientIp } from '../rate-limiter'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit('test-key-under', 5, 60_000)).toBe(true)
    }
  })

  it('blocks the request that exceeds the limit', () => {
    const key = 'test-key-exceed'
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key, 10, 60_000)
    }
    expect(checkRateLimit(key, 10, 60_000)).toBe(false)
  })

  it('resets after the window expires', () => {
    const key = 'test-key-reset'
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key, 10, 60_000)
    }
    expect(checkRateLimit(key, 10, 60_000)).toBe(false)

    vi.advanceTimersByTime(60_001)

    expect(checkRateLimit(key, 10, 60_000)).toBe(true)
  })

  it('uses sliding window — older requests fall out as time passes', () => {
    const key = 'test-key-slide'
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key, 10, 60_000)
    }
    expect(checkRateLimit(key, 10, 60_000)).toBe(false)

    vi.advanceTimersByTime(30_000)
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 10, 60_000)
    }

    vi.advanceTimersByTime(31_000)
    expect(checkRateLimit(key, 10, 60_000)).toBe(true)
  })

  it('isolates different keys', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('key-a', 3, 60_000)
    }
    expect(checkRateLimit('key-a', 3, 60_000)).toBe(false)
    expect(checkRateLimit('key-b', 3, 60_000)).toBe(true)
  })
})

describe('getClientIp', () => {
  const makeRequest = (headers: Record<string, string | null>) => ({
    headers: { get: (name: string) => headers[name] ?? null },
  })

  it('returns IP from x-forwarded-for', () => {
    expect(getClientIp(makeRequest({ 'x-forwarded-for': '192.168.1.1' }))).toBe('192.168.1.1')
  })

  it('returns first IP when x-forwarded-for has a chain', () => {
    expect(getClientIp(makeRequest({ 'x-forwarded-for': '10.0.0.1, 172.16.0.1' }))).toBe('10.0.0.1')
  })

  it('falls back to x-real-ip', () => {
    expect(getClientIp(makeRequest({ 'x-real-ip': '10.0.0.2' }))).toBe('10.0.0.2')
  })

  it('returns "unknown" when no IP headers present', () => {
    expect(getClientIp(makeRequest({}))).toBe('unknown')
  })

  it('x-forwarded-for takes priority over x-real-ip', () => {
    expect(
      getClientIp(makeRequest({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '5.6.7.8' }))
    ).toBe('1.2.3.4')
  })
})
