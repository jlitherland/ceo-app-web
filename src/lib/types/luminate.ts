/**
 * Luminate API Types
 * Based on iOS app's MusicbrainzLuminateModels.swift
 */

// Artist Search Result
export interface LuminateArtistSearchResult {
  id: string // Luminate artist ID (e.g., "AR444CAEBB765648C3A2A5C5D066CE205D")
  artist_name?: string // Snake case from Railway API
  artistName?: string // Alias for backwards compatibility
  isni?: string
}

// Track/Song
export interface LuminateTrack {
  id?: string // song_id
  title?: string
  artist?: string
  isrc?: string
  streamingMetrics?: StreamingMetrics
}

// Discography Section
export interface DiscographySection {
  type: string // e.g., "album", "single"
  tracks: LuminateTrack[]
}

// Artist with Discography
export interface LuminateArtist {
  id: string
  name?: string
  isni?: string
  artist_name?: string
  artist_type?: string
  discography?: DiscographySection[]
}

// Streaming Metrics
export interface StreamingMetrics {
  streams?: number
  listeners?: number
  period?: string
  startDate?: string
  endDate?: string
}

// Song Stream Info (for Top Songs)
export interface SongStreamInfo {
  songId: string
  title: string
  artist: string
  isrc?: string
  streams: number
  percentageOfTotal?: number
  rank?: number
  artworkUrl?: string // iTunes artwork URL
}

// Cached Song Data
export interface CachedSongData {
  songId: string
  title: string
  artist: string
  isrc?: string
  totalStreams: number
  timeRangeStreams: { [rangeLabel: string]: number }
}

// Cached Time Range Data
export interface CachedTimeRangeData {
  rangeLabel: string
  totalStreams?: number
  topSongs: SongStreamInfo[]
  isComplete: boolean
  atdStreams?: number // Activity-to-date (all-time) streams
}

// Top Songs and Streams Result
export interface TopSongsAndStreamsResult {
  rangeLabel: string
  topSongs: SongStreamInfo[]
  totalStreams?: number
  atdStreams?: number
}

// Territory
export interface Territory {
  code: string // ISO 3166-1 alpha-2 code (e.g., "US", "GB")
  name: string
}

// Streaming Service Breakout
export interface StreamingServiceBreakout {
  serviceName: string
  tier?: string // "ad-supported", "premium", "programmed"
  streams: number
  percentage?: number
}

// Territory Spike Summary
export interface TerritorySpikeSummary {
  territoryCode: string
  territoryName: string
  spikeCount: number
  totalSpikes: number
  hasActiveSpike: boolean
  details?: string
}

// Geographic Streaming Data
export interface GeographicStreamingData {
  territory: Territory
  streams: number
  marketShare?: number
  spikeSummary?: TerritorySpikeSummary
  streamingServiceBreakouts?: StreamingServiceBreakout[]
}

// US Metro Market Data
export interface USMetroMarketData {
  marketName: string
  marketCode: string
  streams: number
  marketShare?: number
}

// Geographic Heatmap Data
export interface GeographicHeatmapData {
  artistId: string
  artistName: string
  timeRange: string
  territories: GeographicStreamingData[]
  totalStreams: number
  topTerritories: GeographicStreamingData[]
  usMetroMarkets?: USMetroMarketData[]
}

// Luminate Cache Data
export interface LuminateCacheData {
  artistId: string
  artistName: string
  lastUpdated: Date
  timeRangeData: { [rangeLabel: string]: CachedTimeRangeData }
  allSongs: CachedSongData[]
  geographicData?: { [rangeLabel: string]: GeographicHeatmapData }
}

// Time Range Period
export type TimeRangePeriod = '7d' | '30d' | '90d' | '365d' | 'atd'

export interface TimeRange {
  label: string
  period: TimeRangePeriod
  days?: number
  startDate?: string
  endDate?: string
}

// Promotional Insights (Ideas Tab)
export interface PromotionalInsight {
  songId?: string
  title?: string
  songTitle?: string  // Claude returns this
  artist?: string
  velocity?: number // Growth rate
  currentStreams?: number
  previousStreams?: number
  recommendedActions?: string[]
  marketTiming?: string
  seasonalFactors?: string
  artworkUrl?: string // iTunes artwork URL
  // Extended fields from Claude AI
  reasonForMomentum?: string
  momentumScore?: number
  streamingTrend?: 'growing' | 'stable' | 'declining'
  promotionalStrategy?: {
    immediate?: string[]
    shortTerm?: string[]
    longTerm?: string[]
  }
  socialMediaStrategy?: {
    platforms?: string[]
    contentIdeas?: string[]
    hashtags?: string[]
  }
  inPersonStrategy?: {
    venues?: string[]
    events?: string[]
    partnerships?: string[]
  }
  viralityPotential?: 'high' | 'medium' | 'low'
  targetAudience?: string
}

export interface PromotionalInsightsData {
  artistId: string
  artistName: string
  timeRange: string
  hotSongs: PromotionalInsight[]
  overallStrategy?: string | {
    primaryFocus?: string
    timeWindow?: string
    budget?: string
    riskLevel?: string
  }
  marketTiming?: {
    currentMeta?: string
    opportunityWindow?: string
    seasonalFactors?: string[] | string
  }
  actionableSteps?: string[]
}

// API Response Types
export interface LuminateSearchResponse {
  results: LuminateArtistSearchResult[]
  total: number
}

export interface LuminateArtistResponse {
  artist: LuminateArtist
}

export interface LuminateStreamingResponse {
  data: StreamingMetrics
}

// Error Types
export interface LuminateError {
  code: string
  message: string
  details?: string
}
