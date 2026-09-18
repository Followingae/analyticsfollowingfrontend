"use client"

/**
 * Content ready for approval — what is waiting, and one way in.
 *
 * This has now been wrong in three different directions, and the reasoning is worth keeping
 * so it is not rediscovered a fourth time.
 *
 * It began as a stack of full-width rows, one per creator, each carrying Approve and
 * Changes. The argument was that a client should be able to clear their queue without
 * opening anything. With seven creators that is seven near-identical bars down the page, and
 * the client sees the top of their queue rather than the queue.
 *
 * It was then a grid of tiles, three across, still carrying Approve and Changes, with a big
 * poster on each. Better shape, same mistake twice over: the posters were the largest thing
 * on the dashboard, and the decision was still here.
 *
 * THE DECISION DOES NOT BELONG ON A DASHBOARD. Approving a piece of content is a judgement
 * about the content, and it should be made where the content is actually watched, at a size
 * where it can be judged. A dashboard that offers Approve next to a 90-pixel thumbnail is
 * inviting somebody to approve work they have not seen, and the client is the one who
 * carries that. The dashboard's job is to say a thing is waiting and to open the door.
 *
 * So: what is waiting, who it is from, a strip of small stills to show it is real, and one
 * proper button. The stills open the player for a quick look, because watching is not
 * deciding.
 *
 * RENDERS NOTHING when there is nothing waiting. That is the house rule for this product:
 * no empty states, no placeholders, no upsell where a feature would be.
 */

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ContentPlayer } from "@/components/content/ContentPlayer"
import {
  isVideo, type ContentItem, type CreatorContentGroup,
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

export function ContentAwaitingPanel({
  focus, onChanged,
}: { focus: ContentFocus | null; onChanged: () => void }) {
  const router = useRouter()
  const [player, setPlayer] = useState<{ items: ContentItem[]; index: number } | null>(null)

  // Every waiting piece, flattened, because the strip is a sample of the work rather than a
  // roster of the people. Who made what is answered on the page the button opens.
  const all = useMemo(
    () => (focus?.creators ?? []).flatMap((c) => c.items),
    [focus],
  )

  // No content waiting is not an empty state to be drawn, it is a section that does not
  // exist. Same rule as everywhere else in this product.
  if (!focus || !focus.creators.length) return null

  const href = `/campaigns/${focus.campaign_id}/content`
  const people = focus.creators.length
  const shown = all.slice(0, 6)
  const more = all.length - shown.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content ready for approval</CardTitle>
        <CardDescription>
          {focus.waiting} piece{focus.waiting === 1 ? "" : "s"} from {people}{" "}
          creator{people === 1 ? "" : "s"} on {focus.campaign_name}.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {/* Who it is from: faces, overlapped, the way every product shows a small group. */}
          <div className="flex -space-x-2">
            {focus.creators.slice(0, 4).map((c) => (
              <Avatar key={c.campaign_creator_id} className="h-7 w-7 ring-2 ring-card">
                <AvatarImage src={c.avatar ?? undefined} alt="" />
                <AvatarFallback className="text-[10px]">
                  {initials(c.full_name, c.username)}
                </AvatarFallback>
              </Avatar>
            ))}
            {people > 4 && (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[10px]
                               font-medium tabular-nums ring-2 ring-card">
                +{people - 4}
              </span>
            )}
          </div>

          {/* A sample of the work, small. These are for recognising that something is there,
              not for judging it: judging happens at full size behind the button. */}
          <div className="flex items-center gap-1.5">
            {shown.map((it, i) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setPlayer({ items: all, index: i })}
                aria-label="Watch this"
                className={cn(
                  "group relative isolate h-12 w-12 shrink-0 overflow-hidden rounded-md",
                  "bg-muted ring-1 ring-border transition hover:ring-foreground/25",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {it.poster_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.poster_url} alt="" loading="lazy"
                       className="absolute inset-0 h-full w-full object-cover" />
                )}
                {isVideo(it.media_type) && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-3 w-3 fill-white text-white drop-shadow" />
                  </span>
                )}
              </button>
            ))}
            {more > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">+{more}</span>
            )}
          </div>
        </div>

        {/* One action, at the size an action should be. This was a small text link while the
            thumbnails beside it were the biggest thing on the page. */}
        <Button onClick={() => router.push(href)} className="gap-1.5">
          Review content <ArrowRight className="h-4 w-4" />
        </Button>
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
