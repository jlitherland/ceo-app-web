/**
 * OCR Service
 * Handles OCR requests to Railway backend for scanned PDFs
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const RAILWAY_API_URL = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 'https://ceo-app-working-production.up.railway.app'

export interface OCRResult {
  text: string
  pageCount: number
  confidence: number
  processingTimeMs: number
}

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf_token') {
      return decodeURIComponent(value)
    }
  }

  return null
}

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
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
 * Extract text from scanned PDF using OCR
 * This is called as a fallback when PDF has no text layer
 */
export async function extractTextWithOCR(
  file: File,
  options: { maxPages?: number; onProgress?: (message: string) => void } = {}
): Promise<OCRResult> {
  const { maxPages, onProgress } = options

  try {
    onProgress?.('Converting PDF to base64...')

    // Convert file to base64
    const base64File = await fileToBase64(file)

    onProgress?.('Sending to OCR service...')

    // Get authentication token
    const supabase = createSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Authentication required. Please sign in.')
    }

    // Get CSRF token
    const csrfToken = getCsrfToken()

    // Call Railway OCR endpoint
    const response = await fetch(`${RAILWAY_API_URL}/api/contracts/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...(csrfToken && { 'x-csrf-token': csrfToken }),
      },
      body: JSON.stringify({
        file: base64File,
        maxPages
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(errorData.message || errorData.error || 'OCR request failed')
    }

    onProgress?.('Processing complete!')

    const result = await response.json()
    return result

  } catch (error) {
    console.error('[OCR Service] Error:', error)
    throw error
  }
}

/**
 * Check if a PDF has a text layer (doesn't need OCR)
 */
export async function checkPDFTextLayer(file: File): Promise<{
  hasTextLayer: boolean
  needsOCR: boolean
}> {
  try {
    // Convert file to base64
    const base64File = await fileToBase64(file)

    // Get authentication token
    const supabase = createSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Authentication required. Please sign in.')
    }

    // Get CSRF token
    const csrfToken = getCsrfToken()

    // Call Railway check endpoint
    const response = await fetch(`${RAILWAY_API_URL}/api/contracts/check-text-layer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...(csrfToken && { 'x-csrf-token': csrfToken }),
      },
      body: JSON.stringify({
        file: base64File
      })
    })

    if (!response.ok) {
      throw new Error('Failed to check PDF text layer')
    }

    return await response.json()

  } catch (error) {
    console.error('[OCR Service] Text layer check failed:', error)
    // Assume it needs OCR if check fails
    return { hasTextLayer: false, needsOCR: true }
  }
}
