'use client'

/**
 * Dashboard Sidebar
 * Beautiful minimal navigation
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { TrendingUp, FileText, DollarSign, Users, Sparkles, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
  { name: 'Contracts', href: '/dashboard/contracts', icon: FileText },
  { name: 'Finances', href: '/dashboard/finances', icon: DollarSign },
  { name: 'Teams', href: '/dashboard/teams', icon: Users },
  { name: 'CEO Assistant', href: '/dashboard/assistant', icon: MessageCircle },
  { name: 'Sculpture', href: '/dashboard/sculpture', icon: Sparkles },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-neutral-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/images/ceo-logo.png"
            alt="CEO Logo"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-smooth',
                isActive
                  ? 'bg-brand-orange text-white shadow-float'
                  : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-neutral-700">
        <div className="p-4 bg-gradient-to-br from-brand-orange/10 to-transparent rounded-xl">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Need help?</p>
          <p className="text-xs text-gray-600 dark:text-neutral-400 mb-3">Check our intelligent assistant</p>
          <button className="w-full px-3 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark transition-smooth">
            Open Assistant
          </button>
        </div>
      </div>
    </div>
  )
}
