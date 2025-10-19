/**
 * Contract Analysis API Route
 * Proxies contract analysis requests to Railway backend with rate limiting
 * Rate limited: 30 requests per hour per IP
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, rateLimits } from '@/lib/ratelimit'

const RAILWAY_BASE_URL = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 'https://ceo-app-working-production.up.railway.app'

export async function POST(request: NextRequest) {
  // Apply strict rate limiting for expensive AI operations
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, rateLimits.contractAnalysis)

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Contract analysis is limited to 30 requests per hour.',
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: new Date(rateLimit.reset).toISOString()
        }
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
          'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString()
        }
      }
    )
  }

  try {
    const body = await request.json()

    // Validate request body
    if (!body.text && !body.pdfBase64) {
      return NextResponse.json(
        { error: 'Either text or pdfBase64 must be provided' },
        { status: 400 }
      )
    }

    // Forward to Railway backend with authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const response = await fetch(`${RAILWAY_BASE_URL}/api/claude/analyze-contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Analysis failed: ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()

    // Add rate limit info to response headers
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': rateLimit.limit.toString(),
        'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString()
      }
    })
  } catch (error) {
    console.error('Contract analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
