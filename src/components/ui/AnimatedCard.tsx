/**
 * Animated Card Component
 * Beautiful card with hover effects and optional glassmorphism
 */

'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cardHover } from '@/lib/animations'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  glassEffect?: boolean
  hoverEffect?: boolean
  onClick?: () => void
}

export default function AnimatedCard({
  children,
  className = '',
  glassEffect = false,
  hoverEffect = true,
  onClick
}: AnimatedCardProps) {
  const baseClasses = glassEffect
    ? 'backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl'
    : 'bg-white border-2 border-gray-200'

  return (
    <motion.div
      className={`rounded-2xl p-6 ${baseClasses} ${className}`}
      initial="rest"
      whileHover={hoverEffect ? "hover" : undefined}
      variants={hoverEffect ? cardHover : undefined}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  )
}
