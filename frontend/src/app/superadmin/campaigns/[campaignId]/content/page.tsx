"use client"

/**
 * Content, our side of it.
 *
 * The same wall the client sees, plus the three things only we have: what has not been sent
 * yet, what the folder is, and what was said in Frame.io.
 *
 * WHO SEES WHAT HERE is decided by the levelled access model rather than by role:
 *   content at `view`   the wall, and the player
 *   content at `write`  sending a creator's delivery to the client, and syncing
 *   superadmin          the source panel: sign-in, allocation, unmatched folders, share link
 *
 * The source panel is a DIALOG on this page, not a page of its own. A Frame.io folder is a
 * fact about a campaign, so it belongs on the campaign; and a superadmin only ever wants the
 * sign-in at the moment they are trying to link something and find they cannot.
 */

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, RefreshCw, Settings2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Button } from "@/components/ui/button"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { ContentWall } from "@/components/content/ContentWall"
import { FrameioPanel } from "@/components/content/FrameioPanel"
import { contentAdminApi, type ContentWall as Wall, type ContentSource } from "@/services/contentDeliveryApi"

export default function CampaignContentPage() {
  const campaignId = useParams().campaignId as string
  const router = useRouter()
  const { isSuperAdmin, canDo, loading: accessLoading } = useAdminAccess()

  const [wall, setWall] = useState<Wall | null>(null)
  const [source, setSource] = useState<ContentSource | null>(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [panel, setPanel] = useState(false)

  const canWrite = canDo("content", "write")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [w, s] = await Promise.all([
        contentAdminApi.wall(campaignId),
        contentAdminApi.source(campaignId).catch(() => null),
      ])
      setWall(w); setSource(s); setFailure(null)
    } catch (e: unknown) {
      // An error is not an empty campaign. Saying "no content yet" here would send somebody
      // chasing creators who have already delivered.
      setWall(null)
      setFailure(e instanceof Error ? e.message : "The request did not complete")
    } finally { setLoading(false) }
  }, [campaignId])

  useEffect(() => { if (campaignId) void load() }, [campaignId, load])

  const sync = async () => {
    try {
      setSyncing(true)
      const r = await contentAdminApi.sync(campaignId)
      const c = r.counts || {}
      toast.success(`${c.new ?? 0} new, ${c.updated ?? 0} updated`)
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not read the folder.")
    } finally { setSyncing(false) }
  }

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground"
                    onClick={() => router.push(`/work/campaigns/${campaignId}/timeline`)}>
              <ArrowLeft className="h-3.5 w-3.5" /> Campaign
            </Button>
            <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[34px]">
              Content
            </h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              What each creator has delivered, and where the client has got to with it.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {source?.linked && canWrite && (
              <Button variant="outline" size="sm" onClick={sync} disabled={syncing} className="gap-1.5">
                {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                         : <RefreshCw className="h-3.5 w-3.5" />}
                Sync
              </Button>
            )}
            {/* The only superadmin-only control on the page, and it opens everything else. */}
            {isSuperAdmin && (
              <Button variant="outline" size="sm" onClick={() => setPanel(true)} className="gap-1.5">
                <Settings2 className="h-3.5 w-3.5" />
                {source?.linked ? "Source" : "Link a folder"}
              </Button>
            )}
          </div>
        </div>

        {/* Health, where the person who can fix it will see it. */}
        {source?.linked && source.last_sync_error && (
          <div className="flex items-start gap-2 rounded-ds-xl border border-rose-200/70 bg-rose-50/40
                          px-4 py-3 text-[13.5px] dark:border-rose-900/40 dark:bg-rose-950/15">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div>
              <p className="font-medium">The last read of the Frame.io folder failed</p>
              <p className="mt-0.5 text-muted-foreground">{source.last_sync_error}</p>
            </div>
          </div>
        )}

        {accessLoading || loading ? (
          <div className="flex justify-center py-ds-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : failure ? (
          <div className="py-ds-6 text-center">
            <p className="text-ds-subheading">Could not load the content</p>
            <p className="mt-ds-2 text-ds-body text-muted-foreground">
              Nothing is missing. We just could not read it.
            </p>
            <p className="mt-ds-2 text-ds-caption text-muted-foreground">{failure}</p>
            <Button variant="outline" size="sm" className="mt-ds-3" onClick={load}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
            </Button>
          </div>
        ) : !source?.linked ? (
          <div className="rounded-ds-2xl border border-dashed border-black/[0.10] py-16 text-center
                          dark:border-white/[0.12]">
            <p className="text-[15px]">No content folder on this campaign yet</p>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] text-muted-foreground">
              {isSuperAdmin
                ? "Link the campaign's Frame.io folder and everything the creators have delivered appears here."
                : "A superadmin needs to link this campaign's Frame.io folder."}
            </p>
            {isSuperAdmin && (
              <Button className="mt-5" onClick={() => setPanel(true)}>Link a folder</Button>
            )}
          </div>
        ) : wall ? (
          <>
            {/* Content we hold that belongs to nobody yet. Ours to answer, never the client's. */}
            {wall.unfiled.length > 0 && isSuperAdmin && (
              <div className="rounded-ds-xl border border-amber-200/70 bg-amber-50/40 px-4 py-3
                              dark:border-amber-900/40 dark:bg-amber-950/15">
                <p className="text-[13.5px] font-medium">
                  {wall.unfiled.length} piece{wall.unfiled.length === 1 ? "" : "s"} not matched to a creator
                </p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Open Source to say which creator those folders belong to. The client never sees them.
                </p>
              </div>
            )}

            <ContentWall
              wall={wall} campaignId={campaignId} side="team"
              canDecide={canWrite} onRefresh={load}
            />
          </>
        ) : null}

        {isSuperAdmin && (
          <FrameioPanel campaignId={campaignId} open={panel} onOpenChange={setPanel}
                        onChanged={load} />
        )}
      </div>
    </SuperadminLayout>
  )
}
