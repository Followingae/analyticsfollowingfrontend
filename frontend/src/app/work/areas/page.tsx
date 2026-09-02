"use client"

/**
 * Areas — the working roster for each brand, plus the standing sample packs.
 *
 * An area is where sourcing lives from the moment a founder decides we are chasing a brand
 * to the moment its creators go onto a proposal. It carries the brief, an owner, and every
 * creator we have researched, each one either internal or cleared for the client to see.
 *
 * Two kinds, two tabs. A client area belongs to one brand and is opened by a founder
 * releasing it (that release is what tells the talent team to start). A sample pack belongs
 * to nobody, which is what lets business development answer "show me some fitness people"
 * on the spot instead of queuing a request.
 */

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Loader2, Plus, Users, Trash2, ListChecks, Building2, Link2, Rocket, CheckCircle2,
         Lock, ThumbsDown } from "lucide-react"
import { toast } from "sonner"
import { imdListsApi, type ImdListSummary, type AreaBrief } from "@/services/imdListsApi"
import { clientApi } from "@/services/clientManagementApi"
import { staffAdminApi } from "@/services/staffApi"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { CreatorsHubHeader } from "@/components/console/CreatorsHubHeader"
import { CARD } from "@/components/console/primitives"

type Kind = "client" | "sample"

const DELIVERABLE_OPTIONS = ["reel", "post", "story", "carousel", "video"]

/** The brief in one line, the way the alert that starts the work reads it. */
function briefLine(b?: AreaBrief | null): string {
  if (!b) return ""
  const bits: string[] = []
  if (b.target_count) bits.push(String(b.target_count))
  if (b.categories?.length) bits.push(`${b.categories.join(", ")} creators`)
  if (b.market) bits.push(`in ${b.market}`)
  const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))
  if (b.followers_min && b.followers_max) bits.push(`${k(b.followers_min)}-${k(b.followers_max)}`)
  else if (b.followers_min) bits.push(`${k(b.followers_min)}+`)
  else if (b.followers_max) bits.push(`up to ${k(b.followers_max)}`)
  if (b.deliverables?.length) bits.push(b.deliverables.join(", "))
  if (b.budget_per_creator) bits.push(`up to ⃃ ${Number(b.budget_per_creator).toLocaleString()} each`)
  return bits.join(" · ")
}

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
  const [kind, setKind] = useState<Kind>(params?.get("kind") === "sample" ? "sample" : "client")
  const [toDelete, setToDelete] = useState<ImdListSummary | null>(null)

  // start sourcing (client area)
  const [openStart, setOpenStart] = useState(false)
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [staff, setStaff] = useState<{ id: string; email: string; staff_role?: string | null }[]>([])
  const [teamId, setTeamId] = useState("")
  const [owner, setOwner] = useState("")
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
    clientApi.list({ limit: 200 })
      .then((r: any) => setBrands(r?.data?.clients ?? r?.data ?? []))
      .catch(() => setBrands([]))
    staffAdminApi.list().then((s: any) => setStaff(s ?? [])).catch(() => setStaff([]))
  }, [openStart])

  const shown = useMemo(() => areas.filter(a => (a.kind ?? "client") === kind), [areas, kind])
  const counts = useMemo(() => ({
    client: areas.filter(a => (a.kind ?? "client") === "client").length,
    sample: areas.filter(a => a.kind === "sample").length,
  }), [areas])

  const startSourcing = async () => {
    if (!teamId) return toast.error("Pick the brand")
    setBusy(true)
    try {
      const res = await imdListsApi.startSourcing({
        team_id: teamId,
        brief,
        owner_user_id: owner || null,
        due_at: due || null,
        target_count: brief.target_count ?? null,
      })
      toast.success(`${res.data.brand} released — ${res.data.name} is open`)
      setOpenStart(false); setTeamId(""); setOwner(""); setDue(""); setBrief({})
      load()
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
      await imdListsApi.create({ name: packName.trim(), description: packDesc.trim() || undefined, kind: "sample" })
      toast.success("Sample pack created")
      setOpenPack(false); setPackName(""); setPackDesc("")
      load()
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
              <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[34px]">Areas</h1>
              <p className="mt-1 max-w-2xl text-muted-foreground">
                One roster per brand, from the day we decide to chase them to the proposal.
                Sample packs sit alongside, ready to send a prospect on the spot.
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={openPack} onOpenChange={setOpenPack}>
                {canStock && (
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 rounded-full px-5"><Plus className="h-4 w-4" />New sample pack</Button>
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
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Start sourcing for a brand</DialogTitle>
                      <DialogDescription>
                        This is what tells the talent team to begin. Write what we are looking for —
                        it goes out with the alert, so they know before they open anything.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                      <div className="space-y-1.5">
                        <Label>Brand *</Label>
                        <Select value={teamId} onValueChange={setTeamId}>
                          <SelectTrigger><SelectValue placeholder="Pick the brand" /></SelectTrigger>
                          <SelectContent>
                            {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Hand it to</Label>
                          <Select value={owner} onValueChange={setOwner}>
                            <SelectTrigger><SelectValue placeholder="Owner" /></SelectTrigger>
                            <SelectContent>
                              {staff.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.email}{s.staff_role ? ` · ${s.staff_role.replace(/_/g, " ")}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Wanted by</Label>
                          <Input type="date" value={due} onChange={e => setDue(e.target.value)} />
                        </div>
                      </div>

                      {/* The brief was boxed inside a dialog, which is already a surface —
                          a box inside a box for a group the heading alone can name. The
                          border comes off; a hairline above it marks where the brief starts,
                          and the fields keep their own spacing. */}
                      <div className="space-y-ds-3 border-t pt-ds-3">
                        <p className="text-ds-overline uppercase text-muted-foreground">The brief</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">How many</Label>
                            <Input type="number" min={1} value={brief.target_count ?? ""}
                                   onChange={e => setBrief({ ...brief, target_count: e.target.value ? Number(e.target.value) : undefined })}
                                   placeholder="8" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Market</Label>
                            <Input value={brief.market ?? ""} onChange={e => setBrief({ ...brief, market: e.target.value })}
                                   placeholder="UAE" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Categories</Label>
                          <Input value={(brief.categories ?? []).join(", ")}
                                 onChange={e => setBrief({ ...brief, categories: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })}
                                 placeholder="food, lifestyle" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Followers from</Label>
                            <Input type="number" value={brief.followers_min ?? ""}
                                   onChange={e => setBrief({ ...brief, followers_min: e.target.value ? Number(e.target.value) : undefined })}
                                   placeholder="20000" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">to</Label>
                            <Input type="number" value={brief.followers_max ?? ""}
                                   onChange={e => setBrief({ ...brief, followers_max: e.target.value ? Number(e.target.value) : undefined })}
                                   placeholder="100000" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Deliverables</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {DELIVERABLE_OPTIONS.map(d => {
                              const on = (brief.deliverables ?? []).includes(d)
                              return (
                                <Button
                                  key={d} type="button" size="sm"
                                  variant={on ? "default" : "outline"}
                                  className="h-7 rounded-full px-3 text-xs capitalize"
                                  onClick={() => setBrief({
                                    ...brief,
                                    deliverables: on
                                      ? (brief.deliverables ?? []).filter(x => x !== d)
                                      : [...(brief.deliverables ?? []), d],
                                  })}
                                >{d}</Button>
                              )
                            })}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Budget per creator (AED)</Label>
                          <Input type="number" value={brief.budget_per_creator ?? ""}
                                 onChange={e => setBrief({ ...brief, budget_per_creator: e.target.value ? Number(e.target.value) : undefined })}
                                 placeholder="3000" />
                        </div>
                        {briefLine(brief) && (
                          <p className="text-xs text-muted-foreground">
                            They will read: <span className="text-foreground">{briefLine(brief)}</span>
                          </p>
                        )}
                      </div>
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

          <Tabs value={kind} onValueChange={(v: string) => setKind(v as Kind)}>
            <TabsList>
              <TabsTrigger value="client">Client areas ({counts.client})</TabsTrigger>
              <TabsTrigger value="sample">Sample packs ({counts.sample})</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-ds-2 py-16 text-center">
              <p className="text-ds-label">Areas did not load</p>
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
                {kind === "client" ? "No brands being sourced for" : "No sample packs yet"}
              </p>
              <p className="mx-auto mt-ds-1 max-w-md text-sm text-muted-foreground">
                {kind === "client"
                  ? "Release a brand with Start sourcing and the talent team is told what to look for."
                  : "A pack like “Fitness UAE” lets anyone answer a prospect without waiting on a round."}
              </p>
            </div>
          ) : (
            <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((a) => {
                const line = briefLine(a.brief)
                return (
                  <Card key={a.id}
                        className={`${CARD} group bg-white transition-all hover:-translate-y-0.5 dark:bg-neutral-900/70`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="flex flex-wrap items-center gap-ds-2 text-base">
                          <Link href={`/work/areas/${a.id}`} className="hover:underline">{a.name}</Link>
                          {/* Which pass we are on, and whether it is closed. Only shown once
                              there has been more than one: "round 1" on every card is a
                              label that stops being read. */}
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
                        </CardTitle>
                        {canDestroy && canStock && (
                          <Button size="icon" variant="ghost"
                                  className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                  onClick={() => setToDelete(a)}>
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                      {a.team_name ? (
                        <CardDescription className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />{a.team_name}
                        </CardDescription>
                      ) : a.description ? (
                        <CardDescription className="line-clamp-2">{a.description}</CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {line && <p className="line-clamp-2 text-xs text-muted-foreground">{line}</p>}
                      <Link href={`/work/areas/${a.id}`} className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />{a.items_count} found
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />{a.cleared_count ?? 0} cleared
                        </Badge>
                        {(a.picked_count ?? 0) > 0 && (
                          <Badge className="gap-1">{a.picked_count} picked</Badge>
                        )}
                        {/* What the client said no to. The number that decides whether this
                            area goes round again, so it sits with the other two. */}
                        {(a.dropped_count ?? 0) > 0 && (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <ThumbsDown className="h-3 w-3" />{a.dropped_count} turned down
                          </Badge>
                        )}
                        {(a.live_links ?? 0) > 0 && (
                          /* Was its own emerald, a fifth green beside the console's one. */
                          <Badge variant="outline" className="gap-1 border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]">
                            <Link2 className="h-3 w-3" />Live link
                          </Badge>
                        )}
                      </Link>
                      {a.owner_email && (
                        <p className="text-xs text-muted-foreground">{a.owner_email.split("@")[0]}</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
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
