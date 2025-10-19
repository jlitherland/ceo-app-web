/**
 * Robust JSON Parser
 * Implements multi-level fallback strategies from iOS app
 * Handles malformed JSON responses from Claude AI
 */

export interface ParseResult<T> {
  success: boolean
  data?: T
  error?: string
  attempt?: number
}

/**
 * Parse JSON with multiple fallback strategies
 * Mimics iOS app's robust 5-level parsing approach
 */
export function parseRobustJSON<T = any>(jsonString: string): ParseResult<T> {
  // Level 1: Try direct parse
  try {
    const data = JSON.parse(jsonString) as T
    console.log('✅ JSON parsed successfully on first attempt')
    return { success: true, data, attempt: 1 }
  } catch (error) {
    console.log('❌ Direct parse failed, trying cleanup strategies...')
  }

  // Level 2: Clean markdown and extract JSON
  try {
    const cleaned = cleanMarkdownJSON(jsonString)
    const data = JSON.parse(cleaned) as T
    console.log('✅ JSON parsed after markdown cleanup')
    return { success: true, data, attempt: 2 }
  } catch (error) {
    console.log('❌ Markdown cleanup failed, trying sanitization...')
  }

  // Level 3: Sanitize special characters
  try {
    const sanitized = sanitizeJSONString(cleanMarkdownJSON(jsonString))
    const data = JSON.parse(sanitized) as T
    console.log('✅ JSON parsed after sanitization')
    return { success: true, data, attempt: 3 }
  } catch (error) {
    console.log('❌ Sanitization failed, trying aggressive cleanup...')
  }

  // Level 4: Fix incomplete JSON
  try {
    const fixed = fixIncompleteJSON(sanitizeJSONString(cleanMarkdownJSON(jsonString)))
    const data = JSON.parse(fixed) as T
    console.log('✅ JSON parsed after fixing incomplete structure')
    return { success: true, data, attempt: 4 }
  } catch (error) {
    console.log('❌ Incomplete JSON fix failed, trying aggressive sanitization...')
  }

  // Level 5: Aggressive sanitization (remove problematic fields)
  try {
    const aggressive = aggressivelySanitizeJSON(jsonString)
    const data = JSON.parse(aggressive) as T
    console.log('✅ JSON parsed after aggressive sanitization (some fields removed)')
    return { success: true, data, attempt: 5 }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error'
    console.error('❌ All parsing attempts failed:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Clean markdown code blocks from JSON response
 * Removes ```json and ``` wrappers
 */
function cleanMarkdownJSON(jsonString: string): string {
  let cleaned = jsonString.trim()

  // Remove markdown code blocks
  if (cleaned.includes('```json')) {
    const startIndex = cleaned.indexOf('```json') + 7
    cleaned = cleaned.substring(startIndex)
  } else if (cleaned.startsWith('```')) {
    const startIndex = cleaned.indexOf('\n') + 1
    cleaned = cleaned.substring(startIndex)
  }

  if (cleaned.includes('```')) {
    const endIndex = cleaned.lastIndexOf('```')
    cleaned = cleaned.substring(0, endIndex)
  }

  cleaned = cleaned.trim()

  // Extract JSON content between first { and last }
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  return cleaned
}

/**
 * Sanitize problematic Unicode and special characters
 */
function sanitizeJSONString(jsonString: string): string {
  let result = jsonString

  // Replace problematic Unicode characters
  const problemChars: Record<string, string> = {
    '￿': ' ',
    '¥': 'Y',
    '¢': 'c',
    '•': '*',
    '₹': 'Rs',
    '\u0000': '', // Null character
    '\r': '', // Carriage return
  }

  for (const [badChar, replacement] of Object.entries(problemChars)) {
    result = result.replaceAll(badChar, replacement)
  }

  // Fix escaped quotes that might be problematic
  result = result.replace(/\\"/g, '\\"')

  return result
}

/**
 * Fix incomplete JSON structures
 * Handles trailing commas, unclosed brackets, etc.
 */
function fixIncompleteJSON(jsonString: string): string {
  let fixed = jsonString

  // Remove trailing commas before closing brackets
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1')

  // Fix unclosed strings (dangerous but sometimes necessary)
  const openQuotes = (fixed.match(/"/g) || []).length
  if (openQuotes % 2 !== 0) {
    // Add closing quote at the end if needed
    const lastQuoteIndex = fixed.lastIndexOf('"')
    const lastBraceIndex = fixed.lastIndexOf('}')
    if (lastQuoteIndex > lastBraceIndex) {
      fixed = fixed.substring(0, lastBraceIndex) + '"' + fixed.substring(lastBraceIndex)
    }
  }

  // Fix unclosed arrays
  const openBrackets = (fixed.match(/\[/g) || []).length
  const closeBrackets = (fixed.match(/\]/g) || []).length
  if (openBrackets > closeBrackets) {
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      const lastBraceIndex = fixed.lastIndexOf('}')
      if (lastBraceIndex !== -1) {
        fixed = fixed.substring(0, lastBraceIndex) + ']' + fixed.substring(lastBraceIndex)
      }
    }
  }

  // Fix unclosed objects
  const openBraces = (fixed.match(/\{/g) || []).length
  const closeBraces = (fixed.match(/\}/g) || []).length
  if (openBraces > closeBraces) {
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}'
    }
  }

  return fixed
}

/**
 * Aggressive sanitization as last resort
 * Removes problematic fields entirely (clauseText, suggestion, description)
 */
function aggressivelySanitizeJSON(jsonString: string): string {
  let cleaned = cleanMarkdownJSON(jsonString)

  // Remove clauseText fields (most common source of issues)
  cleaned = cleaned.replace(/"clauseText"\s*:\s*"(?:[^"\\]|\\.)*"/g, '"clauseText": null')

  // Remove suggestion fields
  cleaned = cleaned.replace(/"suggestion"\s*:\s*"(?:[^"\\]|\\.)*"/g, '"suggestion": null')

  // Simplify description fields
  cleaned = cleaned.replace(
    /"description"\s*:\s*"(?:[^"\\]|\\.)*"/g,
    '"description": "Content removed due to parsing issues"'
  )

  // Remove all problematic characters
  const problemChars = ['￿', '¥', '¢', '\u0000', '\r']
  for (const char of problemChars) {
    cleaned = cleaned.replaceAll(char, '')
  }

  // Apply other fixes
  cleaned = sanitizeJSONString(cleaned)
  cleaned = fixIncompleteJSON(cleaned)

  return cleaned
}

/**
 * Validate contract text before sending to API
 * Matches iOS validation logic
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateContractText(text: string): ValidationResult {
  // Check if empty
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Contract text is empty' }
  }

  // Check minimum length
  if (text.length < 100) {
    return {
      valid: false,
      error: 'Contract text is too short (minimum 100 characters)',
    }
  }

  // Check maximum length (100,000 characters like iOS)
  if (text.length > 100000) {
    return {
      valid: false,
      error: 'Contract text is too long (maximum 100,000 characters)',
    }
  }

  // Check for corrupted text (>5% replacement characters)
  const replacementChars = (text.match(/�/g) || []).length
  const corruptionRate = replacementChars / text.length

  if (corruptionRate > 0.05) {
    return {
      valid: false,
      error: 'Contract appears to be corrupted or contains invalid characters',
    }
  }

  return { valid: true }
}
