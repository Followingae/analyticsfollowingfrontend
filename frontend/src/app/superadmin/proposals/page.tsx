"use client"

import { useState, useEffect } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StandardMetricCard } from "@/components/ui/standard-metric-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  Eye,
  Clock,
  Coins,
  Plus,
  MoreHorizontal,
  Send,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { adminProposalApi, AdminProposal, AdminProposalStats } from "@/services/adminProposalMasterApi"
import { motion } from "motion/react"
import { proposalMotion } from "@/components/proposals/proposal-utils"

export const dynamic = "force-dynamic"

import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge"

export default function SuperadminProposalsPage() {
  const [proposals, setProposals] = useState<AdminProposal[]>([])
  const [stats, setStats] = useState<AdminProposalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [proposalsRes, statsRes] = await Promise.all([
        adminProposalApi.listProposals(statusFilter === "all" ? undefined : { status: statusFilter }),
        adminProposalApi.getStats(),
      ])
      setProposals(proposalsRes.proposals || [])
      setStats(statsRes)
    } catch (err) {
      toast.error("Failed to load proposals")
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (id: string) => {
    try {
      await adminProposalApi.sendToBrand(id)
      toast.success("Proposal sent to brand")
      loadData()
    } catch (err) {
      toast.error("Failed to send proposal")
    }
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Proposals</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage influencer proposals for brands
              </p>
            </div>
            <Link href="/superadmin/proposals/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Proposal
              </Button>
            </Link>
          </div>

          {/* KPI Cards */}
          {stats ? (
            <motion.div
              variants={proposalMotion.staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
              <motion.div variants={proposalMotion.staggerItem}>
                <StandardMetricCard icon={FileText} label="Total" value={stats.total_proposals} subtitle="proposals" />
              </motion.div>
              <motion.div variants={proposalMotion.staggerItem}>
                <StandardMetricCard icon={Clock} label="Active" value={stats.active_proposals} subtitle="awaiting response" />
              </motion.div>
              <motion.div variants={proposalMotion.staggerItem}>
                <StandardMetricCard icon={CheckCircle} label="Approved" value={stats.approved_proposals} subtitle={`${stats.approval_rate}% rate`} />
              </motion.div>
              <motion.div variants={proposalMotion.staggerItem}>
                <StandardMetricCard icon={Coins} label="Margin" value={`د.إ${stats.total_margin.toLocaleString()}`} subtitle={`avg ${stats.avg_margin_percentage.toFixed(1)}%`} />
              </motion.div>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-muted animate-pulse rounded-lg" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-16 bg-muted animate-pulse rounded" />
                        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="more_requested">More Requested</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Proposals Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Influencers</TableHead>
                    <TableHead className="text-right">Sell</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                          </div>
                        </TableCell>
                        <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-5 w-16 bg-muted animate-pulse rounded-full" /></TableCell>
                        <TableCell className="text-right"><div className="h-4 w-10 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                        <TableCell className="text-right"><div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                        <TableCell className="text-right"><div className="h-4 w-12 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                        <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell className="text-right"><div className="h-8 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : proposals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
                        <p className="text-sm font-medium mb-1">No proposals found</p>
                        <p className="text-xs text-muted-foreground mb-4">Create a proposal to get started</p>
                        <Link href="/superadmin/proposals/create">
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Proposal
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    proposals.map((p) => (
                      <TableRow key={p.id} className="group transition-colors duration-150 hover:bg-muted/50">
                        <TableCell>
                          <Link
                            href={`/superadmin/proposals/${p.id}`}
                            className="hover:underline font-medium text-sm"
                          >
                            {p.title}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.campaign_name}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.user_email || "--"}
                        </TableCell>
                        <TableCell>
                          <ProposalStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          <span className="font-medium">{p.selected_count}</span>
                          <span className="text-muted-foreground">/{p.total_influencers}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium">
                          {p.total_sell_amount
                            ? `د.إ${p.total_sell_amount.toLocaleString()}`
                            : "--"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {p.margin_percentage
                            ? `${p.margin_percentage.toFixed(1)}%`
                            : "--"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.deadline_at
                            ? new Date(p.deadline_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : "--"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-150 data-[state=open]:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/superadmin/proposals/${p.id}`}>
                                  <Eye className="mr-2 h-3.5 w-3.5" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {p.status === "draft" && (
                                <DropdownMenuItem onClick={() => handleSend(p.id)}>
                                  <Send className="mr-2 h-3.5 w-3.5" />
                                  Send to Brand
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
      </div>
    </SuperadminLayout>
  )
}
