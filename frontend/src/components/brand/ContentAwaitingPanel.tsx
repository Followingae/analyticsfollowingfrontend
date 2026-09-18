"use client"

/**
 * Content ready for approval — one card, the creators side by side.
 *
 * THE POINT OF THIS COMPONENT is that a client should be able to clear their queue without
 * opening anything. The dashboard used to be organised around profile unlocks, which is a
 * thing they bought rather than a thing they have to DO; the one thing a brand actually owes
 * us an answer on is content, and it was not on this page at all.
 *
 * It was a stack of full-width rows, one per creator: avatar, name, buttons and a strip of
 * thumbnails, repeated down the page. With two creators that reads fine. With seven it is a
 * column of near-identical bars and the client cannot see their queue, only the top of it.
 * The work is the same shape every time, so it belongs in a grid: each creator is a tile,
 * three across, and the whole queue fits on one screen where it can be compared and cleared.
 *
 * Each tile leads with the content rather than with the person, because the decision is
 * about the content. Clicking it opens the same player the content page uses, so the two
 * behave identically.
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

/** One creator's content, as a tile. */
function CreatorTile({
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

  const cover = group.items[0]
  const more = group.items.length - 1

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      {/* The content first: it is what the decision is about. */}
      <button
        type="button"
        onClick={() => onOpen(group.items, 0)}
        className={cn(
          "group relative isolate aspect-[4/3] w-full overflow-hidden bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:ring-inset",
        )}
        aria-label={`Watch ${group.full_name || group.username || "this creator"}'s content`}
      >
        {cover?.poster_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.poster_url} alt="" loading="lazy"
               className="absolute inset-0 h-full w-full object-cover transition duration-500
                          group-hover:scale-[1.04]" />
        )}
        {cover && isVideo(cover.media_type) && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/45 p-2 backdrop-blur-sm">
              <Play className="h-4 w-4 fill-white text-white" />
            </span>
          </span>
        )}
        {more > 0 && (
          <Badge variant="secondary" className="absolute right-2 top-2 tabular-nums">
            +{more}
          </Badge>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={group.avatar ?? undefined} alt="" />
            <AvatarFallback className="text-[10px]">
              {initials(group.full_name, group.username)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {/* dir="auto" so an Arabic creator name reads correctly rather than being
                forced left to right. Same reason the email does it. */}
            <p dir="auto" className="truncate text-sm font-medium leading-tight">
              {group.full_name || group.username || "Creator"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {group.counts.in_review} piece{group.counts.in_review === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {asking ? (
          <div className="space-y-2">
            <Textarea
              autoFocus value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="What needs to change?"
              className="min-h-[68px] resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm"
                      onClick={() => { setAsking(false); setNote("") }}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => act("changes")} disabled={busy || !note.trim()}>
                {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Send
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5"
                    onClick={() => setAsking(true)}>
              <MessageSquareWarning className="h-3.5 w-3.5" /> Changes
            </Button>
            <Button size="sm" className="flex-1 gap-1.5"
                    onClick={() => act("approve")} disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Check className="h-3.5 w-3.5" />}
              Approve
            </Button>
          </div>
        )}
      </div>
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
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Content ready for approval</CardTitle>
          <CardDescription>
            {focus.waiting} piece{focus.waiting === 1 ? "" : "s"} on {focus.campaign_name}.
            Watch it here, then approve it or tell us what to change.
          </CardDescription>
        </div>
        <Link href={`/campaigns/${focus.campaign_id}/content`}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm text-primary
                         hover:underline">
          See all content <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <CardContent>
        {/* Three across on a laptop. The tiles are the same shape every time, so a client
            with seven creators waiting sees seven decisions rather than the top of a list. */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {focus.creators.map((g) => (
            <CreatorTile
              key={g.campaign_creator_id}
              group={g}
              campaignId={focus.campaign_id}
              onOpen={(items, i) => setPlayer({ items, index: i })}
              onDone={onChanged}
            />
          ))}
        </div>
      </CardContent>

      {player && (
        <ContentPlayer
          open onOpenChange={(o) => { if (!o) setPlayer(null) }}
          items={player.items} index={player.index}
          onIndexChange={(i) => setPlayer((p) => (p ? { ...p, index: i } : p))}
          ctx={{ campaignId: focus.campaign_id, side: "brand", canDecide: true }}
          onChanged={onChanged}
        />
      )}
    </Card>
  )
}
