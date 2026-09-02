"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
// Every superadmin page supplies its own shell — app/superadmin/layout.tsx is a
// pass-through that only sets metadata. SuperadminLayout is what renders the sidebar
// AND wraps the page in <AuthGuard>, which holds rendering until the session is
// resolved. Without it this page mounted immediately, fired its fetch before a token
// existed, and every call came back 401.
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { CampaignsHubHeader } from "@/components/console/CampaignsHubHeader"
import {
  reportCampaignApi,
  shareUrlFor,
  type ReportCampaignSummary,
} from "@/services/reportCampaignApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  BarChart3, Plus, Link2, Copy, Check, Loader2, Eye, EyeOff, ExternalLink, FileText,
} from "lucide-react"

export default function ReportCampaignsPage() {
  const [rows, setRows] = useState<ReportCampaignSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [brand, setBrand] = useState("")
  const [descr, setDescr] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<ReportCampaignSummary | null>(null)
  /**
   * A failed list rendered as the first-run empty state: "No report campaigns yet", with a
   * Create button under it. So an outage looked like a clean slate and invited an operator to
   * build a second copy of a report that already exists, with a second share link the client
   * would then hold alongside the first.
   */
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await reportCampaignApi.list()
      setRows(r?.data?.campaigns ?? [])
      setFailure(null)
    } catch (e) {
      setRows([])
      setFailure((e as Error).message || "The request did not complete")
      toast.error((e as Error).message || "Could not load the report campaigns")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!name.trim() || !brand.trim()) return
    setCreating(true)
    try {
      const r = await reportCampaignApi.create({
        name: name.trim(), brand_name: brand.trim(), description: descr.trim() || undefined,
      })
      toast.success("Report campaign created. Add the post links next.")
      setOpen(false); setName(""); setBrand(""); setDescr("")
      await load()
      if (r?.data?.id) window.location.href = `/campaigns/${r.data.id}/posts`
      // Straight to Add Posts on create is deliberate: a new report has nothing to show
      // until links are in it. Every later visit goes to the report itself.
    } catch (e) {
      toast.error((e as Error).message || "Could not create campaign")
    } finally {
      setCreating(false)
    }
  }

  const share = async (row: ReportCampaignSummary) => {
    setBusyId(row.id)
    try {
      const r = await reportCampaignApi.createShare(row.id)
      const url = shareUrlFor(r.data.token)
      await navigator.clipboard.writeText(url).catch(() => {})
      setCopied(row.id)
      setTimeout(() => setCopied((c) => (c === row.id ? null : c)), 2000)
      toast.success(r.data.created ? "Share link created and copied" : "Existing link copied")
      await load()
    } catch (e) {
      toast.error((e as Error).message || "Could not create share link")
    } finally {
      setBusyId(null)
    }
  }

  const doRevoke = async () => {
    if (!revoking) return
    const row = revoking
    setRevoking(null); setBusyId(row.id)
    try {
      await reportCampaignApi.revokeShare(row.id)
      toast.success("Link revoked. Anyone holding it now sees nothing.")
      await load()
    } catch (e) {
      toast.error((e as Error).message || "Could not revoke link")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <SuperadminLayout>
    <div className="space-y-ds-5 p-ds-4">
      <CampaignsHubHeader
        action={
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New report campaign
          </Button>
        }
      />

      <p className="max-w-2xl text-ds-body text-muted-foreground">
        Create a campaign, paste the post and reel links it produced, and share a measured
        performance report with the client. Every figure is counted from the live posts:
        nothing is estimated.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New report campaign</DialogTitle>
              <DialogDescription>
                You&apos;ll add the post links on the next screen.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="rc-name">Campaign name</Label>
                <Input id="rc-name" value={name} onChange={(e) => setName(e.target.value)}
                       placeholder="e.g. Lago Wafers: Summer Launch" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rc-brand">Brand</Label>
                <Input id="rc-brand" value={brand} onChange={(e) => setBrand(e.target.value)}
                       placeholder="e.g. Lago" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rc-descr">Notes <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea id="rc-descr" value={descr} onChange={(e) => setDescr(e.target.value)}
                          placeholder="Anything the client should read at the top of the report."
                          rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create} disabled={creating || !name.trim() || !brand.trim()}>
                {creating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-ds-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : failure ? (
        /* No Create button here. An error is not an invitation to make a second report. */
        <div className="py-ds-6 text-center">
          <p className="text-ds-subheading">Could not load the report campaigns</p>
          <p className="mt-ds-2 text-ds-body text-muted-foreground">
            Existing reports and any share links already with a client are unaffected. This
            page could not read the list, so do not create a replacement from here.
          </p>
          <p className="mt-ds-2 text-ds-caption text-muted-foreground">{failure}</p>
          <Button variant="outline" size="sm" className="mt-ds-3"
                  onClick={() => { setLoading(true); load() }}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-ds-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-ds-3 text-ds-label">No report campaigns yet</p>
          <p className="mt-ds-2 text-ds-body text-muted-foreground">
            Create one, paste the post links, and the report builds itself.
          </p>
          <Button className="mt-ds-3 gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New report campaign
          </Button>
        </div>
      ) : (
        /* A card per report drew an edge around every row of a list whose rows are all the
           same kind of thing. Rows now, separated by a hairline, with the report's name and
           the line under it carrying the hierarchy the card was carrying. */
        <div className="divide-y divide-black/[0.06] border-y border-black/[0.06] dark:divide-white/[0.07] dark:border-white/[0.07]">
          {rows.map((r) => (
            <div key={r.id} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.04]">
              <div className="flex flex-wrap items-center gap-ds-3 py-ds-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Opens the REPORT, not the generic campaign screen. Clicking a
                        report campaign used to land on /campaigns/[id]/posts, so the
                        report itself was unreachable without minting a share link. */}
                    <Link href={`/superadmin/report-campaigns/${r.id}`}
                          className="truncate font-medium hover:underline">
                      {r.name}
                    </Link>
                    <Badge variant="secondary" className="font-normal">{r.brand_name}</Badge>
                    {/* text-emerald-600 was a raw palette step; "shared" is the console's
                        good tone, decided once. */}
                    {r.share_token ? (
                      <Badge variant="outline" className="gap-1 font-normal text-[var(--tone-good-ink)]">
                        <Eye className="h-3 w-3" /> Shared
                        {typeof r.share_views === "number"
                          ? ` · ${r.share_views} view${r.share_views === 1 ? "" : "s"}`
                          : ""}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-ds-1 text-ds-caption text-muted-foreground">
                    {/* A summary row that came back without a post count said "0 posts",
                        which on this list means "this report is empty, go and add links" —
                        advice on a report that may be full. */}
                    {typeof r.posts === "number" ? `${r.posts} post${r.posts === 1 ? "" : "s"}` : "post count unknown"}
                    {r.created_at ? ` · created ${new Date(r.created_at).toLocaleDateString("en-GB")}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="secondary" size="sm" className="gap-1.5">
                    <Link href={`/superadmin/report-campaigns/${r.id}`}>
                      <BarChart3 className="h-3.5 w-3.5" /> View report
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href={`/campaigns/${r.id}/posts`}>
                      <Plus className="h-3.5 w-3.5" /> Add posts
                    </Link>
                  </Button>

                  {r.share_token && (
                    <Button asChild variant="ghost" size="sm" className="gap-1.5"
                            title="Open the client-facing report">
                      <a href={`/r/${r.share_token}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> Preview
                      </a>
                    </Button>
                  )}

                  <Button size="sm" variant={r.share_token ? "secondary" : "default"}
                          className="gap-1.5" disabled={busyId === r.id}
                          onClick={() => share(r)}>
                    {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : copied === r.id ? <Check className="h-3.5 w-3.5" />
                      : r.share_token ? <Copy className="h-3.5 w-3.5" />
                      : <Link2 className="h-3.5 w-3.5" />}
                    {copied === r.id ? "Copied" : r.share_token ? "Copy link" : "Create share link"}
                  </Button>

                  {r.share_token && (
                    <Button size="sm" variant="ghost" disabled={busyId === r.id}
                            className="gap-1.5 text-muted-foreground"
                            onClick={() => setRevoking(r)}>
                      <EyeOff className="h-3.5 w-3.5" /> Revoke
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revoking kills a link the client may already be using — always confirm. */}
      <AlertDialog open={!!revoking} onOpenChange={(o: boolean) => !o && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this report link?</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone who already has the link for <strong>{revoking?.name}</strong> will stop being
              able to open it, including the client. You can create a new link afterwards, but it
              will be a different URL.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it live</AlertDialogCancel>
            <AlertDialogAction onClick={doRevoke}>Revoke link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </SuperadminLayout>
  )
}
