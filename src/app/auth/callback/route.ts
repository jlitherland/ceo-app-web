/**
 * Auth Callback Route
 * Handles OAuth redirects from Apple/Google
 *
 * NOTE: This route handles PKCE flow (code exchange).
 * If you're seeing tokens in the URL hash instead of a code parameter,
 * you need to enable PKCE in your OAuth configuration.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  // Log all parameters for debugging
  console.log('📥 Auth callback received')
  console.log('  URL:', requestUrl.toString())
  console.log('  Code:', code ? `${code.substring(0, 20)}...` : 'MISSING')
  console.log('  All params:', Object.fromEntries(requestUrl.searchParams.entries()))

  // If no code, handle implicit flow (tokens in URL hash)
  if (!code) {
    console.log('⚠️  No code parameter - handling implicit flow with tokens in hash')

    // Redirect to a client-side page that can process the hash
    return NextResponse.redirect(`${origin}/auth/callback-client${requestUrl.hash}`)
  }

  // PKCE flow - exchange code for session
  const cookieStore = await cookies()
  let response = NextResponse.redirect(`${origin}/dashboard`)

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the response object
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              // Force these options to ensure cookies work
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          })
        },
      },
    }
  )

  // Exchange code for session - this will call setAll with cookies
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('❌ Auth callback error:', error.message)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    )
  }

  if (!data.session) {
    console.error('❌ No session created')
    return NextResponse.redirect(`${origin}/login?error=Failed to create session`)
  }

  console.log('✓ Session created for:', data.session.user.email)
  console.log('✓ Access token:', data.session.access_token.substring(0, 20) + '...')

  return response
}
