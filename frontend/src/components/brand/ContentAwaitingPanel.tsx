"use client"

/**
 * What is waiting on the client, on their home screen, with the buttons right there.
 *
 * THE POINT OF THIS COMPONENT is that a client should be able to clear their queue without
 * opening anything. The dashboard used to be organised around profile unlocks, which is a
 * thing they bought rather than a thing they have to DO; the one thing a brand actually owes
 * us an answer on is content, and it was not on this page at all.
 *
 * Big pictures, generous space, and the two decisions. A creator approved from here
 * disappears from the panel, and when the last one goes the whole panel goes with it, so a
 * client who is up to date sees a shorter page rather than an empty box congratulating them.
 *
 * RENDERS NOTHING when there is nothing waiting. That is the house rule for this product:
 * no empty states, no placeholders, no upsell where a feature would be.
 */

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Loader2, MessageSquareWarning, Play } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ContentPlayer } from "@/components/content/ContentPlayer"
import {
  contentBrandApi, isVideo,
  type ContentItem, type CreatorContentGroup,
} from "@/services/contentDeliveryApi"

export interface ContentFocus {
  campaign_id: string
  campaign_name: string
  waiting: number
  creators: CreatorContentGroup[]
}

function initials(name?: string | null, username?: string | null) {
  const s = (name || username || "?").trim()
  return s.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

function Row({
  group, campaignId, onOpen, onDone,
}: {
  group: CreatorContentGroup
  campaignId: string
  onOpen: (items: ContentItem[], i: number) => void
  onDone: () => void
}) {
  const [asking, setAsking] = useState(false)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  const act = async (kind: "approve" | "changes") => {
    try {
      setBusy(true)
      if (kind === "approve") {
        const r = await contentBrandApi.approve(campaignId, {
          campaign_creator_id: group.campaign_creator_id,
        })
        toast.success(`Approved ${r.approved} piece${r.approved === 1 ? "" : "s"}`)
      } else {
        if (!note.trim()) { toast.error("Say what needs changing."); return }
        await contentBrandApi.requestChanges(campaignId, {
          note, campaign_creator_id: group.campaign_creator_id,
        })
        toast.success("Sent to the team")
        setAsking(false); setNote("")
      }
      onDone()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "That did not work.")
    } finally { setBusy(false) }
  }

  return (
    <div className="border-t border-black/[0.06] py-ds-4 first:border-t-0 first:pt-0
                    dark:border-white/[0.07]">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div className="flex min-w-0 items-center gap-ds-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={group.avatar ?? undefined} alt="" />
            <AvatarFallback className="text-ds-caption">
              {initials(group.full_name, group.username)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {/* dir="auto" so an Arabic creator name reads correctly rather than being
                forced left to right. Same reason the email does it. */}
            <p dir="auto" className="truncate text-ds-body font-medium">
              {group.full_name || group.username || "Creator"}
            </p>
            <p className="mt-0.5 truncate text-ds-caption text-muted-foreground">
              {group.username ? `@${group.username} · ` : ""}
              {group.counts.in_review} piece{group.counts.in_review === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {!asking && (
          <div className="flex shrink-0 items-center gap-ds-2">
            <Button variant="ghost" size="sm" onClick={() => setAsking(true)}
                    className="gap-1.5 text-muted-foreground">
              <MessageSquareWarning className="h-4 w-4" /> Changes
            </Button>
            <Button size="sm" onClick={() => act("approve")} disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* The content itself. Clicking one opens the player, which is the same player the
          content page uses, so the two behave identically. */}
      <div className="mt-ds-3 flex flex-wrap gap-ds-2">
        {group.items.slice(0, 5).map((it, i) => (
          <button
            key={it.id}
            onClick={() => onOpen(group.items, i)}
            className={cn(
              "group relative isolate aspect-[9/13] w-[86px] overflow-hidden rounded-ds-md",
              "bg-muted ring-1 ring-black/[0.06] transition hover:ring-black/[0.14]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-primary dark:ring-white/[0.08] dark:hover:ring-white/20",
            )}
          >
            {it.poster_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.poster_url} alt="" loading="lazy"
                   className="absolute inset-0 h-full w-full object-cover transition duration-500
                              group-hover:scale-[1.04]" />
            )}
            {isVideo(it.media_type) && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-black/45 p-1.5 backdrop-blur-sm">
                  <Play className="h-3 w-3 fill-white text-white" />
                </span>
              </span>
            )}
          </button>
        ))}
        {group.items.length > 5 && (
          <span className="self-center text-ds-caption text-muted-foreground">
            +{group.items.length - 5}
          </span>
        )}
      </div>

      {asking && (
        <div className="mt-ds-3 space-y-ds-2">
          <Textarea
            autoFocus value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="What needs to change?"
            className="min-h-[76px] resize-none text-ds-body"
          />
          <div className="flex justify-end gap-ds-2">
            <Button variant="ghost" size="sm" onClick={() => { setAsking(false); setNote("") }}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => act("changes")} disabled={busy || !note.trim()}>
              {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Send to the team
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ContentAwaitingPanel({
  focus, onChanged,
}: { focus: ContentFocus | null; onChanged: () => void }) {
  const [player, setPlayer] = useState<{ items: ContentItem[]; index: number } | null>(null)

  // No content waiting is not an empty state to be drawn, it is a section that does not
  // exist. Same rule as everywhere else in this product.
  if (!focus || !focus.creators.length) return null

  return (
    <section className="flex flex-col gap-ds-4">
      <div className="flex flex-wrap items-baseline justify-between gap-ds-2">
        <div>
          <h2 className="text-ds-subheading">
            {focus.waiting} piece{focus.waiting === 1 ? "" : "s"} waiting on you
          </h2>
          <p className="mt-ds-1 text-ds-body-sm text-muted-foreground">
            On {focus.campaign_name}. Watch it here, then approve it or tell us what to change.
          </p>
        </div>
        <Link href={`/campaigns/${focus.campaign_id}/content`}
              className="inline-flex items-center gap-1.5 text-ds-body-sm text-primary
                         hover:underline">
          See all content <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-ds-lg border border-black/[0.06] p-ds-4 dark:border-white/[0.07]">
        {focus.creators.map((g) => (
          <Row
            key={g.campaign_creator_id}
            group={g}
            campaignId={focus.campaign_id}
            onOpen={(items, i) => setPlayer({ items, index: i })}
            onDone={onChanged}
          />
        ))}
      </div>

      {player && (
        <ContentPlayer
          open onOpenChange={(o) => { if (!o) setPlayer(null) }}
          items={player.items} index={player.index}
          onIndexChange={(i) => setPlayer((p) => (p ? { ...p, index: i } : p))}
          ctx={{ campaignId: focus.campaign_id, side: "brand", canDecide: true }}
          onChanged={onChanged}
        />
      )}
    </section>
  )
}
