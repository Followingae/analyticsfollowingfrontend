"use client"

/**
 * The creator's own Instagram insights, as screenshots they sent us.
 *
 * Whatever is here is shown to every brand that sees this creator in a proposal, behind a
 * "Creator insights" button in the creator sheet, in the order set here. An empty tab means
 * no button at all, so removing the last screenshot is how the button is taken away.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { ScreenshotLightbox } from "@/components/ScreenshotLightbox"
import type { MasterInfluencer } from "@/types/influencerDatabase"

type Shot = { url: string; uploaded_at?: string }
const MAX = 10

async function call(path: string, init: RequestInit = {}): Promise<Shot[]> {
  const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/influencers/${path}`, {
    ...init,
    headers: { Authorization: (getAuthHeaders() as Record<string, string>).Authorization || "", ...(init.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = body?.detail
    throw new Error(typeof d === "string" ? d : Array.isArray(d) ? d.map((x: any) => x?.msg).join("; ") : `Failed (${res.status})`)
  }
  return body?.data?.items ?? []
}

export function InfluencerInsightsTab({ influencer }: { influencer: MasterInfluencer }) {
  const id = influencer.id
  const [shots, setShots] = useState<Shot[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [viewAt, setViewAt] = useState<number | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try { setShots(await call(`${id}/direct-analytics`)) }
    catch (e: any) { setShots([]); toast.error(e.message || "Could not load the screenshots") }
  }, [id])
  useEffect(() => { setShots(null); load() }, [load])

  const upload = async (files: File[]) => {
    const images = files.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type))
    if (images.length < files.length) toast.error("Only JPG, PNG or WebP images can be added")
    if (!images.length) return
    const room = MAX - (shots?.length ?? 0)
    if (images.length > room) { toast.error(`There is room for ${room} more (at most ${MAX})`); return }
    const form = new FormData()
    images.forEach((f) => form.append("files", f))
    setBusy("upload")
    try {
      setShots(await call(`${id}/direct-analytics`, { method: "POST", body: form }))
      toast.success(images.length === 1 ? "Screenshot added" : `${images.length} screenshots added`)
    } catch (e: any) { toast.error(e.message || "Upload failed") }
    finally { setBusy(null); if (input.current) input.current.value = "" }
  }

  const remove = async (url: string) => {
    setBusy(url)
    try {
      setShots(await call(`${id}/direct-analytics?url=${encodeURIComponent(url)}`, { method: "DELETE" }))
      toast.success("Removed. Brands no longer see it.")
    } catch (e: any) { toast.error(e.message || "Could not remove it") }
    finally { setBusy(null) }
  }

  const move = async (from: number, step: number) => {
    if (!shots) return
    const to = from + step
    if (to < 0 || to >= shots.length) return
    const next = [...shots]
    ;[next[from], next[to]] = [next[to], next[from]]
    setShots(next)
    try {
      setShots(await call(`${id}/direct-analytics/order`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: next.map((s) => s.url) }),
      }))
    } catch (e: any) { toast.error(e.message || "Could not reorder"); load() }
  }

  const full = (shots?.length ?? 0) >= MAX

  return (
    <div className="flex flex-col gap-ds-4">
      <div>
        <p className="text-ds-subheading">Creator insights</p>
        <p className="mt-ds-1 text-ds-body text-muted-foreground">
          Screenshots of their own Instagram insights, sent to us by the creator. Brands see
          these from the creator sheet in any proposal, in this order. With none here, the
          button does not show.
        </p>
      </div>

      <button
        type="button"
        disabled={full || busy === "upload"}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(Array.from(e.dataTransfer.files)) }}
        className={cn(
          "flex flex-col items-center justify-center gap-ds-2 rounded-xl border-2 border-dashed px-ds-4 py-ds-6 text-center transition",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30 hover:bg-muted/40",
          (full || busy === "upload") && "pointer-events-none opacity-60",
        )}
      >
        {busy === "upload" ? <Loader2 className="size-6 animate-spin text-muted-foreground" /> : <ImagePlus className="size-6 text-muted-foreground" />}
        <span className="text-ds-body font-medium">
          {busy === "upload" ? "Uploading…" : full ? `Full (${MAX} screenshots)` : "Drop screenshots here, or click to choose"}
        </span>
        <span className="text-ds-caption text-muted-foreground">JPG, PNG or WebP, up to 15MB each</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => upload(Array.from(e.target.files || []))}
      />

      {shots === null ? (
        <div className="flex justify-center py-ds-4"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : shots.length > 0 && (
        <div className="grid grid-cols-3 gap-ds-3 sm:grid-cols-4">
          {shots.map((s, i) => (
            <div key={s.url} className="group relative overflow-hidden rounded-xl border bg-muted/40">
              <button type="button" onClick={() => setViewAt(i)} className="block aspect-[9/16] w-full">
                <img src={s.url} alt={`Screenshot ${i + 1}`} className="size-full object-cover object-top" />
              </button>
              <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 text-[11px] font-semibold text-white">{i + 1}</span>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <div className="flex gap-1">
                  <Button size="icon" variant="secondary" className="size-7" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier">
                    <ArrowLeft className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="secondary" className="size-7" disabled={i === shots.length - 1} onClick={() => move(i, 1)} aria-label="Move later">
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
                <Button size="icon" variant="destructive" className="size-7" disabled={busy === s.url} onClick={() => remove(s.url)} aria-label="Remove">
                  {busy === s.url ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScreenshotLightbox
        images={(shots ?? []).map((s) => s.url)}
        open={viewAt !== null}
        startAt={viewAt ?? 0}
        onOpenChange={(o) => { if (!o) setViewAt(null) }}
        title={`@${influencer.username}: insights`}
        subtitle="What brands see"
      />
    </div>
  )
}
