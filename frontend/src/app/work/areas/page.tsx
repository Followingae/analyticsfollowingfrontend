"use client"

/**
 * Areas — the working roster for each brand, plus the standing sample packs.
 *
 * An area is where sourcing lives from the moment a founder decides we are chasing a brand
 * to the moment its creators go onto a proposal. It carries the brief and every creator we
 * have researched, each one either internal or cleared for the client to see.
 *
 * Two kinds, two tabs. A client area belongs to one brand and is opened by a founder
 * releasing it (that release is what tells the talent team to start). A sample pack belongs
 * to nobody, which is what lets business development answer "show me some fitness people"
 * on the spot instead of queuing a request.
 */

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Plus, Trash2, ListChecks, Building2, Link2, Rocket, Lock } from "lucide-react"
import { toast } from "sonner"
import { imdListsApi, type ImdListSummary, type AreaBrief } from "@/services/imdListsApi"
import { clientApi } from "@/services/clientManagementApi"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { CreatorsHubHeader } from "@/components/console/CreatorsHubHeader"
import { MiniBar, ScoreDot } from "@/components/console/primitives"
import { BriefFields } from "@/components/console/BriefFields"
// One brief, one sentence, built in one place. There were two copies of this function, one
// here and one on the area screen, and both wrote a bare U+20C3 for the dirham into a plain
// string, in a font that does not carry the glyph, so the money in every brief rendered as
// an empty box. The sentence says "AED" instead, which is what the alert already said.
import { briefLine } from "@/lib/areaBrief"

type Kind = "client" | "sample"

/** Reading the query needs a boundary in Next 15; the page itself is unchanged. */
export default function AreasPageWrapper() {
  return <Suspense fallback={null}><AreasPage /></Suspense>
}

function AreasPage() {
  const { canDestroy, can } = useAdminAccess()
  // Business development lives on the sending side of an area: they send the link and
  // answer the client. Stocking it is the talent team's job, so the buttons that change
  // what is in an area are not theirs.
  const canStock = can("influencers")
  const [areas, setAreas] = useState<ImdListSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Which half of the screen to open on. Business development are sent here for sample packs
  // and landed on client rosters every time, because the link asked for a tab nobody read.
  const params = useSearchParams()
  const router = useRouter()
  const [kind, setKind] = useState<Kind>(params?.get("kind") === "sample" ? "sample" : "client")
  const [toDelete, setToDelete] = useState<ImdListSummary | null>(null)

  /**
   * Arriving from one brand.
   *
   * A person standing on Barakat, looking at the opportunity somebody logged this morning,
   * pressed Start sourcing and was dropped on every brand we have and asked to pick the one
   * they were already looking at. The brand travels now: `?team=` narrows the list to it and
   * fixes it in the dialog, `?start=1` opens the dialog on arrival, and `?brand=` is only a
   * label so the screen can name the brand before the client list has come back. The id is
   * what is used; the name is never trusted for anything but display.
   */
  const fromTeam = params?.get("team") || ""
  const fromBrand = params?.get("brand") || ""

  // start sourcing (client area)
  const [openStart, setOpenStart] = useState(!!fromTeam && params?.get("start") === "1")
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [teamId, setTeamId] = useState(fromTeam)
  const [due, setDue] = useState("")
  const [brief, setBrief] = useState<AreaBrief>({})
  const [busy, setBusy] = useState(false)

  // sample pack
  const [openPack, setOpenPack] = useState(false)
  const [packName, setPackName] = useState("")
  const [packDesc, setPackDesc] = useState("")

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await imdListsApi.list()
      setAreas(res?.data?.lists ?? [])
    } catch (e) {
      // Held apart from an empty list on purpose. "No brands being sourced for" reads as a
      // fact about the business; a read that failed is a fact about the request.
      setLoadError((e as Error).message || "Could not load areas")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!openStart) return
    // Leads as well as clients. You source for a brand months before it signs anything,
    // and this picker read the client book, so the brand you had just logged in order to
    // source for it was the one brand you could not choose.
    clientApi.list({ limit: 200, scope: 'all' })
      .then((r: any) => setBrands(r?.data?.clients ?? r?.data ?? []))
      .catch(() => setBrands([]))
  }, [openStart])

  // A sample pack belongs to nobody, so the brand filter is a fact about client areas only.
  const clientAreas = useMemo(
    () => areas.filter(a => (a.kind ?? "client") === "client" && (!fromTeam || a.team_id === fromTeam)),
    [areas, fromTeam])
  const shown = useMemo(
    () => (kind === "client" ? clientAreas : areas.filter(a => a.kind === "sample")),
    [areas, clientAreas, kind])
  const counts = useMemo(() => ({
    client: clientAreas.length,
    sample: areas.filter(a => a.kind === "sample").length,
  }), [areas, clientAreas])

  /**
   * The brand's name, for the filter chip and for the fixed brand line in the dialog. The
   * client list is only fetched when the dialog opens, so an area we already hold answers
   * first, then the fetched list, and the label from the link covers the moment before
   * either has arrived. Never used as an identifier.
   */
  const fromBrandName = useMemo(() => {
    if (!fromTeam) return ""
    return areas.find(a => a.team_id === fromTeam)?.team_name
        || brands.find(b => b.id === fromTeam)?.name
        || fromBrand
  }, [areas, brands, fromTeam, fromBrand])

  /** Changing tab is a place you can be sent back to, so it belongs in the URL. */
  const switchKind = (v: Kind) => {
    setKind(v)
    const q = new URLSearchParams()
    if (v === "sample") q.set("kind", "sample")
    // A sample pack has no brand, so the brand filter is dropped when you cross to that tab.
    else if (fromTeam) {
      q.set("team", fromTeam)
      if (fromBrand) q.set("brand", fromBrand)
    }
    const qs = q.toString()
    router.replace(`/work/areas${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  const startSourcing = async () => {
    if (!teamId) return toast.error("Pick the brand")
    setBusy(true)
    try {
      const res = await imdListsApi.startSourcing({
        team_id: teamId,
        brief,
        due_at: due || null,
        target_count: brief.target_count ?? null,
      })
      toast.success(`${res.data.brand} released — ${res.data.name} is open`)
      setOpenStart(false); setTeamId(""); setDue(""); setBrief({})
      // The area you just released is where the work is. Reloading the grid and leaving you
      // to find the card you just made is the same defect as the link that brought you here.
      router.push(`/work/areas/${res.data.id}`)
    } catch (e) {
      toast.error((e as Error).message || "Could not start sourcing")
    } finally {
      setBusy(false)
    }
  }

  const createPack = async () => {
    if (!packName.trim()) return toast.error("Give the pack a name")
    setBusy(true)
    try {
      const res = await imdListsApi.create({
        name: packName.trim(), description: packDesc.trim() || undefined, kind: "sample" })
      toast.success("Sample pack created")
      setOpenPack(false); setPackName(""); setPackDesc("")
      // An empty pack is worth nothing, and the only next step is stocking it. Landing back
      // on the grid was worse than a dead end: the new pack is on the other tab, so it was
      // not even on screen.
      const newId = res?.data?.id
      if (newId) router.push(`/work/areas/${newId}`)
      else { switchKind("sample"); load() }
    } catch (e) {
      toast.error((e as Error).message || "Could not create the pack")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!toDelete) return
    try {
      await imdListsApi.remove(toDelete.id)
      toast.success(`Deleted "${toDelete.name}"`)
      setToDelete(null)
      load()
    } catch (e) {
      toast.error((e as Error).message || "Could not delete")
    }
  }

  return (
    <AuthGuard>
      <SuperAdminInterface>
        <div className="mx-auto max-w-6xl space-y-ds-4 p-ds-4">
          {canStock && <CreatorsHubHeader className="mb-0" bare />}

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              {/* One object, one name. This screen said "Areas", its tabs said "Client
                  areas", the sidebar and the hub above both say "Brand rosters", and the
                  brand record said "the sourcing area" in one branch and "the brand roster"
                  in the other. Roster is the word the navigation already uses. */}
              <h1 className="text-ds-title">Rosters</h1>
              <p className="mt-1 max-w-2xl text-muted-foreground">
                One roster per brand, plus the packs anyone can send a prospect.
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={openPack} onOpenChange={setOpenPack}>
                {canStock && (
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 rounded-full px-5"><Plus className="h-4 w-4" />New pack</Button>
                  </DialogTrigger>
                )}
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New sample pack</DialogTitle>
                    <DialogDescription>
                      A standing set anyone can send a prospect — name it for what someone would ask for.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Name *</Label>
                      <Input value={packName} onChange={e => setPackName(e.target.value)} placeholder="e.g. Fitness UAE" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea value={packDesc} onChange={e => setPackDesc(e.target.value)} rows={2}
                                placeholder="Optional — who this pack is for" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenPack(false)} disabled={busy}>Cancel</Button>
                    <Button onClick={createPack} disabled={busy}>
                      {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {canDestroy && (
                <Dialog open={openStart} onOpenChange={setOpenStart}>
                  <DialogTrigger asChild>
                    <Button data-tour="start-sourcing"
                            className="gap-2 rounded-full bg-neutral-900 px-5 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                      <Rocket className="h-4 w-4" />Start sourcing</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Start sourcing for a brand</DialogTitle>
                      <DialogDescription>
                        This is what tells the talent team to begin. Write what we are looking for —
                        it goes out with the alert, so they know before they open anything.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex max-h-[62vh] flex-col gap-ds-3 overflow-y-auto pr-1">
                      <div className="space-y-1.5">
                        <Label>Brand *</Label>
                        {fromTeam ? (
                          /* You came here from this brand's record. Re-picking it from two
                             hundred is not a choice, it is the question you already answered,
                             and a dropdown here is a chance to release the wrong brand. */
                          <div className="flex items-center gap-ds-2 rounded-ds-lg border px-3 py-2">
                            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-sm font-medium">{fromBrandName || "This brand"}</span>
                            <button type="button"
                                    className="ml-auto text-xs text-muted-foreground hover:text-foreground hover:underline"
                                    onClick={() => {
                                      setTeamId("")
                                      router.replace("/work/areas", { scroll: false })
                                    }}>
                              Different brand
                            </button>
                          </div>
                        ) : (
                          <Select value={teamId} onValueChange={setTeamId}>
                            <SelectTrigger><SelectValue placeholder="Pick the brand" /></SelectTrigger>
                            <SelectContent>
                              {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {/* No owner picker. A release goes to the talent team, and at this
                          moment there is no individual to name: the list offered every staff
                          member, account managers and business development included, and
                          asking for a name invented a decision nobody had made. Who logged
                          the brand, who released it and who it went to are all recorded
                          already, and the area shows them. Handing an area to one named
                          person stays available on the area afterwards. */}
                      <div className="space-y-1.5">
                        <Label>Wanted by</Label>
                        <Input type="date" value={due} onChange={e => setDue(e.target.value)}
                               className="max-w-[220px]" />
                      </div>

                      {/* The brief. It was a flat run of eight inputs with the budget sitting
                          between the follower range and the deliverables, which is three
                          different subjects in three adjacent rows. It is now three groups in
                          the order the questions get asked, and the fields that do not apply
                          are not on screen at all. Same component the area screen edits with,
                          so a field added there arrives here too. */}
                      <BriefFields brief={brief} onChange={setBrief} />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpenStart(false)} disabled={busy}>Cancel</Button>
                      <Button onClick={startSourcing} disabled={busy}>
                        {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Release to the team
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-ds-3">
            {/* A second tab row under the hub's own was two identical strips doing two
                different jobs: one is navigation, this is a filter. */}
            <ToggleGroup type="single" size="sm" variant="outline" value={kind}
                         onValueChange={(v: string) => { if (v) switchKind(v as Kind) }}>
              <ToggleGroupItem value="client" aria-label="Brand rosters">
                Brands ({counts.client})
              </ToggleGroupItem>
              <ToggleGroupItem value="sample" aria-label="Sample packs">
                Packs ({counts.sample})
              </ToggleGroupItem>
            </ToggleGroup>
            {/* You were sent here from one brand, so the screen says so rather than looking
                like the whole roster is this short. */}
            {fromTeam && kind === "client" && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span className="text-foreground">{fromBrandName || "One brand"}</span>
                <button type="button" className="hover:text-foreground hover:underline"
                        onClick={() => router.replace("/work/areas", { scroll: false })}>
                  · show every brand
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-ds-2 py-16 text-center">
              <p className="text-ds-label">Rosters did not load</p>
              <p className="max-w-md text-ds-caption text-muted-foreground">
                {loadError}. Nothing has been lost, the list simply did not come back.
              </p>
              <Button variant="outline" size="sm" className="mt-ds-1" onClick={load}>Try again</Button>
            </div>
          ) : shown.length === 0 ? (
            /* A dashed card with a bordered circle inside it: two boxes drawn round the
               sentence "there is nothing here". Both come off — the words say it. */
            <div className="py-16 text-center">
              <ListChecks className="mx-auto h-6 w-6 text-muted-foreground/60" />
              <p className="mt-ds-3 font-medium">
                {kind === "sample" ? "No packs yet"
                  : fromTeam ? `No roster for ${fromBrandName || "this brand"} yet`
                  : "No brand has been released yet"}
              </p>
              <p className="mx-auto mt-ds-1 max-w-md text-sm text-muted-foreground">
                {kind === "sample"
                  ? "A pack like “Fitness UAE” lets anyone answer a prospect on the spot."
                  : canDestroy
                  ? "Release a brand with Start sourcing and the talent team is told what to look for."
                  : "A founder releases a brand with the brief, and it appears here for the talent team to work."}
              </p>
            </div>
          ) : (
            /* A grid of identical cards says every roster is equally urgent, and it had no
               room for the one fact that decides which is not: the date it was wanted by.
               `due_at`, `target_count` and `awaiting_count` were all on the summary and none
               of them were drawn, so the team held to a deadline could see it only on the
               founders' own console. A row can carry them, and it sorts. */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roster</TableHead>
                    {kind === "client" && <TableHead>Brand</TableHead>}
                    <TableHead>Found</TableHead>
                    <TableHead className="text-right">Cleared</TableHead>
                    <TableHead className="text-right">Waiting on you</TableHead>
                    <TableHead className="text-right">Wanted by</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((a) => {
                    const line = briefLine(a.brief)
                    const late = !!a.due_at && !a.locked_at &&
                      new Date(a.due_at).getTime() < Date.now()
                    const over = a.due_at
                      ? Math.floor((Date.now() - new Date(a.due_at).getTime()) / 86_400_000)
                      : 0
                    const awaiting = a.awaiting_count ?? 0
                    return (
                      <TableRow key={a.id} className="group">
                        <TableCell className="max-w-[22rem]">
                          <Link href={`/work/areas/${a.id}`} className="block">
                            <span className="flex flex-wrap items-center gap-ds-2">
                              <span className="font-medium hover:underline">{a.name}</span>
                              {(a.round_no ?? 1) > 1 && (
                                <span className="rounded-ds-full bg-[var(--tone-info-wash)] px-2 py-0.5 text-ds-caption font-medium">
                                  Round {a.round_no}
                                </span>
                              )}
                              {a.locked_at && (
                                <span className="inline-flex items-center gap-1 rounded-ds-full bg-[var(--tone-neutral-wash)] px-2 py-0.5 text-ds-caption font-medium text-muted-foreground">
                                  <Lock className="h-3 w-3" />Closed
                                </span>
                              )}
                              {(a.live_links ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-ds-full bg-[var(--tone-good-wash)] px-2 py-0.5 text-ds-caption font-medium text-[var(--tone-good-ink)]">
                                  <Link2 className="h-3 w-3" />Live link
                                </span>
                              )}
                            </span>
                            {/* The brief, as the one line it is written to be. The whole of
                                it is on the roster itself. */}
                            {(line || a.description) && (
                              <span className="mt-0.5 block truncate text-ds-caption text-muted-foreground"
                                    title={line || a.description || undefined}>
                                {line || a.description}
                              </span>
                            )}
                          </Link>
                        </TableCell>
                        {kind === "client" && (
                          <TableCell className="text-muted-foreground">
                            {a.team_name || "–"}
                          </TableCell>
                        )}
                        <TableCell>
                          {/* Found against asked for. Two numbers and the distance between
                              them, which is what five separate badges were circling. */}
                          <MiniBar value={a.items_count}
                                   max={a.target_count || a.items_count || 1}
                                   tone={late ? "bad" : "info"} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {a.cleared_count ?? 0}
                          {(a.dropped_count ?? 0) > 0 && (
                            <span className="ml-2 text-ds-caption text-muted-foreground"
                                  title={`${a.dropped_count} turned down by the client`}>
                              {a.dropped_count} out
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {awaiting > 0
                            ? <ScoreDot value={awaiting} tone="warn"
                                        title={`${awaiting} stocked and not yet cleared or struck`} />
                            : <span className="text-muted-foreground">–</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {!a.due_at
                            ? <span className="text-muted-foreground">–</span>
                            : late
                              ? <ScoreDot value={over} suffix="d" tone="bad"
                                          title={`${over} day${over === 1 ? "" : "s"} past the date`} />
                              : (
                                <span className="whitespace-nowrap text-ds-caption text-muted-foreground">
                                  {new Date(a.due_at).toLocaleDateString("en-GB",
                                    { day: "numeric", month: "short" })}
                                </span>
                              )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.owner_email ? a.owner_email.split("@")[0] : "–"}
                        </TableCell>
                        <TableCell>
                          {canDestroy && canStock && (
                            <Button size="icon" variant="ghost"
                                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={() => setToDelete(a)}>
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <AlertDialog open={!!toDelete} onOpenChange={(v: boolean) => { if (!v) setToDelete(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{toDelete?.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                The area and its grouping go away, along with what the client picked on it. The{" "}
                {toDelete?.items_count ?? 0} creator{toDelete?.items_count === 1 ? "" : "s"} stay in the
                master database, and any proposal they are already on is unaffected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Delete area</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
