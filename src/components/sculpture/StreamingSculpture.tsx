'use client'

/**
 * Streaming Data ASCII Sculpture
 * A living visualization of your music's journey through the world
 *
 * Concept:
 * - Each song becomes a flowing stream of characters
 * - Stream count determines visual density
 * - Geographic patterns create regional textures
 * - Time creates waves and pulses
 */

import { useEffect, useRef, useState } from 'react'

interface Song {
  title: string
  artist: string
  streams: number
  velocity: number // Growth rate
  geographic?: {
    country: string
    percentage: number
  }[]
}

interface StreamingSculptureProps {
  songs: Song[]
  width?: number
  height?: number
  speed?: number
}

export function StreamingSculpture({
  songs,
  width = 120,
  height = 60,
  speed = 1
}: StreamingSculptureProps) {
  const canvasRef = useRef<HTMLPreElement>(null)
  const [time, setTime] = useState(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      setTime(t => t + deltaTime * speed)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [speed])

  const pattern = generateSculpture(songs, width, height, time)

  return (
    <pre
      ref={canvasRef}
      className="font-mono text-[8px] leading-[10px] text-brand-orange select-none overflow-hidden whitespace-pre"
      style={{
        fontFamily: 'Monaco, "Courier New", monospace',
        textRendering: 'optimizeSpeed',
      }}
    >
      {pattern}
    </pre>
  )
}

function generateSculpture(
  songs: Song[],
  width: number,
  height: number,
  time: number
): string {
  const grid: string[][] = Array(height).fill(0).map(() => Array(width).fill(' '))

  if (songs.length === 0) {
    return renderEmptyState(width, height, time)
  }

  // Sort songs by streams (most popular first)
  const sortedSongs = [...songs].sort((a, b) => b.streams - a.streams)

  // Create layers for each song
  sortedSongs.forEach((song, index) => {
    const layer = index / sortedSongs.length
    renderSongLayer(grid, song, layer, time, width, height)
  })

  // Convert grid to string
  return grid.map(row => row.join('')).join('\n')
}

function renderSongLayer(
  grid: string[][],
  song: Song,
  layer: number,
  time: number,
  width: number,
  height: number
) {
  const streamIntensity = Math.min(song.streams / 1000000, 1) // Normalize to 0-1
  const velocityFactor = 1 + (song.velocity || 0) * 0.5
  const title = song.title.toUpperCase()

  // Create flowing text streams
  const flowSpeed = 0.2 * velocityFactor
  const yOffset = Math.floor(layer * height * 0.8) // Vertical spacing
  const xFlow = (time * flowSpeed * 10) % (width + title.length)

  // Main song title as flowing text
  for (let i = 0; i < title.length; i++) {
    const x = Math.floor(xFlow - i) % width
    const y = (yOffset + Math.floor(Math.sin(time + i * 0.2) * 2)) % height

    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y][x] = title[i]
    }
  }

  // Stream count visualization (dots radiating from title)
  const dotCount = Math.floor(streamIntensity * 50)
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2 + time
    const radius = 3 + Math.sin(time + i) * 2
    const x = Math.floor(width / 2 + Math.cos(angle) * radius * (1 + layer))
    const y = Math.floor(yOffset + Math.sin(angle) * radius * 0.5)

    if (x >= 0 && x < width && y >= 0 && y < height && grid[y][x] === ' ') {
      const symbol = streamIntensity > 0.8 ? '●' : streamIntensity > 0.5 ? '◆' : streamIntensity > 0.3 ? '○' : '·'
      grid[y][x] = symbol
    }
  }

  // Velocity waves (if song is growing)
  if (song.velocity > 0) {
    for (let x = 0; x < width; x++) {
      const wave = Math.sin(x * 0.2 - time * 2) * Math.cos(layer * Math.PI + time)
      if (wave > 0.7) {
        const y = Math.floor(yOffset + wave * 3)
        if (y >= 0 && y < height && grid[y][x] === ' ') {
          grid[y][x] = '~'
        }
      }
    }
  }
}

function renderEmptyState(width: number, height: number, time: number): string {
  const grid: string[][] = Array(height).fill(0).map(() => Array(width).fill(' '))

  const message = '[ SEARCH FOR AN ARTIST TO BEGIN ]'
  const messageX = Math.floor((width - message.length) / 2)
  const messageY = Math.floor(height / 2)

  // Pulsing message
  const pulse = Math.sin(time * 2) * 0.5 + 0.5
  if (pulse > 0.3) {
    for (let i = 0; i < message.length; i++) {
      if (messageX + i < width) {
        grid[messageY][messageX + i] = message[i]
      }
    }
  }

  // Ambient particles
  for (let i = 0; i < 20; i++) {
    const x = Math.floor((Math.sin(time * 0.5 + i) * 0.5 + 0.5) * width)
    const y = Math.floor((Math.cos(time * 0.3 + i * 2) * 0.5 + 0.5) * height)
    if (x >= 0 && x < width && y >= 0 && y < height && grid[y][x] === ' ') {
      grid[y][x] = '·'
    }
  }

  return grid.map(row => row.join('')).join('\n')
}
