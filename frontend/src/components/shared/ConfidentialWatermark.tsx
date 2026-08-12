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

  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="180">
       <text x="0" y="110" transform="rotate(-24 0 110)"
             font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="13"
             fill="currentColor" opacity="0.5">${text.replace(/[<>&]/g, '')}</text>
     </svg>`)

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 select-none text-foreground/[0.055] print:text-foreground/25"
      style={{
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
        color: 'currentColor',
      }}
    />
  )
}
