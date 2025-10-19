/**
 * Top Songs View
 * Displays streaming data across multiple time periods
 * Replicates iOS TopSongsAndStreamsView.swift
 */

'use client'

import { useState } from 'react'
import { Music, TrendingUp, RefreshCw, Lightbulb } from 'lucide-react'
import { formatStreamCount } from '@/lib/services/luminateService'
import type { TopSongsAndStreamsResult } from '@/lib/types/luminate'
import SongArtwork from './SongArtwork'

interface TopSongsViewProps {
  data: TopSongsAndStreamsResult[]
  loading?: boolean
  onRefresh?: () => void
  onRequestInsights?: (song: { title: string; artist: string; isrc?: string; streams: number }) => void
}

export default function TopSongsView({ data, loading, onRefresh, onRequestInsights }: TopSongsViewProps) {
  const [selectedRange, setSelectedRange] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedSong, setSelectedSong] = useState<{ title: string; artist: string; isrc?: string; streams: number } | null>(null)

  const handleLightbulbClick = (song: { title: string; artist: string; isrc?: string; streams: number }) => {
    setSelectedSong(song)
    setShowConfirmModal(true)
  }

  const handleConfirmInsights = () => {
    if (selectedSong && onRequestInsights) {
      onRequestInsights(selectedSong)
    }
    setShowConfirmModal(false)
    setSelectedSong(null)
  }

  const handleCancelInsights = () => {
    setShowConfirmModal(false)
    setSelectedSong(null)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-8">
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 text-brand-orange animate-spin" />
          <p className="text-gray-600 dark:text-neutral-300 font-medium">Fetching streaming data...</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-12 text-center">
        <Music className="w-16 h-16 text-gray-300 dark:text-neutral-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-neutral-300 font-medium text-lg">No streaming data available</p>
        <p className="text-gray-500 dark:text-neutral-400 mt-2">Search for an artist to view their analytics</p>
      </div>
    )
  }

  const currentData = data[selectedRange]

  // Debug: Log data structure
  console.log('TopSongsView data:', data)

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden">
      {/* Time Range Tabs */}
      <div className="border-b-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700">
        <div className="flex overflow-x-auto hide-scrollbar">
          {data.map((range, index) => {
            const label = range.rangeLabel || range.timeRange?.label || `Period ${index + 1}`
            console.log('Range label:', label, 'for range:', range)
            return (
              <button
                key={index}
                onClick={() => setSelectedRange(index)}
                className={`flex-1 min-w-[120px] px-6 py-4 font-medium transition-all ${
                  selectedRange === index
                    ? 'bg-brand-orange text-white border-b-4 border-brand-orange-dark'
                    : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-600'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Total Streams Header */}
      <div className="p-8 bg-gradient-to-br from-brand-orange/5 to-brand-orange/10 dark:from-brand-orange/10 dark:to-brand-orange/20 border-b-2 border-gray-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">Total Streams</p>
            <p className="text-5xl font-bold text-brand-orange">
              {currentData.totalStreams
                ? formatStreamCount(currentData.totalStreams)
                : '0'}
            </p>
            {currentData.atdStreams && (
              <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2">
                All-Time: {formatStreamCount(currentData.atdStreams)}
              </p>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-3 bg-white dark:bg-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600 rounded-xl border-2 border-gray-200 dark:border-neutral-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
            </button>
          )}
        </div>
      </div>

      {/* Songs List */}
      <div className="divide-y divide-gray-100 dark:divide-neutral-700">
        {currentData.topSongs.length === 0 ? (
          <div className="p-12 text-center">
            <Music className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-neutral-400">No songs found for this period</p>
          </div>
        ) : (
          currentData.topSongs.map((song, index) => (
            <div
              key={song.songId || index}
              className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors group"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-10">
                <span className="text-2xl font-bold text-gray-400 dark:text-neutral-500">
                  {song.rank || index + 1}
                </span>
              </div>

              {/* Album Artwork */}
              <SongArtwork artist={song.artist} track={song.title} size="medium" />

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                  {song.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-neutral-400 truncate">{song.artist}</p>
              </div>

              {/* Streams */}
              <div className="flex-shrink-0 text-right">
                <p className="text-xl font-bold text-brand-orange">
                  {formatStreamCount(song.streams)}
                </p>
                {song.percentageOfTotal && (
                  <p className="text-sm text-gray-500 dark:text-neutral-400">
                    {song.percentageOfTotal.toFixed(1)}%
                  </p>
                )}
              </div>

              {/* Trend Icon */}
              <div className="flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>

              {/* Lightbulb Button - Only show if callback provided */}
              {onRequestInsights && (
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleLightbulbClick({
                      title: song.title,
                      artist: song.artist,
                      isrc: song.isrc,
                      streams: song.streams
                    })}
                    className="p-2 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Get promotional ideas for this song"
                  >
                    <Lightbulb className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedSong && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Get Promotional Ideas?</h3>
            </div>

            <p className="text-gray-600 dark:text-neutral-300 mb-2">
              Would you like AI-powered promotional ideas for:
            </p>

            <div className="bg-gray-50 dark:bg-neutral-700 rounded-xl p-4 mb-6 border-2 border-gray-200 dark:border-neutral-600">
              <div className="flex items-center gap-3">
                <SongArtwork artist={selectedSong.artist} track={selectedSong.title} size="large" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">{selectedSong.title}</p>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">{selectedSong.artist}</p>
                  <p className="text-sm text-brand-orange font-medium mt-1">
                    {formatStreamCount(selectedSong.streams)} streams
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">
              This will analyze current trends and generate personalized promotional strategies for this specific song.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleCancelInsights}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-200 font-medium rounded-xl transition-colors"
              >
                No, Cancel
              </button>
              <button
                onClick={handleConfirmInsights}
                className="flex-1 px-4 py-3 bg-brand-orange hover:bg-brand-orange-dark text-white font-medium rounded-xl transition-colors"
              >
                Yes, Generate Ideas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
