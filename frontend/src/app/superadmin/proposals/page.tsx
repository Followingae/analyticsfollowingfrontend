"use client"

import { useState, useEffect } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  DollarSign,
  Users,
  Plus,
  MoreHorizontal,
  Send,
  CheckCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { adminProposalApi, AdminProposal, AdminProposalStats } from "@/services/adminProposalMasterApi"

export const dynamic = "force-dynamic"

function getStatusVariant(status: string) {
  switch (status) {
    case "draft": return "secondary"
    case "sent": return "default"
    case "in_review": return "outline"
    case "approved": return "default"
    case "rejected": return "destructive"
    case "more_requested": return "outline"
    default: return "secondary"
  }
}

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
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Proposals</h1>
              <p className="text-muted-foreground">
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
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StandardMetricCard icon={FileText} label="Total" value={stats.total_proposals} subtitle="proposals created" />
              <StandardMetricCard icon={Clock} label="Active" value={stats.active_proposals} subtitle="awaiting response" />
              <StandardMetricCard icon={CheckCircle} label="Approved" value={stats.approved_proposals} subtitle={`${stats.approval_rate}% rate`} />
              <StandardMetricCard icon={DollarSign} label="Total Margin" value={`$${stats.total_margin.toLocaleString()}`} subtitle={`avg ${stats.avg_margin_percentage.toFixed(1)}%`} />
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
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Influencers</TableHead>
                    <TableHead className="text-right">Sell</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : proposals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No proposals found</p>
                        <Link href="/superadmin/proposals/create">
                          <Button variant="outline" size="sm" className="mt-3">
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first proposal
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    proposals.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/superadmin/proposals/${p.id}`}
                            className="hover:underline"
                          >
                            {p.title}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {p.campaign_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.user_email || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(p.status) as any}>
                            {p.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.selected_count}/{p.total_influencers}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.total_sell_amount
                            ? `$${p.total_sell_amount.toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.margin_percentage
                            ? `${p.margin_percentage.toFixed(1)}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.deadline_at
                            ? new Date(p.deadline_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/superadmin/proposals/${p.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Detail
                                </Link>
                              </DropdownMenuItem>
                              {p.status === "draft" && (
                                <DropdownMenuItem onClick={() => handleSend(p.id)}>
                                  <Send className="mr-2 h-4 w-4" />
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
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperadminLayout>
  )
}
