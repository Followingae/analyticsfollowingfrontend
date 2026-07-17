"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Loader2, Plus, Search, Users, X, Globe, Check } from "lucide-react"
import { toast } from "sonner"
import { imdListsApi, type ImdListCreator } from "@/services/imdListsApi"
import { proposalApprovalApi } from "@/services/proposalApprovalApi"

const ANY_COUNTRY = "__any__"
const PAGE_SIZE = 40

function fmt(n?: number | null) {
  if (!n) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function ImdListDetailPage() {
  const listId = useParams().listId as string
  const [list, setList] = useState<{ name: string; description?: string | null; items: ImdListCreator[] } | null>(null)
  const [loading, setLoading] = useState(true)

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
    try {
      const res = await imdListsApi.get(listId)
      setList(res?.data ?? null)
    } catch (e) {
      toast.error((e as Error).message || "Failed to load list")
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

  const removeOne = async (influencerId: string, username: string) => {
    try {
      await imdListsApi.removeItem(listId, influencerId)
      toast.success(`Removed @${username}`)
      load()
    } catch (e) {
      toast.error((e as Error).message || "Failed to remove")
    }
  }

  const pickedCount = Object.keys(picked).length
  const hasMore = results.length < total

  return (
    <AuthGuard>
      <SuperAdminInterface>
        <div className="mx-auto max-w-5xl space-y-6 p-6">
          <Link href="/superadmin/influencers/lists" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />All lists
          </Link>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !list ? (
            <p className="py-20 text-center text-muted-foreground">List not found.</p>
          ) : (
            <>
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-bold">{list.name}</h1>
                  {list.description && <p className="mt-1 text-muted-foreground">{list.description}</p>}
                  <Badge variant="secondary" className="mt-3 gap-1">
                    <Users className="h-3 w-3" />{list.items.length} creator{list.items.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <Button className="gap-2" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add creators</Button>
              </div>

              {list.items.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <p className="font-medium">This list is empty</p>
                    <p className="mt-1 text-sm text-muted-foreground">Add creators from the master database to build it up.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-1.5">
                  {list.items.map((c) => (
                    <div key={c.item_id} className="group flex items-center gap-3 rounded-xl border p-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={c.profile_image_url || undefined} />
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
                      {c.country && <Badge variant="secondary" className="shrink-0">{c.country}</Badge>}
                      {c.tier && <Badge variant="outline" className="shrink-0 capitalize">{c.tier}</Badge>}
                      <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeOne(c.id, c.username)}
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

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
                          <AvatarImage src={c.profile_image_url || c.profile_pic_url} />
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
      </SuperAdminInterface>
    </AuthGuard>
  )
}
