/**
 * Waveform Visualization Component
 * Interactive waveform display with progress overlay and timestamp markers
 * Ported from iOS SoundCloudStyleMusicPlayer
 */

'use client'

import { useMemo } from 'react'
import type { TimestampComment, WallPostLike } from '@/lib/types/database'
import { WaveformService } from '@/lib/services/waveformService'

interface WaveformVisualizationProps {
  samples: number[]
  duration: number
  currentTime: number
  onSeek: (timestamp: number) => void
  comments?: TimestampComment[]
  likes?: WallPostLike[]
  className?: string
}

export function WaveformVisualization({
  samples,
  duration,
  currentTime,
  onSeek,
  comments = [],
  likes = [],
  className = ''
}: WaveformVisualizationProps) {
  const progress = duration > 0 ? currentTime / duration : 0

  // Calculate positions for comments and likes
  const commentMarkers = useMemo(() => {
    return comments.map(comment => ({
      id: comment.id,
      position: WaveformService.timestampToPosition(comment.timestamp, duration),
      userName: comment.user_name,
      userAvatar: comment.user_avatar,
      text: comment.text
    }))
  }, [comments, duration])

  const likeMarkers = useMemo(() => {
    return likes
      .filter(like => like.timestamp_in_audio !== null)
      .map(like => ({
        id: like.id,
        position: WaveformService.timestampToPosition(like.timestamp_in_audio!, duration),
        userName: like.user_name
      }))
  }, [likes, duration])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const position = x / rect.width
    const timestamp = WaveformService.positionToTimestamp(position, duration)
    onSeek(timestamp)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Waveform bars */}
      <div
        className="relative h-24 flex items-center gap-0.5 cursor-pointer select-none"
        onClick={handleClick}
      >
        {/* Background waveform (unplayed) */}
        {samples.map((amplitude, index) => {
          const height = Math.max(4, amplitude * 100) // Min 4% height
          const isPlayed = index / samples.length <= progress

          return (
            <div
              key={index}
              className="flex-1 flex items-center justify-center transition-colors duration-100"
            >
              <div
                className={`w-full rounded-full transition-all duration-100 ${
                  isPlayed
                    ? 'bg-brand-orange'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          )
        })}

        {/* Scrubber handle (current position indicator) */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
          style={{ left: `${progress * 100}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
        </div>

        {/* Comment markers */}
        {commentMarkers.map((marker) => (
          <div
            key={marker.id}
            className="absolute top-0 bottom-0 flex items-center pointer-events-none"
            style={{ left: `${marker.position * 100}%` }}
          >
            <div className="relative group">
              {/* Avatar marker */}
              {marker.userAvatar ? (
                <img
                  src={marker.userAvatar}
                  alt={marker.userName}
                  className="w-6 h-6 rounded-full border-2 border-blue-500 shadow-lg"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-[10px] text-white font-semibold">
                  {marker.userName[0]}
                </div>
              )}

              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-auto z-10">
                <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-xs">
                  <div className="font-semibold">{marker.userName}</div>
                  <div className="text-gray-300">{marker.text}</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Like markers */}
        {likeMarkers.map((marker) => (
          <div
            key={marker.id}
            className="absolute bottom-0 flex items-end pointer-events-none"
            style={{ left: `${marker.position * 100}%` }}
          >
            <div className="relative group">
              {/* Heart icon */}
              <div className="w-4 h-4 text-brand-orange drop-shadow-lg">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-full h-full"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>

              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-auto z-10">
                <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {marker.userName} liked this
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{WaveformService.formatTime(currentTime)}</span>
        <span>{WaveformService.formatTime(duration)}</span>
      </div>
    </div>
  )
}
