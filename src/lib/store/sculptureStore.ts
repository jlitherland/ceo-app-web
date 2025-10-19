/**
 * Sculpture Data Store
 * Bridges analytics data to the sculpture visualization
 * Uses localStorage and events for cross-tab communication
 */

export interface SongData {
  title: string
  artist: string
  artistId: string
  streams: number
  velocity: number
  streamsByTimeRange: Record<string, number>
  geographic?: {
    country: string
    percentage: number
  }[]
}

export interface SculptureData {
  songs: SongData[]
  lastUpdated: number
  artistName: string
  artistId: string
}

const STORAGE_KEY = 'sculpture_data'
const EVENT_NAME = 'sculpture_data_updated'

/**
 * Save sculpture data and trigger update event
 */
export function saveSculptureData(data: SculptureData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: data }))

    console.log('✅ Sculpture data saved:', data.songs.length, 'songs')
  } catch (error) {
    console.error('Failed to save sculpture data:', error)
  }
}

/**
 * Load sculpture data from storage
 */
export function loadSculptureData(): SculptureData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored) as SculptureData
    console.log('📖 Loaded sculpture data:', data.songs.length, 'songs')
    return data
  } catch (error) {
    console.error('Failed to load sculpture data:', error)
    return null
  }
}

/**
 * Subscribe to sculpture data updates
 * Returns unsubscribe function
 */
export function subscribeSculptureData(
  callback: (data: SculptureData) => void
): () => void {
  // Handle same-tab updates (custom event)
  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<SculptureData>
    callback(customEvent.detail)
  }

  // Handle cross-tab updates (storage event)
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue) as SculptureData
        callback(data)
      } catch (error) {
        console.error('Failed to parse storage event data:', error)
      }
    }
  }

  window.addEventListener(EVENT_NAME, handleCustomEvent)
  window.addEventListener('storage', handleStorageEvent)

  console.log('👂 Subscribed to sculpture data updates')

  // Return unsubscribe function
  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent)
    window.removeEventListener('storage', handleStorageEvent)
    console.log('👋 Unsubscribed from sculpture data updates')
  }
}

/**
 * Clear sculpture data
 */
export function clearSculptureData(): void {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }))
  console.log('🗑️ Cleared sculpture data')
}

/**
 * Transform top songs data to sculpture format
 */
export function transformTopSongsToSculpture(
  topSongsData: any[],
  artistName: string,
  artistId: string
): SculptureData {
  const songs: SongData[] = []

  // Extract all unique songs from time ranges
  const songMap = new Map<string, SongData>()

  topSongsData.forEach((timeRangeData) => {
    timeRangeData.songs?.forEach((song: any) => {
      const songId = song.isrc || song.title

      if (!songMap.has(songId)) {
        songMap.set(songId, {
          title: song.title || 'Unknown',
          artist: artistName,
          artistId: artistId,
          streams: song.streams || 0,
          velocity: 0,
          streamsByTimeRange: {},
        })
      }

      const songData = songMap.get(songId)!
      songData.streamsByTimeRange[timeRangeData.timeRange] = song.streams || 0

      // Update total streams
      songData.streams = Math.max(songData.streams, song.streams || 0)
    })
  })

  // Calculate velocity for each song
  songMap.forEach((song) => {
    const ranges = Object.keys(song.streamsByTimeRange).sort()
    if (ranges.length >= 2) {
      const recent = song.streamsByTimeRange[ranges[ranges.length - 1]] || 0
      const older = song.streamsByTimeRange[ranges[ranges.length - 2]] || 1
      song.velocity = (recent - older) / older
    }
  })

  // Convert to array and sort by streams
  const sortedSongs = Array.from(songMap.values())
    .sort((a, b) => b.streams - a.streams)
    .slice(0, 15) // Top 15 songs

  return {
    songs: sortedSongs,
    lastUpdated: Date.now(),
    artistName,
    artistId,
  }
}
