/**
 * Railway Service
 * API client for Railway-hosted backend services
 * Handles contract analysis, Claude AI chat, and Luminate analytics
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const RAILWAY_BASE_URL = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 'https://ceo-app-working-production.up.railway.app'

export interface ContractAnalysisRequest {
  text?: string
  pdfBase64?: string
  contractType?: string
}

export interface ContractAnalysisResponse {
  analysis: string
  cached: boolean
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  model?: string
  max_tokens?: number
  temperature?: number
}

export interface ChatResponse {
  response: string
  cached: boolean
}

export interface ContractQuestionRequest {
  question: string
  contractText: string
  analysisResults: string
}

export interface ContractQuestionResponse {
  answer: string
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  hash: string
}

class RailwayServiceClass {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1 hour

  /**
   * Generate SHA-256 hash of text for cache key
   */
  private async generateHash(text: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Get cached result if available and not expired
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    const now = Date.now()
    const age = now - entry.timestamp

    if (age > this.CACHE_TTL) {
      // Cache expired, remove it
      this.cache.delete(key)
      console.log('🗑️ Cache expired for key:', key.substring(0, 16) + '...')
      return null
    }

    console.log('✅ Cache hit! Age:', Math.round(age / 1000 / 60), 'minutes')
    return entry.data as T
  }

  /**
   * Store result in cache
   */
  private setCache<T>(key: string, data: T, hash: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hash,
    })
    console.log('💾 Cached result. Total cache size:', this.cache.size)

    // Limit cache size to 50 entries
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
      console.log('🗑️ Cache limit reached, removed oldest entry')
    }
  }

  /**
   * Get JWT token from Supabase session for Railway authentication
   * Automatically refreshes expired tokens
   */
  private async getJWTToken(retryCount = 0): Promise<string | null> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session }, error } = await supabase.auth.getSession()

      console.log('🔐 Getting JWT token...', {
        hasError: !!error,
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
      })

      if (error) {
        console.error('❌ Failed to get Supabase session:', error)
        return null
      }

      if (!session) {
        console.warn('⚠️ No active Supabase session - user needs to sign in')
        return null
      }

      // Check if token is expired or about to expire (within 5 minutes)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
      const now = Date.now()
      const expiryBuffer = 5 * 60 * 1000 // 5 minutes

      if (expiresAt <= now + expiryBuffer) {
        console.log('🔄 Token expired or expiring soon, refreshing...')

        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError) {
            console.error('Failed to refresh session:', refreshError)

            // Retry up to 2 times
            if (retryCount < 2) {
              console.log(`Retrying token refresh (attempt ${retryCount + 2}/3)...`)
              await new Promise(resolve => setTimeout(resolve, 1000))
              return this.getJWTToken(retryCount + 1)
            }

            return null
          }

          if (refreshData.session) {
            console.log('✅ Token refreshed successfully')
            return refreshData.session.access_token
          }
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError)
          return null
        }
      }

      return session.access_token
    } catch (error) {
      console.error('Error getting JWT token:', error)
      return null
    }
  }

  /**
   * Make authenticated request to Railway API
   * Includes comprehensive error handling for network issues
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuthFailure = true
  ): Promise<T> {
    const token = await this.getJWTToken()

    if (!token) {
      throw new Error('Authentication required. Please sign in.')
    }

    const url = `${RAILWAY_BASE_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      })

      // Handle authentication errors with token refresh
      if (response.status === 401 && retryOnAuthFailure) {
        console.log('🔄 Got 401, refreshing token and retrying...')

        // Force token refresh
        const supabase = createSupabaseBrowserClient()
        const { data, error } = await supabase.auth.refreshSession()

        if (!error && data.session) {
          // Retry request with new token (only once)
          return this.makeRequest<T>(endpoint, options, false)
        }

        throw new Error('Authentication expired. Please sign in again.')
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('Railway API error:', errorText)

        // Provide user-friendly error messages
        switch (response.status) {
          case 400:
            throw new Error('Invalid request. Please check your contract and try again.')
          case 401:
            throw new Error('Authentication expired. Please sign in again.')
          case 403:
            throw new Error('Access denied. Please check your account permissions.')
          case 429:
            throw new Error('Rate limit exceeded. Please wait a few minutes and try again.')
          case 500:
          case 502:
          case 503:
            throw new Error('Server error. Please try again in a few moments.')
          case 504:
            throw new Error('Request timed out. This contract may be too large.')
          default:
            throw new Error(`API error: ${response.status}. ${errorText}`)
        }
      }

      return response.json()
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection.')
        }
      }

      // Handle AbortController timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. This contract may be too large.')
      }

      // Re-throw with original message if already an Error
      throw error
    }
  }

  /**
   * Analyze a music contract using Claude AI
   * Supports both text and PDF (base64) input
   * Includes local caching (1-hour TTL)
   */
  async analyzeContract(
    request: ContractAnalysisRequest
  ): Promise<ContractAnalysisResponse> {
    // Validate input
    if (!request.text && !request.pdfBase64) {
      throw new Error('Either text or PDF data must be provided')
    }

    // Generate cache key from contract content
    const contentForHash = request.text || request.pdfBase64 || ''
    const cacheKey = await this.generateHash(contentForHash)

    // Check local cache first
    const cachedResult = this.getFromCache<ContractAnalysisResponse>(cacheKey)
    if (cachedResult) {
      console.log('📦 Returning cached analysis result')
      return { ...cachedResult, cached: true }
    }

    // Estimate timeout based on content size
    const contentSize = request.pdfBase64?.length || request.text?.length || 0
    let timeoutMs = 120000 // 2 minutes default

    if (contentSize > 50000) {
      timeoutMs = 240000 // 4 minutes for large contracts
    } else if (contentSize > 20000) {
      timeoutMs = 180000 // 3 minutes for medium contracts
    }

    console.log('📄 Starting contract analysis...')
    console.log('  Content size:', contentSize, 'characters')
    console.log('  Timeout:', timeoutMs / 1000, 'seconds')
    console.log('  Railway URL:', RAILWAY_BASE_URL)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.error('⏱️ Request timed out after', timeoutMs / 1000, 'seconds')
      controller.abort()
    }, timeoutMs)

    const startTime = Date.now()

    try {
      console.log('🚀 Sending request to Railway API...')
      const response = await this.makeRequest<ContractAnalysisResponse>(
        '/api/claude/analyze-contract',
        {
          method: 'POST',
          body: JSON.stringify(request),
          signal: controller.signal,
        }
      )

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`✅ Analysis complete in ${elapsed}s`)
      console.log('  Server cached:', response.cached)

      // Store in local cache
      this.setCache(cacheKey, response, cacheKey)

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.error(`❌ Analysis failed after ${elapsed}s:`, error)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. This contract may be too large. Please try again.')
        }
      }

      throw error
    }
  }

  /**
   * Send a chat message to Claude AI
   */
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/api/claude/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Ask a follow-up question about a contract
   */
  async askContractQuestion(
    request: ContractQuestionRequest
  ): Promise<ContractQuestionResponse> {
    return this.makeRequest<ContractQuestionResponse>(
      '/api/claude/ask-question',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }
}

export const RailwayService = new RailwayServiceClass()
