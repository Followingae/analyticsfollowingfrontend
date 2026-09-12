"use client"

/**
 * Everything Frame.io, on the campaign it belongs to.
 *
 * THERE IS NO INTEGRATIONS PAGE, deliberately. A Frame.io folder is a fact about a campaign,
 * so it lives on the campaign; and the one genuinely account-level thing — the sign-in — is
 * reached from here too, because a superadmin only ever needs it at the moment they are
 * trying to link something and find they cannot. Sending them to Settings to fix a thing they
 * discovered in Campaigns is how a two-click job becomes a hunt.
 *
 * SUPERADMIN ONLY. Every action in this file is refused server-side for anybody else. The
 * panel is not rendered for them either, but that is a courtesy, not the control.
 *
 * WHAT IS NOT HERE, AND WHY. There is no "browse my whole Frame.io account" tree. The primary
 * way to allocate a folder is to PASTE ITS LINK: the superadmin is already looking at the
 * right folder in Frame.io and the address bar already says which one it is, so pasting asks
 * the account nothing at all. Searching projects is the fallback, needs two characters before
 * it will answer, and filters server-side — so opening this panel never renders a list of
 * twenty-two clients' projects at anybody.
 */

import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle, Check, ExternalLink, FolderSearch, Link2, Link2Off, Loader2,
  RefreshCw, Search, ShieldCheck, Users,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  contentAdminApi,
  type ContentSource, type FrameioConnection, type UnmatchedFolder, type MatchCandidate,
} from "@/services/contentDeliveryApi"

/** Where Adobe sends the superadmin back to. Inside the campaigns module, so the whole
 *  round trip begins and ends where the work is. Must match the Adobe console exactly. */
export function frameioRedirectUri(): string {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}/work/campaigns`
}

// ── Health, said in a sentence ─────────────────────────────────────────────────────────────
function Health({ conn }: { conn: FrameioConnection }) {
  if (!conn.configured) {
    return (
      <p className="text-[13px] text-amber-700 dark:text-amber-400">
        {conn.reason || "Frame.io is not configured on this server."}
      </p>
    )
  }
  if (!conn.connected) {
    return <p className="text-[13px] text-muted-foreground">Not signed in to Frame.io yet.</p>
  }
  return (
    <div className="space-y-1 text-[13px]">
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-emerald-600" />
        Signed in as {conn.account_email || "Frame.io"}
        {typeof conn.campaigns_linked === "number" && (
          <> · {conn.campaigns_linked} campaign{conn.campaigns_linked === 1 ? "" : "s"} linked</>
        )}
      </p>
      {/* last_ok answers "is this working". A boolean "connected" is what makes somebody
          discover a lapsed sign-in by noticing a campaign has gone quiet. */}
      {conn.last_ok_at && (
        <p className="text-muted-foreground">
          Last read {new Date(conn.last_ok_at).toLocaleString()}
        </p>
      )}
      {conn.last_error && (
        <p className="flex items-start gap-1.5 text-rose-700 dark:text-rose-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{conn.last_error}</span>
        </p>
      )}
    </div>
  )
}

// ── The panel ─────────────────────────────────────────────────────────────────────────────
export function FrameioPanel({
  campaignId, open, onOpenChange, onChanged,
}: {
  campaignId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  onChanged?: () => void
}) {
  const [conn, setConn] = useState<FrameioConnection | null>(null)
  const [source, setSource] = useState<ContentSource | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const [url, setUrl] = useState("")
  const [shareUrl, setShareUrl] = useState("")
  const [query, setQuery] = useState("")
  const [projects, setProjects] = useState<{ id: string; name: string; root_folder_id: string }[]>([])
  const [browsing, setBrowsing] = useState<{ projectId: string; folderId?: string; folders: { id: string; name: string }[]; fileCount: number } | null>(null)

  const [unmatched, setUnmatched] = useState<UnmatchedFolder[]>([])
  const [candidates, setCandidates] = useState<MatchCandidate[]>([])
  const [picked, setPicked] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([
        contentAdminApi.connection().catch(() => null),
        contentAdminApi.source(campaignId).catch(() => null),
      ])
      setConn(c); setSource(s)
      setShareUrl(s?.share_url ?? "")
      if (s?.linked) {
        const u = await contentAdminApi.unmatched(campaignId).catch(() => null)
        if (u) { setUnmatched(u.unmatched); setCandidates(u.creators) }
      }
    } finally { setLoading(false) }
  }, [campaignId])

  useEffect(() => { if (open) void load() }, [open, load])

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    try {
      setBusy(key)
      await fn()
      if (ok) toast.success(ok)
      await load()
      onChanged?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "That did not work.")
    } finally { setBusy(null) }
  }

  const connect = async () => {
    try {
      setBusy("connect")
      const { url: authUrl } = await contentAdminApi.authorizeUrl(frameioRedirectUri())
      // A full navigation, not a popup: Adobe refuses to render inside one, and a blocked
      // popup looks exactly like a broken button.
      window.location.href = authUrl
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not start the sign-in.")
      setBusy(null)
    }
  }

  const search = async () => {
    if (query.trim().length < 2) return
    await run("search", async () => {
      setProjects(await contentAdminApi.searchProjects(query.trim()))
      setBrowsing(null)
    })
  }

  const browse = async (projectId: string, folderId?: string) => {
    await run("browse", async () => {
      const r = await contentAdminApi.browse(projectId, folderId)
      setBrowsing({ projectId, folderId: r.folder_id, folders: r.folders, fileCount: r.file_count })
    })
  }

  const link = (body: { url?: string; project_id?: string; folder_id?: string }) =>
    run("link", async () => {
      const r = await contentAdminApi.link(campaignId, { ...body, share_url: shareUrl || undefined })
      const c = r.counts || {}
      toast.success(`Linked. Found ${c.files ?? 0} file${c.files === 1 ? "" : "s"} across ${c.folders ?? 0} folders.`)
      setUrl(""); setProjects([]); setBrowsing(null); setQuery("")
    })

  const connected = !!conn?.connected

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Content source
          </DialogTitle>
          <DialogDescription>
            One folder, allocated to this campaign. Nothing else in the Frame.io account is
            reachable from here, by anybody.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── The sign-in ──────────────────────────────────────────────────────────── */}
            <section className="rounded-ds-xl border border-black/[0.06] p-4 dark:border-white/[0.07]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[14px] font-medium">Frame.io sign-in</p>
                  {conn && <Health conn={conn} />}
                </div>
                <div className="flex shrink-0 gap-2">
                  {connected ? (
                    <Button size="sm" variant="ghost" disabled={busy === "disconnect"}
                            onClick={() => run("disconnect", () => contentAdminApi.disconnect(),
                                              "Signed out. Nothing was deleted.")}>
                      Sign out
                    </Button>
                  ) : (
                    <Button size="sm" onClick={connect}
                            disabled={busy === "connect" || !conn?.configured}>
                      {busy === "connect" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Sign in
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {!connected ? (
              <p className="text-[13.5px] text-muted-foreground">
                Sign in to Frame.io to allocate a folder to this campaign.
              </p>
            ) : source?.linked ? (
              <>
                {/* ── What is allocated ──────────────────────────────────────────────── */}
                <section className="rounded-ds-xl border border-black/[0.06] p-4 dark:border-white/[0.07]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[14px] font-medium">
                        <Link2 className="h-3.5 w-3.5" />
                        {source.folder_name || "Linked folder"}
                      </p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {source.last_sync_at
                          ? <>Last read {new Date(source.last_sync_at).toLocaleString()}</>
                          : "Not read yet"}
                        {source.last_sync_counts?.files != null && (
                          <> · {source.last_sync_counts.files} file
                            {source.last_sync_counts.files === 1 ? "" : "s"}</>
                        )}
                      </p>
                      {source.last_sync_error && (
                        <p className="mt-1 flex items-start gap-1.5 text-[13px] text-rose-700 dark:text-rose-400">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {source.last_sync_error}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {source.folder_view_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={source.folder_view_url} target="_blank" rel="noreferrer">
                            Open <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={busy === "sync"}
                              onClick={() => run("sync", () => contentAdminApi.sync(campaignId),
                                                "Read again.")}>
                        {busy === "sync"
                          ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                        Sync
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busy === "unlink"}
                              onClick={() => run("unlink", () => contentAdminApi.unlink(campaignId),
                                                "Unlinked. Approvals were kept.")}
                              className="text-muted-foreground">
                        <Link2Off className="mr-1.5 h-3.5 w-3.5" /> Unlink
                      </Button>
                    </div>
                  </div>
                </section>

                {/* ── Folders we could not place ─────────────────────────────────────── */}
                {unmatched.length > 0 && (
                  <section className="rounded-ds-xl border border-amber-200/70 bg-amber-50/40 p-4
                                      dark:border-amber-900/40 dark:bg-amber-950/15">
                    <p className="flex items-center gap-2 text-[14px] font-medium">
                      <Users className="h-3.5 w-3.5" />
                      {unmatched.length} folder{unmatched.length === 1 ? "" : "s"} we could not place
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Only folders inside this campaign&apos;s allocation. Answered once, and
                      never asked again.
                    </p>
                    <div className="mt-4 space-y-2.5">
                      {unmatched.map((f) => (
                        <div key={f.folder_id}
                             className="flex flex-wrap items-center gap-2 rounded-ds-lg bg-background
                                        px-3 py-2.5">
                          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
                            {f.name}
                          </span>
                          <Select value={picked[f.folder_id] ?? ""}
                                  onValueChange={(v) => setPicked((p) => ({ ...p, [f.folder_id]: v }))}>
                            <SelectTrigger className="h-8 w-[210px] text-[13px]">
                              <SelectValue placeholder="Which creator?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__ignore__">Not a creator — ignore it</SelectItem>
                              {candidates.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.username ? `@${c.username}` : c.full_name || "Creator"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm" variant="outline"
                            disabled={!picked[f.folder_id] || busy === `resolve-${f.folder_id}`}
                            onClick={() => run(`resolve-${f.folder_id}`, () =>
                              contentAdminApi.resolveFolder(campaignId, {
                                folder_id: f.folder_id,
                                folder_name: f.name,
                                campaign_creator_id: picked[f.folder_id] === "__ignore__"
                                  ? null : picked[f.folder_id],
                                ignored: picked[f.folder_id] === "__ignore__",
                              }), "Remembered.")}
                          >
                            Save
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ── The optional Frame.io link for the client ──────────────────────── */}
                <section className="space-y-2">
                  <Label htmlFor="share" className="text-[13.5px]">
                    Frame.io link for the client <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input id="share" value={shareUrl} placeholder="https://f.io/…"
                           onChange={(e) => setShareUrl(e.target.value)} className="text-[13.5px]" />
                    <Button variant="outline" disabled={busy === "share"}
                            onClick={() => run("share", () =>
                              contentAdminApi.setShareLink(campaignId, shareUrl || null), "Saved.")}>
                      Save
                    </Button>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">
                    The client can already watch and approve everything here. This only adds a
                    link for a client who wants to comment frame by frame in Frame.io itself.
                  </p>
                </section>
              </>
            ) : (
              <>
                {/* ── Allocate a folder ───────────────────────────────────────────────── */}
                <section className="space-y-2">
                  <Label htmlFor="furl" className="text-[13.5px]">Paste the folder&apos;s Frame.io link</Label>
                  <div className="flex gap-2">
                    <Input id="furl" value={url} placeholder="https://next.frame.io/project/…"
                           onChange={(e) => setUrl(e.target.value)} className="text-[13.5px]" />
                    <Button disabled={!url.trim() || busy === "link"} onClick={() => link({ url })}>
                      {busy === "link" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Link
                    </Button>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">
                    Open the campaign&apos;s folder in Frame.io and copy the address. This asks
                    your account nothing at all.
                  </p>
                </section>

                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-black/[0.07] dark:bg-white/[0.09]" />
                  <span className="text-[12px] uppercase tracking-wide text-muted-foreground">or</span>
                  <span className="h-px flex-1 bg-black/[0.07] dark:bg-white/[0.09]" />
                </div>

                <section className="space-y-2">
                  <Label htmlFor="fq" className="text-[13.5px]">Search your projects</Label>
                  <div className="flex gap-2">
                    <Input id="fq" value={query} placeholder="Project name"
                           onChange={(e) => setQuery(e.target.value)}
                           onKeyDown={(e) => { if (e.key === "Enter") void search() }}
                           className="text-[13.5px]" />
                    <Button variant="outline" onClick={search}
                            disabled={query.trim().length < 2 || busy === "search"}>
                      {busy === "search"
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Search className="h-3.5 w-3.5" />}
                    </Button>
                  </div>

                  {projects.length > 0 && !browsing && (
                    <div className="divide-y divide-black/[0.06] rounded-ds-lg border
                                    border-black/[0.06] dark:divide-white/[0.07] dark:border-white/[0.07]">
                      {projects.map((p) => (
                        <button key={p.id} onClick={() => browse(p.id)}
                                className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5
                                           text-left text-[13.5px] transition hover:bg-muted/50">
                          <span className="truncate">{p.name}</span>
                          <FolderSearch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}

                  {browsing && (
                    <div className="space-y-2 rounded-ds-lg border border-black/[0.06] p-3
                                    dark:border-white/[0.07]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12.5px] text-muted-foreground">
                          {browsing.folders.length} folder{browsing.folders.length === 1 ? "" : "s"}
                          {browsing.fileCount > 0 && `, ${browsing.fileCount} file${browsing.fileCount === 1 ? "" : "s"}`}
                        </p>
                        <Button size="sm" variant="outline" disabled={busy === "link"}
                                onClick={() => link({ project_id: browsing.projectId, folder_id: browsing.folderId })}>
                          Link this folder
                        </Button>
                      </div>
                      {browsing.folders.length > 0 && (
                        <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                          {browsing.folders.map((f) => (
                            <div key={f.id} className="flex items-center justify-between gap-2 py-2">
                              <button onClick={() => browse(browsing.projectId, f.id)}
                                      className="min-w-0 flex-1 truncate text-left text-[13.5px]
                                                 hover:underline">
                                {f.name}
                              </button>
                              <Button size="sm" variant="ghost" disabled={busy === "link"}
                                      onClick={() => link({ project_id: browsing.projectId, folder_id: f.id })}>
                                Link
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
