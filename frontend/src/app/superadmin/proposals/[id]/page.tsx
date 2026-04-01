"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { adminProposalApi, AdminProposalDetail, AdminProposalInfluencer } from "@/services/adminProposalMasterApi"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { StandardMetricCard } from "@/components/ui/standard-metric-card"
import { Progress } from "@/components/ui/progress"
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge"
import { formatCurrency, formatCount, formatDate, proposalMotion, chartColorVar } from "@/components/proposals/proposal-utils"
import { motion, useInView } from "motion/react"
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  Plus,
  MoreHorizontal,
  Trash2,
  Clock,
  Coins,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react"

export const dynamic = "force-dynamic"

// =============================================================================
// HELPERS
// =============================================================================

const TIMELINE_ICONS: Record<string, React.ElementType> = {
  created: FileText,
  sent: Send,
  more_requested: MessageSquare,
  more_added: Plus,
  approved: CheckCircle,
  rejected: XCircle,
}

function getSellPrice(inf: AdminProposalInfluencer): number {
  if (inf.custom_sell_pricing?.post != null) return inf.custom_sell_pricing.post
  if (inf.sell_price_snapshot?.post != null) return inf.sell_price_snapshot.post
  return 0
}

function getCostPrice(inf: AdminProposalInfluencer): number {
  if (inf.cost_price_snapshot?.post != null) return inf.cost_price_snapshot.post
  return 0
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<AdminProposalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  async function loadDetail() {
    try {
      setLoading(true)
      const detail = await adminProposalApi.getDetail(id)
      setData(detail)
    } catch (err: any) {
      toast.error(err.message || "Failed to load proposal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleSend() {
    try {
      setSending(true)
      await adminProposalApi.sendToBrand(id)
      toast.success("Proposal sent to brand")
      loadDetail()
    } catch (err: any) {
      toast.error(err.message || "Failed to send proposal")
    } finally {
      setSending(false)
    }
  }

  async function handleRemoveInfluencer(influencerId: string) {
    try {
      await adminProposalApi.removeInfluencer(id, influencerId)
      toast.success("Influencer removed")
      loadDetail()
    } catch (err: any) {
      toast.error(err.message || "Failed to remove influencer")
    }
  }

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SuperadminLayout>
    )
  }

  if (!data) {
    return (
      <SuperadminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground">Proposal not found</p>
          <Button variant="outline" onClick={() => router.push("/superadmin/proposals")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Proposals
          </Button>
        </div>
      </SuperadminLayout>
    )
  }

  const { proposal, influencers, financials, timeline } = data
  const status = proposal.status as string
  const canEdit = status === "draft" || status === "more_requested"
  const canSend = status === "draft" && influencers.length > 0
  const showBrandResponse = ["in_review", "more_requested", "approved", "rejected"].includes(status)
  const lastTimelineEvent = timeline.length > 0 ? timeline[timeline.length - 1].event : null

  // Compute table totals
  const totalSell = influencers.reduce((s, i) => s + getSellPrice(i), 0)
  const totalCost = influencers.reduce((s, i) => s + getCostPrice(i), 0)

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        {/* ================================================================= */}
        {/* 1. HEADER CARD                                                    */}
        {/* ================================================================= */}
        <Card className="overflow-hidden">
          {proposal.cover_image_url && (
            <div className="h-40 w-full bg-muted">
              <img
                src={proposal.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/superadmin/proposals")}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{proposal.title}</CardTitle>
                <CardDescription className="space-y-0.5">
                  <span className="block">Campaign: {proposal.campaign_name}</span>
                  {proposal.user_email && (
                    <span className="block">Brand: {proposal.user_email}</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <ProposalStatusBadge status={status} />
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/superadmin/proposals/create?edit=${id}`)
                    }
                  >
                    Edit
                  </Button>
                )}
                {canSend && (
                  <Button size="sm" disabled={sending} onClick={handleSend}>
                    <Send className="mr-1 h-4 w-4" />
                    {sending ? "Sending..." : "Send to Brand"}
                  </Button>
                )}
              </div>
            </div>
            {proposal.description && (
              <>
                <Separator className="mt-4" />
                <p className="text-sm text-muted-foreground pt-2">
                  {proposal.description}
                </p>
              </>
            )}
            {proposal.proposal_notes && (
              <p className="text-sm text-muted-foreground mt-1 italic">
                Notes: {proposal.proposal_notes}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* ================================================================= */}
        {/* 2. STATUS TIMELINE                                                */}
        {/* ================================================================= */}
        {timeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                <motion.div
                  variants={proposalMotion.staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {timeline.map((event, idx) => {
                    const Icon = TIMELINE_ICONS[event.event] || Clock
                    const isActive = event.event === lastTimelineEvent
                    return (
                      <motion.div key={idx} variants={proposalMotion.staggerItem} className="relative flex gap-4 items-start">
                        <div
                          className={`absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background ${
                            isActive
                              ? "border-primary text-primary"
                              : "border-muted-foreground/30 text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium capitalize ${
                              isActive ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {event.event.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.timestamp)}
                          </p>
                          {event.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================= */}
        {/* 3. FINANCIAL SUMMARY                                              */}
        {/* ================================================================= */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={proposalMotion.staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <motion.div variants={proposalMotion.staggerItem}>
                <StandardMetricCard icon={Coins} label="Total Sell" value={formatCurrency(financials.total_sell)} />
              </motion.div>
              <motion.div variants={proposalMotion.staggerItem}>
                <StandardMetricCard icon={Coins} label="Total Cost" value={formatCurrency(financials.total_cost)} />
              </motion.div>
              <motion.div variants={proposalMotion.staggerItem}>
                <StandardMetricCard icon={TrendingUp} label="Margin %" value={`${financials.margin_percentage?.toFixed(1) ?? "0.0"}%`} />
              </motion.div>
              <motion.div variants={proposalMotion.staggerItem}>
                <StandardMetricCard icon={Users} label="Influencers" value={influencers.length} />
              </motion.div>
            </motion.div>
            <Card className="mt-4">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Profit Margin</span>
                  <span className="text-sm font-medium">{financials.margin_percentage?.toFixed(1) ?? "0.0"}%</span>
                </div>
                <Progress value={financials.margin_percentage ?? 0} />
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* ================================================================= */}
        {/* 4. INFLUENCERS TABLE                                              */}
        {/* ================================================================= */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Influencers</CardTitle>
            <CardDescription>
              {influencers.length} influencer{influencers.length !== 1 && "s"} in
              this proposal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Influencer</TableHead>
                    <TableHead className="text-right">Followers</TableHead>
                    <TableHead className="text-right">Engagement</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Sell Price</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Selected</TableHead>
                    <TableHead className="min-w-[120px]">Admin Notes</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {influencers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-muted-foreground py-8"
                      >
                        No influencers added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    influencers.map((inf) => {
                      const sell = getSellPrice(inf)
                      const cost = getCostPrice(inf)
                      const margin = sell > 0 ? ((sell - cost) / sell) * 100 : 0
                      return (
                        <TableRow key={inf.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={inf.profile_image_url || ""}
                                  alt={inf.username || ""}
                                />
                                <AvatarFallback>
                                  {(inf.username || "?")[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {inf.username || "Unknown"}
                                </span>
                                {inf.full_name && (
                                  <span className="text-xs text-muted-foreground">
                                    {inf.full_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCount(inf.followers_count)}
                          </TableCell>
                          <TableCell className="text-right">
                            {inf.engagement_rate != null
                              ? inf.engagement_rate.toFixed(2) + "%"
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {inf.tier ? (
                              <Badge variant="outline" className="capitalize">
                                {inf.tier}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sell)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(cost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {margin.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            {inf.selected_by_user ? (
                              <Badge variant="default">
                                Selected
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Not Selected</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {inf.admin_notes || "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleRemoveInfluencer(inf.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
                {influencers.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-medium">
                        Totals
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(totalSell)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(totalCost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {totalSell > 0
                          ? (((totalSell - totalCost) / totalSell) * 100).toFixed(1) +
                            "%"
                          : "0.0%"}
                      </TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================= */}
        {/* 5. BRAND RESPONSE SECTION                                         */}
        {/* ================================================================= */}
        {showBrandResponse && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brand Response</CardTitle>
              <CardDescription>
                Feedback and notes from the brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {proposal.brand_notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Brand Notes</p>
                  <p className="text-sm text-muted-foreground rounded-md bg-muted p-3">
                    {proposal.brand_notes}
                  </p>
                </div>
              )}
              {proposal.request_more_notes && (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Request More Notes
                  </p>
                  <p className="text-sm text-muted-foreground rounded-md bg-muted p-3">
                    {proposal.request_more_notes}
                  </p>
                </div>
              )}
              {!proposal.brand_notes && !proposal.request_more_notes && (
                <p className="text-sm text-muted-foreground">
                  No brand feedback yet.
                </p>
              )}
              {status === "more_requested" && (
                <>
                  <Separator />
                  <Button
                    onClick={() =>
                      router.push(
                        `/superadmin/proposals/create?addMore=${id}`
                      )
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add More Influencers
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </SuperadminLayout>
  )
}
