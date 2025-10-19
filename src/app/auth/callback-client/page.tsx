'use client'

/**
 * Client-side OAuth Callback Handler
 * Processes auth tokens from URL hash (implicit flow)
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function CallbackClientPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log('🔍 Client-side auth handler started')
        console.log('Full URL:', window.location.href)
        console.log('Hash:', window.location.hash)

        // Check if there's a hash with auth tokens
        if (!window.location.hash) {
          setError('No authentication data found in URL')
          setTimeout(() => router.push('/login?error=No auth data'), 2000)
          return
        }

        setStatus('Detecting session...')

        // Supabase will automatically detect and handle the tokens in the hash
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setError(sessionError.message)
          setTimeout(() => router.push(`/login?error=${encodeURIComponent(sessionError.message)}`), 2000)
          return
        }

        if (data.session) {
          console.log('✅ Session created:', data.session.user.email)
          setStatus('Success! Redirecting to dashboard...')

          // Short delay to show success message
          setTimeout(() => {
            router.push('/dashboard')
          }, 500)
        } else {
          console.error('❌ No session found')
          setError('Failed to create session')
          setTimeout(() => router.push('/login?error=No session created'), 2000)
        }
      } catch (err) {
        console.error('❌ Exception:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setTimeout(() => router.push('/login?error=Authentication failed'), 2000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center text-orange-500">
        <div className="mb-6">
          {error ? (
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          )}
        </div>

        <h2 className="text-2xl font-bold mb-2 text-orange-500">
          {error ? 'Authentication Failed' : 'Completing sign in...'}
        </h2>

        <p className="text-orange-500/80">
          {error || status}
        </p>
      </div>
    </div>
  )
}
