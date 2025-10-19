/**
 * Luminate API Service
 * Handles all Luminate/Musicbrainz API interactions via Railway backend
 * Goes through Next.js API proxy to avoid CORS and handle auth server-side
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  LuminateArtistSearchResult,
  LuminateArtist,
  TopSongsAndStreamsResult,
  GeographicHeatmapData,
  GeographicStreamingData,
  USMetroMarketData,
  PromotionalInsightsData,
  TimeRange,
} from '@/lib/types/luminate'

/**
 * Get JWT token from client session
 */
async function getClientToken(): Promise<string | null> {
  try {
    const supabase = createSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    console.error('Error getting client token:', error)
    return null
  }
}

/**
 * Make request through Next.js API proxy
 * The proxy forwards client JWT to Railway
 */
async function makeProxyRequest<T>(
  endpoint: string,
  method: string = 'POST',
  data?: any
): Promise<T> {
  const token = await getClientToken()

  console.log('[Luminate Service] Making request:', {
    endpoint,
    method,
    hasToken: !!token,
    tokenPrefix: token ? `${token.substring(0, 10)}...` : 'none'
  })

  const response = await fetch('/api/luminate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({
      endpoint,
      method,
      data,
    }),
  })

  console.log('[Luminate Service] Response status:', response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.error('[Luminate Service] Error details:', {
      status: response.status,
      statusText: response.statusText,
      errorData
    })
    throw new Error(errorData.error || `Request failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Search for artists in Luminate database
 */
export async function searchLuminateArtists(
  artistName: string
): Promise<LuminateArtistSearchResult[]> {
  try {
    const data = await makeProxyRequest<{ results: LuminateArtistSearchResult[] }>(
      '/api/luminate/search',
      'POST',
      {
        query: artistName,
        size: 20,
      }
    )
    return data.results || []
  } catch (error) {
    console.error('Error searching Luminate artists:', error)
    throw error
  }
}

/**
 * Get artist data with discography
 */
export async function getLuminateArtistData(
  artistId: string,
  idType: 'artist_id' | 'isni' = 'artist_id'
): Promise<LuminateArtist> {
  try {
    const data = await makeProxyRequest<{ artist: LuminateArtist }>(
      `/api/luminate/artists/${artistId}`,
      'GET'
    )
    return data.artist
  } catch (error) {
    console.error('Error fetching artist data:', error)
    throw error
  }
}

/**
 * Get top songs and streams for multiple time ranges
 */
export async function getTopSongsForRanges(
  artistId: string,
  timeRanges: TimeRange[]
): Promise<TopSongsAndStreamsResult[]> {
  try {
    // Convert TimeRange to the format expected by the backend
    const formattedTimeRanges = timeRanges.map(tr => ({
      startDate: getDateRange(tr).startDate,
      endDate: getDateRange(tr).endDate,
      label: tr.label,
    }))

    console.log('[luminateService] Requesting top songs with time ranges:', formattedTimeRanges)

    const data = await makeProxyRequest<any[]>(
      `/api/luminate/artists/${artistId}/top-songs`,
      'POST',
      {
        timeRanges: formattedTimeRanges,
      }
    )

    console.log('[luminateService] Raw response from Railway:', JSON.stringify(data?.slice(0, 1), null, 2))

    // Ensure each result has a rangeLabel - Railway backend may not be returning it
    const resultsWithLabels: TopSongsAndStreamsResult[] = (data || []).map((result, index) => {
      const expectedLabel = formattedTimeRanges[index]?.label

      return {
        rangeLabel: result.rangeLabel || expectedLabel || `Period ${index + 1}`,
        topSongs: result.topSongs || [],
        totalStreams: result.totalStreams,
        atdStreams: result.atdStreams
      }
    })

    console.log('[luminateService] Results after adding labels:', {
      dataLength: resultsWithLabels.length,
      labels: resultsWithLabels.map(r => r.rangeLabel)
    })

    return resultsWithLabels
  } catch (error) {
    console.error('Error fetching top songs:', error)
    throw error
  }
}

/**
 * Get geographic streaming data
 */
export async function getGeographicData(
  artistId: string,
  startDate: string,
  endDate: string,
  mode: 'territories' | 'markets' = 'territories'
): Promise<GeographicHeatmapData> {
  try {
    console.log('[Geographic Service] Fetching data:', { artistId, startDate, endDate, mode })

    const rawData = await makeProxyRequest<any>(
      `/api/luminate/artists/${artistId}/geographic`,
      'POST',
      {
        startDate,
        endDate,
        mode,
      }
    )

    console.log('[Geographic Service] Raw response:', rawData)

    // Transform Railway response to GeographicHeatmapData format
    // Railway returns: { data: [{ name, code, streams, marketId? }], total, mode }
    if (!rawData || !rawData.data) {
      console.warn('[Geographic Service] No data in response')
      return {
        artistId,
        artistName: '',
        timeRange: `${startDate} to ${endDate}`,
        territories: [],
        totalStreams: 0,
        topTerritories: [],
        usMetroMarkets: []
      }
    }

    const totalStreams = rawData.total || 0

    if (mode === 'territories') {
      // Transform territory data
      const territories: GeographicStreamingData[] = rawData.data.map((item: any) => {
        const marketShare = totalStreams > 0 ? (item.streams / totalStreams) : 0

        return {
          territory: {
            code: item.code,
            name: item.name
          },
          streams: item.streams,
          marketShare,
          spikeSummary: undefined,
          streamingServiceBreakouts: undefined
        }
      })

      // Sort by streams descending
      const topTerritories = [...territories].sort((a, b) => b.streams - a.streams)

      console.log('[Geographic Service] Transformed territories:', territories.length, 'items')

      return {
        artistId,
        artistName: '',
        timeRange: `${startDate} to ${endDate}`,
        territories,
        totalStreams,
        topTerritories,
        usMetroMarkets: []
      }
    } else {
      // Transform market data
      const usMetroMarkets: USMetroMarketData[] = rawData.data.map((item: any) => {
        const marketShare = totalStreams > 0 ? (item.streams / totalStreams) : 0

        return {
          marketName: item.name,
          marketCode: item.code || item.marketId || '',
          streams: item.streams,
          marketShare
        }
      })

      console.log('[Geographic Service] Transformed markets:', usMetroMarkets.length, 'items')

      return {
        artistId,
        artistName: '',
        timeRange: `${startDate} to ${endDate}`,
        territories: [],
        totalStreams,
        topTerritories: [],
        usMetroMarkets
      }
    }
  } catch (error) {
    console.error('[Geographic Service] Error fetching geographic data:', error)
    throw error
  }
}

/**
 * Get promotional insights (Ideas tab)
 */
export async function getPromotionalInsights(
  artistId: string,
  timeRanges: TimeRange[]
): Promise<PromotionalInsightsData> {
  try {
    // Convert TimeRange to the format expected by the backend
    const formattedTimeRanges = timeRanges.map(tr => ({
      startDate: getDateRange(tr).startDate,
      endDate: getDateRange(tr).endDate,
      label: tr.label,
    }))

    const data = await makeProxyRequest<PromotionalInsightsData>(
      `/api/luminate/artists/${artistId}/promotional-insights`,
      'POST',
      {
        timeRanges: formattedTimeRanges,
      }
    )
    return data
  } catch (error) {
    console.error('Error fetching promotional insights:', error)
    throw error
  }
}

/**
 * Calculate velocity for promotional insights
 * Velocity = (recent_streams - older_streams) / older_streams
 */
export function calculateVelocity(recentStreams: number, olderStreams: number): number {
  if (olderStreams === 0) return recentStreams // New songs
  return (recentStreams - olderStreams) / olderStreams
}

/**
 * Default time ranges matching iOS app
 */
export const DEFAULT_TIME_RANGES: TimeRange[] = [
  { label: 'Last 7 Days', period: '7d', days: 7 },
  { label: 'Last Month', period: '30d', days: 30 },
  { label: 'Last Quarter', period: '90d', days: 90 },
  { label: 'Last Year', period: '365d', days: 365 },
]

/**
 * Format date for Luminate API (ISO 8601)
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0] // yyyy-MM-dd
}

/**
 * Get date range from time period
 */
export function getDateRange(period: TimeRange): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date()

  if (period.days) {
    startDate.setDate(startDate.getDate() - period.days)
  }

  return {
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(endDate),
  }
}

/**
 * Check if artist ID is a Luminate ID (starts with AR and is 32+ chars)
 */
export function isLuminateArtistId(id: string): boolean {
  return id.startsWith('AR') && id.length >= 32
}

/**
 * Check if ID is an ISNI (16 digits)
 */
export function isISNI(id: string): boolean {
  return /^\d{16}$/.test(id.replace(/\s/g, ''))
}

/**
 * Format number with K/M/B suffixes
 */
export function formatStreamCount(count: number | undefined | null): string {
  if (count === undefined || count === null || isNaN(count)) {
    return '0'
  }
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B`
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`
  }
  return count.toString()
}
