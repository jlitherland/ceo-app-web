/**
 * iTunes Artwork Service
 * Fetches song artwork from iTunes Search API
 * Based on iOS app's iTunesArtworkService
 */

export type ArtworkSize = 'small' | 'medium' | 'large'

interface iTunesSearchResponse {
  resultCount: number
  results: iTunesTrack[]
}

interface iTunesTrack {
  trackName?: string
  artistName?: string
  artworkUrl30?: string
  artworkUrl60?: string
  artworkUrl100?: string
}

class iTunesArtworkService {
  private static instance: iTunesArtworkService

  // Cache to store artwork URLs
  private artworkCache: Map<string, string> = new Map()

  // In-memory image cache
  private imageCache: Map<string, string> = new Map()

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): iTunesArtworkService {
    if (!iTunesArtworkService.instance) {
      iTunesArtworkService.instance = new iTunesArtworkService()
    }
    return iTunesArtworkService.instance
  }

  /**
   * Get artwork URL for a song
   */
  async getArtworkURL(
    artist: string,
    track: string,
    size: ArtworkSize = 'medium'
  ): Promise<string | null> {
    // Clean input strings
    const cleanArtist = artist.trim()
    const cleanTrack = track.trim()

    if (!cleanArtist || !cleanTrack) {
      return null
    }

    const cacheKey = `${cleanArtist}_${cleanTrack}_${size}`

    // Check cache first
    if (this.artworkCache.has(cacheKey)) {
      return this.artworkCache.get(cacheKey)!
    }

    // Fetch from iTunes API
    const artworkURL = await this.fetchArtworkFromiTunes(cleanArtist, cleanTrack, size)

    // Cache the result
    if (artworkURL) {
      this.artworkCache.set(cacheKey, artworkURL)
    }

    return artworkURL
  }

  /**
   * Convert artwork URL to higher resolution
   */
  private getHighResURL(url: string, size: ArtworkSize): string {
    const sizeMap = {
      small: '60x60',
      medium: '100x100',
      large: '600x600'
    }

    // Replace the size in the URL
    return url.replace(/\d+x\d+/, sizeMap[size])
  }

  /**
   * Fetch artwork from iTunes Search API
   */
  private async fetchArtworkFromiTunes(
    artist: string,
    track: string,
    size: ArtworkSize
  ): Promise<string | null> {
    try {
      // Encode search terms
      const searchTerm = encodeURIComponent(`${artist} ${track}`)
      const url = `https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=1`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.warn(`iTunes API request failed: ${response.status}`)
        return null
      }

      const data: iTunesSearchResponse = await response.json()

      if (data.resultCount === 0 || !data.results[0]) {
        return null
      }

      const firstResult = data.results[0]

      // Get artwork URL based on size
      let artworkUrl: string | undefined

      switch (size) {
        case 'small':
          artworkUrl = firstResult.artworkUrl60
          break
        case 'medium':
          artworkUrl = firstResult.artworkUrl100
          break
        case 'large':
          // Convert to 600x600 by replacing size
          artworkUrl = firstResult.artworkUrl100?.replace('100x100', '600x600')
          break
      }

      return artworkUrl || null
    } catch (error) {
      console.error('Error fetching artwork from iTunes:', error)
      return null
    }
  }

  /**
   * Preload artwork for multiple songs
   */
  async preloadArtwork(
    songs: Array<{ title: string; artist: string }>,
    size: ArtworkSize = 'medium'
  ): Promise<void> {
    const promises = songs.map(song =>
      this.getArtworkURL(song.artist, song.title, size)
    )

    await Promise.allSettled(promises)
  }

  /**
   * Clear the artwork cache
   */
  clearCache(): void {
    this.artworkCache.clear()
    this.imageCache.clear()
  }
}

export const iTunesArtwork = iTunesArtworkService.getInstance()
