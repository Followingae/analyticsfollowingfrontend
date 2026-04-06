"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Eye, Activity, CheckCircle2, Loader2, Megaphone } from "lucide-react"
import { toast } from "sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.following.ae"

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
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

  const getToken = () => localStorage.getItem("access_token") || ""

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "200" })
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (typeFilter !== "all") params.set("campaign_type", typeFilter)

      const res = await fetch(`${API_BASE}/api/v1/campaigns/unified?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.data || [])
      }
    } catch {
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

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">All Campaigns</h1>
            <p className="text-muted-foreground text-sm">View and manage campaigns across all brands</p>
          </div>
          <Button onClick={() => router.push("/campaigns/new")} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Campaign
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{campaigns.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{activeCt}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-600">{completedCt}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{campaigns.length - activeCt - completedCt}</p><p className="text-xs text-muted-foreground">Other</p></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

        {/* Campaigns List */}
        {loading ? (
          <Card><CardContent className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /><p className="text-muted-foreground">Loading...</p></CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No campaigns found</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((c: any) => (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/campaigns/${c.id}/posts`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {c.brand_logo_url ? (
                      <img src={c.brand_logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {(c.brand_name || c.name || "?").substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.brand_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{typeLabels[c.campaign_type] || c.campaign_type}</Badge>
                    <Badge className={`text-xs ${statusColors[c.status] || ""}`}>{c.status}</Badge>
                    <div className="text-right text-xs text-muted-foreground ml-4">
                      <div>{c.creator_count || c.creators_count || 0} creators</div>
                      <div>{c.post_count || c.posts_count || 0} posts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SuperadminLayout>
  )
}
