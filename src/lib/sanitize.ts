/**
 * Input Sanitization Utilities
 * Provides safe HTML rendering and input validation
 */

import DOMPurify from 'isomorphic-dompurify'
import React from 'react'

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this when rendering user-generated HTML content
 *
 * @param dirty - Potentially unsafe HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * const cleanHtml = sanitizeHtml(userInput)
 * return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
 */
export function sanitizeHtml(
  dirty: string,
  options?: {
    ALLOWED_TAGS?: string[]
    ALLOWED_ATTR?: string[]
    ALLOW_DATA_ATTR?: boolean
  }
): string {
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: options?.ALLOWED_TAGS || [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: options?.ALLOWED_ATTR || ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: options?.ALLOW_DATA_ATTR || false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  }

  return DOMPurify.sanitize(dirty, config)
}

/**
 * Sanitize plain text input
 * Strips all HTML tags and dangerous characters
 *
 * @param input - User input string
 * @returns Plain text with HTML entities escaped
 *
 * @example
 * const safeName = sanitizeText(userNameInput)
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * Validate and sanitize email addresses
 *
 * @param email - Email address to validate
 * @returns Sanitized email if valid, null otherwise
 */
export function sanitizeEmail(email: string): string | null {
  const sanitized = sanitizeText(email.trim().toLowerCase())

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  return emailRegex.test(sanitized) ? sanitized : null
}

/**
 * Validate and sanitize URLs
 *
 * @param url - URL to validate
 * @param allowedProtocols - Allowed URL protocols (default: http, https)
 * @returns Sanitized URL if valid, null otherwise
 */
export function sanitizeUrl(
  url: string,
  allowedProtocols: string[] = ['http', 'https']
): string | null {
  try {
    const sanitized = sanitizeText(url.trim())
    const parsed = new URL(sanitized)

    if (!allowedProtocols.includes(parsed.protocol.replace(':', ''))) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize file names to prevent path traversal attacks
 *
 * @param filename - File name to sanitize
 * @returns Safe file name without path components
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    .trim()
    .substring(0, 255) // Limit length
}

/**
 * Sanitize contract text for analysis
 * Allows more formatting but removes dangerous content
 *
 * @param text - Contract text
 * @returns Sanitized contract text
 */
export function sanitizeContractText(text: string): string {
  // For contracts, we want to preserve formatting but remove scripts
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
      'div', 'span', 'blockquote', 'pre', 'code'
    ],
    ALLOWED_ATTR: ['class', 'style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
}

/**
 * Validate string length with sanitization
 *
 * @param input - Input string
 * @param minLength - Minimum allowed length
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string if valid, null otherwise
 */
export function sanitizeAndValidateLength(
  input: string,
  minLength: number,
  maxLength: number
): string | null {
  const sanitized = sanitizeText(input.trim())

  if (sanitized.length < minLength || sanitized.length > maxLength) {
    return null
  }

  return sanitized
}

/**
 * Sanitize search queries
 * Allows alphanumeric, spaces, and common punctuation
 *
 * @param query - Search query
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 200) // Limit length
}

/**
 * Create a safe component for rendering sanitized HTML
 * Use this instead of dangerouslySetInnerHTML
 *
 * @example
 * <SafeHtml html={userGeneratedContent} />
 */
export function SafeHtml({
  html,
  className,
  allowedTags,
}: {
  html: string
  className?: string
  allowedTags?: string[]
}) {
  const sanitized = sanitizeHtml(html, { ALLOWED_TAGS: allowedTags })

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
