/**
 * Aggregated Luminate Service
 * Handles fetching and merging data from multiple artist IDs
 */

import {
  getTopSongsForRanges,
  getGeographicData,
  type TopSongsAndStreamsResult,
  type GeographicHeatmapData,
  type GeographicStreamingData,
  type TimeRange,
} from './luminateService'
import type { ArtistMapping } from '@/lib/types/artistMapping'

/**
 * Fetch and aggregate top songs from multiple artist IDs for multiple time ranges
 */
export async function getAggregatedTopSongs(
  artistIds: string[],
  timeRanges: TimeRange[]
): Promise<TopSongsAndStreamsResult[]> {
  // Validate inputs
  if (!Array.isArray(artistIds) || artistIds.length === 0) {
    throw new Error('Invalid artist IDs: must be non-empty array')
  }

  if (artistIds.length > 5) {
    throw new Error('Too many artists: maximum 5 allowed for aggregation')
  }

  if (!Array.isArray(timeRanges) || timeRanges.length === 0) {
    throw new Error('Invalid time ranges: must be non-empty array')
  }

  if (timeRanges.length > 10) {
    throw new Error('Too many time ranges: maximum 10 allowed')
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Aggregated Service] Fetching top songs for', artistIds.length, 'artists')
  }

  // Fetch all artist data in parallel
  const results = await Promise.all(
    artistIds.map(async (id) => {
      try {
        return await getTopSongsForRanges(id, timeRanges)
      } catch (error) {
        console.error(`[Aggregated Service] Error fetching songs for artist ID:`, error)
        return null
      }
    })
  )

  // Filter out failed requests
  const validResults = results.filter((r): r is TopSongsAndStreamsResult[] => r !== null)

  if (validResults.length === 0) {
    throw new Error('Failed to fetch data from any artist ID')
  }

  // Flatten all results into single array
  const allPeriods = validResults.flat()

  // Group by time period
  const periodMap = new Map<string, TopSongsAndStreamsResult[]>()
  allPeriods.forEach((period) => {
    const existing = periodMap.get(period.rangeLabel) || []
    existing.push(period)
    periodMap.set(period.rangeLabel, existing)
  })

  if (process.env.NODE_ENV === 'development') {
    console.log('[Aggregated Service] Period labels found:', Array.from(periodMap.keys()))
    console.log('[Aggregated Service] Total periods before merge:', allPeriods.length)
  }

  // Merge each period
  const mergedPeriods: TopSongsAndStreamsResult[] = []
  periodMap.forEach((periods, rangeLabel) => {
    const merged = mergeTopSongsPeriods(periods, rangeLabel)
    mergedPeriods.push(merged)
  })

  if (process.env.NODE_ENV === 'development') {
    console.log('[Aggregated Service] Merged periods:', mergedPeriods.length)
    console.log('[Aggregated Service] Merged period labels:', mergedPeriods.map(p => p.rangeLabel))
  }
  return mergedPeriods
}

/**
 * Merge multiple TopSongsAndStreamsResult from same time period
 */
function mergeTopSongsPeriods(
  periods: TopSongsAndStreamsResult[],
  rangeLabel: string
): TopSongsAndStreamsResult {
  // Collect all songs from all periods
  const allSongs = periods.flatMap((p) => p.topSongs)

  // Merge songs by ISRC (or title if ISRC is missing)
  const songMap = new Map<string, {
    title: string
    artist: string
    isrc?: string
    streams: number
  }>()

  allSongs.forEach((song) => {
    const key = song.isrc || song.title
    const existing = songMap.get(key)

    if (existing) {
      // Add streams from duplicate
      existing.streams += song.streams
    } else {
      songMap.set(key, {
        title: song.title,
        artist: song.artist,
        isrc: song.isrc,
        streams: song.streams,
      })
    }
  })

  // Convert to array and sort by streams
  const mergedSongs = Array.from(songMap.values()).sort((a, b) => b.streams - a.streams)

  // Calculate total streams
  const totalStreams = mergedSongs.reduce((sum, song) => sum + song.streams, 0)

  // Recalculate ranks and percentages
  const topSongs = mergedSongs.map((song, index) => ({
    ...song,
    rank: index + 1,
    percentageOfTotal: totalStreams > 0 ? (song.streams / totalStreams) * 100 : 0,
  }))

  return {
    rangeLabel,
    totalStreams,
    topSongs,
  }
}

/**
 * Fetch and aggregate geographic data from multiple artist IDs
 */
export async function getAggregatedGeographicData(
  artistIds: string[],
  startDate: string,
  endDate: string,
  mode: 'territories' | 'markets' = 'territories'
): Promise<GeographicHeatmapData> {
  // Validate inputs
  if (!Array.isArray(artistIds) || artistIds.length === 0) {
    throw new Error('Invalid artist IDs: must be non-empty array')
  }

  if (artistIds.length > 5) {
    throw new Error('Too many artists: maximum 5 allowed for aggregation')
  }

  if (!startDate || !endDate) {
    throw new Error('Invalid date range')
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Aggregated Service] Fetching geographic data for', artistIds.length, 'artists')
  }

  // Fetch all artist data in parallel
  const results = await Promise.all(
    artistIds.map(async (id) => {
      try {
        return await getGeographicData(id, startDate, endDate, mode)
      } catch (error) {
        console.error(`[Aggregated Service] Error fetching geographic for artist ID:`, error)
        return null
      }
    })
  )

  // Filter out failed requests
  const validResults = results.filter((r): r is GeographicHeatmapData => r !== null)

  if (validResults.length === 0) {
    throw new Error('Failed to fetch geographic data from any artist ID')
  }

  return mergeGeographicData(validResults)
}

/**
 * Merge multiple GeographicHeatmapData objects
 */
function mergeGeographicData(dataArray: GeographicHeatmapData[]): GeographicHeatmapData {
  if (dataArray.length === 0) {
    throw new Error('No geographic data to merge')
  }

  // Use first result as template
  const template = dataArray[0]

  // Merge territories
  const territoryMap = new Map<string, {
    territory: { code: string; name: string }
    streams: number
  }>()

  dataArray.forEach((data) => {
    data.territories.forEach((territory) => {
      const key = territory.territory.code
      const existing = territoryMap.get(key)

      if (existing) {
        existing.streams += territory.streams
      } else {
        territoryMap.set(key, {
          territory: {
            code: territory.territory.code,
            name: territory.territory.name,
          },
          streams: territory.streams,
        })
      }
    })
  })

  // Calculate total streams
  const totalStreams = Array.from(territoryMap.values()).reduce(
    (sum, t) => sum + t.streams,
    0
  )

  // Convert to array with market share and sort
  const territories: GeographicStreamingData[] = Array.from(territoryMap.values())
    .map((t) => ({
      territory: t.territory,
      streams: t.streams,
      marketShare: totalStreams > 0 ? t.streams / totalStreams : 0,
    }))
    .sort((a, b) => b.streams - a.streams)

  // Merge US metro markets if present
  const marketMap = new Map<string, {
    marketName: string
    marketCode: string
    streams: number
  }>()

  dataArray.forEach((data) => {
    if (data.usMetroMarkets) {
      data.usMetroMarkets.forEach((market) => {
        const key = market.marketCode
        const existing = marketMap.get(key)

        if (existing) {
          existing.streams += market.streams
        } else {
          marketMap.set(key, {
            marketName: market.marketName,
            marketCode: market.marketCode,
            streams: market.streams,
          })
        }
      })
    }
  })

  const usMetroMarkets = Array.from(marketMap.values())
    .map((m) => ({
      marketName: m.marketName,
      marketCode: m.marketCode,
      streams: m.streams,
      marketShare: totalStreams > 0 ? m.streams / totalStreams : 0,
    }))
    .sort((a, b) => b.streams - a.streams)

  return {
    artistId: template.artistId,
    artistName: template.artistName,
    timeRange: template.timeRange,
    territories,
    totalStreams,
    topTerritories: territories.slice(0, 10),
    usMetroMarkets: usMetroMarkets.length > 0 ? usMetroMarkets : undefined,
  }
}

/**
 * Validate artist name to prevent XSS and prototype pollution
 */
function validateArtistName(artistName: string): boolean {
  if (!artistName || typeof artistName !== 'string') {
    return false
  }

  if (artistName.length > 200) {
    return false
  }

  // Prevent prototype pollution
  const dangerousKeys = ['__proto__', 'constructor', 'prototype']
  if (dangerousKeys.includes(artistName.toLowerCase())) {
    return false
  }

  return true
}

/**
 * Validate artist IDs array
 */
function validateArtistIds(artistIds: string[]): boolean {
  if (!Array.isArray(artistIds) || artistIds.length === 0 || artistIds.length > 10) {
    return false
  }

  return artistIds.every(id =>
    typeof id === 'string' &&
    id.length > 0 &&
    id.length < 500 &&
    !id.includes('<') && // Prevent XSS
    !id.includes('>') &&
    !id.includes('script')
  )
}

/**
 * Save aggregation preference to localStorage
 */
export function saveAggregationPreference(artistName: string, artistIds: string[]): void {
  try {
    // Validate inputs
    if (!validateArtistName(artistName)) {
      throw new Error('Invalid artist name')
    }

    if (!validateArtistIds(artistIds)) {
      throw new Error('Invalid artist IDs')
    }

    const stored = localStorage.getItem('artist_aggregations')
    const preferences = stored ? JSON.parse(stored) : {}

    // Sanitize artist name for storage
    const sanitizedName = artistName.trim()
    preferences[sanitizedName] = artistIds

    // Check storage size before saving
    const serialized = JSON.stringify(preferences)
    if (serialized.length > 50000) { // 50KB limit
      throw new Error('Storage quota exceeded')
    }

    localStorage.setItem('artist_aggregations', serialized)

    if (process.env.NODE_ENV === 'development') {
      console.log('[Aggregation] Saved preference:', sanitizedName, artistIds.length, 'IDs')
    }
  } catch (error) {
    console.error('[Aggregation] Failed to save preference:', error)
  }
}

/**
 * Get aggregation preference from localStorage
 */
export function getAggregationPreference(artistName: string): string[] | null {
  try {
    if (!validateArtistName(artistName)) {
      return null
    }

    const stored = localStorage.getItem('artist_aggregations')
    if (!stored) return null

    const preferences = JSON.parse(stored)
    const sanitizedName = artistName.trim()
    const ids = preferences[sanitizedName]

    // Validate stored data before returning
    if (ids && validateArtistIds(ids)) {
      return ids
    }

    return null
  } catch (error) {
    console.error('[Aggregation] Failed to load preference:', error)
    return null
  }
}

/**
 * Clear aggregation preference
 */
export function clearAggregationPreference(artistName: string): void {
  try {
    if (!validateArtistName(artistName)) {
      return
    }

    const stored = localStorage.getItem('artist_aggregations')
    if (!stored) return

    const preferences = JSON.parse(stored)
    const sanitizedName = artistName.trim()
    delete preferences[sanitizedName]
    localStorage.setItem('artist_aggregations', JSON.stringify(preferences))

    if (process.env.NODE_ENV === 'development') {
      console.log('[Aggregation] Cleared preference:', sanitizedName)
    }
  } catch (error) {
    console.error('[Aggregation] Failed to clear preference:', error)
  }
}
