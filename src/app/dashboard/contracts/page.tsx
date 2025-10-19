'use client'

import { useState, lazy, Suspense } from 'react'
import { BookOpen, AlertCircle, RefreshCw } from 'lucide-react'
import { RailwayService } from '@/lib/services/railwayService'
import type { ContractAnalysisResults as AnalysisResults } from '@/lib/types/contracts'
import { parseRobustJSON, validateContractText } from '@/lib/utils/jsonParser'

// Lazy load heavy components
const ContractUploader = lazy(() => import('@/components/contracts/ContractUploader').then(mod => ({ default: mod.ContractUploader })))
const GlossaryDrawer = lazy(() => import('@/components/contracts/GlossaryDrawer').then(mod => ({ default: mod.GlossaryDrawer })))
const ContractAnalysisResults = lazy(() => import('@/components/contracts/ContractAnalysisResults').then(mod => ({ default: mod.ContractAnalysisResults })))

const TOKEN_COST = 3000 // Cost per analysis

export default function ContractsPage() {
  const [contractText, setContractText] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [fileName, setFileName] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(
    null
  )
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false)

  const MAX_RETRIES = 3

  const handleContractLoaded = (text: string, name: string) => {
    console.log('📥 Contract loaded in page component:', {
      fileName: name,
      textLength: text.length,
      firstChars: text.substring(0, 100)
    })

    setContractText(text)
    setFileName(name)
    setPastedText('')
    setError(null)
    setRetryCount(0)

    console.log('✅ State updated with contract text')
  }

  const handleAnalyze = async (text: string, currentRetry = 0) => {
    // Reset retry count on fresh attempts
    if (currentRetry === 0) {
      setRetryCount(0)
    }

    // Validate contract text before sending
    const validation = validateContractText(text)
    if (!validation.valid) {
      setError(validation.error || 'Invalid contract text')
      setIsAnalyzing(false)
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await RailwayService.analyzeContract({
        text,
      })

      // Parse the JSON response with robust fallback strategies
      console.log('📝 Parsing analysis response...')
      const parseResult = parseRobustJSON<AnalysisResults>(response.analysis)

      if (!parseResult.success || !parseResult.data) {
        throw new Error(
          parseResult.error || 'Failed to parse analysis results. Please try again.'
        )
      }

      console.log(`✅ Successfully parsed results (attempt ${parseResult.attempt}/5)`)
      setAnalysisResults(parseResult.data)
      setRetryCount(0)
      setIsAnalyzing(false)
    } catch (err) {
      console.error('Contract analysis error:', err)

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to analyze contract'

      const nextRetry = currentRetry + 1

      // Check if we should retry
      if (nextRetry < MAX_RETRIES) {
        setRetryCount(nextRetry)
        setError(
          `${errorMessage}. Retrying... (Attempt ${nextRetry + 1}/${MAX_RETRIES})`
        )

        // Retry after a short delay with exponential backoff
        const delay = 2000 * nextRetry
        setTimeout(() => {
          handleAnalyze(text, nextRetry)
        }, delay)
      } else {
        setError(
          `${errorMessage}. Maximum retry attempts reached. Please try again.`
        )
        setIsAnalyzing(false)
      }

      return
    }
  }

  const handleAnalyzeUploadedContract = () => {
    if (contractText) {
      handleAnalyze(contractText)
    }
  }

  const handleAnalyzePastedText = () => {
    const trimmed = pastedText.trim()

    // Validate using comprehensive validation
    const validation = validateContractText(trimmed)
    if (!validation.valid) {
      setError(validation.error || 'Invalid contract text')
      return
    }

    setContractText(trimmed)
    setFileName('Pasted Contract')
    handleAnalyze(trimmed)
  }

  const handleRetry = () => {
    setRetryCount(0)
    setError(null)
    handleAnalyze(contractText)
  }

  const handleReset = () => {
    setContractText('')
    setPastedText('')
    setFileName('')
    setError(null)
    setAnalysisResults(null)
    setRetryCount(0)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-800">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Contract Analyzer
              </h1>
              <p className="text-white mt-2">
                Understand your contracts, and know how to protect yourself.
              </p>
            </div>
            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <BookOpen className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
              <span className="text-gray-700 dark:text-neutral-300 font-medium">Glossary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {!isAnalyzing && !analysisResults && (
          <div className="space-y-8">
            {/* Upload Section */}
            <div>
              {!contractText && (
                <Suspense fallback={<div className="animate-pulse bg-gray-100 dark:bg-neutral-700 h-64 rounded-xl" />}>
                  <ContractUploader
                    onContractLoaded={handleContractLoaded}
                    tokenCost={TOKEN_COST}
                    disabled={isAnalyzing}
                  />
                </Suspense>
              )}

              {contractText && !isAnalyzing && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-neutral-800 border border-neutral-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-white">{fileName}</p>
                      <p className="text-sm text-white">
                        {contractText.length.toLocaleString()} characters
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleAnalyzeUploadedContract}
                        className="px-6 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark transition-colors font-medium shadow-sm"
                      >
                        Analyze Contract
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-neutral-900 text-white font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Paste Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Paste Contract Text
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your contract text here..."
                  rows={10}
                  className="w-full px-4 py-3 border border-neutral-600 bg-neutral-800 text-white placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange resize-none font-mono text-sm"
                  disabled={isAnalyzing || !!contractText}
                />
                <p className="text-xs text-white mt-2">
                  Minimum 100 characters • -{TOKEN_COST} tokens
                </p>
              </div>

              <button
                onClick={handleAnalyzePastedText}
                disabled={
                  isAnalyzing || !!contractText || pastedText.trim().length < 100
                }
                className="w-full px-6 py-3 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze Pasted Contract
              </button>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-orange border-t-transparent mx-auto mb-6" />
            <p className="text-xl font-medium text-white mb-2">
              Analyzing Contract...
            </p>
            <p className="text-white mb-4">
              This may take up to 2 minutes for large contracts
            </p>
            {retryCount > 0 && (
              <p className="text-sm text-white">
                Retry attempt {retryCount + 1} of {MAX_RETRIES}
              </p>
            )}
          </div>
        )}

        {/* Error State */}
        {error && !isAnalyzing && (
          <div className="space-y-4">
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-white mb-1">
                    Analysis Failed
                  </p>
                  <p className="text-sm text-white">{error}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {retryCount >= MAX_RETRIES - 1 && (
                <button
                  onClick={handleRetry}
                  className="flex-1 px-6 py-3 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Try Again</span>
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results Modal */}
      {analysisResults && (
        <Suspense fallback={null}>
          <ContractAnalysisResults
            results={analysisResults}
            contractText={contractText}
            onClose={handleReset}
          />
        </Suspense>
      )}

      {/* Glossary Drawer */}
      <Suspense fallback={null}>
        <GlossaryDrawer
          isOpen={isGlossaryOpen}
          onClose={() => setIsGlossaryOpen(false)}
        />
      </Suspense>
    </div>
  )
}
