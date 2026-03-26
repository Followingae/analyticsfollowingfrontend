"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Check, X, Users, Clock, ShieldCheck, ShieldX, Instagram, Mail, Phone, AlertTriangle, Star, Tag } from "lucide-react"
import { faMemberApi } from "@/services/faAdminApi"
import { toast } from "sonner"

const TIER_COLORS: Record<string, string> = {
  PLATINUM: "bg-purple-500/10 text-purple-600 border-purple-200",
  GOLD: "bg-amber-500/10 text-amber-600 border-amber-200",
  SILVER: "bg-gray-400/10 text-gray-500 border-gray-200",
  BRONZE: "bg-orange-500/10 text-orange-600 border-orange-200",
}

function MemberCard({ member, onAction }: { member: any; onAction: () => void }) {
  const [acting, setActing] = useState(false)

  const handleApprove = async () => {
    setActing(true)
    try {
      await faMemberApi.approve(member.id)
      toast.success(`${member.full_name} approved`)
      onAction()
    } catch { toast.error("Failed to approve") }
    finally { setActing(false) }
  }

  const handleReject = async () => {
    setActing(true)
    try {
      await faMemberApi.reject(member.id)
      toast.success(`${member.full_name} rejected`)
      onAction()
    } catch { toast.error("Failed to reject") }
    finally { setActing(false) }
  }

  const approvalStatus = member.is_approved === 1 ? "approved" : member.is_approved === 2 ? "rejected" : "pending"
  const fraudRisk = member.fraud_score > 0.2 ? "high" : member.fraud_score > 0.1 ? "medium" : "low"
  const joinDate = member.created_at ? new Date(member.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"

  return (
    <div className="p-5 border-b last:border-0 space-y-3">
      {/* Row 1: Avatar + Name + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {member.instagram_profile_pic ? (
            <img src={member.instagram_profile_pic} alt="" className="h-12 w-12 rounded-full object-cover shrink-0 border" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-base">{member.full_name}</p>
              <Badge variant="outline" className={TIER_COLORS[member.tier] || ""}>{member.tier}</Badge>
              {!member.eligible && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Ineligible</Badge>}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <Instagram className="h-3.5 w-3.5" />
              <a href={`https://instagram.com/${member.instagram_username}`} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium">@{member.instagram_username}</a>
            </div>
            {member.instagram_bio && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-md italic">&ldquo;{member.instagram_bio}&rdquo;</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {approvalStatus === "pending" ? (
            <>
              <Button size="sm" variant="outline" onClick={handleReject} disabled={acting} className="text-red-600 border-red-200 hover:bg-red-50">
                <X className="h-4 w-4 mr-1" />Reject
              </Button>
              <Button size="sm" onClick={handleApprove} disabled={acting}>
                <Check className="h-4 w-4 mr-1" />Approve
              </Button>
            </>
          ) : (
            <Badge variant={approvalStatus === "approved" ? "default" : "destructive"}>
              {approvalStatus === "approved" ? <><ShieldCheck className="h-3 w-3 mr-1" />Approved</> : <><ShieldX className="h-3 w-3 mr-1" />Rejected</>}
            </Badge>
          )}
        </div>
      </div>

      {/* Row 2: Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
        <div className="bg-muted/40 rounded-lg px-3 py-2">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Followers</p>
          <p className="font-semibold">{member.followers_count?.toLocaleString() ?? "—"}</p>
          <p className="text-[11px] text-muted-foreground">{member.followers_range}</p>
        </div>
        <div className="bg-muted/40 rounded-lg px-3 py-2">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Engagement</p>
          <p className="font-semibold">{member.engagement_rate ?? 0}%</p>
          <p className="text-[11px] text-muted-foreground">{member.engagement_range}</p>
        </div>
        <div className="bg-muted/40 rounded-lg px-3 py-2">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Fraud Risk</p>
          <p className={`font-semibold ${fraudRisk === "high" ? "text-red-600" : fraudRisk === "medium" ? "text-amber-600" : "text-green-600"}`}>
            {fraudRisk === "high" && <AlertTriangle className="h-3 w-3 inline mr-0.5 -mt-0.5" />}
            {(member.fraud_score * 100).toFixed(0)}%
          </p>
          <p className="text-[11px] text-muted-foreground capitalize">{fraudRisk} risk</p>
        </div>
        <div className="bg-muted/40 rounded-lg px-3 py-2">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Audience Quality</p>
          <p className="font-semibold">{((member.audience_quality_score ?? 0) * 100).toFixed(0)}%</p>
        </div>
        <div className="bg-muted/40 rounded-lg px-3 py-2">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Niche</p>
          <p className="font-semibold text-xs truncate">{member.content_niche?.join(", ") || "—"}</p>
        </div>
        <div className="bg-muted/40 rounded-lg px-3 py-2">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Joined</p>
          <p className="font-semibold text-xs">{joinDate}</p>
        </div>
      </div>

      {/* Row 3: Contact info */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</span>
        {member.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{member.email}</span>}
        {member.gender && <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{member.gender}</span>}
        <span className="flex items-center gap-1"><Star className="h-3 w-3" />{member.campaigns_participated} campaigns</span>
      </div>
    </div>
  )
}

export default function FAMembersPage() {
  const [tab, setTab] = useState("pending")
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const approvalFilter = tab === "all" ? undefined : tab === "pending" ? 0 : tab === "approved" ? 1 : 2
      // Fetch current tab + counts in parallel (3 count calls instead of 4 full list fetches)
      const [res, pendingRes, approvedRes, rejectedRes] = await Promise.all([
        faMemberApi.list({ is_approved: approvalFilter, limit: 100 }),
        faMemberApi.list({ is_approved: 0, limit: 1 }),
        faMemberApi.list({ is_approved: 1, limit: 1 }),
        faMemberApi.list({ is_approved: 2, limit: 1 }),
      ])
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.members) ? res.data.members : Array.isArray(res) ? res : []
      setMembers(list)
      const getTotal = (r: any) => r.data?.total ?? 0
      const pCount = getTotal(pendingRes)
      const aCount = getTotal(approvedRes)
      const rCount = getTotal(rejectedRes)
      setCounts({
        all: pCount + aCount + rCount,
        pending: pCount,
        approved: aCount,
        rejected: rCount,
      })
    } catch {
      toast.error("Failed to load members")
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">FA Members</h1>
            <p className="text-muted-foreground text-sm">Review and approve influencer accounts</p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="pending">
                <Clock className="h-4 w-4 mr-1" />Pending
                {counts.pending > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">{counts.pending}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-12">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No {tab === "all" ? "" : tab} members found
                </p>
              ) : (
                <div className="divide-y">
                  {members.map((m: any) => (
                    <MemberCard key={m.id} member={m} onAction={load} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
