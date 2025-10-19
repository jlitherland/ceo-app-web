/**
 * PDF Parser Utility
 * Extracts text from PDF files for contract analysis
 * Uses dynamic imports to ensure client-side only execution
 */

export interface PDFParseResult {
  text: string
  pageCount: number
  success: boolean
  error?: string
  metadata?: PDFMetadata
}

export interface PDFMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creationDate?: Date
  modificationDate?: Date
}

export interface PDFParseOptions {
  maxPages?: number
  includeMetadata?: boolean
  progressCallback?: (progress: number) => void
}

/**
 * Extract text from a PDF file
 * This function must only be called in the browser
 */
export async function extractTextFromPDF(
  file: File,
  options: PDFParseOptions = {}
): Promise<PDFParseResult> {
  // Ensure we're in browser environment
  if (typeof window === 'undefined') {
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: 'PDF parsing is only available in the browser',
    }
  }

  try {
    // Dynamically import pdfjs-dist only on client side
    const pdfjsLib = await import('pdfjs-dist')

    // Configure PDF.js worker to use local file served by Next.js
    // This avoids CORS issues with CDNs
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
    const pdf = await loadingTask.promise

    const pageCount = pdf.numPages
    const maxPages = options.maxPages || pageCount
    const pagesToProcess = Math.min(maxPages, pageCount)

    let fullText = ''
    let metadata: PDFMetadata | undefined

    // Extract metadata if requested
    if (options.includeMetadata) {
      metadata = await extractMetadata(pdf)
    }

    // Extract text from each page with progress tracking
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Combine text items with proper spacing
      const pageText = textContent.items
        .map((item: any) => {
          if (item && typeof item === 'object' && 'str' in item) {
            return item.str
          }
          return ''
        })
        .join(' ')

      fullText += pageText + '\n\n'

      // Report progress
      if (options.progressCallback) {
        const progress = (pageNum / pagesToProcess) * 100
        options.progressCallback(progress)
      }
    }

    // Clean up the extracted text
    fullText = cleanExtractedText(fullText)

    return {
      text: fullText,
      pageCount,
      success: true,
      metadata,
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error)

    // More detailed error messages
    let errorMessage = 'Failed to extract text from PDF'

    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        errorMessage = 'Invalid or corrupted PDF file'
      } else if (error.message.includes('password')) {
        errorMessage = 'PDF is password protected'
      } else if (error.message.includes('permissions')) {
        errorMessage = 'PDF has restricted permissions'
      } else {
        errorMessage = error.message
      }
    }

    return {
      text: '',
      pageCount: 0,
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Extract metadata from PDF
 */
async function extractMetadata(pdf: any): Promise<PDFMetadata> {
  try {
    const metadata = await pdf.getMetadata()
    const info = metadata.info

    return {
      title: info.Title || undefined,
      author: info.Author || undefined,
      subject: info.Subject || undefined,
      keywords: info.Keywords || undefined,
      creationDate: info.CreationDate ? parseDate(info.CreationDate) : undefined,
      modificationDate: info.ModDate ? parseDate(info.ModDate) : undefined,
    }
  } catch (error) {
    console.warn('Failed to extract PDF metadata:', error)
    return {}
  }
}

/**
 * Parse PDF date string (format: D:YYYYMMDDHHmmSSOHH'mm)
 */
function parseDate(dateString: string): Date | undefined {
  try {
    // Remove D: prefix if present
    const cleaned = dateString.replace(/^D:/, '')

    // Extract components
    const year = parseInt(cleaned.substring(0, 4))
    const month = parseInt(cleaned.substring(4, 6)) - 1 // JS months are 0-indexed
    const day = parseInt(cleaned.substring(6, 8))
    const hour = parseInt(cleaned.substring(8, 10)) || 0
    const minute = parseInt(cleaned.substring(10, 12)) || 0
    const second = parseInt(cleaned.substring(12, 14)) || 0

    return new Date(year, month, day, hour, minute, second)
  } catch (error) {
    return undefined
  }
}

/**
 * Clean extracted text from PDF - ENHANCED
 */
function cleanExtractedText(text: string): string {
  let cleaned = text

  // Remove excessive whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ')

  // Normalize line breaks (max 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  // Remove page headers/footers patterns (more comprehensive)
  cleaned = cleaned.replace(/^Page \d+ of \d+$/gm, '') // "Page X of Y"
  cleaned = cleaned.replace(/^Page \d+$/gm, '') // "Page X"
  cleaned = cleaned.replace(/^\d+ \| Page$/gm, '') // "X | Page"
  cleaned = cleaned.replace(/^- \d+ -$/gm, '') // "- X -"
  cleaned = cleaned.replace(/^\[\d+\]$/gm, '') // "[X]"
  cleaned = cleaned.replace(/^\d+$/gm, '') // Standalone numbers

  // Fix hyphenated words broken across lines
  cleaned = cleaned.replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')

  // Trim whitespace from each line
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .join('\n')

  // Normalize smart quotes and dashes (common in PDFs)
  cleaned = cleaned.replace(/[\u201C\u201D]/g, '"') // Smart double quotes
  cleaned = cleaned.replace(/[\u2018\u2019]/g, "'") // Smart single quotes
  cleaned = cleaned.replace(/[\u2013\u2014]/g, '-') // En dash, em dash
  cleaned = cleaned.replace(/\u2026/g, '...') // Ellipsis

  // Remove replacement character (indicates encoding issues)
  cleaned = cleaned.replace(/\uFFFD/g, '')

  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '')

  // Normalize bullet points
  cleaned = cleaned.replace(/[•◦▪▫]/g, '•')

  return cleaned.trim()
}

/**
 * Validate PDF file - ENHANCED
 */
export function validatePDFFile(
  file: File,
  options: { maxSizeMB?: number; minSizeKB?: number } = {}
): {
  valid: boolean
  error?: string
} {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
    }
  }

  // Check file type - more strict validation
  const validTypes = ['application/pdf']
  const validExtensions = ['.pdf']

  const hasValidType = validTypes.includes(file.type)
  const hasValidExtension = validExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  )

  if (!hasValidType || !hasValidExtension) {
    return {
      valid: false,
      error: 'File must be a PDF (.pdf extension)',
    }
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.scr$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.com$/i,
  ]

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return {
      valid: false,
      error: 'Suspicious file name detected',
    }
  }

  // Check file size (configurable max, default 10MB)
  const maxSizeMB = options.maxSizeMB || 10
  const maxSize = maxSizeMB * 1024 * 1024

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `PDF file must be smaller than ${maxSizeMB}MB`,
    }
  }

  // Check file size minimum (configurable, default 1KB)
  const minSizeKB = options.minSizeKB || 1
  const minSize = minSizeKB * 1024

  if (file.size < minSize) {
    return {
      valid: false,
      error: 'PDF file appears to be empty',
    }
  }

  return { valid: true }
}

/**
 * Convert file to base64 for API transmission
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:application/pdf;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Extract text from specific pages only
 */
export async function extractTextFromPages(
  file: File,
  pageNumbers: number[]
): Promise<PDFParseResult> {
  if (typeof window === 'undefined') {
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: 'PDF parsing is only available in the browser',
    }
  }

  try {
    const pdfjsLib = await import('pdfjs-dist')

    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()

    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
    const pdf = await loadingTask.promise

    const pageCount = pdf.numPages
    let fullText = ''

    // Validate page numbers
    const validPages = pageNumbers.filter(num => num >= 1 && num <= pageCount)

    for (const pageNum of validPages) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')

      fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`
    }

    fullText = cleanExtractedText(fullText)

    return {
      text: fullText,
      pageCount,
      success: true,
    }
  } catch (error) {
    console.error('Error extracting text from specific pages:', error)
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract text',
    }
  }
}

/**
 * Check if PDF is searchable (has extractable text)
 */
export async function isPDFSearchable(file: File): Promise<boolean> {
  try {
    const result = await extractTextFromPDF(file, { maxPages: 1 })
    return result.success && result.text.trim().length > 50
  } catch {
    return false
  }
}
