/**
 * A label the team puts on some of a proposal's creators, e.g. "Truth and Dare Event" for
 * the ones booked for an event on top of the main campaign. It says what they are booked
 * for, not how good they are, so it sits with the creator's name rather than taking the
 * "Recommended by us" slot at the top of a card.
 */
import { PartyPopper } from "lucide-react"
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
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[11px] font-bold leading-none",
        tone,
        className,
      )}
      title={badge.label}
    >
      <PartyPopper className="size-3.5 shrink-0" />
      <span className="truncate">{badge.label}</span>
    </span>
  )
}
