/**
 * Geographic View
 * Displays streaming data by territory/location
 * Replicates iOS GeographicHeatmapView.swift
 */

'use client'

import { useState } from 'react'
import { Globe, MapPin, TrendingUp, Flame } from 'lucide-react'
import { formatStreamCount } from '@/lib/services/luminateService'
import type { GeographicHeatmapData } from '@/lib/types/luminate'

interface GeographicViewProps {
  data: GeographicHeatmapData | null
  loading?: boolean
}

export default function GeographicView({ data, loading }: GeographicViewProps) {
  const [viewMode, setViewMode] = useState<'territories' | 'markets'>('territories')

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-8">
        <div className="flex items-center justify-center space-x-3">
          <Globe className="w-6 h-6 text-brand-orange animate-spin" />
          <p className="text-gray-600 dark:text-neutral-300 font-medium">Loading geographic data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-12 text-center">
        <Globe className="w-16 h-16 text-gray-300 dark:text-neutral-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-neutral-300 font-medium text-lg">No geographic data available</p>
      </div>
    )
  }

  const displayData = viewMode === 'territories' ? (data.topTerritories || []) : (data.usMetroMarkets || [])

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Geographic Distribution</h3>
            {data.timeRange && (
              <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                Time Period: <span className="font-semibold text-brand-orange">{data.timeRange}</span>
              </p>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 bg-white dark:bg-neutral-800 rounded-lg p-1 border-2 border-gray-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode('territories')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'territories'
                  ? 'bg-brand-orange text-white'
                  : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-600'
              }`}
            >
              Territories
            </button>
            <button
              onClick={() => setViewMode('markets')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'markets'
                  ? 'bg-brand-orange text-white'
                  : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-600'
              }`}
            >
              US Markets
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border-2 border-gray-200 dark:border-neutral-700">
            <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Total Streams</p>
            <p className="text-2xl font-bold text-brand-orange">
              {formatStreamCount(data.totalStreams)}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border-2 border-gray-200 dark:border-neutral-700">
            <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Countries</p>
            <p className="text-2xl font-bold text-brand-orange">
              {data.territories?.length || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border-2 border-gray-200 dark:border-neutral-700">
            <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Active Spikes</p>
            <p className="text-2xl font-bold text-brand-orange">
              {data.territories?.filter(t => t.spikeSummary?.hasActiveSpike).length || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border-2 border-gray-200 dark:border-neutral-700">
            <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Top Market</p>
            <p className="text-lg font-bold text-brand-orange truncate">
              {data.topTerritories?.[0]?.territory?.name || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Territories/Markets List */}
      <div className="divide-y divide-gray-100 dark:divide-neutral-700 max-h-[600px] overflow-y-auto">
        {viewMode === 'territories' ? (
          data.topTerritories?.map((territory, index) => (
            <div
              key={territory.territory.code}
              className="p-5 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="flex-shrink-0 w-10">
                  <span className="text-2xl font-bold text-gray-400 dark:text-neutral-500">{index + 1}</span>
                </div>

                {/* Country Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-brand-orange" />
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                      {territory.territory.name}
                    </p>
                    {territory.spikeSummary?.hasActiveSpike && (
                      <Flame className="w-5 h-5 text-red-500" title="Active spike detected" />
                    )}
                  </div>

                  {/* Market Share Bar */}
                  {territory.marketShare && (
                    <div className="relative w-full h-2 bg-gray-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-orange to-brand-orange-dark rounded-full"
                        style={{ width: `${Math.min(territory.marketShare * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xl font-bold text-white">
                    {formatStreamCount(territory.streams)}
                  </p>
                  {territory.marketShare && (
                    <p className="text-sm text-white">
                      {(territory.marketShare * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>

              {/* Streaming Service Breakouts */}
              {territory.streamingServiceBreakouts && territory.streamingServiceBreakouts.length > 0 && (
                <div className="mt-3 pl-14 flex flex-wrap gap-2">
                  {territory.streamingServiceBreakouts.slice(0, 3).map((service, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-neutral-700 rounded-full text-xs font-medium text-gray-700 dark:text-neutral-300"
                    >
                      {service.serviceName}: {formatStreamCount(service.streams)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          // US Metro Markets View
          data.usMetroMarkets && data.usMetroMarkets.length > 0 ? (
            data.usMetroMarkets.map((market, index) => (
              <div
                key={market.marketCode}
                className="p-5 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10">
                    <span className="text-2xl font-bold text-gray-400 dark:text-neutral-500">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{market.marketName}</p>
                    {market.marketShare && (
                      <div className="mt-2 relative w-full h-2 bg-gray-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-orange to-brand-orange-dark rounded-full"
                          style={{ width: `${Math.min(market.marketShare * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xl font-bold text-white">
                      {formatStreamCount(market.streams)}
                    </p>
                    {market.marketShare && (
                      <p className="text-sm text-white">
                        {(market.marketShare * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <MapPin className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-neutral-400">No US market data available</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
