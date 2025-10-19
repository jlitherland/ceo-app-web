'use client'

/**
 * Dashboard Top Bar
 * User menu and actions
 */

import { useEffect, useState } from 'react'
import { LogOut, User } from 'lucide-react'
import Image from 'next/image'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function DashboardTopBar() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    let mounted = true

    // Get initial session
    const checkSession = async () => {
      console.log('🔍 Checking session...')
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ Session check error:', error)
      }

      if (!mounted) return

      if (session) {
        console.log('✓ Session found:', session.user.email)
        setUser(session.user)
      } else {
        console.log('❌ No session, redirecting to login')
        // Give a small delay for cookies to be read
        setTimeout(() => {
          if (mounted) router.push('/login')
        }, 500)
      }
    }

    checkSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session')
      if (!mounted) return

      if (session) {
        setUser(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/login')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="h-16 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-center px-6">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-orange border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="h-16 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between px-6">
      {/* Breadcrumbs would go here */}
      <div></div>

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
          <p className="text-xs text-gray-500 dark:text-neutral-400">Artist</p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button className="p-2 text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-smooth">
            <User className="w-5 h-5" />
          </button>

          <button
            onClick={handleSignOut}
            className="p-2 text-gray-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-smooth"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
