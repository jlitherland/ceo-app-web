'use client'

/**
 * Streaming Sculpture Page
 * Minimal visualization of streaming data
 */

import { useEffect, useState } from 'react'
import { StreamingSculpture } from '@/components/sculpture/StreamingSculpture'
import {
  loadSculptureData,
  subscribeSculptureData,
  type SongData,
} from '@/lib/store/sculptureStore'

interface Song {
  title: string
  artist: string
  streams: number
  velocity: number
  geographic?: {
    country: string
    percentage: number
  }[]
}

export default function SculpturePage() {
  const [songs, setSongs] = useState<Song[]>([])

  // Load initial data and subscribe to updates
  useEffect(() => {
    // Load initial data
    const data = loadSculptureData()
    if (data && data.songs) {
      setSongs(data.songs)
    }

    // Subscribe to real-time updates from analytics tab
    const unsubscribe = subscribeSculptureData((data) => {
      if (data && data.songs) {
        console.log('🎨 Sculpture received new data:', data.songs.length, 'songs')
        setSongs(data.songs)
      }
    })

    return unsubscribe
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 flex flex-col items-center justify-center">
      {songs.length === 0 ? (
        <h1 className="text-2xl font-light text-gray-400 dark:text-neutral-600">
          sculpture made in your likeness
        </h1>
      ) : (
        <div className="w-full flex flex-col items-center justify-center">
          <h1 className="text-2xl font-light text-gray-400 dark:text-neutral-600 mb-8">
            sculpture made in your likeness
          </h1>
          <StreamingSculpture
            songs={songs}
            speed={1}
            width={140}
            height={70}
          />
        </div>
      )}
    </div>
  )
}
