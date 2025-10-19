/**
 * Skeleton Loader Component
 * Beautiful shimmer loading effect
 */

'use client'

import { motion } from 'framer-motion'

interface SkeletonLoaderProps {
  className?: string
  count?: number
  height?: string
}

export default function SkeletonLoader({
  className = '',
  count = 1,
  height = 'h-4'
}: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={`${height} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 rounded-lg ${className}`}
          style={{
            backgroundSize: '200% 100%'
          }}
          animate={{
            backgroundPosition: ['200% 0', '-200% 0']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-200 dark:border-neutral-800 p-6 space-y-4">
      <SkeletonLoader height="h-6" className="w-3/4" />
      <SkeletonLoader height="h-4" count={3} className="w-full" />
      <div className="grid grid-cols-2 gap-4 mt-4">
        <SkeletonLoader height="h-20" />
        <SkeletonLoader height="h-20" />
      </div>
    </div>
  )
}
