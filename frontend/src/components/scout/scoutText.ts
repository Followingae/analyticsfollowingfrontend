import type { PersonStage, ScoutEvent } from "@/services/scoutApi"

/** One ScoutOutreach step in plain words. Shared by the live feed and a creator's timeline. */
export function eventText(e: ScoutEvent): string {
  const h = e.username ? `@${e.username}` : ""
  switch (e.kind) {
    case "found": return `Found ${h}${e.channel ? ` via ${e.channel}` : ""}`
    case "light_analysed": return `Checked ${h}`
    case "contacted": return `Messaged ${h}${e.channel ? ` on ${e.channel}` : ""}`
    case "replied": return `${h} replied`
    case "applied": return `${h} applied${e.detail?.campaign ? ` to ${e.detail.campaign}` : ""}`
    case "relevant": return `${h} is a relevant applicant${e.detail?.campaign ? ` for ${e.detail.campaign}` : ""}`
    case "added_to_database": return `${h} added to the database (main analytics started)`
    case "goal_met": return e.detail?.text || "Goal met"
    case "warning": return e.detail?.text || "Warning"
    default: return e.detail?.text || e.kind.replace(/_/g, " ")
  }
}

export const STAGE_LABEL: Record<PersonStage, string> = {
  queued: "Queued", contacted: "Contacted", clicked: "Clicked", chatting: "Chatting", applied: "Applied",
  relevant: "Relevant", shortlisted: "Shortlisted", in_proposal: "In proposal", passed: "Passed", failed: "Not sent",
  skipped: "Skipped", joined_app: "Joined app", in_database: "In database",
}

export function stageTone(s: PersonStage): string {
  switch (s) {
    case "relevant": case "shortlisted": case "in_proposal": case "joined_app": case "in_database":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "passed": case "failed": return "bg-red-50 text-red-700 border-red-200"
    case "skipped": return "bg-muted text-muted-foreground border-transparent"
    case "queued": return "bg-amber-50 text-amber-800 border-amber-200"
    default: return "bg-background text-foreground border-border"
  }
}

export function when(t?: string | null) {
  if (!t) return ""
  return new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}
