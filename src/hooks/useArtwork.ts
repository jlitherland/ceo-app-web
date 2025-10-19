/**
 * Hook for fetching song artwork
 */

import { useState, useEffect } from 'react'
import { iTunesArtwork, type ArtworkSize } from '@/lib/services/iTunesArtworkService'

export function useArtwork(artist: string, track: string, size: ArtworkSize = 'medium') {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!artist || !track) {
      return
    }

    let cancelled = false

    const fetchArtwork = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const url = await iTunesArtwork.getArtworkURL(artist, track, size)

        if (!cancelled) {
          setArtworkUrl(url)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch artwork')
          setIsLoading(false)
        }
      }
    }

    fetchArtwork()

    return () => {
      cancelled = true
    }
  }, [artist, track, size])

  return { artworkUrl, isLoading, error }
}
