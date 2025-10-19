/**
 * Artist Search Component
 * Search for artists in Luminate database
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, Music } from 'lucide-react'
import { searchLuminateArtists, isLuminateArtistId, isISNI } from '@/lib/services/luminateService'
import type { LuminateArtistSearchResult } from '@/lib/types/luminate'

interface ArtistSearchProps {
  onArtistSelect: (artistId: string, artistName: string) => void
}

export default function ArtistSearch({ onArtistSelect }: ArtistSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LuminateArtistSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [searchProgress, setSearchProgress] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-search as user types with debounce
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Don't search if query is too short
    if (query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      setSearchProgress('')
      return
    }

    // Check if direct ID input
    if (isLuminateArtistId(query) || isISNI(query)) {
      setSearchProgress('Direct ID detected - press Enter to load')
      return
    }

    // Debounce search by 500ms
    setSearchProgress('Typing...')
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query)
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const performSearch = async (searchQuery: string, retryCount = 0) => {
    setLoading(true)
    setError(null)
    setSearchProgress('Searching artists...')

    try {
      const searchResults = await searchLuminateArtists(searchQuery)
      setResults(searchResults)
      setShowResults(true)
      setSearchProgress(searchResults.length > 0 ? `Found ${searchResults.length} artists` : 'No results')

      // If only one result, show it but don't auto-select (let user confirm)
      if (searchResults.length === 1) {
        setSearchProgress('1 artist found - click to select')
      }
    } catch (err: any) {
      // Retry once on 500 errors (transient Railway/Luminate issues)
      if (retryCount < 1 && err?.message?.includes('500')) {
        console.log('Search failed with 500, retrying...')
        setSearchProgress('Connection issue, retrying...')
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
        return performSearch(searchQuery, retryCount + 1)
      }

      setError('Search temporarily unavailable. Please try again.')
      setSearchProgress('')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) return

    // Check if direct ID input
    if (isLuminateArtistId(query) || isISNI(query)) {
      onArtistSelect(query, query)
      return
    }

    // If already have results, use them
    if (results.length === 1) {
      const artist = results[0]
      const name = artist.artist_name || artist.artistName || artist.id
      onArtistSelect(artist.id, name)
      setShowResults(false)
      return
    }

    // Otherwise trigger search
    if (!loading) {
      performSearch(query)
    }
  }

  const handleSelectArtist = (artist: LuminateArtistSearchResult) => {
    const name = artist.artist_name || artist.artistName || artist.id
    onArtistSelect(artist.id, name)
    setShowResults(false)
    setQuery(artist.artist_name || artist.artistName || '')
  }

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-neutral-500 dark:text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Start typing artist name..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand-orange focus:outline-none transition-colors"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-orange animate-spin" />
          )}
        </div>

        {/* Search Progress Indicator */}
        {searchProgress && (
          <div className="mt-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {searchProgress}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
      </form>

      {/* Skeleton Loaders while searching */}
      {loading && query.length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-96 overflow-y-auto">
          <div className="p-2">
            <p className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-neutral-400">
              Searching...
            </p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full flex items-center gap-3 px-3 py-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-neutral-700 dark:bg-gray-600 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Dropdown */}
      {showResults && results.length > 1 && !loading && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-96 overflow-y-auto">
          <div className="p-2">
            <p className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-neutral-400">
              Select an artist ({results.length} results)
            </p>
            {results.map((artist) => (
              <button
                key={artist.id}
                onClick={() => handleSelectArtist(artist)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-neutral-700 dark:hover:bg-neutral-700 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-brand-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5 text-brand-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {artist.artist_name || artist.artistName || 'Artist Match'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-neutral-400 truncate font-mono text-xs">
                    {artist.isni || artist.id}
                  </p>
                  {!(artist.artist_name || artist.artistName) && (
                    <p className="text-xs text-brand-orange mt-0.5">
                      Click to view analytics
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single result - show immediately */}
      {showResults && results.length === 1 && !loading && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-neutral-800 border-2 border-brand-orange rounded-xl shadow-xl">
          <div className="p-2">
            <p className="px-3 py-2 text-sm font-medium text-brand-orange">
              Artist found - click to load analytics
            </p>
            {results.map((artist) => (
              <button
                key={artist.id}
                onClick={() => handleSelectArtist(artist)}
                className="w-full flex items-center gap-3 px-3 py-3 bg-brand-orange/5 hover:bg-brand-orange/10 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-brand-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5 text-brand-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {artist.artist_name || artist.artistName || 'Artist Match'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-neutral-400 truncate font-mono text-xs">
                    {artist.isni || artist.id}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl p-8 text-center">
          <Music className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-neutral-300 font-medium">No artists found</p>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            Try a different search term
          </p>
        </div>
      )}
    </div>
  )
}
