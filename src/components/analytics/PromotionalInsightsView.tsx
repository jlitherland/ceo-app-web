/**
 * Promotional Insights View (Ideas Tab)
 * promotional recommendations for promoting songs
 * Replicates iOS PromotionalInsightsView.swift
 */

'use client'

import { Lightbulb, TrendingUp, Target, Calendar, Flame, CheckCircle } from 'lucide-react'
import { formatStreamCount } from '@/lib/services/luminateService'
import type { PromotionalInsightsData } from '@/lib/types/luminate'
import SongArtwork from './SongArtwork'

interface PromotionalInsightsViewProps {
  data: PromotionalInsightsData | null
  loading?: boolean
}

export default function PromotionalInsightsView({ data, loading }: PromotionalInsightsViewProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-8">
        <div className="flex items-center justify-center space-x-3">
          <Lightbulb className="w-6 h-6 text-brand-orange animate-pulse" />
          <p className="text-gray-600 dark:text-neutral-400 font-medium">Thinking...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-12 text-center">
        <Lightbulb className="w-16 h-16 text-gray-300 dark:text-neutral-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-neutral-400 font-medium text-lg">No promotional insights available</p>
        <p className="text-gray-500 dark:text-neutral-500 mt-2">Analyze an artist to get promotional recommendations</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Market Timing Section */}
      {data.marketTiming && (
        <div className="bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 rounded-2xl border-2 border-brand-orange/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-brand-orange" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Market Timing</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {data.marketTiming.currentMeta && (
              <div className="bg-white dark:bg-neutral-700/80 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">Current Meta</p>
                <p className="text-gray-900 dark:text-white">{data.marketTiming.currentMeta}</p>
              </div>
            )}
            {data.marketTiming.opportunityWindow && (
              <div className="bg-white dark:bg-neutral-700/80 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">Opportunity Window</p>
                <p className="text-gray-900 dark:text-white">{data.marketTiming.opportunityWindow}</p>
              </div>
            )}
            {Array.isArray(data.marketTiming.seasonalFactors) && data.marketTiming.seasonalFactors.length > 0 && (
              <div className="bg-white dark:bg-neutral-700/80 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">Seasonal Factors</p>
                <ul className="space-y-1">
                  {data.marketTiming.seasonalFactors.map((factor, idx) => (
                    <li key={idx} className="text-sm text-gray-900 dark:text-white">• {factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overall Strategy */}
      {data.overallStrategy && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-brand-orange" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Overall Strategy</h3>
          </div>
          {typeof data.overallStrategy === 'string' ? (
            <p className="text-gray-700 dark:text-neutral-300 leading-relaxed">{data.overallStrategy}</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {data.overallStrategy.primaryFocus && (
                <div className="bg-white dark:bg-neutral-700/80 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">Primary Focus</p>
                  <p className="text-gray-900 dark:text-white">{data.overallStrategy.primaryFocus}</p>
                </div>
              )}
              {data.overallStrategy.timeWindow && (
                <div className="bg-white dark:bg-neutral-700/80 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">Time Window</p>
                  <p className="text-gray-900 dark:text-white">{data.overallStrategy.timeWindow}</p>
                </div>
              )}
              {data.overallStrategy.budget && (
                <div className="bg-white dark:bg-neutral-700/80 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">Budget Level</p>
                  <p className="text-gray-900 dark:text-white capitalize">{data.overallStrategy.budget}</p>
                </div>
              )}
              {data.overallStrategy.riskLevel && (
                <div className="bg-white dark:bg-neutral-700/80 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">Risk Level</p>
                  <p className="text-gray-900 dark:text-white capitalize">{data.overallStrategy.riskLevel}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actionable Steps */}
      {data.actionableSteps && Array.isArray(data.actionableSteps) && data.actionableSteps.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Action Plan</h3>
          </div>
          <ul className="space-y-3">
            {data.actionableSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 dark:bg-green-500 text-white text-sm font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="text-gray-700 dark:text-neutral-300 leading-relaxed">{step}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hot Songs */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden">
        <div className="p-6 border-b-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-red-500 dark:text-red-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Hot Songs Ready for Promotion</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-neutral-400 mt-2">
            These songs are showing strong velocity and are prime candidates for promotional campaigns
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-neutral-700">
          {!data.hotSongs || data.hotSongs.length === 0 ? (
            <div className="p-12 text-center">
              <Flame className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-neutral-400">No hot songs identified at this time</p>
            </div>
          ) : (
            data.hotSongs.map((song, index) => {
              const songTitle = song.songTitle || song.title || 'Unknown Song'

              return (
                <div key={song.songId || index} className="p-6 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                  {/* Song Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-brand-orange to-brand-orange-dark rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">#{index + 1}</span>
                    </div>

                    {song.artist && <SongArtwork artist={song.artist} track={songTitle} size="large" />}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{songTitle}</h4>
                      {song.artist && <p className="text-sm text-gray-600 dark:text-neutral-400 mb-2">{song.artist}</p>}

                      {/* Stats Row */}
                      <div className="flex flex-wrap gap-4">
                        {song.momentumScore && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {song.momentumScore}/100 momentum
                            </span>
                          </div>
                        )}
                        {song.streamingTrend && (
                          <div className="text-sm">
                            <span className={`font-medium ${
                              song.streamingTrend === 'growing' ? 'text-green-600' :
                              song.streamingTrend === 'declining' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {song.streamingTrend}
                            </span>
                          </div>
                        )}
                        {song.viralityPotential && (
                          <div className="text-sm">
                            Virality: <span className={`font-medium ${
                              song.viralityPotential === 'high' ? 'text-green-600' :
                              song.viralityPotential === 'low' ? 'text-gray-600' :
                              'text-yellow-600'
                            }`}>
                              {song.viralityPotential}
                            </span>
                          </div>
                        )}
                        {song.velocity !== undefined && (
                          <div className="text-sm text-gray-600 dark:text-neutral-400">
                            Growth: <span className="font-medium text-gray-900 dark:text-white">{(song.velocity * 100).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reason for Momentum */}
                  {song.reasonForMomentum && (
                    <div className="mb-4 pl-16">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-900 dark:text-blue-200">{song.reasonForMomentum}</p>
                      </div>
                    </div>
                  )}

                  {/* Target Audience */}
                  {song.targetAudience && (
                    <div className="mb-4 pl-16">
                      <p className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Target Audience:</p>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">{song.targetAudience}</p>
                    </div>
                  )}

                  {/* Promotional Strategy */}
                  {song.promotionalStrategy && (
                    <div className="mb-4 pl-16">
                      <p className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Promotional Strategy:</p>
                      <div className="grid md:grid-cols-3 gap-3">
                        {song.promotionalStrategy.immediate && song.promotionalStrategy.immediate.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-2">Immediate</p>
                            <ul className="space-y-1">
                              {song.promotionalStrategy.immediate.map((action, idx) => (
                                <li key={idx} className="text-xs text-red-700 dark:text-red-200">• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {song.promotionalStrategy.shortTerm && song.promotionalStrategy.shortTerm.length > 0 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Short-term</p>
                            <ul className="space-y-1">
                              {song.promotionalStrategy.shortTerm.map((action, idx) => (
                                <li key={idx} className="text-xs text-yellow-700 dark:text-yellow-200">• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {song.promotionalStrategy.longTerm && song.promotionalStrategy.longTerm.length > 0 && (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2">Long-term</p>
                            <ul className="space-y-1">
                              {song.promotionalStrategy.longTerm.map((action, idx) => (
                                <li key={idx} className="text-xs text-green-700 dark:text-green-200">• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social Media Strategy */}
                  {song.socialMediaStrategy && (
                    <div className="mb-4 pl-16">
                      <p className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Social Media Strategy:</p>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 space-y-2">
                        {song.socialMediaStrategy.platforms && song.socialMediaStrategy.platforms.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">Platforms:</p>
                            <p className="text-xs text-purple-700 dark:text-purple-200">{song.socialMediaStrategy.platforms.join(', ')}</p>
                          </div>
                        )}
                        {song.socialMediaStrategy.contentIdeas && song.socialMediaStrategy.contentIdeas.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">Content Ideas:</p>
                            <ul className="space-y-1">
                              {song.socialMediaStrategy.contentIdeas.map((idea, idx) => (
                                <li key={idx} className="text-xs text-purple-700 dark:text-purple-200">• {idea}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {song.socialMediaStrategy.hashtags && song.socialMediaStrategy.hashtags.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">Hashtags:</p>
                            <p className="text-xs text-purple-700 dark:text-purple-200">{song.socialMediaStrategy.hashtags.join(' ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* In-Person Strategy */}
                  {song.inPersonStrategy && (
                    <div className="pl-16">
                      <p className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">In-Person Strategy:</p>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 space-y-2">
                        {song.inPersonStrategy.venues && song.inPersonStrategy.venues.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1">Venues:</p>
                            <p className="text-xs text-indigo-700 dark:text-indigo-200">{song.inPersonStrategy.venues.join(', ')}</p>
                          </div>
                        )}
                        {song.inPersonStrategy.events && song.inPersonStrategy.events.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1">Events:</p>
                            <p className="text-xs text-indigo-700 dark:text-indigo-200">{song.inPersonStrategy.events.join(', ')}</p>
                          </div>
                        )}
                        {song.inPersonStrategy.partnerships && song.inPersonStrategy.partnerships.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1">Partnerships:</p>
                            <p className="text-xs text-indigo-700 dark:text-indigo-200">{song.inPersonStrategy.partnerships.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legacy: Market Timing */}
                  {song.marketTiming && (
                    <div className="mb-4 pl-16">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          {song.marketTiming}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Legacy: Recommended Actions */}
                  {Array.isArray(song.recommendedActions) && song.recommendedActions.length > 0 && (
                    <div className="pl-16">
                      <p className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Recommended Actions:</p>
                      <ul className="space-y-2">
                        {song.recommendedActions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-neutral-300">
                            <CheckCircle className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
