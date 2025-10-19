'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, RefreshCw, Music, Sparkles } from 'lucide-react'
import ArtistSearch from '@/components/analytics/ArtistSearch'
import TopSongsView from '@/components/analytics/TopSongsView'
import GeographicView from '@/components/analytics/GeographicView'
import PromotionalInsightsView from '@/components/analytics/PromotionalInsightsView'
import { MultiArtistSelector } from '@/components/analytics/MultiArtistSelector'
import { usePromotionalInsights } from '@/hooks/usePromotionalInsights'
import {
  getTopSongsForRanges,
  getGeographicDataForRanges,
  getGeographicData,
  getDateRange,
  searchLuminateArtists
} from '@/lib/services/luminateService'
import {
  getAggregatedTopSongs,
  getAggregatedGeographicData,
  saveAggregationPreference,
  getAggregationPreference
} from '@/lib/services/aggregatedLuminateService'
import {
  saveSculptureData,
  transformTopSongsToSculpture,
  loadSculptureData
} from '@/lib/store/sculptureStore'
import type {
  TopSongsAndStreamsResult,
  GeographicHeatmapData,
  TimeRange
} from '@/lib/types/luminate'
import {
  fadeInUp,
  staggerContainer,
  buttonHover,
  scaleIn,
  pageTransition
} from '@/lib/animations'
import { SkeletonCard } from '@/components/ui/SkeletonLoader'

// Default time ranges
const DEFAULT_TIME_RANGES: TimeRange[] = [
  { label: '1 Month', period: '30d', days: 30 },
  { label: 'Last Quarter', period: '90d', days: 90 },
  { label: '1 Year', period: '365d', days: 365 },
  { label: 'All Time', period: 'atd', days: 3650 }, // ~10 years
]

export default function AnalyticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedArtist, setSelectedArtist] = useState<{ id: string; name: string } | null>(null)
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]) // Multiple IDs for aggregation
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Multi-artist selection modal
  const [showMultiArtistSelector, setShowMultiArtistSelector] = useState(false)
  const [pendingArtistName, setPendingArtistName] = useState<string>('')
  const [pendingArtistProfiles, setPendingArtistProfiles] = useState<Array<{ id: string; name: string }>>([])

  // Data states
  const [topSongsData, setTopSongsData] = useState<TopSongsAndStreamsResult[]>([])
  const [geographicData, setGeographicData] = useState<GeographicHeatmapData[]>([])

  // Loading states for each section
  const [loadingTopSongs, setLoadingTopSongs] = useState(false)
  const [loadingGeographic, setLoadingGeographic] = useState(false)

  // AbortController ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)

  // Use promotional insights hook
  const {
    isLoading: loadingInsights,
    insights: insightsData,
    error: insightsError,
    progress: insightsProgress,
    generateInsights,
    forceRefresh: refreshInsights,
    clearInsights,
    generateSingleSongInsights
  } = usePromotionalInsights()

  const fetchAllAnalytics = async (artistId: string) => {
    setIsLoading(true)

    // Fetch top songs and geographic data in parallel
    await Promise.all([
      fetchTopSongs(artistId),
      fetchGeographic(artistId),
    ])

    setIsLoading(false)
  }

  const handleArtistSelect = async (artistId: string, artistName: string) => {
    // Clear old data immediately when switching artists
    setError(null)
    setTopSongsData([])
    setGeographicData([])
    clearInsights() // Clear stale insights from previous artist

    // Check if we have a saved aggregation preference for this artist
    const savedIds = getAggregationPreference(artistName)
    if (savedIds && savedIds.length > 1) {
      console.log('[Analytics] Found saved aggregation preference:', savedIds)
      setSelectedArtist({ id: artistId, name: artistName })
      setSelectedArtistIds(savedIds)

      // Update URL
      const params = new URLSearchParams()
      params.set('artist', savedIds.join(','))
      params.set('name', artistName)
      router.push(`?${params.toString()}`, { scroll: false })

      await fetchAllAnalyticsAggregated(savedIds, artistName)
      return
    }

    // Search for potential duplicate profiles
    try {
      const searchResults = await searchLuminateArtists(artistName)

      // Filter results that match the artist name closely
      // Limit to max 10 profiles to prevent UI freeze
      const similarProfiles = searchResults
        .filter(result => {
          const name = result.artist_name || result.artistName || ''
          return name.toLowerCase() === artistName.toLowerCase()
        })
        .slice(0, 10)

      if (similarProfiles.length > 1) {
        // Show multi-artist selector
        if (process.env.NODE_ENV === 'development') {
          console.log('[Analytics] Found', similarProfiles.length, 'profiles for', artistName)
        }
        setPendingArtistName(artistName)
        setPendingArtistProfiles(similarProfiles.map(p => ({
          id: p.id,
          name: p.artist_name || p.artistName || p.id
        })))
        setShowMultiArtistSelector(true)
        return
      }
    } catch (err) {
      console.error('[Analytics] Error checking for duplicate profiles:', err)
      // Continue with single artist
    }

    // Single artist - proceed normally
    setSelectedArtist({ id: artistId, name: artistName })
    setSelectedArtistIds([artistId])

    // Update URL with artist info for persistence
    const params = new URLSearchParams()
    params.set('artist', artistId)
    params.set('name', artistName)
    router.push(`?${params.toString()}`, { scroll: false })

    await fetchAllAnalytics(artistId)
  }

  const handleMultiArtistConfirm = async (selectedIds: string[]) => {
    setShowMultiArtistSelector(false)

    // Save preference
    saveAggregationPreference(pendingArtistName, selectedIds)

    setSelectedArtist({ id: selectedIds[0], name: pendingArtistName })
    setSelectedArtistIds(selectedIds)

    // Update URL
    const params = new URLSearchParams()
    params.set('artist', selectedIds.join(','))
    params.set('name', pendingArtistName)
    router.push(`?${params.toString()}`, { scroll: false })

    if (selectedIds.length > 1) {
      await fetchAllAnalyticsAggregated(selectedIds, pendingArtistName)
    } else {
      await fetchAllAnalytics(selectedIds[0])
    }
  }

  const handleMultiArtistCancel = () => {
    setShowMultiArtistSelector(false)
    setPendingArtistName('')
    setPendingArtistProfiles([])
  }

  // Restore artist and data from localStorage/URL on mount
  useEffect(() => {
    const artistId = searchParams.get('artist')
    const artistName = searchParams.get('name')

    if (artistId && artistName && !selectedArtist) {
      console.log('🔄 Restoring artist from URL:', artistId, artistName)

      // Check if artistId contains comma-separated IDs (aggregated mode)
      const artistIds = artistId.split(',')
      setSelectedArtist({ id: artistIds[0], name: artistName })
      setSelectedArtistIds(artistIds)

      // Trigger appropriate data fetch based on number of IDs
      if (artistIds.length > 1) {
        fetchAllAnalyticsAggregated(artistIds, artistName)
      } else {
        fetchAllAnalytics(artistId)
      }
    } else if (!selectedArtist) {
      // Try to restore from localStorage if no URL params
      const cachedData = loadSculptureData()
      if (cachedData && cachedData.songs.length > 0) {
        console.log('💾 Restoring from cache:', cachedData.artistName, cachedData.songs.length, 'songs')
        setSelectedArtist({ id: cachedData.artistId, name: cachedData.artistName })

        // Update URL to match cached state
        const params = new URLSearchParams()
        params.set('artist', cachedData.artistId)
        params.set('name', cachedData.artistName)
        router.push(`?${params.toString()}`, { scroll: false })

        // Reconstruct topSongsData from cached sculpture data
        const reconstructedData: TopSongsAndStreamsResult[] = [{
          rangeLabel: 'Cached',
          topSongs: cachedData.songs.map(song => ({
            title: song.title,
            artist: song.artist,
            streams: song.streams,
            isrc: song.isrc || '',
            rank: 0
          }))
        }]
        setTopSongsData(reconstructedData)
        console.log('✅ Analytics restored with', reconstructedData[0].topSongs.length, 'songs')
      }
    }
    // Only run on mount or when URL params change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Generate insights when top songs data is ready
  useEffect(() => {
    if (topSongsData.length > 0 && selectedArtist) {
      generateInsights(topSongsData, {
        artistName: selectedArtist.name,
        timeframe: 'Last 30 Days'
      })
    }
  }, [topSongsData, selectedArtist, generateInsights])

  const fetchAllAnalyticsAggregated = async (artistIds: string[], artistName: string) => {
    setIsLoading(true)

    // Fetch aggregated data in parallel
    await Promise.all([
      fetchTopSongsAggregated(artistIds, artistName),
      fetchGeographicAggregated(artistIds),
    ])

    setIsLoading(false)
  }

  const fetchTopSongs = async (artistId: string) => {
    setLoadingTopSongs(true)
    try {
      const data = await getTopSongsForRanges(artistId, DEFAULT_TIME_RANGES)

      console.log('[Analytics Page] fetchTopSongs received data:', {
        dataLength: data?.length,
        hasRangeLabel: data?.map(d => ({ rangeLabel: d.rangeLabel, hasLabel: !!d.rangeLabel }))
      })

      setTopSongsData(data)

      // Update sculpture visualization with this streaming data
      if (data && data.length > 0 && selectedArtist) {
        console.log('📊 Sending data to sculpture:', data.length, 'time ranges')
        const sculptureData = transformTopSongsToSculpture(
          data,
          selectedArtist.name,
          artistId
        )
        saveSculptureData(sculptureData)
        console.log('✅ Sculpture data saved:', sculptureData.songs.length, 'songs')
      }
    } catch (err) {
      console.error('Error fetching top songs:', err)
      setError('Failed to fetch streaming data')
    } finally {
      setLoadingTopSongs(false)
    }
  }

  const fetchTopSongsAggregated = async (artistIds: string[], artistName: string) => {
    setLoadingTopSongs(true)
    try {
      // Fetch aggregated data for all time ranges
      const aggregatedData = await getAggregatedTopSongs(artistIds, DEFAULT_TIME_RANGES)

      console.log('[Analytics Page] fetchTopSongsAggregated received data:', {
        dataLength: aggregatedData?.length,
        hasRangeLabel: aggregatedData?.map(d => ({ rangeLabel: d.rangeLabel, hasLabel: !!d.rangeLabel }))
      })

      setTopSongsData(aggregatedData)

      // Update sculpture visualization
      if (aggregatedData.length > 0 && selectedArtist) {
        console.log('📊 Sending aggregated data to sculpture:', aggregatedData.length, 'time ranges')
        const sculptureData = transformTopSongsToSculpture(
          aggregatedData,
          artistName,
          artistIds[0]
        )
        saveSculptureData(sculptureData)
        console.log('✅ Sculpture data saved:', sculptureData.songs.length, 'songs')
      }
    } catch (err) {
      console.error('Error fetching aggregated top songs:', err)
      setError('Failed to fetch aggregated streaming data')
    } finally {
      setLoadingTopSongs(false)
    }
  }

  const fetchGeographic = async (artistId: string) => {
    setLoadingGeographic(true)
    try {
      // Use same time ranges as top songs for consistency
      const geographicTimeRanges: TimeRange[] = [
        { label: 'Last 30 Days', period: '30d', days: 30 },
        { label: 'Last Quarter', period: '90d', days: 90 },
        { label: '1 Year', period: '365d', days: 365 },
      ]

      const data = await getGeographicDataForRanges(artistId, geographicTimeRanges)

      console.log('[Analytics Page] fetchGeographic received data:', {
        dataLength: data?.length,
        timeRanges: data?.map(d => d.timeRange)
      })

      setGeographicData(data)
    } catch (err) {
      console.error('Error fetching geographic data:', err)
    } finally {
      setLoadingGeographic(false)
    }
  }

  const fetchGeographicAggregated = async (artistIds: string[]) => {
    setLoadingGeographic(true)
    try {
      // Use same time ranges as top songs for consistency
      const geographicTimeRanges: TimeRange[] = [
        { label: 'Last 30 Days', period: '30d', days: 30 },
        { label: 'Last Quarter', period: '90d', days: 90 },
        { label: '1 Year', period: '365d', days: 365 },
      ]

      // For now, fetch each time period separately for aggregated mode
      // TODO: Update aggregatedLuminateService to support multi-range requests
      const dataPromises = geographicTimeRanges.map(async (range) => {
        const { startDate, endDate } = getDateRange(range)
        const data = await getAggregatedGeographicData(artistIds, startDate, endDate)
        if (data) {
          data.timeRange = range.label
        }
        return data
      })

      const results = await Promise.all(dataPromises)
      setGeographicData(results.filter(Boolean) as GeographicHeatmapData[])
    } catch (err) {
      console.error('Error fetching aggregated geographic data:', err)
    } finally {
      setLoadingGeographic(false)
    }
  }


  const handleRefresh = () => {
    if (selectedArtist) {
      fetchAllAnalytics(selectedArtist.id)
    }
  }

  const handleRequestSongInsights = async (song: { title: string; artist: string; isrc?: string; streams: number }) => {
    if (!selectedArtist) return

    // Clear existing insights first
    clearInsights()

    // Generate insights for this specific song
    await generateSingleSongInsights(song, selectedArtist.name)

    // Scroll to insights section
    const insightsSection = document.getElementById('promotional-insights')
    if (insightsSection) {
      insightsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-800">
      {/* Header - Collapses when data is loaded */}
      <motion.div
        className="border-b border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 sticky top-0 z-10 overflow-hidden"
        initial={false}
        animate={{
          height: selectedArtist && topSongsData.length > 0 ? 'auto' : 'auto',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="px-6 py-6">
          {/* Compact Header when data is loaded */}
          {selectedArtist && topSongsData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-black dark:text-white">Analytics</h1>
                  <span className="text-xs font-medium text-gray-500 dark:text-neutral-500 uppercase">all platforms</span>
                </div>
                <div className="h-6 w-px bg-gray-300 dark:bg-neutral-600" />
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  <span className="font-semibold text-black dark:text-white">{selectedArtist.name}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ArtistSearch onArtistSelect={handleArtistSelect} compact />
                <motion.button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
                  variants={buttonHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-700 dark:text-neutral-300 ${isLoading ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* Expanded Header when no data */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-black dark:text-white">Streaming Analytics</h1>
                    <span className="text-sm font-medium text-gray-500 dark:text-neutral-500 uppercase tracking-wide">all platforms</span>
                  </div>
                  {selectedArtist && (
                    <p className="text-gray-600 dark:text-neutral-400 mt-1">
                      Real-time insights for <span className="font-semibold text-black dark:text-white">{selectedArtist.name}</span>
                    </p>
                  )}
                </div>
                {selectedArtist && (
                  <motion.button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
                    variants={buttonHover}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-700 dark:text-neutral-300 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="text-sm text-gray-700 dark:text-neutral-300">Refresh</span>
                  </motion.button>
                )}
              </div>

              {/* Artist Search Bar */}
              <ArtistSearch onArtistSelect={handleArtistSelect} />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && selectedArtist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 dark:border-neutral-700 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-black dark:text-white mb-1">
                  Fetching data
                </p>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Loading analytics for {selectedArtist.name}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-6 py-8">
        <AnimatePresence mode="wait">
          {!selectedArtist ? (
            <motion.div
              key="empty"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center px-4"
            >
              <motion.div
                variants={scaleIn}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-orange/10 to-brand-orange/20 flex items-center justify-center mb-4"
              >
                <TrendingUp className="w-10 h-10 text-brand-orange" />
              </motion.div>

              <motion.h2 variants={fadeInUp} className="text-xl font-bold text-black dark:text-white mb-2">
                Discover your streaming performance
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-sm text-gray-600 dark:text-neutral-400 text-center max-w-md mb-6">
                Search for any artist to unlock detailed streaming analytics and insights. All platforms in one place - for the first time.
              </motion.p>

              <motion.div
                variants={staggerContainer}
                className="grid grid-cols-3 gap-3 max-w-2xl w-full"
              >
                <motion.div
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center">
                    <Music className="w-4 h-4 text-brand-orange" />
                  </div>
                  <p className="font-semibold text-black dark:text-white text-sm text-center">Top Songs</p>
                </motion.div>

                <motion.div
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-brand-orange" />
                  </div>
                  <p className="font-semibold text-black dark:text-white text-sm text-center">Geographic Data</p>
                </motion.div>

                <motion.div
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-brand-orange" />
                  </div>
                  <p className="font-semibold text-black dark:text-white text-sm text-center">Insights</p>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Top Songs Section */}
              <motion.section variants={fadeInUp}>
                <motion.div
                  className="flex items-center gap-3 mb-4"
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Music className="w-5 h-5 text-brand-orange" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-black dark:text-white">Top Songs</h2>
                </motion.div>
                {loadingTopSongs ? (
                  <SkeletonCard />
                ) : (
                  <TopSongsView
                    data={topSongsData}
                    loading={loadingTopSongs}
                    onRefresh={() => selectedArtist && fetchTopSongs(selectedArtist.id)}
                    onRequestInsights={handleRequestSongInsights}
                  />
                )}
              </motion.section>

              {/* Geographic Section */}
              <motion.section variants={fadeInUp}>
                <motion.div
                  className="flex items-center gap-3 mb-4"
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <TrendingUp className="w-5 h-5 text-brand-orange" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-black dark:text-white">Geographic Distribution</h2>
                </motion.div>
                {loadingGeographic ? (
                  <SkeletonCard />
                ) : (
                  <GeographicView
                    data={geographicData}
                    loading={loadingGeographic}
                  />
                )}
              </motion.section>

              {/* Promotional Insights Section */}
              <motion.section id="promotional-insights" variants={fadeInUp}>
                <motion.div
                  className="flex items-center gap-3 mb-4"
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-orange to-brand-orange-dark flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-black dark:text-white">Promotional Insights</h2>
                </motion.div>
                {loadingInsights ? (
                  <SkeletonCard />
                ) : (
                  <PromotionalInsightsView
                    data={insightsData}
                    loading={loadingInsights}
                  />
                )}
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Multi-Artist Selector Modal */}
      {showMultiArtistSelector && (
        <MultiArtistSelector
          artistName={pendingArtistName}
          artistProfiles={pendingArtistProfiles}
          onConfirm={handleMultiArtistConfirm}
          onCancel={handleMultiArtistCancel}
          savedSelection={getAggregationPreference(pendingArtistName) || undefined}
        />
      )}
    </div>
  )
}
