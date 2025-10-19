/**
 * Claude AI API Route
 * Proxies Claude API calls through Railway backend
 * Supports web search for promotional insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, rateLimits } from '@/lib/ratelimit'

const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://ceo-app-working-production.up.railway.app'

export async function POST(request: NextRequest) {
  // Apply rate limiting - Claude calls are expensive
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, rateLimits.claude)

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Too many AI requests. Please try again later.',
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
    // Get JWT from Authorization header
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Claude API] No Authorization header')
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const body = await request.json()
    const { prompt, messages, max_tokens = 4096, temperature = 0.7, timeout = 90000 } = body

    // Support both old prompt format and new messages format
    let apiMessages: Array<{ role: 'user' | 'assistant', content: string }>

    if (messages) {
      // New format: messages array already provided
      apiMessages = messages
      console.log('[Claude API] Sending messages to Railway (count:', messages.length, ')')
    } else if (prompt) {
      // Old format: single prompt string (backward compatibility)
      apiMessages = [{ role: 'user', content: prompt }]
      console.log('[Claude API] Sending prompt to Railway (length:', prompt.length, 'chars)')
    } else {
      return NextResponse.json(
        { error: 'Either prompt or messages is required' },
        { status: 400 }
      )
    }

    // Call Railway's Claude service (same endpoint as iOS app)
    const response = await fetch(`${RAILWAY_API_URL}/api/claude/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: apiMessages,
        model: 'claude-sonnet-4-5-20250929',
        max_tokens,
        temperature
      }),
      signal: AbortSignal.timeout(timeout)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Claude API] Railway error:', errorText)
      return NextResponse.json(
        { error: 'Claude API error', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[Claude API] Success, response length:', data.response?.length || 0, 'chars')

    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': rateLimit.limit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString()
      }
    })

  } catch (error) {
    console.error('[Claude API] Error:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - analysis took too long' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze with Claude AI' },
      { status: 500 }
    )
  }
}
