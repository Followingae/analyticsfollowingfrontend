"use client"

/**
 * Every campaign we are delivering.
 *
 * The list is the whole screen: a campaign is a name, a client, a type, a state, and how
 * much of it exists yet. Each of those was a card with a border round it, which put four
 * edges between two campaigns that differ by one word. They are rows now, and the four
 * counts above them are figures with room rather than tiles.
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
import { Search, Plus, Activity, CheckCircle2, Megaphone, Layers } from "lucide-react"
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

  const activeCt = campaigns.filter(c => c.status === "active").length
  const completedCt = campaigns.filter(c => c.status === "completed").length

  const filters = (
    <div className="flex flex-wrap items-center gap-ds-2">
      <div className="relative w-full max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
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
            {/* The counts describe what came back for the filters that are set, which is
                what the person is looking at, rather than a blanket total of everything. */}
            <StatGrid>
              <Stat label="Campaigns here" value={campaigns.length} icon={Megaphone}
                    hint={statusFilter === "all" && typeFilter === "all"
                      ? "Every campaign on the books"
                      : "Matching the filters set below"} />
              <Stat label="Active" value={activeCt} tone={activeCt ? "good" : "neutral"}
                    icon={Activity} hint="Being delivered right now"
                    onClick={() => setStatusFilter("active")} />
              <Stat label="Completed" value={completedCt} icon={CheckCircle2}
                    hint="Delivered and closed"
                    onClick={() => setStatusFilter("completed")} />
              <Stat label="Draft or paused" value={campaigns.length - activeCt - completedCt}
                    tone={campaigns.length - activeCt - completedCt ? "warn" : "neutral"}
                    icon={Layers} hint="Started, not running" />
            </StatGrid>

            {filters}

            <Panel title="Campaigns" description="Open one for its timeline" flush>
              {filtered.map((c: any) => {
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
                        {" · "}{c.creator_count || c.creators_count || 0} creators
                        {" · "}{c.post_count || c.posts_count || 0} posts
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
              {filtered.length === 0 && (
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
