/**
 * Sentry Server Configuration
 * Monitors server-side errors and API routes
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
    // Remove sensitive environment variables
    if (event.contexts?.runtime?.node) {
      delete event.contexts.runtime.node
    }

    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
      delete event.request.headers['x-supabase-auth']
    }

    return event
  },

  // Ignore specific errors
  ignoreErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'session_not_found',
    'refresh_token_not_found'
  ],
})
