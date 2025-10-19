/**
 * Waveform Audio Player
 * Complete SoundCloud-style audio player with waveform visualization,
 * timestamped comments, and interactive controls
 * Ported from iOS SoundCloudStyleMusicPlayer
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, MessageCircle, Heart } from 'lucide-react'
import { WaveformVisualization } from './WaveformVisualization'
import { waveformService, type WaveformData } from '@/lib/services/waveformService'
import { timestampCommentService } from '@/lib/services/timestampCommentService'
import { versionService } from '@/lib/services/versionService'
import { VersionStackButton } from '@/components/versions/VersionStackButton'
import { VersionSelectorModal } from '@/components/versions/VersionSelectorModal'
import type { TimestampComment, WallPostLike, TrackVersion } from '@/lib/types/database'

interface WaveformAudioPlayerProps {
  postId: string
  audioUrl: string
  fileName?: string
  onLike?: (timestamp: number) => void
  likes?: WallPostLike[]
  currentUserId?: string
  versionCount?: number
  activeVersionId?: string | null
  onVersionChange?: (version: TrackVersion) => void
}

export function WaveformAudioPlayer({
  postId,
  audioUrl,
  fileName = 'Audio Track',
  onLike,
  likes = [],
  currentUserId,
  versionCount = 1,
  activeVersionId = null,
  onVersionChange
}: WaveformAudioPlayerProps) {
  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Waveform state
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null)
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(true)

  // Comments state
  const [comments, setComments] = useState<TimestampComment[]>([])

  // Version state
  const [showVersionSelector, setShowVersionSelector] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)

  // Load waveform on mount
  useEffect(() => {
    async function loadWaveform() {
      setIsLoadingWaveform(true)
      const data = await waveformService.generateWaveform(audioUrl)
      setWaveformData(data)
      setIsLoadingWaveform(false)
    }
    loadWaveform()
  }, [audioUrl])

  // Load comments
  useEffect(() => {
    async function loadComments() {
      const allComments = await timestampCommentService.getComments(postId)
      setComments(allComments)
    }
    loadComments()

    // Subscribe to real-time updates
    const unsubscribe = timestampCommentService.subscribeToComments(postId, setComments)
    return unsubscribe
  }, [postId])

  // Update current time as audio plays
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        // Load the audio first if not loaded
        if (audio.readyState < 2) {
          await new Promise((resolve, reject) => {
            audio.onloadeddata = resolve
            audio.onerror = reject
            audio.load()
          })
        }
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      console.error('Audio URL:', audioUrl)
      console.error('Audio ready state:', audio.readyState)
      setIsPlaying(false)
      // Try to provide helpful error message
      if (error instanceof Error) {
        alert(`Cannot play audio: ${error.message}. Please check that the file exists and is accessible.`)
      }
    }
  }

  const handleSeek = async (timestamp: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = timestamp
    setCurrentTime(timestamp)

    // Auto-play after seek
    if (!isPlaying) {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Error playing audio after seek:', error)
      }
    }
  }

  const handleAddComment = () => {
    setShowCommentInput(true)
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !currentUserId) return

    setIsSubmittingComment(true)
    const success = await timestampCommentService.addComment(
      postId,
      currentTime,
      commentText
    )

    if (success) {
      setCommentText('')
      setShowCommentInput(false)
    }
    setIsSubmittingComment(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    await timestampCommentService.deleteComment(commentId)
  }

  const handleLikeAtCurrentTime = () => {
    if (onLike) {
      onLike(currentTime)
    }
  }

  const recentComments = comments.slice(0, 3)
  const displayComments = showAllComments ? comments : recentComments

  return (
    <div className="bg-brand-orange/10 rounded-xl p-4 border border-brand-orange/20">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="w-12 h-12 bg-brand-orange rounded-full flex items-center justify-center hover:bg-brand-orange-dark transition-colors flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" />
          )}
        </button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{fileName}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">Audio Track</p>
            {versionCount > 1 && (
              <VersionStackButton
                versionCount={versionCount}
                onClick={() => setShowVersionSelector(true)}
                isOpen={showVersionSelector}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {currentUserId && (
            <>
              <button
                onClick={handleAddComment}
                className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                title="Add comment"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={handleLikeAtCurrentTime}
                className="p-2 text-gray-400 hover:text-brand-orange transition-colors"
                title="Like at current time"
              >
                <Heart className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Waveform */}
      {isLoadingWaveform || !waveformData ? (
        <div className="h-24 bg-white/5 rounded-lg animate-pulse flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading waveform...</p>
        </div>
      ) : (
        <WaveformVisualization
          samples={waveformData.samples}
          duration={duration || waveformData.duration}
          currentTime={currentTime}
          onSeek={handleSeek}
          comments={comments}
          likes={likes}
        />
      )}

      {/* Comment Input */}
      {showCommentInput && (
        <div className="mt-3 p-3 bg-white/5 rounded-lg">
          <div className="flex items-start gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Comment at ${waveformService.constructor.formatTime(currentTime)}...`}
              className="flex-1 bg-white/5 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange/50 placeholder-gray-600"
              disabled={isSubmittingComment}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmitComment()
                }
              }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || isSubmittingComment}
              className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isSubmittingComment ? 'Posting...' : 'Post'}
            </button>
            <button
              onClick={() => {
                setShowCommentInput(false)
                setCommentText('')
              }}
              className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="mt-3 space-y-2">
          {displayComments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => handleSeek(comment.timestamp)}
            >
              {comment.user_avatar ? (
                <img
                  src={comment.user_avatar}
                  alt={comment.user_name}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {comment.user_name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{comment.user_name}</span>
                  <span className="text-blue-400 text-xs">
                    {waveformService.constructor.formatTime(comment.timestamp)}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{comment.text}</p>
              </div>
              {currentUserId === comment.user_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteComment(comment.id)
                  }}
                  className="text-gray-500 hover:text-red-400 text-xs"
                >
                  Delete
                </button>
              )}
            </div>
          ))}

          {!showAllComments && comments.length > 3 && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-blue-400 text-sm hover:underline"
            >
              View all {comments.length} comments
            </button>
          )}

          {showAllComments && comments.length > 3 && (
            <button
              onClick={() => setShowAllComments(false)}
              className="text-blue-400 text-sm hover:underline"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* Version Selector Modal */}
      {showVersionSelector && (
        <VersionSelectorModal
          postId={postId}
          currentVersionId={activeVersionId}
          onClose={() => setShowVersionSelector(false)}
          onVersionSelect={(version) => {
            setShowVersionSelector(false)
            if (onVersionChange) {
              onVersionChange(version)
            }
          }}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}
