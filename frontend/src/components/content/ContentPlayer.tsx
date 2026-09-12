"use client"

/**
 * The content, playing here.
 *
 * WHY THIS EXISTS AT ALL. Content is produced in Frame.io, and the obvious thing to build was
 * a button that opens Frame.io. That is a worse product: it takes the client out of the
 * platform mid-decision, shows them a tool they did not ask to learn, and leaves the approval
 * somewhere we cannot read. So the video plays here and the decision is made here, and
 * Frame.io becomes the place the work is DONE rather than the place the client is SENT.
 *
 * HOW IT PLAYS WITHOUT A TOKEN. The URLs come from our own API, minted per request on the
 * server and signed for a few minutes. Nothing in this file knows a Frame.io token, folder or
 * project exists; it asks our backend for "the thing to play" and gets back a URL.
 *
 * HLS FIRST, AND THIS IS NOT A PREFERENCE. Half the delivered files are `.MOV` masters at
 * fifty megabytes and up — `video/quicktime`, which Chrome will not play at all and which
 * nobody should be made to download in full to watch ten seconds. Frame.io's HLS rendition
 * plays everywhere, starts immediately and streams only what is watched. Safari plays HLS
 * natively so it needs no library; everything else loads hls.js, and only then, so a client
 * looking at photographs never downloads a video player.
 *
 * The decision buttons live in here rather than only on the card because the moment somebody
 * decides is the moment they have just finished watching.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, X, ChevronLeft, ChevronRight, Check, MessageSquareWarning, Download, Lock } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  contentAdminApi, contentBrandApi, isVideo, prettySize,
  type ContentItem, type Playback,
} from "@/services/contentDeliveryApi"

export interface PlayerContext {
  campaignId: string
  /** 'brand' asks the brand endpoints and shows the two decision buttons. */
  side: "brand" | "team"
  /** Whether this viewer may decide. A team member never can: approving is the client's. */
  canDecide: boolean
}

export function ContentPlayer({
  open, onOpenChange, items, index, onIndexChange, ctx, onChanged,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** The whole creator's delivery, so the arrows move through it without closing. */
  items: ContentItem[]
  index: number
  onIndexChange: (i: number) => void
  ctx: PlayerContext
  onChanged?: () => void
}) {
  const item = items[index]
  const [media, setMedia] = useState<Playback | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // ── Fetch the signed URLs for whichever piece is showing ──────────────────────────────
  useEffect(() => {
    if (!open || !item) return
    let alive = true
    setLoading(true); setFailed(null); setMedia(null)
    const api = ctx.side === "brand" ? contentBrandApi : contentAdminApi
    api.playback(ctx.campaignId, item.id)
      .then((m) => { if (alive) setMedia(m) })
      .catch((e: unknown) => {
        if (alive) setFailed(e instanceof Error ? e.message : "That would not load.")
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // Keyed on the item's ID, not the item. The object identity changes every time the wall
    // refreshes after an approval, and depending on it would re-mint signed URLs and restart
    // the video the moment somebody approved the thing they were watching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id, ctx.campaignId, ctx.side])

  // ── Attach the stream ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video || !media || !isVideo(media.media_type)) return

    // Safari and iOS play HLS with no help. Loading a library there would be dead weight.
    if (media.hls && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = media.hls
      return
    }

    if (media.hls) {
      let hls: { destroy: () => void } | null = null
      let cancelled = false
      // Imported here, not at the top of the file, so the player weighs nothing until
      // somebody actually opens a video.
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled || !videoRef.current) return
        if (Hls.isSupported()) {
          const h = new Hls({ enableWorker: true, lowLatencyMode: false })
          h.loadSource(media.hls as string)
          h.attachMedia(videoRef.current)
          // A broken stream must fall back rather than show a black rectangle for ever.
          h.on(Hls.Events.ERROR, (_e, data) => {
            if (data?.fatal && videoRef.current && media.mp4) {
              h.destroy()
              videoRef.current.src = media.mp4
            }
          })
          hls = h
        } else if (media.mp4 && videoRef.current) {
          videoRef.current.src = media.mp4
        }
      }).catch(() => {
        if (!cancelled && videoRef.current && media.mp4) videoRef.current.src = media.mp4
      })
      return () => { cancelled = true; hls?.destroy() }
    }

    if (media.mp4) video.src = media.mp4
  }, [media])

  // ── Keyboard ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (asking) return
      if (e.key === "ArrowRight" && index < items.length - 1) onIndexChange(index + 1)
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, index, items.length, asking, onIndexChange])

  const decide = useCallback(async (kind: "approve" | "changes") => {
    if (!item) return
    try {
      setBusy(true)
      if (kind === "approve") {
        await contentBrandApi.approve(ctx.campaignId, { item_ids: [item.id] })
        toast.success("Approved")
      } else {
        if (!note.trim()) { toast.error("Say what needs changing."); return }
        await contentBrandApi.requestChanges(ctx.campaignId, { note, item_ids: [item.id] })
        toast.success("Sent to the team")
        setAsking(false); setNote("")
      }
      onChanged?.()
      if (index < items.length - 1) onIndexChange(index + 1)
      else onOpenChange(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "That did not work.")
    } finally { setBusy(false) }
  }, [item, note, index, items.length, ctx.campaignId, onChanged, onIndexChange, onOpenChange])

  if (!item) return null
  const locked = item.status === "approved"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(1100px,95vw)] gap-0 overflow-hidden border-0 bg-[#0B0B09] p-0 text-white"
        showCloseButton={false}
      >
        {/* Header: what this is, and where you are in the set. */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium">{item.name}</p>
            <p className="mt-0.5 text-[12px] text-white/50">
              {items.length > 1 && <>{index + 1} of {items.length} · </>}
              {prettySize(item.file_size)}
              {item.version_no > 1 && <> · version {item.version_no}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {locked && (
              <Badge className="gap-1 border-0 bg-white/10 text-white/80">
                <Lock className="h-3 w-3" /> Approved
              </Badge>
            )}
            <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)}
                    className="h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* The stage. Black, tall, and nothing else on it. */}
        <div className="relative flex min-h-[45vh] items-center justify-center bg-black">
          {loading && <Loader2 className="h-7 w-7 animate-spin text-white/40" />}

          {failed && !loading && (
            <div className="px-8 py-16 text-center">
              <p className="text-[15px] text-white/80">This would not play</p>
              <p className="mt-2 text-[13px] text-white/50">{failed}</p>
            </div>
          )}

          {media && !loading && !failed && (
            isVideo(media.media_type) ? (
              <video
                ref={videoRef}
                poster={media.poster ?? undefined}
                controls
                playsInline
                className="max-h-[70vh] w-full"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.mp4 || media.poster || ""} alt={media.name}
                   className="max-h-[70vh] w-auto object-contain" />
            )
          )}

          {/* Arrows only where there is somewhere to go. */}
          {index > 0 && (
            <button onClick={() => onIndexChange(index - 1)} aria-label="Previous"
                    className="absolute left-3 rounded-full bg-black/50 p-2 text-white/70
                               backdrop-blur transition hover:bg-black/70 hover:text-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {index < items.length - 1 && (
            <button onClick={() => onIndexChange(index + 1)} aria-label="Next"
                    className="absolute right-3 rounded-full bg-black/50 p-2 text-white/70
                               backdrop-blur transition hover:bg-black/70 hover:text-white">
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* The decision. */}
        <div className="px-5 py-4">
          {item.review_note && (
            <div className="mb-3 rounded-ds-lg bg-white/[0.06] px-3.5 py-2.5">
              <p className="text-[12px] uppercase tracking-wide text-white/40">Changes asked for</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-white/85">{item.review_note}</p>
            </div>
          )}

          {locked ? (
            <p className="text-[13px] text-white/50">
              Approved{item.approved_by_name ? ` by ${item.approved_by_name}` : ""}
              {item.approved_at ? ` on ${new Date(item.approved_at).toLocaleDateString()}` : ""}.
              {item.changed_after_approval_at && " This file has changed since."}
            </p>
          ) : !ctx.canDecide ? (
            <p className="text-[13px] text-white/50">
              {ctx.side === "team"
                ? "Approving is the client's decision."
                : "Waiting on the team."}
            </p>
          ) : asking ? (
            <div className="space-y-3">
              <Textarea
                autoFocus value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="What needs to change?"
                className="min-h-[84px] resize-none border-white/15 bg-white/[0.06] text-[14px]
                           text-white placeholder:text-white/35 focus-visible:ring-white/25"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setAsking(false); setNote("") }}
                        className="text-white/70 hover:bg-white/10 hover:text-white">
                  Cancel
                </Button>
                <Button onClick={() => decide("changes")} disabled={busy || !note.trim()}>
                  {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Send to the team
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {media?.mp4 && (
                <a href={media.mp4} download target="_blank" rel="noreferrer"
                   className="mr-auto inline-flex items-center gap-1.5 text-[13px] text-white/50
                              transition hover:text-white/80">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              )}
              <Button variant="ghost" onClick={() => setAsking(true)}
                      className="gap-1.5 text-white/80 hover:bg-white/10 hover:text-white">
                <MessageSquareWarning className="h-4 w-4" /> Changes needed
              </Button>
              <Button onClick={() => decide("approve")} disabled={busy} className="gap-1.5">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
