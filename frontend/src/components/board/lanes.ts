import { Briefcase, Handshake, Users, type LucideIcon } from 'lucide-react'
import type { CardStatus, LaneKey } from '@/services/boardApi'

/**
 * How each lane looks. Three quiet tints from the token palette: lilac mist on the brand
 * hue (302.8), lime mist on the dark-mode brand hue (121), and a warm grey. Lime is only
 * ever a surface here, never text.
 */
export interface LaneLook {
  icon: LucideIcon
  /** Column background, light then dark. */
  surface: string
  /** The icon mark and the count. */
  ink: string
}

export const LANE_LOOK: Record<LaneKey, LaneLook> = {
  talent: {
    icon: Users,
    surface: 'bg-[oklch(0.972_0.022_302.8)] dark:bg-[oklch(0.235_0.022_302.8)]',
    ink: 'text-[oklch(0.52_0.14_302.8)] dark:text-[oklch(0.80_0.10_302.8)]',
  },
  account_manager: {
    icon: Briefcase,
    surface: 'bg-[oklch(0.975_0.045_121)] dark:bg-[oklch(0.235_0.03_121)]',
    ink: 'text-[oklch(0.46_0.10_121)] dark:text-[oklch(0.82_0.14_121)]',
  },
  business_dev: {
    icon: Handshake,
    surface: 'bg-[oklch(0.962_0.007_80)] dark:bg-[oklch(0.235_0.006_80)]',
    ink: 'text-[oklch(0.46_0.02_80)] dark:text-[oklch(0.78_0.02_80)]',
  },
}

export const LANE_ORDER: LaneKey[] = ['talent', 'account_manager', 'business_dev']

export const STATUS_NEXT: Record<CardStatus, CardStatus> = {
  open: 'planned',
  planned: 'done',
  done: 'open',
}

export const STATUS_LABEL: Record<CardStatus, string> = {
  open: 'Open',
  planned: 'Planned',
  done: 'Done',
}

export const STATUS_RANK: Record<CardStatus, number> = { open: 0, planned: 1, done: 2 }

/** The status pill: muted, lilac, green. */
export const STATUS_PILL: Record<CardStatus, string> = {
  open: 'bg-muted text-muted-foreground/80 hover:bg-muted/80',
  planned: 'bg-primary/15 text-[oklch(0.46_0.14_302.8)] dark:bg-primary/20 dark:text-primary hover:bg-primary/25',
  done: 'bg-success/12 text-[oklch(0.42_0.14_149)] dark:bg-success/20 dark:text-[oklch(0.80_0.14_149)] hover:bg-success/20',
}

/** "2 min ago", "yesterday": short enough to sit in a card footer. */
export function relativeTime(iso: string | null, now = Date.now()): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const s = Math.max(0, Math.round((now - then) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d} days ago`
  const date = new Date(then)
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const MINE_KEY = 'board:mine'
const AUTHOR_KEY = 'board:author'

export const remember = {
  author(): string | null {
    try {
      return localStorage.getItem(AUTHOR_KEY)
    } catch {
      return null
    }
  },
  setAuthor(name: string) {
    try {
      localStorage.setItem(AUTHOR_KEY, name)
    } catch {
      /* private window, blocked storage */
    }
  },
  mine(): string[] {
    try {
      const raw = localStorage.getItem(MINE_KEY)
      const list = raw ? JSON.parse(raw) : []
      return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []
    } catch {
      return []
    }
  },
  addMine(id: string) {
    try {
      const list = remember.mine()
      if (!list.includes(id)) list.push(id)
      localStorage.setItem(MINE_KEY, JSON.stringify(list.slice(-200)))
    } catch {
      /* ignore */
    }
  },
  dropMine(id: string) {
    try {
      localStorage.setItem(MINE_KEY, JSON.stringify(remember.mine().filter((x) => x !== id)))
    } catch {
      /* ignore */
    }
  },
}
