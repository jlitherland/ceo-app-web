/**
 * Version Stack Button
 * Displays version count and reveals stacked alternatives when clicked
 * Samply-style version indicator
 */

'use client'

import { Layers } from 'lucide-react'

interface VersionStackButtonProps {
  versionCount: number
  onClick: () => void
  isOpen?: boolean
}

export function VersionStackButton({
  versionCount,
  onClick,
  isOpen = false
}: VersionStackButtonProps) {
  if (versionCount <= 1) {
    return null // Don't show button if there's only one version
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        isOpen
          ? 'bg-brand-orange text-white'
          : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
      }`}
      title={`${versionCount} versions available`}
    >
      <Layers className="w-3.5 h-3.5" />
      <span>{versionCount} versions</span>
    </button>
  )
}
