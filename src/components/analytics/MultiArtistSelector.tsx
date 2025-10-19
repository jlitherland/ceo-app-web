/**
 * Multi-Artist Selector Component
 * Allows users to select multiple artist profiles to aggregate data
 */

'use client'

import { useState, useEffect } from 'react'
import { Check, X, Info } from 'lucide-react'
import type { SelectableArtistProfile } from '@/lib/types/artistMapping'

interface MultiArtistSelectorProps {
  artistName: string
  artistProfiles: Array<{ id: string; name: string }>
  onConfirm: (selectedIds: string[]) => void
  onCancel: () => void
  savedSelection?: string[]
}

export function MultiArtistSelector({
  artistName,
  artistProfiles,
  onConfirm,
  onCancel,
  savedSelection,
}: MultiArtistSelectorProps) {
  const [profiles, setProfiles] = useState<SelectableArtistProfile[]>([])
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    // Initialize profiles with saved selection or select all by default
    const initialProfiles = artistProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      selected: savedSelection
        ? savedSelection.includes(profile.id)
        : true, // Default to all selected
    }))
    setProfiles(initialProfiles)
  }, [artistProfiles, savedSelection])

  const toggleProfile = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    )
    setShowError(false) // Clear error when user makes selection
  }

  const handleConfirm = () => {
    const selectedIds = profiles.filter((p) => p.selected).map((p) => p.id)
    if (selectedIds.length === 0) {
      setShowError(true) // Show error message
      return
    }
    onConfirm(selectedIds)
  }

  const selectedCount = profiles.filter((p) => p.selected).length

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-neutral-900 rounded-xl border-2 border-neutral-700 max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              Multiple Profiles Found
            </h3>
            <p className="text-sm text-white">
              We found {artistProfiles.length} profiles for "{artistName}". Select which
              ones to combine:
            </p>
          </div>
          <button
            onClick={onCancel}
            className="ml-4 p-1 hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 mb-4 flex items-start space-x-2">
          <Info className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white">
            Combining profiles will merge streaming data, top songs, and geographic stats.
            Your choice will be saved for future sessions.
          </p>
        </div>

        {/* Profile List */}
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => toggleProfile(profile.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                profile.selected
                  ? 'bg-brand-orange/10 border-brand-orange'
                  : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    profile.selected
                      ? 'bg-brand-orange border-brand-orange'
                      : 'border-neutral-600'
                  }`}
                >
                  {profile.selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">{profile.name}</p>
                  <p className="text-xs text-white font-mono">{profile.id}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {showError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">
              Please select at least one profile to continue.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-white">
            {selectedCount} profile{selectedCount !== 1 ? 's' : ''} selected
          </p>
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-neutral-600 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedCount > 1 ? 'Combine Data' : 'View Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
