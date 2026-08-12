'use client'

/**
 * A faint, tiled watermark over views that carry confidential pricing.
 *
 * Be clear about what this does and does not do. It cannot stop a screenshot — nothing in a
 * browser can, and anyone can photograph a screen with a phone. What it does is make a leaked
 * image attributable to a person and a minute, which is what actually changes behaviour. The
 * controls that genuinely prevent leakage are elsewhere: not sending out-of-scope data at all,
 * and refusing bulk export to anyone but leadership.
 *
 * It is deliberately low-contrast so it never competes with the numbers underneath, and
 * pointer-events-none so it can never intercept a click.
 */
import { useEffect, useState } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'

export function ConfidentialWatermark({ label }: { label?: string }) {
  const { user } = useEnhancedAuth()
  const [stamp, setStamp] = useState('')

  useEffect(() => {
    const tick = () => setStamp(new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    }))
    tick()
    // Re-stamp each minute so a screenshot carries the minute it was taken.
    const t = setInterval(tick, 60_000)
    return () => clearInterval(t)
  }, [])

  const who = user?.email || 'Following'
  const text = `${who} · ${stamp}${label ? ` · ${label}` : ''}`

  // Deliberately barely-there on screen: nobody should feel watched while doing their job.
  // It only needs to survive a screenshot, not be noticed during one. Printing is the one
  // case where it darkens, because a printed page leaves the building on paper.
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="300">
       <text x="0" y="180" transform="rotate(-20 0 180)"
             font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="12"
             letter-spacing="0.5" fill="currentColor">${text.replace(/[<>&]/g, '')}</text>
     </svg>`)

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 select-none text-foreground/[0.028] print:text-foreground/20"
      style={{
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
        color: 'currentColor',
      }}
    />
  )
}
