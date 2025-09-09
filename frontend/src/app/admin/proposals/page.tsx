'use client'

import { useState, useEffect } from "react"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  MoreHorizontal,
  RefreshCw,
  CheckCheck,
  XCircle,
  Eye,
  FileText,
  Calendar,
  DollarSign
} from "lucide-react"

import { 
  superadminApiService, 
  Proposal
} from "@/services/superadminApi"
import { toast } from "sonner"

export default function ProposalsPage() {
  // State Management
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [proposalStatusFilter, setProposalStatusFilter] = useState("all")

  // Load proposals
  const loadProposals = async () => {
    setLoading(true)
    try {
      const filters: any = { limit: 50 }
      if (proposalStatusFilter !== "all") filters.status_filter = proposalStatusFilter
      
      const result = await superadminApiService.getProposals(filters)
      if (result.success && result.data) {
        setProposals(result.data.proposals || [])
      } else {
        console.warn('Proposals API not available - superadmin endpoints not implemented')
        setProposals([])
      }
    } catch (error) {
      console.warn('Proposals API not available - superadmin endpoints not implemented')
      setProposals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProposals()
  }, [])

  useEffect(() => {
    loadProposals()
  }, [proposalStatusFilter])

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const handleUpdateProposalStatus = async (proposalId: string, newStatus: string) => {
    try {
      const result = await superadminApiService.updateProposalStatus(proposalId, newStatus, `Status updated by admin`)
      if (result.success) {
        toast.success(`Proposal status updated to ${newStatus}`)
        loadProposals()
      } else {
        toast.error(result.error || 'Failed to update proposal status')
      }
    } catch (error) {
      toast.error('Network error while updating proposal')
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <SuperadminSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading proposals...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 66)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SuperadminSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Proposal Management</h1>
                <p className="text-muted-foreground">Review and manage campaign proposals from brands</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => loadProposals()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Overview Statistics */}
            {proposals.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{proposals.length}</div>
                    <p className="text-xs text-muted-foreground">All submissions</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {proposals.filter(p => p.status === 'pending').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {proposals.filter(p => p.status === 'active').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Running campaigns</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(proposals.reduce((sum, p) => sum + p.budget, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">Combined budgets</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Proposal Filters */}
            <div className="flex items-center justify-between">
              <Select value={proposalStatusFilter} onValueChange={setProposalStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Proposals</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Proposals Table */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Proposals</CardTitle>
                <CardDescription>Manage brand campaign submissions and approvals</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{proposal.title}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {proposal.campaign_type.replace('_', ' ')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{proposal.brand_name}</div>
                            <div className="text-sm text-muted-foreground">{proposal.brand_contact_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(proposal.budget)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(proposal.status)}>
                            {proposal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(proposal.priority)}>
                            {proposal.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(proposal.timeline.start_date)}</span>
                          </div>
                          <div className="text-muted-foreground text-xs">
                            to {formatDate(proposal.timeline.end_date)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleUpdateProposalStatus(proposal.id, 'approved')}>
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateProposalStatus(proposal.id, 'rejected')}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateProposalStatus(proposal.id, 'active')}>
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {proposals.length === 0 && (
                  <div className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
                    <p className="text-muted-foreground">
                      Proposal data will appear here once brands start submitting campaigns.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requirements Summary */}
            {proposals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Common Requirements</CardTitle>
                  <CardDescription>Most frequent requirements across all proposals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Calculate common categories */}
                    {(() => {
                      const allCategories = proposals
                        .flatMap(p => p.requirements.categories || [])
                        .reduce((acc: Record<string, number>, category) => {
                          acc[category] = (acc[category] || 0) + 1
                          return acc
                        }, {})
                      
                      return Object.entries(allCategories)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([category, count]) => (
                          <div key={category} className="flex justify-between items-center">
                            <span className="font-medium">{category}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{count} proposals</Badge>
                              <span className="text-sm text-muted-foreground">
                                {((count / proposals.length) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}