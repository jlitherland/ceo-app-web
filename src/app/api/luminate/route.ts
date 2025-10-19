/**
 * Luminate API Proxy Route
 * Proxies requests to Railway backend with user's Supabase JWT
 * Rate limited: 60 requests per minute per IP
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, rateLimits } from '@/lib/ratelimit'

const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://ceo-app-working-production.up.railway.app'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, rateLimits.luminate)

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: rateLimit.reset
        }
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString()
        }
      }
    )
  }

  try {
    // Get JWT from Authorization header (passed from client)
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Luminate API] No Authorization header')
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const body = await request.json()
    const { endpoint, method = 'POST', data } = body

    console.log('[Luminate API] Request:', { endpoint, method, railwayUrl: RAILWAY_API_URL })

    const fullUrl = `${RAILWAY_API_URL}${endpoint}`
    console.log('[Luminate API] Calling:', fullUrl)

    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    console.log('[Luminate API] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Luminate API] Error response:', errorText)
      return NextResponse.json(
        { error: `Railway API error: ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('[Luminate API] Success')
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Luminate API] Exception:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, rateLimits.luminate)

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: rateLimit.reset
        }
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString()
        }
      }
    )
  }

  try {
    // Get JWT from Authorization header (passed from client)
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Luminate API] No Authorization header')
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const searchParams = request.nextUrl.searchParams
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${RAILWAY_API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Railway API error: ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Luminate API proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
