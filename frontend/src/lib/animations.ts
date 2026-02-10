import { type ClassValue } from 'clsx'

// Subtle animation variants for framer-motion
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: 'easeOut' }
}

export const slideUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2, ease: 'easeOut' }
}

export const slideInFromRight = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: { duration: 0.2, ease: 'easeOut' }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.15, ease: 'easeOut' }
}

// Stagger children animations
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 }
}

// Cursor trail effect configuration
export const cursorSpring = {
  damping: 25,
  stiffness: 700,
  mass: 0.5
}

// Subtle hover animations
export const hoverScale = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.99 },
  transition: { duration: 0.2, ease: 'easeOut' }
}

export const hoverGlow = {
  whileHover: {
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)',
    transition: { duration: 0.2 }
  }
}

// Focus animations
export const focusRing = {
  whileFocus: {
    boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)',
    transition: { duration: 0.15 }
  }
}