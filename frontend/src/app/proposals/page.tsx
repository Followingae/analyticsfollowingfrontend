"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { brandProposalViewApi } from "@/services/adminProposalMasterApi"
import { toast } from "sonner"

import { EnhancedAppSidebar } from "@/components/brand/EnhancedAppSidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  FileText,
  Clock,
  CheckCircle,
  Users,
  Loader2,
  Archive,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { proposalMotion } from "@/components/proposals/proposal-utils"
import { ProposalOverviewCard } from "@/components/proposals/ProposalOverviewCard"
import { motion } from "motion/react"
import NumberFlow from "@number-flow/react"

export const dynamic = "force-dynamic"

// ---------------------------------------------------------------------------
// Types
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
// Page
// ---------------------------------------------------------------------------
export default function ProposalsPage() {
  const { user, loading: authLoading } = useEnhancedAuth()
  const router = useRouter()
  const { markReadByReference } = useNotifications()

  const [proposals, setProposals] = useState<ProposalListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "super_admin" || user.role === "admin") {
        router.replace("/superadmin/proposals")
        return
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!authLoading && user && !user.role.startsWith("super_admin") && user.role !== "admin") {
      loadProposals()
    }
  }, [user, authLoading])

  const loadProposals = async () => {
    setLoading(true)
    try {
      const result = await brandProposalViewApi.listProposals()
      const data = result as any
      setProposals(data.proposals || [])
      setPendingCount(data.pending_count || 0)
      markReadByReference("proposal")
    } catch (err) {
      toast.error("Failed to load proposals")
    } finally {
      setLoading(false)
    }
  }

  const activeProposals = useMemo(
    () => proposals.filter((p) => !["approved", "rejected"].includes(p.status)),
    [proposals]
  )
  const archivedProposals = useMemo(
    () => proposals.filter((p) => ["approved", "rejected"].includes(p.status)),
    [proposals]
  )

  const totalCreators = useMemo(
    () => proposals.reduce((sum, p) => sum + (p.total_influencers || 0), 0),
    [proposals]
  )
  const totalValue = useMemo(
    () => proposals
      .filter((p) => !["approved", "rejected"].includes(p.status))
      .reduce((sum, p) => sum + (p.total_sell_amount || 0), 0),
    [proposals]
  )

  const kpis = [
    { icon: FileText, label: "Active Proposals", value: activeProposals.length },
    { icon: Clock, label: "Pending Review", value: pendingCount },
    { icon: Users, label: "Total Creators", value: totalCreators },
    { icon: TrendingUp, label: "Total Value", value: totalValue, isCurrency: true },
  ]

  if (authLoading) {
    return (
      <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 66)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
        <EnhancedAppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const sidebarStyle = {
    "--sidebar-width": "calc(var(--spacing) * 66)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties

  return (
    <SidebarProvider style={sidebarStyle}>
      <EnhancedAppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <motion.div
            variants={proposalMotion.staggerContainer}
            initial="hidden"
            animate="visible"
            className="@container/main flex flex-1 flex-col p-4 md:p-6 lg:p-8"
          >
            {/* Header */}
            <motion.div variants={proposalMotion.staggerItem}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="gap-1.5 font-medium">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative rounded-full h-2 w-2 bg-primary" />
                        </span>
                        {pendingCount} awaiting review
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1.5">
                    Review influencer proposals curated by your agency team
                  </p>
                </div>
              </div>
            </motion.div>

            {/* KPIs */}
            <motion.div variants={proposalMotion.staggerItem}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 rounded-xl overflow-hidden border border-border/40 mt-6">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="bg-background px-5 py-4 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <kpi.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                    </div>
                    {(kpi as any).isCurrency ? (
                      <p className="text-2xl font-bold tabular-nums">
                        ${kpi.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    ) : (
                      <NumberFlow
                        value={kpi.value}
                        className="text-2xl font-bold tabular-nums"
                        transformTiming={{ duration: 750, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Content */}
            <div className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : proposals.length === 0 ? (
                <EmptyState
                  title="No proposals yet"
                  description={"Your agency team hasn't sent any proposals yet.\nYou'll see them here once they curate influencer lists for your campaigns."}
                  icons={[FileText, Users, Clock]}
                />
              ) : (
                <Tabs defaultValue="active" className="w-full">
                  <TabsList>
                    <TabsTrigger value="active" className="gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Active
                      {pendingCount > 0 && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative rounded-full h-2 w-2 bg-primary" />
                        </span>
                      )}
                      {activeProposals.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 min-w-5 justify-center">
                          {activeProposals.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="archive" className="gap-1.5">
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                      {archivedProposals.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 min-w-5 justify-center">
                          {archivedProposals.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="mt-4">
                    {activeProposals.length === 0 ? (
                      <EmptyState
                        title="No active proposals"
                        description="All proposals have been reviewed. Check the Archive tab for past proposals."
                        icons={[FileText, CheckCircle, Clock]}
                      />
                    ) : (
                      <motion.div
                        variants={proposalMotion.staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                      >
                        {activeProposals.map((proposal) => (
                          <motion.div key={proposal.id} variants={proposalMotion.staggerItem}>
                            <ProposalOverviewCard
                              proposal={proposal}
                              onClick={() => router.push(`/proposals/${proposal.id}`)}
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="archive" className="mt-4">
                    {archivedProposals.length === 0 ? (
                      <EmptyState
                        title="No archived proposals"
                        description="Approved and rejected proposals will appear here."
                        icons={[Archive, CheckCircle, FileText]}
                      />
                    ) : (
                      <motion.div
                        variants={proposalMotion.staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                      >
                        {archivedProposals.map((proposal) => (
                          <motion.div key={proposal.id} variants={proposalMotion.staggerItem}>
                            <ProposalOverviewCard
                              proposal={proposal}
                              archived
                              onClick={() => router.push(`/proposals/${proposal.id}`)}
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </motion.div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
