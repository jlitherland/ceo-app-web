/**
 * Version Selector Modal
 * Shows all versions of a track in a stacked/list view
 * Allows switching between versions
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Check, Play, Upload } from 'lucide-react'
import type { TrackVersion } from '@/lib/types/database'
import { versionService } from '@/lib/services/versionService'
import { WaveformService } from '@/lib/services/waveformService'

interface VersionSelectorModalProps {
  postId: string
  currentVersionId?: string | null
  onClose: () => void
  onVersionSelect: (version: TrackVersion) => void
  onUploadNew?: () => void
  currentUserId?: string
}

export function VersionSelectorModal({
  postId,
  currentVersionId,
  onClose,
  onVersionSelect,
  onUploadNew,
  currentUserId
}: VersionSelectorModalProps) {
  const [versions, setVersions] = useState<TrackVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewingVersion, setPreviewingVersion] = useState<string | null>(null)

  useEffect(() => {
    loadVersions()

    // Subscribe to real-time updates
    const unsubscribe = versionService.subscribeToVersions(postId, setVersions)
    return unsubscribe
  }, [postId])

  async function loadVersions() {
    setIsLoading(true)
    const data = await versionService.getVersions(postId)
    setVersions(data)
    setIsLoading(false)
  }

  const handleVersionClick = (version: TrackVersion) => {
    onVersionSelect(version)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#2a2a2a] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Track Versions</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No versions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => {
                const isActive = version.id === currentVersionId
                const isCurrentUser = currentUserId === version.created_by

                return (
                  <div
                    key={version.id}
                    className={`relative p-4 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-orange/10 border-brand-orange'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    onClick={() => handleVersionClick(version)}
                  >
                    {/* Version Number Badge */}
                    <div className="absolute top-2 left-2">
                      <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        isActive
                          ? 'bg-brand-orange text-white'
                          : 'bg-white/10 text-gray-400'
                      }`}>
                        v{version.version_number}
                      </div>
                    </div>

                    {/* Active Check Mark */}
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-brand-orange rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Version Info */}
                    <div className="mt-6">
                      <h3 className="text-white font-medium text-sm mb-1">
                        {version.title}
                      </h3>
                      <p className="text-gray-400 text-xs">
                        {new Date(version.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                      {version.file_name && (
                        <p className="text-gray-500 text-xs mt-1 truncate">
                          {version.file_name}
                        </p>
                      )}

                      {/* Metadata */}
                      {version.metadata && Object.keys(version.metadata).length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {version.metadata.bpm && (
                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                              {version.metadata.bpm} BPM
                            </span>
                          )}
                          {version.metadata.key && (
                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                              Key: {version.metadata.key}
                            </span>
                          )}
                          {version.metadata.duration && (
                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                              {WaveformService.formatTime(version.metadata.duration)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Preview Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewingVersion(version.id === previewingVersion ? null : version.id)
                      }}
                      className="absolute bottom-2 right-2 p-2 text-gray-400 hover:text-brand-orange transition-colors"
                      title="Preview"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with Upload Button */}
        {onUploadNew && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => {
                onUploadNew()
                onClose()
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload New Version
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
