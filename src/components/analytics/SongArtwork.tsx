/**
 * Song Artwork Component
 * Displays album artwork with loading and fallback states
 */

'use client'

import { Music } from 'lucide-react'
import { useArtwork } from '@/hooks/useArtwork'
import type { ArtworkSize } from '@/lib/services/iTunesArtworkService'

interface SongArtworkProps {
  artist: string
  track: string
  size?: ArtworkSize
  className?: string
}

export default function SongArtwork({ artist, track, size = 'medium', className = '' }: SongArtworkProps) {
  const { artworkUrl, isLoading } = useArtwork(artist, track, size)

  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }

  return (
    <div className={`${sizeClasses[size]} rounded-lg overflow-hidden flex-shrink-0 ${className}`}>
      {isLoading ? (
        // Loading state
        <div className="w-full h-full bg-brand-orange/10 flex items-center justify-center animate-pulse">
          <Music className={`${iconSizes[size]} text-brand-orange/60`} />
        </div>
      ) : artworkUrl ? (
        // Artwork loaded
        <img
          src={artworkUrl}
          alt={`${track} by ${artist}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full bg-brand-orange/10 flex items-center justify-center">
                  <svg class="${iconSizes[size]} text-brand-orange/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                  </svg>
                </div>
              `
            }
          }}
        />
      ) : (
        // Fallback placeholder
        <div className="w-full h-full bg-brand-orange/10 flex items-center justify-center">
          <Music className={`${iconSizes[size]} text-brand-orange/60`} />
        </div>
      )}
    </div>
  )
}
