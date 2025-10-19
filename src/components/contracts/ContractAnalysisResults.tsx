'use client'

import { useState } from 'react'
import {
  FileText,
  BarChart3,
  AlertTriangle,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
} from 'lucide-react'
import type {
  ContractAnalysisResults,
  ComponentRating,
  ConcernArea,
} from '@/lib/types/contracts'
import { CONTRACT_TYPE_DESCRIPTIONS } from '@/lib/types/contracts'
import { cn } from '@/lib/utils'

interface ContractAnalysisResultsProps {
  results: ContractAnalysisResults
  contractText: string
  onClose: () => void
}

type TabType = 'summary' | 'ratings' | 'warnings' | 'qa'

export function ContractAnalysisResults({
  results,
  contractText,
  onClose,
}: ContractAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary')

  // Debug: Log results to see what we're getting
  console.log('📊 Contract Analysis Results:', {
    contractType: results.contractType,
    overallFairness: results.overallFairness,
    concernAreasCount: results.concernAreas?.length || 0,
    concernAreas: results.concernAreas,
    componentRatingsCount: results.componentRatings?.length || 0,
    keyTermsCount: results.keyTerms?.length || 0
  })

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'summary', label: 'Summary', icon: <FileText className="w-4 h-4" /> },
    { id: 'ratings', label: 'Ratings', icon: <BarChart3 className="w-4 h-4" /> },
    {
      id: 'warnings',
      label: 'Warnings',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    { id: 'qa', label: 'Q&A', icon: <MessageCircle className="w-4 h-4" /> },
  ]

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="inline-block px-3 py-1 bg-brand-orange text-white text-sm font-medium rounded-full">
                {results.contractType}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {CONTRACT_TYPE_DESCRIPTIONS[results.contractType]}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  // Download analysis results as JSON
                  const dataStr = JSON.stringify(results, null, 2)
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `contract-analysis-${Date.now()}.json`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 border-b border-gray-200 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-brand-orange text-brand-orange'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'summary' && <SummaryTab results={results} />}
          {activeTab === 'ratings' && <RatingsTab results={results} />}
          {activeTab === 'warnings' && <WarningsTab results={results} />}
          {activeTab === 'qa' && (
            <QATab contractText={contractText} results={results} />
          )}
        </div>
      </div>
    </div>
  )
}

// Summary Tab
function SummaryTab({ results }: { results: ContractAnalysisResults }) {
  const fairnessPercent = Math.round(results.overallFairness * 100)
  const fairnessColor =
    fairnessPercent >= 75
      ? 'text-green-600'
      : fairnessPercent >= 50
        ? 'text-yellow-600'
        : 'text-red-600'

  return (
    <div className="space-y-6">
      {/* Overall Fairness */}
      <div className="bg-gradient-to-br from-brand-orange to-brand-orange-dark text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Overall Fairness</p>
            <p className="text-4xl font-bold">{fairnessPercent}%</p>
          </div>
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {fairnessPercent >= 75 ? (
              <TrendingUp className="w-10 h-10" />
            ) : fairnessPercent >= 50 ? (
              <Minus className="w-10 h-10" />
            ) : (
              <TrendingDown className="w-10 h-10" />
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="prose max-w-none">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {results.summary}
        </p>
      </div>

      {/* Key Terms */}
      {results.keyTerms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Key Terms
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {results.keyTerms.map((term, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {term.name}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {term.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Ratings Tab
function RatingsTab({ results }: { results: ContractAnalysisResults }) {
  return (
    <div className="space-y-4">
      {results.componentRatings.map((rating, index) => (
        <ComponentRatingCard key={index} rating={rating} />
      ))}
    </div>
  )
}

function ComponentRatingCard({ rating }: { rating: ComponentRating }) {
  const ratingPercent = Math.round(rating.rating * 100)
  const ratingColor =
    ratingPercent >= 75
      ? 'bg-green-500'
      : ratingPercent >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500'

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:border-brand-orange transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{rating.name}</h4>
          <p className="text-sm text-gray-600">{rating.details}</p>
          {rating.industryComparison && (
            <p className="text-xs text-gray-500 mt-2 italic">
              {rating.industryComparison}
            </p>
          )}
        </div>
        <div className="ml-4 flex flex-col items-end">
          <span className="text-2xl font-bold text-gray-900">
            {ratingPercent}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all', ratingColor)}
          style={{ width: `${ratingPercent}%` }}
        />
      </div>
    </div>
  )
}

// Warnings Tab
function WarningsTab({ results }: { results: ContractAnalysisResults }) {
  const highSeverity = results.concernAreas.filter((c) => c.severityLevel === 'High')
  const mediumSeverity = results.concernAreas.filter(
    (c) => c.severityLevel === 'Medium'
  )
  const lowSeverity = results.concernAreas.filter((c) => c.severityLevel === 'Low')

  return (
    <div className="space-y-6">
      {highSeverity.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            High Priority ({highSeverity.length})
          </h3>
          <div className="space-y-3">
            {highSeverity.map((concern, index) => (
              <ConcernCard key={index} concern={concern} />
            ))}
          </div>
        </div>
      )}

      {mediumSeverity.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Medium Priority ({mediumSeverity.length})
          </h3>
          <div className="space-y-3">
            {mediumSeverity.map((concern, index) => (
              <ConcernCard key={index} concern={concern} />
            ))}
          </div>
        </div>
      )}

      {lowSeverity.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Low Priority ({lowSeverity.length})
          </h3>
          <div className="space-y-3">
            {lowSeverity.map((concern, index) => (
              <ConcernCard key={index} concern={concern} />
            ))}
          </div>
        </div>
      )}

      {results.concernAreas.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-lg font-medium text-gray-900">No Major Concerns</p>
          <p className="text-sm text-gray-500 mt-1">
            This contract appears to be fairly balanced
          </p>
        </div>
      )}
    </div>
  )
}

function ConcernCard({ concern }: { concern: ConcernArea }) {
  const severityColors = {
    High: 'border-red-200 bg-red-50',
    Medium: 'border-yellow-200 bg-yellow-50',
    Low: 'border-blue-200 bg-blue-50',
  }

  return (
    <div className={cn('border rounded-lg p-4', severityColors[concern.severityLevel])}>
      <h4 className="font-semibold text-gray-900 mb-2">{concern.title}</h4>
      <p className="text-sm text-gray-700 mb-3">{concern.description}</p>

      {concern.clauseText && (
        <div className="bg-white bg-opacity-60 rounded p-3 mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1">
            Relevant Clause:
          </p>
          <p className="text-xs text-gray-700 italic">{concern.clauseText}</p>
        </div>
      )}

      {concern.suggestion && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <p className="text-xs font-medium text-gray-700 mb-1">Suggestion:</p>
          <p className="text-sm text-gray-600">{concern.suggestion}</p>
        </div>
      )}
    </div>
  )
}

// Q&A Tab
function QATab({
  contractText,
  results,
}: {
  contractText: string
  results: ContractAnalysisResults
}) {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Example questions based on contract type
  const exampleQuestions = [
    "What are the most important terms I should negotiate?",
    "Can I terminate this contract early? What are the consequences?",
    "What are my revenue splits and payment terms?",
    "Are there any hidden fees or unexpected costs?",
    "What rights am I giving up by signing this contract?"
  ]

  const handleAskQuestion = async (questionToAsk?: string) => {
    const finalQuestion = questionToAsk || question
    if (!finalQuestion.trim()) return

    if (questionToAsk) {
      setQuestion(questionToAsk)
    }

    setIsLoading(true)
    setError(null)
    setAnswer(null)

    try {
      const { RailwayService } = await import('@/lib/services/railwayService')

      const response = await RailwayService.askContractQuestion({
        question: finalQuestion,
        contractText: contractText.substring(0, 50000), // Limit size
        analysisResults: JSON.stringify(results).substring(0, 10000),
      })

      setAnswer(response.answer)
    } catch (err) {
      console.error('Error asking question:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to get answer. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleExplainLikeImFive = async () => {
    const eli5Question = "Explain this entire contract to me like I'm 5 years old. What are the most important things I need to know in simple terms?"
    await handleAskQuestion(eli5Question)
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Ask questions about this contract and get automated answers based on
          the full text and analysis.
        </p>
      </div>

      {/* Explain Like I'm 5 Button */}
      <button
        onClick={handleExplainLikeImFive}
        disabled={isLoading}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-sm"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            <span>Analyzing...</span>
          </>
        ) : (
          <span>🎈 Explain Like I'm 5</span>
        )}
      </button>

      {/* Example Questions */}
      {!answer && !isLoading && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Example questions:</p>
          <div className="grid gap-2">
            {exampleQuestions.map((exampleQ, index) => (
              <button
                key={index}
                onClick={() => handleAskQuestion(exampleQ)}
                className="text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
              >
                {exampleQ}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) {
              handleAskQuestion()
            }
          }}
          placeholder="Or type your own question..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] resize-none"
        />
        <button
          onClick={() => handleAskQuestion()}
          disabled={isLoading || !question.trim()}
          className="w-full px-6 py-3 bg-[#FF6B00] text-white rounded-lg hover:bg-[#E55E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5" />
              <span>Ask Question</span>
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Tip: Press Cmd+Enter to submit
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {answer && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-brand-orange-light rounded-lg flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-brand-orange" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 mb-2">Answer:</p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
