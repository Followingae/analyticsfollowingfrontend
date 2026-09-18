"use client"

/**
 * The content wall. One component, both audiences.
 *
 * WHY IT IS ONE COMPONENT. The client's wall and ours are the same rows; what differs is that
 * the server strips our internal notes and anything we have not sent from the brand's copy,
 * and that only the brand gets the two decision buttons. Building two walls is how the two
 * quietly drift until the client is looking at something we are not, and then nobody can work
 * out which screen is lying.
 *
 * THE THREE STATES ARE THE WHOLE LAYOUT, and they are decided per CREATOR rather than per
 * file, because that is how both sides think about it. A client asks "has Tasha's stuff come
 * in", never "is file three of four approved".
 *
 *   Waiting on you     big pictures, buttons on the card. The loudest thing on the page and
 *                      the only thing with anything to press.
 *   Approved           the frozen snapshot, a quiet mark, who and when. No buttons.
 *   Not delivered yet  the creator, the stage they are genuinely at, when it is due. Present
 *                      but subdued, so "what is still coming" is answered without leaving.
 *
 * Whitespace is doing real work here. The old campaign screens are dense tables because they
 * answer operational questions; this one answers "does this look right", so the picture is
 * the content and everything else gets out of its way.
 */

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Check, Clock, Film, ImageIcon, Loader2, Lock, MessageSquareWarning, Play,
  ExternalLink, Send,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ContentPlayer } from "@/components/content/ContentPlayer"
import {
  contentBrandApi, contentAdminApi, isVideo, STATE_COPY,
  type ContentWall as Wall, type CreatorContentGroup, type ContentItem,
} from "@/services/contentDeliveryApi"

// ── Tone per state. Colour carries it at a glance, the word carries it for everyone else ──
const TONE: Record<string, string> = {
  waiting_on_you: "text-amber-700 dark:text-amber-400",
  changes_requested: "text-rose-700 dark:text-rose-400",
  approved: "text-emerald-700 dark:text-emerald-400",
  with_us: "text-muted-foreground",
  in_production: "text-muted-foreground",
  awaited: "text-muted-foreground",
}

/**
 * The stage a creator is at, said in words a client would use.
 *
 * These are the NINE values `campaign_creators.stage` actually permits, read from its check
 * constraint. The first version of this map was written from memory and invented five stages
 * that do not exist (`guide_sent`, `product_ready`, `dispatched`, `received`, `content`),
 * so every real creator fell through the lookup and a client saw the raw code: a brand
 * looking at this screen was being told a creator was at "rate_agreed".
 */
const STAGE_COPY: Record<string, string> = {
  enrolled: "Booked",
  rate_agreed: "Booked",
  contracted: "Agreement signed",
  briefed: "Brief sent",
  content_in: "Content delivered",
  content_approved: "Approved",
  posted: "Posted",
  paid: "Complete",
  dropped: "No longer on this campaign",
}

function initials(name?: string | null, username?: string | null) {
  const s = (name || username || "?").trim()
  return s.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

// ── A single piece of content ─────────────────────────────────────────────────────────────
function Thumb({
  item, onOpen, size = "md",
}: { item: ContentItem; onOpen: () => void; size?: "md" | "sm" }) {
  const video = isVideo(item.media_type)
  return (
    <button
      onClick={onOpen}
      className={cn(
        "group relative isolate overflow-hidden rounded-ds-xl bg-muted text-left",
        "ring-1 ring-black/[0.06] transition dark:ring-white/[0.08]",
        "hover:ring-black/[0.14] focus-visible:outline focus-visible:outline-2",
        "focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:ring-white/20",
        // Vertical, because everything delivered here is a reel or a story.
        size === "md" ? "aspect-[9/13] w-full" : "aspect-[9/13] w-[104px] shrink-0",
      )}
    >
      {item.poster_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.poster_url} alt="" loading="lazy"
             className="absolute inset-0 h-full w-full object-cover transition duration-500
                        group-hover:scale-[1.03]" />
      ) : (
        // A poster we could not copy is a designed absence, not a broken image icon.
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b
                        from-muted to-muted-foreground/10">
          {video ? <Film className="h-6 w-6 text-muted-foreground/50" />
                 : <ImageIcon className="h-6 w-6 text-muted-foreground/50" />}
        </div>
      )}

      {video && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/45 p-2.5 backdrop-blur-sm transition
                           group-hover:bg-black/65">
            <Play className="h-4 w-4 fill-white text-white" />
          </span>
        </span>
      )}

      {item.status === "approved" && (
        <span className="absolute right-2 top-2 rounded-full bg-emerald-600/90 p-1">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
      {item.status === "changes_requested" && (
        <span className="absolute right-2 top-2 rounded-full bg-rose-600/90 p-1">
          <MessageSquareWarning className="h-3 w-3 text-white" />
        </span>
      )}
      {item.version_no > 1 && (
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-1.5 py-0.5
                         text-[10px] font-medium text-white backdrop-blur-sm">
          v{item.version_no}
        </span>
      )}
      {item.changed_after_approval_at && (
        <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 px-2 py-1 text-[10px]
                         font-medium text-white">
          Changed since approval
        </span>
      )}
    </button>
  )
}

// ── One creator ───────────────────────────────────────────────────────────────────────────
function CreatorCard({
  group, side, canDecide, onOpen, onRefresh, campaignId,
}: {
  group: CreatorContentGroup
  side: "brand" | "team"
  canDecide: boolean
  onOpen: (g: CreatorContentGroup, i: number) => void
  onRefresh: () => void
  campaignId: string
}) {
  const [asking, setAsking] = useState(false)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  const copy = STATE_COPY[group.state]
  const label = side === "brand" ? copy.brand : copy.team
  const loud = group.state === "waiting_on_you" || group.state === "changes_requested"
  const due = group.content_due ? new Date(group.content_due) : null
  const overdue = due && due < new Date() && group.state === "awaited"

  const act = async (kind: "approve" | "changes") => {
    try {
      setBusy(true)
      if (kind === "approve") {
        const r = await contentBrandApi.approve(campaignId, { campaign_creator_id: group.campaign_creator_id })
        toast.success(`Approved ${r.approved} piece${r.approved === 1 ? "" : "s"}`)
      } else {
        if (!note.trim()) { toast.error("Say what needs changing."); return }
        await contentBrandApi.requestChanges(campaignId, {
          note, campaign_creator_id: group.campaign_creator_id,
        })
        toast.success("Sent to the team")
        setAsking(false); setNote("")
      }
      onRefresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "That did not work.")
    } finally { setBusy(false) }
  }

  const send = async () => {
    try {
      setBusy(true)
      const r = await contentAdminApi.sendForReview(campaignId, {
        campaign_creator_id: group.campaign_creator_id,
      })
      toast.success(r.sent ? `${r.sent} piece${r.sent === 1 ? "" : "s"} sent to the client`
                           : "Nothing to send")
      onRefresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "That did not work.")
    } finally { setBusy(false) }
  }

  return (
    <article
      className={cn(
        "rounded-ds-2xl border p-5 transition sm:p-6",
        loud
          ? "border-black/[0.10] bg-background shadow-[0_1px_2px_rgba(16,20,12,0.04),0_14px_32px_-18px_rgba(16,20,12,0.22)] dark:border-white/[0.12]"
          : "border-black/[0.06] bg-background/60 dark:border-white/[0.07]",
        group.state === "awaited" && "opacity-[0.72]",
      )}
    >
      {/* Who */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={group.avatar ?? undefined} alt="" />
            <AvatarFallback className="text-[12px]">
              {initials(group.full_name, group.username)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium leading-tight">
              {group.full_name || group.username || "Creator"}
            </p>
            {group.username && (
              <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">@{group.username}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("text-[13px] font-medium", TONE[group.state])}>{label}</span>
          {group.counts.total > 0 && (
            <Badge variant="secondary" className="text-[11px]">
              {group.counts.total} piece{group.counts.total === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
      </header>

      {/* What */}
      {group.items.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {group.items.map((it, i) => (
            <Thumb key={it.id} item={it} onOpen={() => onOpen(group, i)} />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px]
                        text-muted-foreground">
          {/* An unmapped stage is a database code, not a sentence, so it is not shown at
              all. A missing line reads as "we have not said"; "rate_agreed" reads as a bug. */}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {(group.stage && STAGE_COPY[group.stage]) || "Not started"}
          </span>
          {due && (
            <span className={cn(overdue && "font-medium text-rose-700 dark:text-rose-400")}>
              {overdue ? "Was due " : "Due "}{due.toLocaleDateString()}
            </span>
          )}
          {(group.in_production ?? 0) > 0 && (
            <span>{group.in_production} piece{group.in_production === 1 ? "" : "s"} being prepared</span>
          )}
        </div>
      )}

      {/* The note the client left, shown to both sides */}
      {group.items.some((i) => i.review_note) && (
        <div className="mt-4 rounded-ds-lg border border-rose-200/60 bg-rose-50/50 px-4 py-3
                        dark:border-rose-900/40 dark:bg-rose-950/20">
          <p className="text-[11.5px] uppercase tracking-wide text-rose-700/70 dark:text-rose-400/70">
            Changes asked for
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed">
            {group.items.find((i) => i.review_note)?.review_note}
          </p>
        </div>
      )}

      {/* What you can do */}
      {side === "brand" && canDecide && group.counts.in_review > 0 && (
        asking ? (
          <div className="mt-5 space-y-3">
            <Textarea
              autoFocus value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="What needs to change?"
              className="min-h-[84px] resize-none text-[14px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setAsking(false); setNote("") }}>Cancel</Button>
              <Button onClick={() => act("changes")} disabled={busy || !note.trim()}>
                {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Send to the team
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setAsking(true)} className="gap-1.5">
              <MessageSquareWarning className="h-4 w-4" /> Changes needed
            </Button>
            <Button onClick={() => act("approve")} disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Approve all {group.counts.in_review}
            </Button>
          </div>
        )
      )}

      {side === "team" && group.counts.pending > 0 && canDecide && (
        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={send} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send {group.counts.pending} to the client
          </Button>
        </div>
      )}

      {/* Approved, and by whom. Quiet, and permanent. */}
      {group.state === "approved" && group.items[0]?.approved_at && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Approved{group.items[0].approved_by_name ? ` by ${group.items[0].approved_by_name}` : ""}
          {" on "}{new Date(group.items[0].approved_at).toLocaleDateString()}
        </p>
      )}
    </article>
  )
}

// ── The wall ──────────────────────────────────────────────────────────────────────────────
export function ContentWall({
  wall, campaignId, side, canDecide, onRefresh,
}: {
  wall: Wall
  campaignId: string
  side: "brand" | "team"
  /** brand: may approve. team: may send for review. */
  canDecide: boolean
  onRefresh: () => void
}) {
  const [player, setPlayer] = useState<{ items: ContentItem[]; index: number } | null>(null)

  const sections = useMemo(() => {
    const bucket = (states: string[]) => wall.creators.filter((g) => states.includes(g.state))
    return [
      {
        key: "act",
        title: side === "brand" ? "Waiting on you" : "With the client",
        sub: side === "brand"
          ? "Watch it here, then approve or say what needs changing."
          : "Sent for review. The client has not decided yet.",
        groups: bucket(["waiting_on_you", "changes_requested"]),
      },
      {
        key: "hold",
        title: side === "brand" ? "Being prepared" : "Not sent yet",
        sub: side === "brand"
          ? "Filming or editing. You will be asked when it is ready."
          : "We have it. The client has not been asked yet.",
        groups: bucket(["with_us", "in_production"]),
      },
      { key: "done", title: "Approved", sub: "Locked, with what was approved kept exactly as it was.",
        groups: bucket(["approved"]) },
      { key: "await", title: "Not delivered yet", sub: "Where each creator has got to.",
        groups: bucket(["awaited"]) },
    ].filter((s) => s.groups.length > 0)
  }, [wall, side])

  const nothing = wall.creators.length === 0

  return (
    <div className="space-y-10">
      {/* The count, and nothing round it. This used to read "22 pieces waiting for you to
          look at." - a sentence explaining to somebody, on the screen they deliberately
          opened, that there is content on it. The number is the information; the rest was
          the interface talking about itself. */}
      {wall.totals.awaiting_client > 0 && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {wall.totals.awaiting_client}
          </span>{" "}
          {side === "brand" ? "to review" : "with the client"}
        </p>
      )}

      {nothing && (
        <div className="rounded-ds-2xl border border-dashed border-black/[0.10] py-16 text-center
                        dark:border-white/[0.12]">
          <p className="text-[15px]">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] text-muted-foreground">
            {side === "brand"
              ? "Content appears here as your creators deliver it. We will email you when there is something to review."
              : "No creators on this campaign yet."}
          </p>
        </div>
      )}

      {sections.map((s) => (
        <section key={s.key} className="space-y-4">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{s.title}</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">{s.sub}</p>
          </div>
          <div className="space-y-4">
            {s.groups.map((g) => (
              <CreatorCard
                key={g.campaign_creator_id}
                group={g} side={side} canDecide={canDecide} campaignId={campaignId}
                onRefresh={onRefresh}
                onOpen={(grp, i) => setPlayer({ items: grp.items, index: i })}
              />
            ))}
          </div>
        </section>
      ))}

      {/* The escape hatch, only when a superadmin set one. The platform does not need it. */}
      {wall.source?.share_url && (
        <p className="pt-2">
          <Link href={wall.source.share_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground
                           underline-offset-4 hover:underline">
            Open the full set in Frame.io <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </p>
      )}

      {player && (
        <ContentPlayer
          open onOpenChange={(o) => { if (!o) setPlayer(null) }}
          items={player.items} index={player.index}
          onIndexChange={(i) => setPlayer((p) => (p ? { ...p, index: i } : p))}
          ctx={{ campaignId, side, canDecide: side === "brand" && canDecide }}
          onChanged={onRefresh}
        />
      )}
    </div>
  )
}
