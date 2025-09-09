'use client'

import { useState, useEffect } from 'react'
import { 
  brandProposalsApi, 
  BrandProposal, 
  BrandDashboard
} from '@/services/proposalsApi'
import {
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  FileText,
  MessageSquare,
  DollarSign,
  Target,
  TrendingUp,
  Users,
  Search,
  Filter
} from 'lucide-react'

import { AppSidebar } from '@/components/app-sidebar'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { BrandProposalDetailsDialog } from './BrandProposalDetailsDialog'
import { ProposalResponseDialog } from './ProposalResponseDialog'

export const dynamic = 'force-dynamic'

export function BrandProposalsDashboard() {
  const [dashboardData, setDashboardData] = useState<BrandDashboard | null>(null)
  const [proposals, setProposals] = useState<BrandProposal[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState('overview')
  
  // Dialogs
  const [selectedProposal, setSelectedProposal] = useState<BrandProposal | null>(null)
  const [isProposalDetailsOpen, setIsProposalDetailsOpen] = useState(false)
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [dashboardResult, proposalsResult] = await Promise.all([
        brandProposalsApi.getDashboard(),
        brandProposalsApi.getAssignedProposals({ limit: 50 })
      ])

      if (dashboardResult.success && dashboardResult.data) {
        setDashboardData(dashboardResult.data)
        setProposals(dashboardResult.data.assigned_proposals || [])
      } else {
        throw new Error(dashboardResult.error || 'Failed to load dashboard')
      }

      if (proposalsResult.success && proposalsResult.data) {
        setProposals(proposalsResult.data.proposals || [])
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load data')
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Submit response to proposal
  const handleSubmitResponse = async (proposalId: string, responseData: {
    response: 'approved' | 'rejected' | 'request_changes' | 'needs_discussion'
    feedback?: string
    requested_changes?: string[]
  }) => {
    try {
      const result = await brandProposalsApi.submitResponse(proposalId, responseData)

      if (result.success) {
        await loadDashboardData() // Refresh data
        toast.success('Response submitted successfully')
        setIsResponseDialogOpen(false)
      } else {
        toast.error(result.error || 'Failed to submit response')
      }
    } catch (error) {
      toast.error('Network error while submitting response')
    }
  }

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    if (statusFilter !== 'all' && proposal.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        proposal.proposal_title.toLowerCase().includes(query) ||
        proposal.proposal_description.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'needs_discussion': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'needs_discussion': return <MessageSquare className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatCurrency = (amountCents: number) => {
    const amountUsd = amountCents / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amountUsd)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = (proposal: BrandProposal) => {
    if (!proposal.response_due_date) return false
    return new Date(proposal.response_due_date) < new Date() && proposal.status === 'sent'
  }

  if (loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
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

  if (error) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button variant="outline" onClick={() => loadDashboardData()}>
                Try Again
              </Button>
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
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Brand Proposals</h1>
                <p className="text-muted-foreground">Review and respond to marketing proposals from Following Agency</p>
              </div>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="proposals">All Proposals</TabsTrigger>
                <TabsTrigger value="pending">Pending Response</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Dashboard Stats */}
                {dashboardData && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.total_proposals_received}</div>
                        <p className="text-xs text-muted-foreground">
                          Received proposals
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Response</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.pending_responses}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardData.overdue_responses} overdue
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.approved_proposals}</div>
                        <p className="text-xs text-muted-foreground">
                          {((dashboardData.approved_proposals / dashboardData.total_proposals_received) * 100).toFixed(0)}% approval rate
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{(dashboardData.response_rate * 100).toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                          Avg: {dashboardData.average_response_time_days} days
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Recent Proposals */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Proposals</CardTitle>
                    <CardDescription>Latest proposals that require your attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {proposals.filter(p => p.status === 'sent').slice(0, 3).map((proposal) => (
                        <div key={proposal.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{proposal.proposal_title}</p>
                              {isOverdue(proposal) && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(proposal.total_campaign_budget_usd_cents)} • 
                              Due: {proposal.response_due_date ? formatDate(proposal.response_due_date) : 'No due date'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProposal(proposal)
                                setIsProposalDetailsOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedProposal(proposal)
                                setIsResponseDialogOpen(true)
                              }}
                              style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} 
                              className="hover:opacity-90"
                            >
                              Respond
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {proposals.filter(p => p.status === 'sent').length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No pending proposals. You're all caught up!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* All Proposals Tab */}
              <TabsContent value="proposals" className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search proposals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-[250px] pl-10"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="sent">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="needs_discussion">Needs Discussion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Proposals List */}
                <div className="space-y-4">
                  {filteredProposals.map((proposal) => (
                    <Card key={proposal.id} className={`group ${isOverdue(proposal) ? 'border-red-200 dark:border-red-800' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{proposal.proposal_title}</h3>
                                  {isOverdue(proposal) && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Overdue
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {proposal.proposal_description}
                                </p>
                              </div>
                              <Badge className={getStatusColor(proposal.status)}>
                                {getStatusIcon(proposal.status)}
                                <span className="ml-1">{proposal.status.replace('_', ' ')}</span>
                              </Badge>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCurrency(proposal.total_campaign_budget_usd_cents)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                <span>{proposal.deliverables.length} deliverable{proposal.deliverables.length !== 1 ? 's' : ''}</span>
                              </div>
                              {proposal.sent_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Received {formatDate(proposal.sent_at)}</span>
                                </div>
                              )}
                              {proposal.response_due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>Due {formatDate(proposal.response_due_date)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProposal(proposal)
                                    setIsProposalDetailsOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                                
                                {proposal.status === 'sent' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedProposal(proposal)
                                      setIsResponseDialogOpen(true)
                                    }}
                                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} 
                                    className="hover:opacity-90"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Respond
                                  </Button>
                                )}
                              </div>

                              {proposal.responded_at && (
                                <span className="text-sm text-muted-foreground">
                                  Responded {formatDate(proposal.responded_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredProposals.length === 0 && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
                        <p className="text-muted-foreground text-center">
                          {searchQuery.trim() || statusFilter !== "all"
                            ? "Try adjusting your search or filter criteria"
                            : "No proposals have been assigned to your account yet"
                          }
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Pending Tab */}
              <TabsContent value="pending" className="space-y-4">
                <div className="space-y-4">
                  {proposals.filter(p => p.status === 'sent').map((proposal) => (
                    <Card key={proposal.id} className={`group ${isOverdue(proposal) ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{proposal.proposal_title}</h3>
                              {isOverdue(proposal) && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(proposal.total_campaign_budget_usd_cents)} • 
                              Due: {proposal.response_due_date ? formatDate(proposal.response_due_date) : 'No due date'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProposal(proposal)
                                setIsProposalDetailsOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedProposal(proposal)
                                setIsResponseDialogOpen(true)
                              }}
                              style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} 
                              className="hover:opacity-90"
                            >
                              Respond Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {proposals.filter(p => p.status === 'sent').length === 0 && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No pending proposals</h3>
                        <p className="text-muted-foreground text-center">
                          All proposals have been responded to. Great job!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Approved Tab */}
              <TabsContent value="approved" className="space-y-4">
                <div className="space-y-4">
                  {proposals.filter(p => p.status === 'approved').map((proposal) => (
                    <Card key={proposal.id} className="group border-green-200 dark:border-green-800">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <h3 className="font-semibold text-lg">{proposal.proposal_title}</h3>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Approved
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(proposal.total_campaign_budget_usd_cents)} • 
                              Approved: {proposal.responded_at ? formatDate(proposal.responded_at) : 'Recently'}
                            </p>
                            {proposal.brand_feedback && (
                              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg mt-2">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                  <strong>Your feedback:</strong> {proposal.brand_feedback}
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProposal(proposal)
                              setIsProposalDetailsOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {proposals.filter(p => p.status === 'approved').length === 0 && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No approved proposals</h3>
                        <p className="text-muted-foreground text-center">
                          Approved proposals will appear here once you respond positively to them.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Proposal Details Dialog */}
            <Dialog open={isProposalDetailsOpen} onOpenChange={setIsProposalDetailsOpen}>
              <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                {selectedProposal && (
                  <BrandProposalDetailsDialog 
                    proposal={selectedProposal} 
                    onClose={() => setIsProposalDetailsOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Response Dialog */}
            <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                {selectedProposal && (
                  <ProposalResponseDialog 
                    proposal={selectedProposal} 
                    onClose={() => setIsResponseDialogOpen(false)}
                    onSubmit={handleSubmitResponse}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}