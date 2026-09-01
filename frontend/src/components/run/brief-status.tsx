/**
 * How a brief's status is said, in one place, so the list and the detail agree.
 *
 * The expired case is the reason this file exists. A list of dead briefs that says
 * only "Expired" is a graveyard: the brand cannot tell the brief that nobody answered
 * from the one they closed themselves from the one whose deadline slipped past while
 * eleven offers sat waiting. Those are three different lessons and only one of them is
 * about the creators. So `expiry_reason` is rendered next to the badge, always, and
 * when the server sends `expired` without one we say that plainly rather than
 * inventing the most flattering explanation.
 */
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { EXPIRY_REASONS, type BriefStatus, type ExpiryReason } from "@/services/runApi"

const TONE: Record<BriefStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-transparent" },
  live: { label: "Live", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  awarded: { label: "Awarded", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground border-border" },
}

export function BriefStatusBadge({ status }: { status: BriefStatus }) {
  const tone = TONE[status] ?? TONE.draft
  return (
    <Badge variant="outline" className={`rounded-ds-control ${tone.className}`}>
      {tone.label}
    </Badge>
  )
}

/** The sentence that turns "Expired" into information. */
export function expiryLine(reason: ExpiryReason | null | undefined): string {
  if (!reason) return "It expired. We do not have a reason recorded — ask us and we will find out."
  return EXPIRY_REASONS[reason] ?? "It expired."
}
