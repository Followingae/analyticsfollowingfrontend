"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Check, X, Users, Clock, ShieldCheck, ShieldX, Instagram } from "lucide-react"
import { faMemberApi } from "@/services/faAdminApi"
import { toast } from "sonner"

const TIER_COLORS: Record<string, string> = {
  PLATINUM: "bg-purple-500/10 text-purple-600 border-purple-200",
  GOLD: "bg-amber-500/10 text-amber-600 border-amber-200",
  SILVER: "bg-gray-400/10 text-gray-500 border-gray-200",
  BRONZE: "bg-orange-500/10 text-orange-600 border-orange-200",
}

function MemberRow({ member, onAction }: { member: any; onAction: () => void }) {
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

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-0">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{member.full_name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Instagram className="h-3 w-3" />
            <span>@{member.instagram_username}</span>
            <span className="text-xs">|</span>
            <span>{member.followers_count?.toLocaleString()} followers</span>
            <span className="text-xs">|</span>
            <span>{member.engagement_rate}% eng.</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={TIER_COLORS[member.tier] || ""}>{member.tier}</Badge>
        {approvalStatus === "pending" ? (
          <>
            <Button size="sm" variant="outline" onClick={handleReject} disabled={acting}>
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
      const res = await faMemberApi.list({ is_approved: approvalFilter, limit: 100 })
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.members) ? res.data.members : Array.isArray(res) ? res : []
      setMembers(list)
      // Load counts
      const [all, pending, approved, rejected] = await Promise.all([
        faMemberApi.list({}),
        faMemberApi.list({ is_approved: 0 }),
        faMemberApi.list({ is_approved: 1 }),
        faMemberApi.list({ is_approved: 2 }),
      ])
      const toArr = (r: any) => Array.isArray(r.data) ? r.data : Array.isArray(r.data?.members) ? r.data.members : Array.isArray(r) ? r : []
      setCounts({
        all: toArr(all).length,
        pending: toArr(pending).length,
        approved: toArr(approved).length,
        rejected: toArr(rejected).length,
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
                    <MemberRow key={m.id} member={m} onAction={load} />
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
