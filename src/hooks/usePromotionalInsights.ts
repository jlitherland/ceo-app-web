/**
 * Promotional Insights Hook
 * Web-optimized Claude AI integration for streaming analytics
 * Based on iOS PromotionalInsightsService
 */

import { useState, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { TopSongsAndStreamsResult, PromotionalInsightsData } from '@/lib/types/luminate'

interface UsePromotionalInsightsOptions {
  artistName: string
  timeframe: string
  cacheExpiryHours?: number
}

export function usePromotionalInsights() {
  const [isLoading, setIsLoading] = useState(false)
  const [insights, setInsights] = useState<PromotionalInsightsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')

  const generateInsights = useCallback(async (
    topSongsData: TopSongsAndStreamsResult[],
    options: UsePromotionalInsightsOptions
  ) => {
    const { artistName, timeframe } = options

    // Check cache first
    const cacheKey = `promotional_insights_${artistName}_${timeframe}_${topSongsData.length}`
    const cached = getCachedInsights(cacheKey)

    if (cached) {
      console.log('📱 Using cached insights for', artistName)
      setInsights(cached)
      return
    }

    setIsLoading(true)
    setError(null)
    setProgress('🌐 Searching the web for current trends...')

    try {
      // Get top 3 songs by velocity/momentum from all time periods
      const topSongs = getTopSongsByVelocity(topSongsData)

      setProgress('📊 Analyzing top 3 songs...')

      // Call Claude through Railway with web search
      const result = await analyzeWithClaude(topSongs, artistName, timeframe, setProgress)

      setInsights(result)

      // Cache the results
      cacheInsights(cacheKey, result)

      setProgress('')
    } catch (err) {
      console.error('Error generating insights:', err)
      setError('Not sure what happened there - try again?')
      setInsights(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const forceRefresh = useCallback(async (
    topSongsData: TopSongsAndStreamsResult[],
    options: UsePromotionalInsightsOptions
  ) => {
    const { artistName, timeframe } = options
    const cacheKey = `promotional_insights_${artistName}_${timeframe}_${topSongsData.length}`

    // Clear cache
    localStorage.removeItem(cacheKey)

    // Generate fresh insights
    await generateInsights(topSongsData, options)
  }, [generateInsights])

  const clearInsights = useCallback(() => {
    setInsights(null)
    setError(null)
    setProgress('')
    setIsLoading(false)
  }, [])

  const generateSingleSongInsights = useCallback(async (
    song: { title: string; artist: string; streams: number },
    artistName: string
  ) => {
    setIsLoading(true)
    setError(null)
    setProgress('🌐 Analyzing song and searching for trends...')

    try {
      setProgress('🎵 Generating personalized strategies...')

      // Call Claude with single song focus
      // Convert single song to the format expected by analyzeWithClaude
      const topSongs = [{
        title: song.title,
        streams: song.streams,
        velocity: 0 // Single song analysis doesn't have velocity context
      }]

      const result = await analyzeWithClaude(topSongs, artistName, 'Current Period', setProgress)

      setInsights(result)
      setProgress('')
    } catch (err) {
      console.error('Error generating single song insights:', err)
      setError('Unable to generate insights. Please try again.')
      setInsights(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    insights,
    error,
    progress,
    generateInsights,
    forceRefresh,
    clearInsights,
    generateSingleSongInsights,
  }
}

/**
 * Get top songs by velocity (growth rate) across time periods
 */
function getTopSongsByVelocity(results: TopSongsAndStreamsResult[]): Array<{
  title: string
  streams: number
  velocity: number
}> {
  // Need at least 2 time periods to calculate velocity
  if (results.length < 2) {
    // If only 1 period, return top 3 by absolute streams
    const firstPeriod = results[0]
    return firstPeriod.topSongs.slice(0, 3).map(song => ({
      title: song.title,
      streams: song.streams,
      velocity: 0
    }))
  }

  const recentPeriod = results[0] // Most recent
  const olderPeriod = results[1] // Comparison period

  // Build maps for quick lookup
  const recentMap = new Map(recentPeriod.topSongs.map(s => [s.isrc || s.title, s.streams]))
  const olderMap = new Map(olderPeriod.topSongs.map(s => [s.isrc || s.title, s.streams]))

  // Calculate velocity for each song
  const songsWithVelocity: Array<{
    title: string
    streams: number
    velocity: number
  }> = []

  recentPeriod.topSongs.forEach(song => {
    const key = song.isrc || song.title
    const recentStreams = recentMap.get(key) || 0
    const olderStreams = olderMap.get(key)

    let velocity: number

    if (!olderStreams) {
      // New song - high velocity
      velocity = recentStreams
    } else {
      // Calculate growth rate
      const growth = recentStreams - olderStreams
      velocity = olderStreams > 0 ? growth / olderStreams : 0
    }

    songsWithVelocity.push({
      title: song.title,
      streams: recentStreams,
      velocity
    })
  })

  // Sort by velocity and return top 3
  return songsWithVelocity
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, 3)
}

/**
 * Call Claude AI through Railway backend with web search enabled
 */
/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf_token') {
      return decodeURIComponent(value)
    }
  }

  return null
}

async function analyzeWithClaude(
  topSongs: Array<{ title: string; streams: number; velocity: number }>,
  artistName: string,
  timeframe: string,
  setProgress: (msg: string) => void
): Promise<PromotionalInsightsData> {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' })

  const songAnalysis = topSongs.map(song =>
    `• ${song.title}: ${formatStreams(song.streams)} streams`
  ).join('\n')

  const totalStreams = topSongs.reduce((sum, song) => sum + song.streams, 0)
  const topSong = topSongs[0]

  const prompt = `TODAY'S DATE: ${currentDate}
CURRENT MONTH: ${currentMonth}

You are a young but experienced music industry analyst, marketing and PR expert, who understands the music meta right now. You strike a balance of suggesting in person experiences and online / social media, and know how to grow a fanbase, as well as how to push a song to online virality.

CRITICAL FIRST STEP: Search the web for current, real-world information about ${artistName}. Look for:
1. Recent news, tour announcements, new releases, or collaborations
2. Social media discussions (Reddit, Twitter/X, TikTok) about their music
3. Current trends in their genre and what's working for similar artists
4. Successful marketing campaigns from artists in the same space
5. Playlist placements, viral moments, or fan behaviors
6. Demographics and listening patterns of their core audience
7. Any cultural moments or events that could be leveraged

Use this real-world context to make your recommendations specific, timely, and actionable. Reference actual current trends, platforms, and strategies that are working RIGHT NOW in 2025.

STREAMING DATA FOR ${artistName} (${timeframe}):
Total Streams: ${formatStreams(totalStreams)}
Number of Songs Analyzed: ${topSongs.length}
Top Performing Song: ${topSong.title} (${formatStreams(topSong.streams)})

TOP 3 SONGS WITH MOST VELOCITY/MOMENTUM:
${songAnalysis}

IMPORTANT GUIDELINES:
- Base ALL recommendations on the web research you just conducted
- Analyze these 3 songs with the most promotional potential
- Reference specific trends, platforms, or strategies you found in your research
- Explain WHY each song is performing well based on current fan behavior and market context
- BE CONCISE - keep explanations brief but specific (2-3 sentences max per field)
- Provide 3 action items per category (not 3-5, exactly 3)
- Every recommendation should reference actual current trends or news you found
- CRITICAL: Keep your response under 3000 tokens total

Please provide your analysis in this EXACT JSON format (be concise):
{
  "hotSongs": [
    {
      "songTitle": "Actual Song Name from the data",
      "reasonForMomentum": "Explain why this song is performing well using BOTH streaming data AND real-world context from your web research (fan discussions, playlist placements, genre trends, cultural relevance, etc.)",
      "momentumScore": 85,
      "streamingTrend": "growing/stable/declining",
      "promotionalStrategy": {
        "immediate": ["Action 1", "Action 2", "Action 3"],
        "shortTerm": ["Action 1", "Action 2", "Action 3"],
        "longTerm": ["Action 1", "Action 2", "Action 3"]
      },
      "socialMediaStrategy": {
        "platforms": ["Platform 1", "Platform 2", "Platform 3"],
        "contentIdeas": ["Idea 1", "Idea 2", "Idea 3"],
        "hashtags": ["#tag1", "#tag2", "#tag3"]
      },
      "inPersonStrategy": {
        "venues": ["Venue 1", "Venue 2"],
        "events": ["Event 1", "Event 2"],
        "partnerships": ["Partner 1", "Partner 2"]
      },
      "viralityPotential": "high/medium/low",
      "targetAudience": "Brief description (2-3 sentences max)"
    }
  ],
  "overallStrategy": {
    "primaryFocus": "Brief strategy (1-2 sentences)",
    "timeWindow": "Timeline (1 sentence)",
    "budget": "low/medium/high",
    "riskLevel": "low/medium/high"
  },
  "marketTiming": {
    "currentMeta": "Brief trend analysis (1-2 sentences)",
    "opportunityWindow": "Timing recommendation (1 sentence)",
    "seasonalFactors": "Seasonal factors (1 sentence)"
  },
  "actionableSteps": [
    "Step 1 with specific song",
    "Step 2 with specific song",
    "Step 3 with specific song"
  ]
}

CRITICAL REMINDERS:
- Return ONLY valid JSON, no markdown blocks
- Keep ALL fields concise (most fields should be 1-2 sentences)
- Exactly 3 songs, 3 items per list
- Reference your web research in every recommendation
- Total response must be under 3000 tokens`

  setProgress('✨ Generating recommendations...')

  // Get user JWT for authentication
  const supabase = createSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Authentication required. Please sign in.')
  }

  // Get CSRF token for security
  const csrfToken = getCsrfToken()

  if (!csrfToken) {
    console.error('No CSRF token found - this may cause authentication to fail')
  }

  // Call Claude through Railway API
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...(csrfToken && { 'x-csrf-token': csrfToken }),
    },
    body: JSON.stringify({
      prompt,
      timeout: 90000 // 90 seconds for web search + analysis
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    console.error('[usePromotionalInsights] Claude API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      hasCsrfToken: !!csrfToken,
      hasJwt: !!session.access_token
    })
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()

  // Extract and parse JSON from Claude's response
  const jsonText = extractJSON(data.response)
  return JSON.parse(jsonText)
}

/**
 * Extract JSON from Claude response (removes markdown blocks)
 */
function extractJSON(text: string): string {
  if (!text) return '{}'

  // Remove markdown code blocks
  let cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')

  // Find JSON object
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')

  if (start === -1 || end === -1 || start >= end) {
    return '{}'
  }

  return cleaned.substring(start, end + 1)
}

/**
 * Format stream count with K/M/B suffixes
 */
function formatStreams(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

/**
 * Cache insights in localStorage
 */
function cacheInsights(key: string, data: PromotionalInsightsData) {
  try {
    const cached = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    }
    localStorage.setItem(key, JSON.stringify(cached))
  } catch (err) {
    console.error('Failed to cache insights:', err)
  }
}

/**
 * Get cached insights from localStorage
 */
function getCachedInsights(key: string): PromotionalInsightsData | null {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const { data, expiresAt } = JSON.parse(cached)

    if (Date.now() > expiresAt) {
      localStorage.removeItem(key)
      return null
    }

    return data
  } catch (err) {
    console.error('Failed to load cached insights:', err)
    return null
  }
}
