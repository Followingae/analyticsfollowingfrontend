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
import {
  reportCampaignApi,
  shareUrlFor,
  type ReportCampaignSummary,
} from "@/services/reportCampaignApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
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

  const load = useCallback(async () => {
    try {
      const r = await reportCampaignApi.list()
      setRows(r?.data?.campaigns ?? [])
    } catch (e) {
      toast.error((e as Error).message || "Could not load report campaigns")
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
      toast.success("Report campaign created — add the post links next")
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
      toast.success("Link revoked — anyone holding it now sees nothing")
      await load()
    } catch (e) {
      toast.error((e as Error).message || "Could not revoke link")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <SuperadminLayout>
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <BarChart3 className="h-6 w-6 text-primary" />
            Report Campaigns
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Create a campaign, paste the post and reel links it produced, and share a measured
            performance report with the client. Every figure is counted from the live posts —
            nothing is estimated.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><Plus className="h-4 w-4" /> New report campaign</Button>
          </DialogTrigger>
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
                       placeholder="e.g. Lago Wafers — Summer Launch" />
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
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No report campaigns yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create one, paste the post links, and you&apos;ll have a shareable report.
              </p>
            </div>
            <Button className="mt-2 gap-1.5" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New report campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.id} className="transition-colors hover:bg-accent/40">
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
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
                    {r.share_token ? (
                      <Badge variant="outline" className="gap-1 font-normal text-emerald-600 dark:text-emerald-400">
                        <Eye className="h-3 w-3" /> Shared · {r.share_views} view{r.share_views === 1 ? "" : "s"}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.posts} post{r.posts === 1 ? "" : "s"}
                    {r.created_at ? ` · created ${new Date(r.created_at).toLocaleDateString()}` : ""}
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
              </CardContent>
            </Card>
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
