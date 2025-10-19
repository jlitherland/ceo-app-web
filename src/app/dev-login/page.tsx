'use client'

/**
 * DEV ONLY: Bypass authentication for local testing
 * DO NOT USE IN PRODUCTION
 */

import { useRouter } from 'next/navigation'
import { Music } from 'lucide-react'
import Link from 'next/link'

export default function DevLoginPage() {
  const router = useRouter()

  const handleDevLogin = () => {
    // Set a fake session in localStorage for dev testing
    const fakeSession = {
      access_token: 'dev-token',
      user: {
        id: 'dev-user-123',
        email: 'dev@test.com',
        user_metadata: { name: 'Dev User' }
      }
    }

    localStorage.setItem('supabase.auth.token', JSON.stringify(fakeSession))

    // Redirect to dashboard
    router.push('/dashboard/analytics')
  }

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-orange/10 to-purple-500/10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dev Login Not Available</h1>
          <p className="text-gray-600 mb-4">This page is only available in development mode.</p>
          <Link href="/login" className="text-brand-orange hover:underline">
            Go to login page →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-orange/10 to-purple-500/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Music className="w-10 h-10 text-brand-orange" />
            <span className="text-3xl font-bold gradient-text">CEO</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dev Login</h1>
          <p className="text-gray-600">Skip authentication for local testing</p>
        </div>

        {/* Dev Login Card */}
        <div className="glass rounded-3xl p-8">
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Development Only</strong>
              <br />
              This bypasses real authentication. Only use for local testing.
            </p>
          </div>

          <button
            onClick={handleDevLogin}
            className="w-full px-6 py-4 bg-brand-orange text-white rounded-2xl font-semibold hover:bg-orange-600 transition-smooth"
          >
            Skip Auth & Go to Dashboard
          </button>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Or use real authentication:</p>
            <Link
              href="/login"
              className="text-brand-orange hover:underline text-sm font-medium"
            >
              Go to login page →
            </Link>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">To fix real auth:</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Go to Supabase Dashboard</li>
            <li>Navigate to Authentication → URL Configuration</li>
            <li>Add: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">http://localhost:3000/auth/callback</code></li>
            <li>Save and try signing in again</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
