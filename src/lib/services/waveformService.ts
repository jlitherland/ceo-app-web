/**
 * Waveform Generation Service
 * Generates waveform visualization data from audio files using Web Audio API
 * Ported from iOS SoundCloudStyleMusicPlayer
 */

export interface WaveformData {
  samples: number[] // Array of 100 amplitude values (0-1)
  duration: number  // Total duration in seconds
}

export class WaveformService {
  private audioContext: AudioContext | null = null
  private cache = new Map<string, WaveformData>()

  /**
   * Get or create AudioContext (lazy initialization)
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  /**
   * Generate waveform data from audio URL
   * Returns 100 amplitude samples for visualization
   */
  async generateWaveform(audioUrl: string): Promise<WaveformData> {
    // Check cache first
    if (this.cache.has(audioUrl)) {
      return this.cache.get(audioUrl)!
    }

    try {
      // Fetch audio file
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()

      // Decode audio data
      const audioContext = this.getAudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Generate waveform samples
      const waveformData = this.extractWaveformData(audioBuffer)

      // Cache the result
      this.cache.set(audioUrl, waveformData)

      return waveformData
    } catch (error) {
      console.error('Error generating waveform:', error)
      // Return fallback waveform on error
      return this.generateFallbackWaveform()
    }
  }

  /**
   * Extract waveform data from audio buffer
   * Generates 100 amplitude samples
   */
  private extractWaveformData(audioBuffer: AudioBuffer): WaveformData {
    const rawData = audioBuffer.getChannelData(0) // Get first channel
    const samples = 100 // Number of bars in waveform
    const blockSize = Math.floor(rawData.length / samples)
    const amplitudes: number[] = []

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize
      let sum = 0

      // Calculate RMS (Root Mean Square) for this block
      for (let j = 0; j < blockSize; j++) {
        sum += rawData[start + j] ** 2
      }

      const rms = Math.sqrt(sum / blockSize)
      amplitudes.push(rms)
    }

    // Normalize amplitudes to 0-1 range
    const max = Math.max(...amplitudes)
    const normalized = amplitudes.map(amp => (max > 0 ? amp / max : 0))

    return {
      samples: normalized,
      duration: audioBuffer.duration
    }
  }

  /**
   * Generate fallback waveform (random-ish pattern)
   * Used when audio file cannot be loaded
   */
  private generateFallbackWaveform(): WaveformData {
    const samples: number[] = []

    for (let i = 0; i < 100; i++) {
      // Create a pseudo-random but visually pleasing pattern
      const base = Math.sin(i / 10) * 0.5 + 0.5
      const noise = Math.random() * 0.3
      samples.push(Math.min(1, base + noise))
    }

    return {
      samples,
      duration: 180 // Default 3 minutes
    }
  }

  /**
   * Clear cache to free memory
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Format time in seconds to MM:SS
   */
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Calculate timestamp position on waveform (0-1)
   */
  static timestampToPosition(timestamp: number, duration: number): number {
    return duration > 0 ? timestamp / duration : 0
  }

  /**
   * Calculate timestamp from position on waveform (0-1)
   */
  static positionToTimestamp(position: number, duration: number): number {
    return position * duration
  }
}

// Singleton instance
export const waveformService = new WaveformService()
