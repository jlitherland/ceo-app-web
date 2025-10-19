/**
 * Supabase Client Configuration
 *
 * This module provides Supabase clients for different contexts:
 * - Browser client (client-side operations)
 * - Server client (server-side operations)
 *
 * SECURITY: Never expose service_role key on the client side!
 */

import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Supabase URL and anon key from environment variables
 * These are safe to expose on the client side
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

/**
 * Browser client for client-side operations
 * Uses localStorage for compatibility with OAuth flow
 */
export function createSupabaseBrowserClient() {
  // Use the legacy client which uses localStorage
  // This matches the storage used in the OAuth callback
  return supabase
}

/**
 * Legacy client for backwards compatibility
 * Use createSupabaseBrowserClient() for new code
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * Real-time subscription helper
 * TODO: Update for Supabase v2 realtime API
 */
export function subscribeToChannel<T = unknown>(
  _channelName: string,
  _event: string,
  _callback: (payload: T) => void
) {
  // Placeholder for Supabase v2 realtime - will be implemented when needed
  console.warn('Real-time subscriptions not yet implemented')
  return () => {
    // Cleanup function
  }
}

/**
 * Storage helpers for file uploads
 */
export const storage = {
  /**
   * Upload file to Supabase storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: { cacheControl?: string; upsert?: boolean }
  ) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false,
      })

    if (error) throw error
    return data
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path)
    return publicUrl
  },

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error
  },

  /**
   * List files in a bucket path
   */
  async listFiles(bucket: string, path?: string) {
    const { data, error } = await supabase.storage.from(bucket).list(path)
    if (error) throw error
    return data
  },
}

/**
 * Auth helpers
 */
export const auth = {
  /**
   * Get current user session
   */
  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  /**
   * Get current user
   */
  async getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Sign in with OAuth provider
   * DEPRECATED: Use createSupabaseBrowserClient().auth.signInWithOAuth() instead
   */
  async signInWithOAuth(provider: 'google' | 'apple') {
    const redirectTo = `${window.location.origin}/auth/callback`
    console.log('🔐 Starting OAuth flow with redirect:', redirectTo)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    })
    if (error) {
      console.error('❌ OAuth error:', error)
      throw error
    }
    console.log('✓ OAuth initiated successfully')
    return data
  },

  /**
   * Sign in with email
   */
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  /**
   * Sign up with email
   */
  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    return data
  },
}

export type { Database }
