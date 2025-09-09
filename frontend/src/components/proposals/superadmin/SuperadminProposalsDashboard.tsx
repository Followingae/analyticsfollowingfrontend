'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  superadminProposalsApi, 
  BrandProposal, 
  SuperadminDashboard,
  InviteCampaign,
  InfluencerApplication
} from '@/services/proposalsApi'
import {
  Plus,
  Users,
  Eye,
  Send,
  Settings,
  BarChart3,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Target,
  MessageSquare,
  UserPlus,
  Link2,
  Mail,
  Award
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { CreateProposalDialog } from './CreateProposalDialog'
import { InviteCampaignManager } from './InviteCampaignManager'
import { ProposalDetailsDialog } from './ProposalDetailsDialog'

export const dynamic = 'force-dynamic'

export function SuperadminProposalsDashboard() {
  const [dashboardData, setDashboardData] = useState<SuperadminDashboard | null>(null)
  const [proposals, setProposals] = useState<BrandProposal[]>([])
  const [inviteCampaigns, setInviteCampaigns] = useState<InviteCampaign[]>([])
  const [recentApplications, setRecentApplications] = useState<InfluencerApplication[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState('overview')
  
  // Dialogs
  const [isCreateProposalOpen, setIsCreateProposalOpen] = useState(false)
  const [isInviteCampaignOpen, setIsInviteCampaignOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<BrandProposal | null>(null)
  const [isProposalDetailsOpen, setIsProposalDetailsOpen] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const router = useRouter()

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [dashboardResult, proposalsResult, campaignsResult] = await Promise.all([
        superadminProposalsApi.getDashboard(),
        superadminProposalsApi.getAllProposals({ limit: 50 }),
        superadminProposalsApi.getInviteCampaigns({ limit: 10 })
      ])

      if (dashboardResult.success && dashboardResult.data) {
        setDashboardData(dashboardResult.data)
        setRecentApplications(dashboardResult.data.recent_applications || [])
      } else {
        throw new Error(dashboardResult.error || 'Failed to load dashboard')
      }

      if (proposalsResult.success && proposalsResult.data) {
        setProposals(proposalsResult.data.proposals || [])
      }

      if (campaignsResult.success && campaignsResult.data) {
        setInviteCampaigns(campaignsResult.data.campaigns || [])
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

  // Send proposal to brand
  const handleSendProposal = async (proposalId: string) => {
    try {
      const result = await superadminProposalsApi.sendProposalToBrands(proposalId, {
        response_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        send_notifications: true
      })

      if (result.success) {
        await loadDashboardData() // Refresh data
        toast.success('Proposal sent to brand users successfully')
      } else {
        toast.error(result.error || 'Failed to send proposal')
      }
    } catch (error) {
      toast.error('Network error while sending proposal')
    }
  }

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    if (statusFilter !== 'all' && proposal.status !== statusFilter) return false
    if (priorityFilter !== 'all' && proposal.priority_level !== priorityFilter) return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        proposal.proposal_title.toLowerCase().includes(query) ||
        proposal.proposal_description.toLowerCase().includes(query) ||
        proposal.brand_company_name?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'needs_discussion': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-muted-foreground'
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
              <p className="text-muted-foreground">Loading proposals dashboard...</p>
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
                <h1 className="text-3xl font-bold">Proposals Management</h1>
                <p className="text-muted-foreground">Manage B2B proposals, invite campaigns, and influencer applications</p>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={isInviteCampaignOpen} onOpenChange={setIsInviteCampaignOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Link2 className="h-4 w-4 mr-2" />
                      Invite Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px]">
                    <InviteCampaignManager onClose={() => setIsInviteCampaignOpen(false)} onSuccess={loadDashboardData} />
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isCreateProposalOpen} onOpenChange={setIsCreateProposalOpen}>
                  <DialogTrigger asChild>
                    <Button style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} className="hover:opacity-90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Proposal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[900px]">
                    <CreateProposalDialog onClose={() => setIsCreateProposalOpen(false)} onSuccess={loadDashboardData} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="proposals">Proposals</TabsTrigger>
                <TabsTrigger value="campaigns">Invite Campaigns</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                        <div className="text-2xl font-bold">{dashboardData.total_proposals}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardData.active_proposals} active
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(dashboardData.total_proposed_value_usd_cents)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Proposed value
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Responses</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.pending_brand_responses}</div>
                        <p className="text-xs text-muted-foreground">
                          Awaiting brand decision
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Applications</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.total_applications_received}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardData.active_invite_campaigns} active campaigns
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Recent Proposals */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Proposals</CardTitle>
                    <CardDescription>Latest proposal activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData?.recent_proposals?.slice(0, 5).map((proposal) => (
                        <div key={proposal.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{proposal.proposal_title}</p>
                            <p className="text-sm text-muted-foreground">
                              {proposal.brand_company_name || 'Brand Proposal'} • {formatCurrency(proposal.total_campaign_budget_usd_cents)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(proposal.status)}>
                              {proposal.status.replace('_', ' ')}
                            </Badge>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Distribution */}
                {dashboardData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Proposal Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(dashboardData.proposals_by_status).map(([status, count]) => (
                          <div key={status} className="text-center">
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {status.replace('_', ' ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Proposals Tab */}
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
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="needs_discussion">Needs Discussion</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Proposals List */}
                <div className="space-y-4">
                  {filteredProposals.map((proposal) => (
                    <Card key={proposal.id} className="group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{proposal.proposal_title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {proposal.brand_company_name || 'Brand Proposal'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(proposal.status)}>
                                  {proposal.status.replace('_', ' ')}
                                </Badge>
                                {proposal.priority_level && (
                                  <div className={`text-xs font-medium ${getPriorityColor(proposal.priority_level)}`}>
                                    {proposal.priority_level} priority
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCurrency(proposal.total_campaign_budget_usd_cents)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Created {formatDate(proposal.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{proposal.assigned_brand_users.length} brand user{proposal.assigned_brand_users.length !== 1 ? 's' : ''}</span>
                              </div>
                              {proposal.sent_to_brands_at && (
                                <div className="flex items-center gap-1">
                                  <Send className="h-4 w-4" />
                                  <span>Sent {formatDate(proposal.sent_to_brands_at)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {proposal.status === 'draft' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleSendProposal(proposal.id)}
                                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} 
                                    className="hover:opacity-90"
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    Send to Brands
                                  </Button>
                                )}
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
                              </div>
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
                          {searchQuery.trim() || statusFilter !== "all" || priorityFilter !== "all"
                            ? "Try adjusting your search or filter criteria"
                            : "Create your first proposal to get started"
                          }
                        </p>
                        {(!searchQuery.trim() && statusFilter === "all" && priorityFilter === "all") && (
                          <Button className="mt-4" onClick={() => setIsCreateProposalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Proposal
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Other tabs (placeholder) */}
              <TabsContent value="campaigns">
                <div className="text-center py-12">
                  <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Invite Campaigns</h3>
                  <p className="text-muted-foreground">
                    Campaign management interface coming soon...
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="applications">
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Influencer Applications</h3>
                  <p className="text-muted-foreground">
                    Application review interface coming soon...
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics & Reports</h3>
                  <p className="text-muted-foreground">
                    Advanced analytics dashboard coming soon...
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Proposal Details Dialog */}
            <Dialog open={isProposalDetailsOpen} onOpenChange={setIsProposalDetailsOpen}>
              <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                {selectedProposal && (
                  <ProposalDetailsDialog 
                    proposal={selectedProposal} 
                    onClose={() => setIsProposalDetailsOpen(false)}
                    onUpdate={loadDashboardData}
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