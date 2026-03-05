"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { brandProposalViewApi } from "@/services/adminProposalMasterApi"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StandardMetricCard } from "@/components/ui/standard-metric-card"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  Users,
  Loader2,
} from "lucide-react"
import { formatCount, formatCurrency } from "@/components/proposals/proposal-utils"

export const dynamic = "force-dynamic"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getStatusColor(status: string) {
  switch (status) {
    case "sent":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "in_review":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "more_requested":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "sent":
      return <Clock className="h-4 w-4" />
    case "in_review":
      return <Eye className="h-4 w-4" />
    case "approved":
      return <CheckCircle className="h-4 w-4" />
    case "rejected":
      return <XCircle className="h-4 w-4" />
    case "more_requested":
      return <MessageSquare className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

// ---------------------------------------------------------------------------
// Types for list response
// ---------------------------------------------------------------------------
interface ProposalListItem {
  id: string
  title: string
  campaign_name: string
  description?: string
  status: string
  total_influencers: number
  selected_count: number
  total_sell_amount?: number
  deadline_at?: string
  cover_image_url?: string
  created_at: string
  sent_at?: string
  responded_at?: string
  more_added_at?: string
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function ProposalsPage() {
  const { user, loading: authLoading } = useEnhancedAuth()
  const router = useRouter()

  const [proposals, setProposals] = useState<ProposalListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  // Redirect admin/superadmin to superadmin proposals dashboard
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "super_admin" || user.role === "admin") {
        router.replace("/superadmin/proposals")
        return
      }
    }
  }, [user, authLoading, router])

  // Load proposals for brand users
  useEffect(() => {
    if (!authLoading && user && !user.role.startsWith("super_admin") && user.role !== "admin") {
      loadProposals()
    }
  }, [user, authLoading])

  const loadProposals = async () => {
    setLoading(true)
    try {
      const result = await brandProposalViewApi.listProposals()
      // The backend returns { proposals, pending_count, pagination }
      const data = result as any
      setProposals(data.proposals || [])
      setPendingCount(data.pending_count || 0)
    } catch (err) {
      toast.error("Failed to load proposals")
    } finally {
      setLoading(false)
    }
  }

  // While checking auth, show loading
  if (authLoading) {
    return (
      <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 66)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Stats
  const totalProposals = proposals.length
  const approvedCount = proposals.filter((p) => p.status === "approved").length
  const activeCount = proposals.filter((p) =>
    ["sent", "in_review", "more_requested"].includes(p.status)
  ).length

  const sidebarStyle = {
    "--sidebar-width": "calc(var(--spacing) * 66)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-semibold">Proposals</h1>
              <p className="text-muted-foreground">
                Review influencer proposals from your agency team
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StandardMetricCard icon={FileText} label="Total" value={totalProposals} subtitle="proposals received" />
              <StandardMetricCard icon={Clock} label="Pending" value={pendingCount} subtitle="awaiting response" />
              <StandardMetricCard icon={Users} label="Active" value={activeCount} subtitle="in review" />
              <StandardMetricCard icon={CheckCircle} label="Approved" value={approvedCount} subtitle="campaigns created" />
            </div>

            {/* Proposals List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : proposals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No proposals yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Your agency team hasn&apos;t sent any proposals yet. You&apos;ll see
                    them here once they curate influencer lists for your campaigns.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {proposals.map((proposal) => {
                  const daysLeft = proposal.deadline_at
                    ? Math.max(
                        0,
                        Math.ceil(
                          (new Date(proposal.deadline_at).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    : null

                  return (
                    <Card
                      key={proposal.id}
                      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 overflow-hidden"
                      onClick={() => router.push(`/proposals/${proposal.id}`)}
                    >
                      {proposal.cover_image_url && (
                        <div className="h-32 w-full bg-muted">
                          <img
                            src={proposal.cover_image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">
                                {proposal.title}
                              </h3>
                              <Badge className={getStatusColor(proposal.status)}>
                                {getStatusIcon(proposal.status)}
                                <span className="ml-1">
                                  {proposal.status.replace(/_/g, " ")}
                                </span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {proposal.campaign_name}
                            </p>
                            {proposal.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {proposal.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {proposal.total_influencers} influencers
                              </span>
                              {proposal.selected_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  {proposal.selected_count} selected
                                </span>
                              )}
                              {proposal.total_sell_amount != null && proposal.total_sell_amount > 0 && (
                                <span className="font-medium text-foreground">
                                  {formatCurrency(proposal.total_sell_amount)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {daysLeft !== null && (
                              <Badge
                                variant="outline"
                                className={
                                  daysLeft === 0
                                    ? "border-red-500 text-red-700 dark:text-red-400"
                                    : ""
                                }
                              >
                                {daysLeft > 0
                                  ? `${daysLeft} days left`
                                  : "Deadline passed"}
                              </Badge>
                            )}
                            {proposal.more_added_at && (
                              <Badge variant="secondary" className="text-xs">
                                New influencers added
                              </Badge>
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
