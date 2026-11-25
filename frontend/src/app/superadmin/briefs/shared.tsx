'use client'

import { useState } from 'react'
import type { AdminBrief } from '@/services/brandBriefApi'

export const STATUS: Record<AdminBrief['status'], { label: string; tone: string }> = {
  sent: { label: 'Not opened', tone: 'bg-muted text-muted-foreground' },
  opened: { label: 'Opened', tone: 'bg-muted text-foreground' },
  in_progress: { label: 'Being filled', tone: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' },
  submitted: { label: 'Sent to us', tone: 'bg-primary text-primary-foreground' },
  sourcing: { label: 'Sourcing', tone: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]' },
  withdrawn: { label: 'Withdrawn', tone: 'bg-muted text-muted-foreground line-through' },
}

export function BrandLogo({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  const [bad, setBad] = useState(false)
  if (url && !bad) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" onError={() => setBad(true)} className="shrink-0 rounded-full border bg-white object-cover"
                style={{ width: size, height: size }} />
  }
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
          style={{ width: size, height: size }}>{name.slice(0, 1).toUpperCase()}</span>
  )
}

export function ago(iso: string | null): string {
  if (!iso) return ''
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
