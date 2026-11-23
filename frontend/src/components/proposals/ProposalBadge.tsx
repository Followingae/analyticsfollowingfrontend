/**
 * A label the team puts on some of a proposal's creators, e.g. "Truth and Dare Event" for
 * the ones booked for an event on top of the main campaign, or "UAE" / "Qatar" on a
 * proposal that runs in several markets. It says what they are booked for or where, not
 * how good they are, so it sits with the creator's name rather than taking the
 * "Recommended by us" slot at the top of a card.
 */
import { MapPin, PartyPopper } from "lucide-react"

/* A badge that names a market ("UAE", "Qatar") marks where the creator posts, so it wears a
   pin; anything else is what they are booked for. Flag emoji are not used: Windows draws
   them as two letters. */
const PLACES = new Set([
  "uae", "united arab emirates", "dubai", "abu dhabi", "sharjah", "qatar", "doha", "kuwait",
  "ksa", "saudi", "saudi arabia", "riyadh", "jeddah", "bahrain", "oman", "muscat", "egypt",
  "lebanon", "jordan", "gcc",
])
import { cn } from "@/lib/utils"

export type ProposalBadgeColor = "pink" | "blue" | "green" | "amber" | "violet" | "slate"
export interface ProposalBadgeData { label: string; color?: ProposalBadgeColor | string | null }

const TONE: Record<ProposalBadgeColor, string> = {
  pink: "bg-pink-500 text-white shadow-[0_2px_12px_rgba(236,72,153,.45)]",
  blue: "bg-sky-500 text-white",
  green: "bg-emerald-500 text-white",
  amber: "bg-amber-400 text-amber-950",
  violet: "bg-violet-500 text-white",
  slate: "bg-slate-700 text-white",
}

export const BADGE_COLORS = Object.keys(TONE) as ProposalBadgeColor[]

export function ProposalBadge({ badge, className }: { badge?: ProposalBadgeData | null; className?: string }) {
  if (!badge?.label) return null
  const tone = TONE[(badge.color as ProposalBadgeColor) || "pink"] ?? TONE.pink
  const Icon = PLACES.has(badge.label.trim().toLowerCase()) ? MapPin : PartyPopper
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[11px] font-bold leading-none",
        tone,
        className,
      )}
      title={badge.label}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{badge.label}</span>
    </span>
  )
}
