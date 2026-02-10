'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedCursorProps {
  children: React.ReactNode
  className?: string
  showCursor?: boolean
}

export function AnimatedCursor({
  children,
  className,
  showCursor = true
}: AnimatedCursorProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 8)
      cursorY.set(e.clientY - 8)
    }

    if (showCursor) {
      window.addEventListener('mousemove', moveCursor)
      return () => window.removeEventListener('mousemove', moveCursor)
    }
  }, [showCursor, cursorX, cursorY])

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {showCursor && (
        <motion.div
          className="pointer-events-none fixed top-0 left-0 z-50 mix-blend-difference"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
          }}
        >
          <motion.div
            className="h-4 w-4 rounded-full bg-primary/20"
            animate={{
              scale: isHovered ? 1.5 : 0,
              opacity: isHovered ? 1 : 0
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      )}
    </div>
  )
}