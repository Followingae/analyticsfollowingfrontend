"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft, Loader2, Plus, Search, Users, X, Globe, Check,
  Download, Link2, Copy, BarChart3, Link as LinkIcon , CheckCircle2, ShieldCheck, Ban,
  Lock, RotateCcw, ThumbsDown, Pencil } from "lucide-react"
import { toast } from "sonner"
import { imdListsApi, creatorShareApi, type ImdListCreator, type ImdListSummary } from "@/services/imdListsApi"
import { proposalApprovalApi } from "@/services/proposalApprovalApi"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { AddCreatorsDialog } from "@/components/superadmin/influencer-database/AddCreatorsDialog"
import { cdnAvatar } from "@/lib/avatar"
/* One brief sentence and one brief panel, both built in one place. This file used to carry
   its own copy of the summary line, drifting from the create screen's copy and from the
   backend's, and writing a bare U+20C3 for the dirham that rendered as an empty box. */
import { briefLine } from "@/lib/areaBrief"
import { BriefDetail } from "@/components/console/BriefDetail"
import { BriefFields } from "@/components/console/BriefFields"
import type { AreaBrief } from "@/services/imdListsApi"

const ANY_COUNTRY = "__any__"
const PAGE_SIZE = 40

function fmt(n?: number | null) {
  if (!n) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function ImdListDetailPage() {
  const listId = useParams().areaId as string
  const { canExport, canDestroy, can } = useAdminAccess()
  const canStock = can("influencers")
  const [list, setList] = useState<(ImdListSummary & { items: ImdListCreator[] }) | null>(null)
  // Which rows are ticked for a bulk clear or strike. Kept separate from the add-creators
  // picker, which is a different selection with a different meaning.
  const [marked, setMarked] = useState<Record<string, true>>({})
  const [gateBusy, setGateBusy] = useState(false)
  const [strikeOpen, setStrikeOpen] = useState(false)
  // Sourcing someone who is not in the database yet, without losing which brand they were for.
  const [softAddOpen, setSoftAddOpen] = useState(false)
  const [strikeWhy, setStrikeWhy] = useState("")
  const [loading, setLoading] = useState(true)
  // Error, loading and empty are three states. A read that failed used to fall through to
  // "Area not found", which tells the operator their work is gone when the truth is that a
  // request did not come back.
  const [error, setError] = useState<string | null>(null)
  // The client turned these down. Destructive and unguessable later, so it takes a reason.
  const [dropOpen, setDropOpen] = useState(false)
  const [dropWhy, setDropWhy] = useState("")
  const [roundBusy, setRoundBusy] = useState(false)
  /**
   * Editing the brief.
   *
   * The PATCH has always accepted a brief and no screen has ever sent one, so a brief written
   * wrong at release stayed wrong for the life of the area and the manager worked from a
   * sentence everyone knew was out of date. Founders only, because writing the brief is the
   * same decision as releasing it.
   */
  const [briefOpen, setBriefOpen] = useState(false)
  const [briefDraft, setBriefDraft] = useState<AreaBrief>({})
  const [briefBusy, setBriefBusy] = useState(false)

  // add-creators picker
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [country, setCountry] = useState(ANY_COUNTRY)
  const [countries, setCountries] = useState<{ country: string; n: number }[]>([])
  const [results, setResults] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [picked, setPicked] = useState<Record<string, true>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await imdListsApi.get(listId)
      setList(res?.data ?? null)
    } catch (e) {
      setError((e as Error).message || "Could not load this area")
    } finally {
      setLoading(false)
    }
  }, [listId])
  useEffect(() => { load() }, [load])

  // Creators already in the list are excluded server-side (exclude_list_id) — the picker
  // never offers someone you already have.
  const fetchPage = useCallback(async (p: number, append: boolean) => {
    append ? setLoadingMore(true) : setSearching(true)
    try {
      const res = await proposalApprovalApi.searchMasterDb({
        query: search || undefined,
        page: p,
        pageSize: PAGE_SIZE,
        countries: country !== ANY_COUNTRY ? [country] : undefined,
        excludeListId: listId,
      })
      const rows = res?.data?.influencers ?? []
      setTotal(res?.data?.total_count ?? rows.length)
      setResults((prev) => (append ? [...prev, ...rows] : rows))
      setPage(p)
    } catch (e) {
      toast.error((e as Error).message || "Search failed")
    } finally {
      setSearching(false); setLoadingMore(false)
    }
  }, [search, country, listId])

  useEffect(() => {
    if (!open) return
    setPicked({}); setSearch(""); setCountry(ANY_COUNTRY); setResults([]); setPage(1)
    fetchPage(1, false)
    proposalApprovalApi.getCountries().then((r) => setCountries(r?.data?.countries ?? [])).catch(() => setCountries([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => fetchPage(1, false), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, country])

  const addPicked = async () => {
    const ids = Object.keys(picked)
    if (!ids.length) return
    setSaving(true)
    try {
      const res = await imdListsApi.addItems(listId, ids)
      const { added = 0, skipped = 0 } = res?.data ?? {}
      toast.success(`Added ${added}${skipped > 0 ? ` — ${skipped} already in this list` : ""}`)
      setOpen(false)
      load()
    } catch (e) {
      toast.error((e as Error).message || "Failed to add")
    } finally {
      setSaving(false)
    }
  }

  // Share links are minted on demand, not up front: a token is a live public URL, and
  // pre-generating one for every creator in every list would put the whole master database
  // online the moment a list is created.
  const [sharing, setSharing] = useState<string | null>(null)

  // Sharing the WHOLE list is a separate thing from sharing one creator: it carries an
  // expiry the operator picks, and revoking it closes the list rather than one row.
  const [listLink, setListLink] = useState<{ path: string; expires_at: string | null } | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareDays, setShareDays] = useState('30')
  const [shareReveal, setShareReveal] = useState<'with_prices' | 'no_prices'>('with_prices')
  const [shareBusy, setShareBusy] = useState(false)

  useEffect(() => {
    if (!listId) return
    imdListsApi.shareStatus(listId)
      .then((r: any) => setListLink(r.data?.live ? { path: r.data.live.path, expires_at: r.data.live.expires_at } : null))
      .catch(() => undefined)
  }, [listId])

  const mintListLink = async () => {
    const days = Number(shareDays)
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      toast.error('Pick between 1 and 365 days')
      return
    }
    setShareBusy(true)
    try {
      const res: any = await imdListsApi.share(listId, { expires_in_days: days, reveal: shareReveal })
      setListLink({ path: res.data.path, expires_at: res.data.expires_at })
      await copy(res.data.path)
      toast.success(res.data.reused ? 'This list already had a live link — copied' : `Link copied. Open for ${days} days.`)
      setShareOpen(false)
    } catch (e) {
      toast.error((e as Error).message || 'Could not create the link')
    } finally {
      setShareBusy(false)
    }
  }

  const revokeListLink = async () => {
    if (!window.confirm('Turn off the link? Anyone holding it stops seeing the list.')) return
    setShareBusy(true)
    try {
      await imdListsApi.revokeShare(listId)
      setListLink(null)
      toast.success('Link turned off')
    } catch (e) {
      toast.error((e as Error).message || 'Could not turn it off')
    } finally {
      setShareBusy(false)
    }
  }

  const copy = async (path: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`)
    toast.success("Link copied")
  }

  const share = async (username: string, existing?: string | null) => {
    if (existing) return copy(existing)
    setSharing(username)
    try {
      const res = await creatorShareApi.create(username)
      await copy(res.data.share_path)
      // A creator Instagram won't let us measure can still be shared — the page explains
      // why and points at their profile — but the operator should know that's what the
      // recipient will get before they paste the link into an email.
      if (res.data.unavailable) {
        toast.warning(`@${username}: ${res.data.unavailable.headline}`, {
          description: "The link works and explains this to the viewer.",
        })
      }
      load()
    } catch (e) {
      toast.error((e as Error).message || "Could not create link")
    } finally {
      setSharing(null)
    }
  }

  const exportCsv = async () => {
    try {
      await imdListsApi.exportCsv(listId, list?.name || "list")
      toast.success("CSV downloaded")
    } catch (e) {
      toast.error((e as Error).message || "Export failed")
    }
  }

  const removeOne = async (influencerId: string, username: string) => {
    try {
      await imdListsApi.removeItem(listId, influencerId)
      toast.success(`Removed @${username}`)
      load()
    } catch (e) {
      toast.error((e as Error).message || "Failed to remove")
    }
  }

  const markedIds = Object.keys(marked)

  const clearMarked = async () => {
    if (!markedIds.length) return
    setGateBusy(true)
    try {
      const res = await imdListsApi.clear(listId, markedIds)
      toast.success(`${res.data.cleared} cleared to share`)
      setMarked({}); load()
    } catch (e) {
      toast.error((e as Error).message || "Could not clear")
    } finally {
      setGateBusy(false)
    }
  }

  const strikeMarked = async () => {
    if (!markedIds.length || !strikeWhy.trim()) return
    setGateBusy(true)
    try {
      const res = await imdListsApi.strike(listId, markedIds, strikeWhy.trim())
      toast.success(`${res.data.struck} taken off the table`)
      setMarked({}); setStrikeOpen(false); setStrikeWhy(""); load()
    } catch (e) {
      toast.error((e as Error).message || "Could not strike")
    } finally {
      setGateBusy(false)
    }
  }

  // ── the round loop ──────────────────────────────────────────────────────────────────
  // Three things and no more: which pass we are on, who the client turned down and why, and
  // whether the round is closed.

  const dropMarked = async () => {
    if (!markedIds.length || !dropWhy.trim()) return
    setGateBusy(true)
    try {
      const res = await imdListsApi.drop(listId, markedIds, dropWhy.trim())
      toast.success(`${res.data.dropped} recorded as turned down`)
      setMarked({}); setDropOpen(false); setDropWhy(""); load()
    } catch (e) {
      toast.error((e as Error).message || "Could not record that")
    } finally {
      setGateBusy(false)
    }
  }

  const undropOne = async (influencerId: string, username: string) => {
    try {
      await imdListsApi.undrop(listId, [influencerId])
      toast.success(`@${username} is back on the table`)
      load()
    } catch (e) {
      toast.error((e as Error).message || "Could not put them back")
    }
  }

  /** Save the brief. `target_count` lives on the area as well as in the brief, so both move
   *  together or the card and the sentence start disagreeing about the same number. */
  const saveBrief = async () => {
    setBriefBusy(true)
    try {
      await imdListsApi.update(listId, {
        brief: briefDraft,
        target_count: briefDraft.target_count ?? null,
      })
      toast.success("Brief updated")
      setBriefOpen(false)
      await load()
    } catch (e) {
      toast.error((e as Error).message || "Could not save the brief")
    } finally {
      setBriefBusy(false)
    }
  }

  const lockRound = async () => {
    if (!window.confirm(
      "Close this round? Nothing in it changes again, and the client link stops taking answers."
    )) return
    setRoundBusy(true)
    try {
      const res = await imdListsApi.lock(listId)
      toast.success(`Round ${res.data.round_no} closed`, {
        description: `${res.data.picked} picked, ${res.data.standing} still on the table.`,
      })
      load()
    } catch (e) {
      toast.error((e as Error).message || "Could not close the round")
    } finally {
      setRoundBusy(false)
    }
  }

  const openNextRound = async () => {
    setRoundBusy(true)
    try {
      const res = await imdListsApi.nextRound(listId)
      toast.success(`Round ${res.data.round_no} is open`, {
        description: res.data.already_rejected > 0
          ? `${res.data.already_rejected} already turned down, still here so nobody is offered twice.`
          : undefined,
      })
      load()
    } catch (e) {
      toast.error((e as Error).message || "Could not open the next round")
    } finally {
      setRoundBusy(false)
    }
  }

  const locked = !!list?.locked_at
  const roundNo = list?.round_no ?? 1
  /** Internal people are known by their first name here, not by an address. */
  const who = (email: string) => email.split("@")[0].replace(/[._]/g, " ")
  const handedTo = list?.handed_to ?? []
  const droppedCount = (list?.items ?? []).filter(c => c.dropped_at).length
  const clearedCount = (list?.items ?? []).filter(c => c.cleared_at && !c.struck_at && !c.dropped_at).length
  const pickedByClient = (list?.items ?? []).filter(c => c.client_verdict === "selected").length
  const pickedCount = Object.keys(picked).length
  const hasMore = results.length < total

  return (
    <AuthGuard>
      <SuperAdminInterface>
        <div className="mx-auto max-w-5xl space-y-ds-4 p-ds-4">
          {/* Back to the half you came from. A sample pack sent you to the client tab every
              time, which is the exact bug the inbound `?kind` link was added to fix. A
              client area goes back to its brand, so a round of "open it, go back, open the
              next" stays inside the brand you are working. */}
          <Link
            href={list?.kind === "sample" ? "/work/areas?kind=sample"
                  : list?.team_id ? `/work/areas?team=${encodeURIComponent(list.team_id)}` +
                      (list.team_name ? `&brand=${encodeURIComponent(list.team_name)}` : "")
                  : "/work/areas"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            {list?.kind === "sample" ? "All sample packs"
             : list?.team_name ? `All areas for ${list.team_name}` : "All areas"}
          </Link>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : error ? (
            /* A failed read says so and offers the retry. It must never look like an area
               with nothing in it: one of those means try again, the other means get to work. */
            <div className="flex flex-col items-center gap-ds-2 py-20 text-center">
              <p className="text-ds-label">This area did not load</p>
              <p className="max-w-md text-ds-caption text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="mt-ds-1" onClick={load}>Try again</Button>
            </div>
          ) : !list ? (
            <p className="py-20 text-center text-muted-foreground">Area not found.</p>
          ) : (
            <>
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex flex-wrap items-center gap-ds-2">
                    <h1 className="text-ds-title">{list.name}</h1>
                    {/* The round is a fact about the area, so it sits with its name. It only
                        appears once there has been more than one: "round 1" on everything is
                        a label nobody reads. */}
                    {roundNo > 1 && (
                      <span className="rounded-ds-full bg-[var(--tone-info-wash)] px-2.5 py-0.5 text-ds-caption font-medium">
                        Round {roundNo}
                      </span>
                    )}
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-ds-full bg-[var(--tone-neutral-wash)] px-2.5 py-0.5 text-ds-caption font-medium text-muted-foreground">
                        <Lock className="h-3 w-3" />Closed
                      </span>
                    )}
                  </div>
                  {list.team_name && (
                    <p className="mt-1 text-sm text-muted-foreground">{list.team_name}</p>
                  )}
                  {list.description && <p className="mt-1 text-muted-foreground">{list.description}</p>}
                  {/* The brief travels with the area, so whoever opens it knows what to look
                      for without asking the person who released it. */}
                  {briefLine(list.brief) && (
                    <p className="mt-ds-2 max-w-xl rounded-ds-md bg-muted px-3 py-2 text-sm">
                      {briefLine(list.brief)}
                      {list.due_at && (
                        <span className="text-muted-foreground">
                          {" · wanted by "}
                          {new Date(list.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />{list.items.length} found
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />{clearedCount} cleared to share
                    </Badge>
                    {pickedByClient > 0 && <Badge className="gap-1">{pickedByClient} picked by the client</Badge>}
                    {/* Who the client turned down is not a footnote. It is the number that
                        decides whether this area goes round again. */}
                    {droppedCount > 0 && (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <Ban className="h-3 w-3" />{droppedCount} turned down
                      </Badge>
                    )}
                  </div>
                  {/* How this area came to be, in the three names the business already knows:
                      business development logged the brand, a founder released it, and it
                      went to the talent team. Nobody is asked for any of this at release,
                      because all three are already recorded. Each part is dropped when it is
                      not known rather than printed as a blank. */}
                  {(list.logged_by_email || list.released_by_email || handedTo.length > 0) && (
                    <p className="mt-ds-2 text-ds-caption text-muted-foreground">
                      {[
                        list.logged_by_email && `Logged by ${who(list.logged_by_email)}`,
                        list.released_by_email && `released by ${who(list.released_by_email)}`,
                        handedTo.length > 0 && `with ${handedTo.map(who).join(", ")}`,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {listLink?.expires_at && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Link open until {new Date(listLink.expires_at).toLocaleDateString('en-GB',
                        { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* A list CSV carries sell pricing and public share links and is built to be
                      forwarded, so only leadership may produce one. The team shares creators
                      with a client through a proposal instead. */}
                  {canExport && (
                    <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={list.items.length === 0}>
                      <Download className="h-4 w-4" />Export CSV
                    </Button>
                  )}
                  {/* One live link per list. While one exists the button copies it rather
                      than minting a second, so "turn it off" really does close the list. */}
                  {listLink ? (
                    <>
                      <Button variant="outline" className="gap-2" onClick={() => copy(listLink.path)}>
                        <LinkIcon className="h-4 w-4" />Copy list link
                      </Button>
                      {canDestroy && (
                        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-destructive"
                                disabled={shareBusy} onClick={revokeListLink}>
                          Turn off
                        </Button>
                      )}
                    </>
                  ) : (
                    canDestroy && (
                      <Button variant="outline" className="gap-2" disabled={clearedCount === 0}
                              title={clearedCount === 0 ? "Clear someone for sharing first" : undefined}
                              onClick={() => setShareOpen(true)}>
                        <LinkIcon className="h-4 w-4" />Share area
                      </Button>
                    )
                  )}
                  {/* Closing a round and opening the next are the two ends of the loop, so
                      they are one control that shows whichever one is available. Founders
                      only: it is the same decision as clearing, made at the other end. */}
                  {canDestroy && (locked ? (
                    <Button variant="outline" className="gap-2" disabled={roundBusy}
                            onClick={openNextRound}>
                      {roundBusy ? <Loader2 className="h-4 w-4 animate-spin" />
                                 : <RotateCcw className="h-4 w-4" />}
                      Open round {roundNo + 1}
                    </Button>
                  ) : (
                    <Button variant="outline" className="gap-2" disabled={roundBusy}
                            onClick={lockRound}>
                      {roundBusy ? <Loader2 className="h-4 w-4 animate-spin" />
                                 : <Lock className="h-4 w-4" />}
                      Close round {roundNo}
                    </Button>
                  ))}
                  {canStock && !locked && (
                    <>
                      <Button variant="outline" className="gap-2" onClick={() => setSoftAddOpen(true)}>
                        <Plus className="h-4 w-4" />Source new
                      </Button>
                      <Button className="gap-2" onClick={() => setOpen(true)}>
                        <Plus className="h-4 w-4" />Add from database
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* A closed round is a state, not a failure, so it is a tint and a sentence
                  rather than a card or an alert. One hairline above it separates it from the
                  header without adding another box to the page. */}
              {locked && (
                <div className="flex flex-wrap items-baseline gap-ds-2 border-t pt-ds-3 text-ds-caption">
                  <span className="font-medium text-foreground">Round {roundNo} is closed.</span>
                  <span className="text-muted-foreground">
                    Nothing here changes and the client link no longer takes answers.
                    {list.locked_by_email ? ` Closed by ${list.locked_by_email.split("@")[0]}.` : ""}
                    {canDestroy ? " Open the next round to keep going." : ""}
                  </span>
                </div>
              )}

              {/* The brief, in full.
                  The header carries it as one sentence, which is the right shape for a
                  glance and the wrong shape for the screen where the work happens. A manager
                  about to write to a creator needs the usage term, the go-live window and the
                  brands to avoid as separate facts she can check, and until now none of those
                  existed anywhere. Not a card: a hairline and an eyebrow, like the closed
                  round above it. */}
              <section className="flex flex-col gap-ds-3 border-t pt-ds-3">
                <div className="flex items-center justify-between gap-ds-3">
                  <p className="text-ds-overline uppercase text-muted-foreground">The brief</p>
                  {canDestroy && (
                    <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs"
                            onClick={() => { setBriefDraft(list.brief || {}); setBriefOpen(true) }}>
                      <Pencil className="h-3 w-3" />{list.brief ? "Edit" : "Write the brief"}
                    </Button>
                  )}
                </div>
                <BriefDetail brief={list.brief} dueAt={list.due_at} />
              </section>

              {/* The gate. Anyone may stock an area; only a founder decides which of them a
                  client sees, which is what lets the talent team keep adding all week
                  behind a link that is already open. */}
              {canStock && !locked && markedIds.length > 0 && (
                /* The one edge that earns itself on this screen: a bar that floats over the
                   list needs to say where it ends. Radius from the token scale. */
                <div className="sticky top-2 z-10 flex flex-wrap items-center gap-ds-2 rounded-ds-lg border bg-background/95 p-ds-2 shadow-sm backdrop-blur">
                  <span className="text-sm font-medium">{markedIds.length} selected</span>
                  <span className="text-xs text-muted-foreground">
                    Cleared creators are the only ones a share link shows.
                  </span>
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setMarked({})}>Cancel</Button>
                    {/* Recording the client's answer is not a founder's decision, it is
                        writing down something they have already said, so anyone stocking the
                        area can do it. Striking and clearing stay leadership's. */}
                    <Button size="sm" variant="outline" className="gap-1.5" disabled={gateBusy}
                            onClick={() => setDropOpen(true)}>
                      <ThumbsDown className="h-3.5 w-3.5" />Client turned down
                    </Button>
                    {canDestroy && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5" disabled={gateBusy}
                                onClick={() => setStrikeOpen(true)}>
                          <Ban className="h-3.5 w-3.5" />Take off the table
                        </Button>
                        <Button size="sm" className="gap-1.5" disabled={gateBusy} onClick={clearMarked}>
                          {gateBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <ShieldCheck className="h-3.5 w-3.5" />}
                          Clear to share
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {list.items.length === 0 ? (
                /* A dashed card round the sentence "there is nobody here" — box comes off. */
                <div className="py-16 text-center">
                  <p className="font-medium">Nobody in this area yet</p>
                  <p className="mt-ds-1 text-sm text-muted-foreground">Add creators from the master database, or source new ones by handle.</p>
                </div>
              ) : (
                /* Every creator was a bordered, rounded tile. Twenty creators put twenty
                   boxes on a page that is itself inside a page — and the box was carrying
                   nothing the list order was not already carrying. The borders come off and
                   the row groups by whitespace and a hover wash. Selection kept a visible
                   mark: it was a border plus a grey, it is now the console's info wash, which
                   reads at a glance and does not add an edge. */
                <div className="-mx-ds-2 space-y-ds-1">
                  {list.items.map((c) => (
                    <div key={c.item_id}
                         className={`group flex items-center gap-ds-3 rounded-ds-lg px-ds-2 py-ds-2 transition-colors ${
                           c.struck_at || c.dropped_at ? "opacity-55" : ""
                         } ${marked[c.id]
                           ? "bg-[var(--tone-info-wash)]"
                           : "hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"}`}>
                      {canStock && !locked && (
                        <Checkbox
                          checked={!!marked[c.id]}
                          onCheckedChange={(v: boolean | string) => setMarked(prev => {
                            const next = { ...prev }
                            if (v) next[c.id] = true
                            else delete next[c.id]
                            return next
                          })}
                          aria-label={`Select @${c.username}`}
                        />
                      )}
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={cdnAvatar(c.profile_image_url)} />
                        <AvatarFallback>{(c.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">@{c.username}</div>
                        <div className="truncate text-xs text-muted-foreground">{c.full_name}</div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <div>{fmt(c.followers_count)} followers</div>
                        {c.engagement_rate != null && <div>{Number(c.engagement_rate).toFixed(1)}% eng</div>}
                      </div>
                      {/* Whether we actually measured this creator decides what a share
                          link would show, so it belongs on the row next to the button. */}
                      {!c.analytics_status && (
                        <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
                          <BarChart3 className="h-3 w-3" />No analytics
                        </Badge>
                      )}
                      {c.country && <Badge variant="secondary" className="shrink-0">{c.country}</Badge>}
                      {c.tier && <Badge variant="outline" className="shrink-0 capitalize">{c.tier}</Badge>}

                      {/* Our verdict, then theirs. A struck creator keeps their reason on the
                          row: it is what stops the same person going back in front of the
                          same brand next month. */}
                      {c.dropped_at ? (
                        /* Their no outranks ours on the row, because it is the one that ends
                           the conversation. The reason is on the row itself rather than in a
                           tooltip: it is the reason the next round exists, and a round later
                           nobody remembers to hover. */
                        <span className="flex shrink-0 items-center gap-1.5">
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <ThumbsDown className="h-3 w-3" />
                            Turned down{c.dropped_in_round ? ` in round ${c.dropped_in_round}` : ""}
                          </Badge>
                          {c.dropped_reason && (
                            <span className="max-w-[16rem] truncate text-ds-caption text-muted-foreground"
                                  title={c.dropped_reason}>
                              {c.dropped_reason}
                            </span>
                          )}
                        </span>
                      ) : c.struck_at ? (
                        <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground"
                               title={c.struck_reason || undefined}>
                          <Ban className="h-3 w-3" />Struck
                        </Badge>
                      ) : c.cleared_at ? (
                        <Badge variant="outline" className="shrink-0 gap-1 border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]">
                          <ShieldCheck className="h-3 w-3" />Cleared
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-muted-foreground">Internal</Badge>
                      )}
                      {c.client_verdict === "selected" && (
                        <Badge className="shrink-0">Client picked</Badge>
                      )}
                      {/* A rejection and a drop are the same event, written together, so the
                          row carries one badge for it rather than two saying the same thing. */}

                      <Button
                        size="sm"
                        variant={c.share_token ? "secondary" : "outline"}
                        className="h-7 shrink-0 gap-1.5 px-2 text-xs"
                        disabled={sharing === c.username}
                        onClick={() => share(c.username, c.share_path)}
                        title={c.share_token
                          ? `Public link · ${c.share_views ?? 0} view${c.share_views === 1 ? "" : "s"}`
                          : "Create a public analytics link"}
                      >
                        {sharing === c.username
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : c.share_token ? <Copy className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                        {c.share_token ? "Copy link" : "Share"}
                      </Button>
                      {/* Somebody records the wrong name, or the client changes their mind.
                          A drop that could not be undone would make people avoid recording
                          it at all, which costs the loop the information it runs on. */}
                      {c.dropped_at && canStock && !locked && (
                        <Button size="sm" variant="ghost"
                                className="h-7 shrink-0 px-2 text-xs text-muted-foreground"
                                onClick={() => undropOne(c.id, c.username)}>
                          Put back
                        </Button>
                      )}
                      {canStock && !locked && (
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => removeOne(c.id, c.username)}
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Not in the master database yet. They go to the waiting room for pricing and come
            back into this area on approval. */}
        <AddCreatorsDialog
          open={softAddOpen}
          onOpenChange={setSoftAddOpen}
          areaId={listId}
          areaName={list?.name}
          onAdded={load}
        />

        {/* Rewriting the brief. The same fields the founder released with, so what she is
            reading and what he wrote are never two different forms. */}
        <Dialog open={briefOpen} onOpenChange={setBriefOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>The brief</DialogTitle>
              <DialogDescription>
                What the team is looking for, what we are offering and what we need back.
                Everyone working this area reads it, so say the parts you know.
              </DialogDescription>
            </DialogHeader>
            <div className="flex max-h-[62vh] flex-col gap-ds-3 overflow-y-auto pr-1">
              <BriefFields brief={briefDraft} onChange={setBriefDraft} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBriefOpen(false)} disabled={briefBusy}>
                Cancel
              </Button>
              <Button onClick={saveBrief} disabled={briefBusy}>
                {briefBusy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save the brief
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* The client's answer, written down. Same shape as striking, opposite author: this
            one records what they said, that one records what we decided. */}
        <Dialog open={dropOpen} onOpenChange={setDropOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                The client turned down {markedIds.length} creator{markedIds.length === 1 ? "" : "s"}
              </DialogTitle>
              <DialogDescription>
                They stay in the area with the reason on their row, so round {roundNo + 1} is built
                knowing who has already been turned down. You can put them back if this was
                recorded in error.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label>What did they say</Label>
              <Textarea value={dropWhy} rows={3}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDropWhy(e.target.value)}
                        placeholder="e.g. too small for the launch, worked with a competitor last month, tone is wrong for us" />
              <p className="text-ds-caption text-muted-foreground">
                Required. A drop with no reason tells the next round nothing.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDropOpen(false)} disabled={gateBusy}>Cancel</Button>
              <Button onClick={dropMarked} disabled={gateBusy || !dropWhy.trim()}>
                {gateBusy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Record it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={strikeOpen} onOpenChange={setStrikeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Take {markedIds.length} off the table</DialogTitle>
              <DialogDescription>
                They stay in the area and keep their research. This only stops them being shown
                to this brand. The reason is what stops them coming back next round.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Why</Label>
              <Textarea value={strikeWhy} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStrikeWhy(e.target.value)} rows={3}
                        placeholder="e.g. competitor conflict, rate above budget, client passed last time" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStrikeOpen(false)} disabled={gateBusy}>Cancel</Button>
              <Button onClick={strikeMarked} disabled={gateBusy || !strikeWhy.trim()}>
                {gateBusy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Take off the table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] overflow-hidden p-0">
            <DialogHeader className="border-b p-5">
              <DialogTitle>Add creators to this list</DialogTitle>
              <DialogDescription>Anyone already in the list is hidden.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by username or name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="sm:w-48">
                  <Globe className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Any country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_COUNTRY}>Any country</SelectItem>
                  {countries.map((c) => <SelectItem key={c.country} value={c.country}>{c.country} ({c.n})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[50vh] space-y-1.5 overflow-y-auto p-4">
              {searching ? (
                <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : results.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {search || country !== ANY_COUNTRY ? "No creators match these filters." : "Every active creator is already in this list."}
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 pb-1">
                    <button
                      type="button"
                      onClick={() => setPicked((prev) => {
                        const all = results.every((c) => prev[c.id])
                        if (all) return {}
                        return Object.fromEntries(results.map((c) => [c.id, true as const]))
                      })}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {results.every((c) => picked[c.id]) ? "Clear these" : `Select these ${results.length}`}
                    </button>
                    <span className="text-xs text-muted-foreground">Showing {results.length} of {total}</span>
                  </div>

                  {results.map((c) => {
                    const on = !!picked[c.id]
                    return (
                      <button
                        type="button" key={c.id}
                        onClick={() => setPicked((prev) => {
                          const next = { ...prev }
                          if (next[c.id]) delete next[c.id]; else next[c.id] = true
                          return next
                        })}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${on ? "border-primary/40 bg-primary/5" : "hover:border-foreground/20"}`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                          {on && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={cdnAvatar(c.profile_image_url || c.profile_pic_url)} />
                          <AvatarFallback>{(c.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">@{c.username}</span>
                          <span className="block truncate text-xs text-muted-foreground">{c.full_name}</span>
                        </span>
                        <span className="shrink-0 text-right text-xs text-muted-foreground">{fmt(c.followers_count)} followers</span>
                        {c.country && <Badge variant="secondary" className="shrink-0">{c.country}</Badge>}
                      </button>
                    )
                  })}

                  {hasMore && (
                    <Button variant="outline" className="w-full" disabled={loadingMore} onClick={() => fetchPage(page + 1, true)}>
                      {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : `Load ${Math.min(PAGE_SIZE, total - results.length)} more`}
                    </Button>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="border-t p-4">
              <div className="mr-auto text-sm text-muted-foreground">{pickedCount} selected</div>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={addPicked} disabled={saving || pickedCount === 0} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add {pickedCount > 0 ? pickedCount : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this list</DialogTitle>
            <DialogDescription>
              Anyone with the link sees the creators. No login. Cost prices are never sent.
              Creators with no sell price are left off a link that shows prices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">Open for</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Input type="number" min={1} max={365} value={shareDays}
                       onChange={(e) => setShareDays(e.target.value)} className="w-24" />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>

            <div>
              <Label className="text-xs">What they see</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setShareReveal('with_prices')}
                        className={`rounded-md border p-3 text-left transition-colors ${
                          shareReveal === 'with_prices' ? 'border-foreground/40 bg-muted/50' : 'hover:bg-muted/30'}`}>
                  <span className="text-sm font-medium">Creators and prices</span>
                </button>
                <button type="button" onClick={() => setShareReveal('no_prices')}
                        className={`rounded-md border p-3 text-left transition-colors ${
                          shareReveal === 'no_prices' ? 'border-foreground/40 bg-muted/50' : 'hover:bg-muted/30'}`}>
                  <span className="text-sm font-medium">Creators only</span>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)} disabled={shareBusy}>Cancel</Button>
            <Button onClick={mintListLink} disabled={shareBusy}>Create link and copy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
