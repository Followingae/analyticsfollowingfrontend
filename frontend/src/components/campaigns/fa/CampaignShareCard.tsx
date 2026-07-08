"use client"

// Brand-facing "Campaign link" card. Surfaces the dynamic share link
// (creatorapp.following.ae/c/<id>) that opens the campaign in the Following app so
// creators can apply. Read-only for brands — the cover image + logo are set by the
// Following team (superadmin) and are only PREVIEWED here, never editable.

import { useState } from "react"
import { Copy, Check, Link2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function CampaignShareCard({
  campaignId,
  coverUrl,
  logoUrl,
}: {
  campaignId: string
  coverUrl?: string | null
  logoUrl?: string | null
}) {
  const url = `https://creatorapp.following.ae/c/${campaignId}`
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Campaign link copied")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy — select and copy manually")
    }
  }

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-violet-500/[0.06] to-transparent p-5">
      <div className="flex items-start gap-4">
        {/* Cover + logo preview (read-only) */}
        <div className="relative h-16 w-16 shrink-0">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="h-16 w-16 rounded-xl object-cover border" />
          ) : (
            <div className="h-16 w-16 rounded-xl border bg-muted flex items-center justify-center">
              <Link2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {logoUrl && (
            <img src={logoUrl} alt="" className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full object-cover border-2 border-background bg-background" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Link2 className="h-4 w-4 text-violet-600" /> Campaign link
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Share this with creators — it opens your campaign in the Following app so they can apply.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate rounded-lg border bg-background px-3 py-2 font-mono text-sm">
              {url}
            </div>
            <Button size="sm" variant="outline" onClick={copy} className="shrink-0 gap-1.5">
              {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </Button>
            <Button size="sm" variant="ghost" asChild className="shrink-0 px-2" title="Open link">
              <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
