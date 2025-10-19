/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals and sends to analytics
 *
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 *
 * Additional metrics:
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 */

import type { Metric } from 'web-vitals'

/**
 * Report Web Vitals to analytics service
 * Modify this function to send metrics to your preferred analytics platform
 */
function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    })
  }

  // Send to your analytics service (Google Analytics, Vercel Analytics, etc.)
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // Google Analytics 4
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
    })
  }

  // Send to Sentry for performance monitoring
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    import('@sentry/nextjs').then(({ captureMessage }) => {
      captureMessage(`Web Vital: ${metric.name}`, {
        level: metric.rating === 'good' ? 'info' : metric.rating === 'needs-improvement' ? 'warning' : 'error',
        tags: {
          web_vital: metric.name,
        },
        extra: {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
        },
      })
    })
  }

  // Send to custom API endpoint (optional)
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        timestamp: Date.now(),
      }),
      keepalive: true,
    }).catch(console.error)
  }
}

/**
 * Initialize Web Vitals tracking
 * Call this in your root layout or _app component
 */
export function reportWebVitals(onPerfEntry?: (metric: Metric) => void) {
  if (onPerfEntry && typeof window !== 'undefined') {
    import('web-vitals').then(({ onCLS, onFCP, onFID, onLCP, onTTFB, onINP }) => {
      // Core Web Vitals
      onCLS((metric) => {
        sendToAnalytics(metric)
        onPerfEntry(metric)
      })

      onFID((metric) => {
        sendToAnalytics(metric)
        onPerfEntry(metric)
      })

      onLCP((metric) => {
        sendToAnalytics(metric)
        onPerfEntry(metric)
      })

      // Additional metrics
      onFCP((metric) => {
        sendToAnalytics(metric)
        onPerfEntry(metric)
      })

      onTTFB((metric) => {
        sendToAnalytics(metric)
        onPerfEntry(metric)
      })

      onINP((metric) => {
        sendToAnalytics(metric)
        onPerfEntry(metric)
      })
    })
  }
}

/**
 * Performance thresholds for Core Web Vitals
 * Based on Google's recommendations
 */
export const VITALS_THRESHOLDS = {
  LCP: {
    good: 2500, // 2.5s or less
    needsImprovement: 4000, // 4s or less
  },
  FID: {
    good: 100, // 100ms or less
    needsImprovement: 300, // 300ms or less
  },
  CLS: {
    good: 0.1, // 0.1 or less
    needsImprovement: 0.25, // 0.25 or less
  },
  FCP: {
    good: 1800, // 1.8s or less
    needsImprovement: 3000, // 3s or less
  },
  TTFB: {
    good: 800, // 800ms or less
    needsImprovement: 1800, // 1.8s or less
  },
  INP: {
    good: 200, // 200ms or less
    needsImprovement: 500, // 500ms or less
  },
} as const

/**
 * Get performance rating from metric value
 */
export function getPerformanceRating(
  metricName: keyof typeof VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = VITALS_THRESHOLDS[metricName]

  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}
