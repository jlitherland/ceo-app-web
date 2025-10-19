/**
 * Web Vitals Reporter Component
 * Client component that reports Web Vitals metrics
 */

'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/analytics/web-vitals'

export function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals()
  }, [])

  return null
}
