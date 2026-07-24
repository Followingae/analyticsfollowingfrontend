/**
 * Shared helpers for proposal components
 */

export const DEFAULT_AVATAR = "/placeholder-avatar.svg"

import {
  Star,
  Zap,
  TrendingUp,
  Crown,
  Clock,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
  Hammer,
  ShieldCheck,
  RotateCcw,
  type LucideIcon,
} from "lucide-react"

// Audience SIZE, not a grade. This used to run a traffic light down the tiers — mid
// green, micro yellow, nano orange — so a client scanning a proposal saw amber and red
// warnings sitting on perfectly good creators and read them as flagged. Smaller
// audiences usually engage HARDER, so the old colouring inverted the truth it implied.
// Cool, equal-weight hues only: they separate the tiers without ranking them.
export function getTierColor(tier?: string) {
  switch (tier?.toLowerCase()) {
    case "mega":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    case "macro":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "mid":
    case "mid-tier":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
    case "micro":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
    case "nano":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200"
    default:
      return "bg-muted text-foreground"
  }
}

// ---------------------------------------------------------------------------
// Engagement rate, in context
// ---------------------------------------------------------------------------

// Mirrors _ER_BENCHMARKS in app/services/creator_analytics/derive.py. Engagement falls
// as an account grows, so one global threshold mislabels most of the roster: 0.58% is
// the median for a 250k creator and would look like a failure against the 3% a brand
// half-remembers from a nano case study.
const ER_BANDS: Array<[number | null, number, number]> = [
  [10_000, 0.8, 4.0],
  [50_000, 0.6, 2.0],
  [250_000, 0.3, 1.0],
  [1_000_000, 0.25, 1.0],
  [null, 0.15, 1.0],
]

export type EngagementStanding = "below_average" | "typical" | "above_average" | "exceptional"

/** Label an engagement rate against creators of a COMPARABLE SIZE. */
export function engagementStanding(
  rate?: number | null,
  followers?: number | null
): { standing: EngagementStanding; label: string; className: string } | null {
  if (rate == null || !followers || followers <= 0) return null
  const band = ER_BANDS.find(([max]) => max === null || followers < max)!
  const [, low, high] = band

  let standing: EngagementStanding = "below_average"
  if (rate >= high * 2) standing = "exceptional"
  else if (rate >= high) standing = "above_average"
  else if (rate >= low) standing = "typical"

  // Deliberately no red. "Below average for this size" already says it in words; the
  // colour only ever added alarm to a number the brand was going to judge anyway.
  const map = {
    exceptional: { label: "Exceptional for this size", className: "text-emerald-600 dark:text-emerald-400" },
    above_average: { label: "Above average for this size", className: "text-emerald-600 dark:text-emerald-400" },
    typical: { label: "Typical for this size", className: "text-muted-foreground" },
    below_average: { label: "Below average for this size", className: "text-muted-foreground" },
  } as const
  return { standing, ...map[standing] }
}

export interface TierConfig {
  label: string
  icon: LucideIcon
  className: string
}

export function getTierConfig(tier?: string): TierConfig {
  switch (tier?.toLowerCase()) {
    case "nano":
      return {
        label: "Nano",
        icon: Star,
        className:
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      }
    case "micro":
      return {
        label: "Micro",
        icon: Zap,
        className:
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
      }
    case "macro":
      return {
        label: "Macro",
        icon: TrendingUp,
        className:
          "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      }
    case "mega":
      return {
        label: "Mega",
        icon: Crown,
        className:
          "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400 dark:border-purple-700",
      }
    default:
      return {
        label: tier ?? "Unknown",
        icon: Star,
        className:
          "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
      }
  }
}

export function formatCount(n?: number): string {
  if (!n) return "0"
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
  if (n >= 1000) return (n / 1000).toFixed(1) + "K"
  return n.toString()
}

export function formatCurrency(amount?: number | null): string {
  if (!amount) return "-"
  return "د.إ" + amount.toLocaleString("en-US", { minimumFractionDigits: 0 })
}

// ---------------------------------------------------------------------------
// Proposal status helpers (centralized — no local duplicates)
// ---------------------------------------------------------------------------

export type ProposalStatus =
  | "draft"
  // internal pipeline (not client-visible)
  | "building"
  | "pending_internal_review"
  | "internal_changes_requested"
  | "internally_approved"
  // client-facing
  | "sent"
  | "in_review"
  | "approved"
  | "rejected"
  | "more_requested"

export function getProposalStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
    case "internally_approved":
      return "default"
    case "rejected":
      return "destructive"
    case "sent":
    case "in_review":
    case "more_requested":
    case "building":
    case "pending_internal_review":
      return "secondary"
    case "internal_changes_requested":
      return "outline"
    default:
      return "outline"
  }
}

export function getProposalStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    building: "Building",
    pending_internal_review: "Internal Review",
    internal_changes_requested: "Changes Requested",
    internally_approved: "Internally Approved",
    sent: "Sent",
    in_review: "In Review",
    approved: "Approved",
    rejected: "Rejected",
    more_requested: "More Requested",
  }
  return labels[status] ?? status.replace(/_/g, " ")
}

export function getProposalStatusIcon(status: string): LucideIcon {
  switch (status) {
    case "sent":
      return Send
    case "in_review":
      return Eye
    case "approved":
    case "internally_approved":
      return CheckCircle
    case "rejected":
      return XCircle
    case "more_requested":
      return MessageSquare
    case "draft":
      return Clock
    case "building":
      return Hammer
    case "pending_internal_review":
      return ShieldCheck
    case "internal_changes_requested":
      return RotateCcw
    default:
      return AlertCircle
  }
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "-"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString))
}

// ---------------------------------------------------------------------------
// Motion variants — shared across the entire proposals module
// ---------------------------------------------------------------------------

export const proposalMotion = {
  staggerContainer: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  },
  staggerItem: {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 25 },
    },
  },
  slideRight: {
    hidden: { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 28 },
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  },
  hoverLift: {
    rest: { y: 0 },
    hover: { y: -6, transition: { ease: [0.25, 1, 0.5, 1], duration: 0.25 } },
  },
  detailReveal: {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto", transition: { duration: 0.25 } },
  },
} as const

export const chartColorVar = (i: number) => `hsl(var(--chart-${(i % 5) + 1}))`

// ---------------------------------------------------------------------------
// Stock images — abstract/landscape backgrounds for proposal cards & hero
// ---------------------------------------------------------------------------

export const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=600&fit=crop&q=90",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&h=600&fit=crop&q=90",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=600&fit=crop&q=90",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=600&fit=crop&q=90",
  "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&h=600&fit=crop&q=90",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&h=600&fit=crop&q=90",
  "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&h=600&fit=crop&q=90",
  "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1920&h=600&fit=crop&q=90",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&h=600&fit=crop&q=90",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=600&fit=crop&q=90",
]

export function getStockImage(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  return STOCK_IMAGES[Math.abs(hash) % STOCK_IMAGES.length]
}

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

export function relativeTime(dateString?: string | null): string {
  if (!dateString) return ""
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
