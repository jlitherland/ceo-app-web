/**
 * Sentry Edge Configuration
 * Monitors Edge Runtime (middleware, edge functions)
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Environment configuration
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',

  // Filter out sensitive information
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
    }

    return event
  },
})
