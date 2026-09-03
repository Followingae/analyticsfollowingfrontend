"use client"

/**
 * Every campaign we are delivering.
 *
 * The list is the whole screen: a campaign is a name, a client, a type, a state, and how
 * much of it exists yet. Each of those was a card with a border round it, which put four
 * edges between two campaigns that differ by one word. They are rows now, and the counts
 * above them are figures with room rather than tiles.
 *
 * The band used to hold four numbers, three of which were the status Select drawn as tiles
 * and one of which contradicted the pipeline strip directly above it. It holds what the list
 * cannot say at a glance instead: what is in flight, and what is running out of time. The
 * rows carry the end date, so "which one is slipping" is answered here rather than by
 * opening eight delivery boards.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { CampaignsHubHeader } from "@/components/console/CampaignsHubHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Activity, CalendarClock, Megaphone } from "lucide-react"
import { toast } from "sonner"
import { tokenManager } from "@/utils/tokenManager"
import { Empty, Panel, Row, Stat, StatGrid, type Tone } from "@/components/console/primitives"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.following.ae"

/* The status skins were five hand-picked pairs of Tailwind palette steps, so "paused" here
   was a different amber from "going quiet" on the client screen. They name the console tone
   tokens now, which are decided once. */
const STATUS: Record<string, { label: string; tone: Tone; cls: string }> = {
  active: { label: "Active", tone: "good", cls: "border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]" },
  completed: { label: "Completed", tone: "neutral", cls: "border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]" },
  paused: { label: "Paused", tone: "warn", cls: "border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]" },
  draft: { label: "Draft", tone: "neutral", cls: "border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]" },
  archived: { label: "Archived", tone: "neutral", cls: "border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]" },
}

/* Absent is absent. `??` rather than `||`, so a genuine zero survives and a field the
   endpoint never sent comes back as null for the row to leave out. */
const creatorCt = (c: any): number | null => c.creator_count ?? c.creators_count ?? null
const postCt = (c: any): number | null => c.post_count ?? c.posts_count ?? null

const typeLabels: Record<string, string> = {
  influencer: "Influencer",
  ugc: "UGC",
  cashback: "Cashback",
  paid_deal: "Paid Deal",
  barter: "Barter",
}

export default function SuperadminCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  /**
   * A refused read and an empty list are different facts.
   *
   * `if (res.ok)` had no else: a 500 left `campaigns` at `[]`, which rendered "No campaigns
   * found" and four confident zeroes above it. On a screen whose job is to say what we are
   * delivering, that reads as "we are delivering nothing". Failure is held here so the page
   * can say the read failed instead.
   */
  const [failure, setFailure] = useState<string | null>(null)

  const getToken = () => tokenManager.getTokenSync() || localStorage.getItem("access_token") || ""

  const fetchCampaigns = async () => {
    setLoading(true)
    setFailure(null)
    try {
      const params = new URLSearchParams({ limit: "200" })
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (typeFilter !== "all") params.set("campaign_type", typeFilter)

      const res = await fetch(`${API_BASE}/api/v1/campaigns/unified?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `The server answered ${res.status}`)
      const data = await res.json()
      setCampaigns(data.data || [])
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Could not load campaigns")
      toast.error("Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCampaigns() }, [statusFilter, typeFilter])

  const filtered = campaigns.filter(c => {
    if (!search) return true
    return (c.name?.toLowerCase().includes(search.toLowerCase()) || c.brand_name?.toLowerCase().includes(search.toLowerCase()))
  })

  /* Counted off `filtered`, not `campaigns`. The two Selects are applied server-side but the
     search box is applied here, so typing a letter used to leave the band saying 84 above a
     list showing eleven rows. */
  const activeCt = filtered.filter(c => c.status === "active").length

  /** How a campaign's end date reads today, in the delivery board's vocabulary. */
  const endState = (c: any): { text: string; cls: string } | null => {
    if (!c.end_date || c.status === "completed" || c.status === "archived") return null
    const end = new Date(String(c.end_date).slice(0, 10) + "T00:00:00")
    if (Number.isNaN(end.getTime())) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const days = Math.round((end.getTime() - today.getTime()) / 86_400_000)
    if (days < 0) return { text: `ended ${Math.abs(days)}d ago`, cls: "text-[var(--tone-bad-ink)]" }
    if (days === 0) return { text: "ends today", cls: "text-[var(--tone-warn-ink)]" }
    if (days <= 7) return { text: `ends in ${days}d`, cls: "text-[var(--tone-warn-ink)]" }
    return { text: `ends ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`, cls: "" }
  }

  /* Soonest deadline first among the live ones, so the row that needs attention is at the
     top rather than wherever the query happened to put it. */
  const ordered = [...filtered].sort((a, b) => {
    const rank = (s: string) => (s === "active" ? 0 : s === "paused" ? 1 : s === "draft" ? 2 : 3)
    const byStatus = rank(a.status) - rank(b.status)
    if (byStatus) return byStatus
    if (!a.end_date && !b.end_date) return 0
    if (!a.end_date) return 1
    if (!b.end_date) return -1
    return a.end_date < b.end_date ? -1 : a.end_date > b.end_date ? 1 : 0
  })

  const endingSoon = filtered.filter(c => {
    const e = endState(c)
    return c.status === "active" && e && e.cls !== ""
  }).length

  const filters = (
    <div className="flex flex-wrap items-center gap-ds-2">
      <div className="relative w-full max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by campaign or client" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any type</SelectItem>
          <SelectItem value="influencer">Influencer</SelectItem>
          <SelectItem value="ugc">UGC</SelectItem>
          <SelectItem value="cashback">Cashback</SelectItem>
          <SelectItem value="paid_deal">Paid Deal</SelectItem>
          <SelectItem value="barter">Barter</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <CampaignsHubHeader
          action={
            <Button onClick={() => router.push("/superadmin/campaigns/create")}>
              <Plus className="mr-1.5 h-4 w-4" /> New campaign
            </Button>
          }
        />

        {failure ? (
          /* An error is not an empty state. Nothing below is known, so nothing below is
             drawn: no counts, no list, no "no campaigns found". */
          <div className="space-y-3">
            <p className="text-sm font-medium">Could not load the campaign list.</p>
            <p className="text-sm text-muted-foreground">
              {failure}. This is not an all clear, and nothing here is known.
            </p>
            <Button variant="outline" size="sm" onClick={fetchCampaigns}>Try again</Button>
          </div>
        ) : loading ? (
          <div className="space-y-ds-5">
            <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="space-y-ds-2 px-ds-2 py-ds-2">
                  <Skeleton className="h-3 w-24 rounded-ds-sm" />
                  <Skeleton className="h-9 w-16 rounded-ds-sm" />
                  <Skeleton className="h-3 w-32 rounded-ds-sm" />
                </div>
              ))}
            </div>
            <Skeleton className="h-[340px] rounded-ds-2xl" />
          </div>
        ) : (
          <>
            {/* Three of the four figures here were the status Select rendered as tiles:
                Active, Completed, Draft-or-paused, sitting directly above the control that
                sets exactly those values. And "Active" was the same idea as the pipeline
                strip's "Live" cell 200 pixels up, computed from a different endpoint, so the
                two disagreed in public. What is left is what the list cannot show at a
                glance: how much work is in flight, and how much of it is running out of
                time. */}
            <StatGrid cols={3}>
              <Stat label="Live now" value={activeCt} tone={activeCt ? "good" : "neutral"}
                    icon={Activity} hint="Being delivered today"
                    onClick={() => setStatusFilter("active")} />
              <Stat label="Ending this week" value={endingSoon}
                    tone={endingSoon ? "warn" : "neutral"} icon={CalendarClock}
                    hint="Live, and out of time within seven days" />
              <Stat label="Campaigns here" value={filtered.length} icon={Megaphone}
                    hint={statusFilter === "all" && typeFilter === "all" && !search
                      ? "Every campaign on the books"
                      : "Matching the filters set below"} />
            </StatGrid>

            {filters}

            <Panel title="Campaigns" description="Open one for its timeline" flush>
              {ordered.map((c: any) => {
                const s = STATUS[c.status] || { label: c.status, tone: "neutral" as Tone, cls: "" }
                return (
                  /* Opening a campaign means opening the campaign, not its posts. The record is
                     where the dates, the brand and the roster are; the delivery board and the
                     posts both hang off it — and until now neither had a route in from here,
                     which is why the board looked like a screen nobody could reach. */
                  <Row
                    key={c.id}
                    tone={s.tone}
                    title={
                      <span className="flex items-center gap-2">
                        {/* The client's mark, kept because it is how people find the row they
                            want without reading. It is a hairline circle rather than the
                            rounded square it was, to match the rest of the console. */}
                        {c.brand_logo_url
                          ? <img src={c.brand_logo_url} alt="" className="h-5 w-5 flex-none rounded-full object-cover" />
                          : <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-black/[0.05] text-[9px] font-semibold text-muted-foreground dark:bg-white/[0.08]">
                              {(c.brand_name || c.name || "?").substring(0, 2).toUpperCase()}
                            </span>}
                        {c.name}
                        <Badge variant="outline" className="capitalize">{typeLabels[c.campaign_type] || c.campaign_type}</Badge>
                        <Badge variant="outline" className={s.cls}>{s.label}</Badge>
                      </span>
                    }
                    meta={
                      <>
                        {c.brand_name || "No client on it"}
                        {/* `|| 0` asserted "0 creators, 0 posts" whenever the list endpoint
                            simply did not send those fields. A count nobody sent is not a
                            count of nothing, so the fact is left out instead. */}
                        {creatorCt(c) != null && <>{" · "}{creatorCt(c)} creators</>}
                        {postCt(c) != null && <>{" · "}{postCt(c)} posts</>}
                        {(() => {
                          const e = endState(c)
                          return e ? <>{" · "}<span className={e.cls}>{e.text}</span></> : null
                        })()}
                      </>
                    }
                    actions={
                      <>
                        <Button
                          size="sm" variant="outline" className="rounded-full"
                          onClick={(e) => { e.stopPropagation(); router.push(`/work/campaigns/${c.id}/ladder`) }}
                        >
                          Delivery board
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="rounded-full"
                          /* A UGC campaign has no posts screen — its content lives on /ugc, and
                             /posts renders empty for it. Sending someone to the right one of the
                             two is the difference between "there is nothing here" and the work. */
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(c.campaign_type === 'ugc'
                              ? `/campaigns/${c.id}/ugc`
                              : `/campaigns/${c.id}/posts`)
                          }}
                        >
                          {c.campaign_type === 'ugc' ? 'Videos' : 'Posts'}
                        </Button>
                      </>
                    }
                    onClick={() => router.push(`/work/campaigns/${c.id}/timeline`)}
                  />
                )
              })}
              {ordered.length === 0 && (
                <Empty>
                  {search || statusFilter !== "all" || typeFilter !== "all"
                    ? "No campaign matches those filters."
                    : "No campaigns yet."}
                </Empty>
              )}
            </Panel>
          </>
        )}
      </div>
    </SuperadminLayout>
  )
}
