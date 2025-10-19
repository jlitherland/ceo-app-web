/**
 * Rate Limiting Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, rateLimits } from '@/lib/ratelimit'

describe('Rate Limiting', () => {
  const testConfig = {
    id: 'test',
    limit: 3,
    window: 1000, // 1 second
  }

  beforeEach(() => {
    // Wait a bit to ensure clean state
    return new Promise(resolve => setTimeout(resolve, 10))
  })

  it('should allow requests within limit', () => {
    const identifier = 'test-user-1'

    const result1 = checkRateLimit(identifier, testConfig)
    expect(result1.success).toBe(true)
    expect(result1.remaining).toBe(2)

    const result2 = checkRateLimit(identifier, testConfig)
    expect(result2.success).toBe(true)
    expect(result2.remaining).toBe(1)

    const result3 = checkRateLimit(identifier, testConfig)
    expect(result3.success).toBe(true)
    expect(result3.remaining).toBe(0)
  })

  it('should block requests exceeding limit', () => {
    const identifier = 'test-user-2'

    // Use up the limit
    checkRateLimit(identifier, testConfig)
    checkRateLimit(identifier, testConfig)
    checkRateLimit(identifier, testConfig)

    // This should be blocked
    const result = checkRateLimit(identifier, testConfig)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should reset after time window', async () => {
    const identifier = 'test-user-3'
    const shortConfig = { ...testConfig, window: 100 } // 100ms window

    // Use up the limit
    checkRateLimit(identifier, shortConfig)
    checkRateLimit(identifier, shortConfig)
    checkRateLimit(identifier, shortConfig)

    // Should be blocked
    expect(checkRateLimit(identifier, shortConfig).success).toBe(false)

    // Wait for window to pass
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should be allowed again
    const result = checkRateLimit(identifier, shortConfig)
    expect(result.success).toBe(true)
  })

  it('should handle different identifiers separately', () => {
    const user1 = 'test-user-4'
    const user2 = 'test-user-5'

    // User 1 uses up limit
    checkRateLimit(user1, testConfig)
    checkRateLimit(user1, testConfig)
    checkRateLimit(user1, testConfig)

    // User 1 should be blocked
    expect(checkRateLimit(user1, testConfig).success).toBe(false)

    // User 2 should still be allowed
    expect(checkRateLimit(user2, testConfig).success).toBe(true)
  })

  it('should have correct rate limit configurations', () => {
    expect(rateLimits.contractAnalysis.limit).toBe(10)
    expect(rateLimits.contractAnalysis.window).toBe(60 * 60 * 1000)

    expect(rateLimits.api.limit).toBe(100)
    expect(rateLimits.api.window).toBe(60 * 1000)

    expect(rateLimits.auth.limit).toBe(5)
    expect(rateLimits.luminate.limit).toBe(60)
  })
})
