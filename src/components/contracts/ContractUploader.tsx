'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { extractTextFromPDF, validatePDFFile } from '@/lib/utils/pdfParser'
import { cn } from '@/lib/utils'

interface ContractUploaderProps {
  onContractLoaded: (text: string, fileName: string) => void
  tokenCost?: number
  disabled?: boolean
}

export function ContractUploader({
  onContractLoaded,
  tokenCost = 3000,
  disabled = false,
}: ContractUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    setIsProcessing(true)

    try {
      // Determine file type
      const fileType = file.type

      if (fileType === 'application/pdf') {
        console.log('📄 Processing PDF:', file.name, file.size, 'bytes')

        // Validate PDF
        const validation = validatePDFFile(file)
        if (!validation.valid) {
          console.error('❌ PDF validation failed:', validation.error)
          setError(validation.error || 'Invalid PDF file')
          setIsProcessing(false)
          return
        }
        console.log('✅ PDF validation passed')

        // Extract text from PDF
        console.log('🔍 Extracting text from PDF...')
        const result = await extractTextFromPDF(file)

        if (!result.success) {
          console.error('❌ Text extraction failed:', result.error)
          setError(result.error || 'Failed to extract text from PDF')
          setIsProcessing(false)
          return
        }

        console.log('✅ Text extracted:', result.text.length, 'characters')
        console.log('First 200 chars:', result.text.substring(0, 200))

        if (result.text.length < 100) {
          console.error('❌ Text too short:', result.text.length)
          setError('Contract text is too short (minimum 100 characters)')
          setIsProcessing(false)
          return
        }

        console.log('✅ Calling onContractLoaded with text length:', result.text.length)
        onContractLoaded(result.text, file.name)
      } else if (fileType === 'text/plain') {
        // Read text file
        const text = await file.text()

        if (text.length < 100) {
          setError('Contract text is too short (minimum 100 characters)')
          setIsProcessing(false)
          return
        }

        onContractLoaded(text, file.name)
      } else {
        setError('Please upload a PDF or text file')
        setIsProcessing(false)
        return
      }
    } catch (err) {
      console.error('Error processing file:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to process file'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled || isProcessing) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled && !isProcessing) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click()
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all',
          isDragging && !disabled && !isProcessing
            ? 'border-brand-orange bg-brand-orange-light scale-105'
            : 'border-gray-300 dark:border-neutral-600 hover:border-brand-orange hover:bg-gray-50 dark:hover:bg-neutral-700',
          (disabled || isProcessing) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileInputChange}
          disabled={disabled || isProcessing}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-orange border-t-transparent" />
              <p className="text-gray-600 dark:text-neutral-300">Processing contract...</p>
            </>
          ) : (
            <>
              <div className="p-4 bg-brand-orange-light rounded-full">
                {isDragging ? (
                  <FileText className="w-8 h-8 text-brand-orange" />
                ) : (
                  <Upload className="w-8 h-8 text-brand-orange" />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragging ? 'Drop contract here' : 'Upload Contract'}
                </p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  Click to browse or drag and drop
                </p>
                <p className="text-xs text-gray-400 dark:text-neutral-500">
                  PDF or TXT • Max 10MB
                </p>
              </div>

              {tokenCost > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 px-4 py-2 rounded-full">
                  <span className="font-medium">-{tokenCost}</span>
                  <span>tokens</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Upload Failed
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
