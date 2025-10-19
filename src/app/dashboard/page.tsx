'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  FileText,
  DollarSign,
  Users,
  Sparkles,
  ArrowRight,
  MessageCircle,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    fetchUser()
  }, [])

  const modules = [
    {
      title: 'Analytics',
      description: 'Real-time streaming data & insights',
      icon: TrendingUp,
      href: '/dashboard/analytics',
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      stats: { label: 'Streams tracked', value: '2.4M+' },
    },
    {
      title: 'Contracts',
      description: 'Automated contract analysis',
      icon: FileText,
      href: '/dashboard/contracts',
      iconBg: 'bg-brand-orange/10 dark:bg-brand-orange/20',
      iconColor: 'text-brand-orange',
      stats: { label: 'Contracts analyzed', value: '47' },
    },
    {
      title: 'Finances',
      description: 'Track income & expenses',
      icon: DollarSign,
      href: '/dashboard/finances',
      iconBg: 'bg-green-500/10 dark:bg-green-500/20',
      iconColor: 'text-green-600 dark:text-green-400',
      stats: { label: 'Monthly revenue', value: '$12.4K' },
    },
    {
      title: 'Teams',
      description: 'Collaborate with your crew',
      icon: Users,
      href: '/dashboard/teams',
      iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      stats: { label: 'Team members', value: '8' },
    },
    {
      title: 'CEO Assistant',
      description: 'Music business questions answered',
      icon: MessageCircle,
      href: '/dashboard/assistant',
      iconBg: 'bg-brand-orange/10 dark:bg-brand-orange/20',
      iconColor: 'text-brand-orange',
      stats: { label: 'Conversations', value: '12' },
    },
    {
      title: 'Sculpture',
      description: 'Streaming data visualization',
      icon: Sparkles,
      href: '/dashboard/sculpture',
      iconBg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      stats: { label: 'Active artists', value: '3' },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-neutral-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-orange border-t-transparent" />
      </div>
    )
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Welcome back
              </h1>
              <p className="text-gray-600 dark:text-neutral-400 mt-2">
                Here's what's happening with your business today
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Modules Grid */}
        <section>
          <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
            Your Workspace
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => {
              const Icon = module.icon
              return (
                <button
                  key={index}
                  onClick={() => router.push(module.href)}
                  className="group relative bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-700 hover:border-brand-orange dark:hover:border-brand-orange hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="relative">
                    {/* Icon */}
                    <div
                      className={`${module.iconBg} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className={`w-6 h-6 ${module.iconColor}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
                      {module.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-neutral-500">
                          {module.stats.label}
                        </p>
                        <p className="text-lg font-bold text-brand-orange">
                          {module.stats.value}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 dark:text-neutral-500 group-hover:text-brand-orange group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
