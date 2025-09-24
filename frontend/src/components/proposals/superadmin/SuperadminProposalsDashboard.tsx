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
  superadminApiService,
  DashboardOverview,
  UserManagement,
  CreditOverview,
  SecurityAlert,
  Transaction,
  Influencer,
  Proposal
} from '@/services/superadminApi'
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
  // Main Dashboard Data (using superadmin API, not proposals-specific)
  const [mainDashboardData, setMainDashboardData] = useState<DashboardOverview | null>(null)

  // Proposals-specific data
  const [proposalsDashboardData, setProposalsDashboardData] = useState<SuperadminDashboard | null>(null)
  const [proposals, setProposals] = useState<BrandProposal[]>([])
  const [inviteCampaigns, setInviteCampaigns] = useState<InviteCampaign[]>([])
  const [recentApplications, setRecentApplications] = useState<InfluencerApplication[]>([])

  // Additional data for comprehensive dashboard
  const [users, setUsers] = useState<UserManagement[]>([])
  const [creditOverview, setCreditOverview] = useState<CreditOverview | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [influencers, setInfluencers] = useState<Influencer[]>([])

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

  // Load comprehensive dashboard data
  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load main dashboard data using correct superadmin API (not proposals-specific)
      const [
        mainDashboardResult,
        proposalsDashboardResult,
        proposalsResult,
        campaignsResult,
        usersResult,
        creditOverviewResult,
        securityAlertsResult
      ] = await Promise.all([
        // Main comprehensive dashboard
        superadminApiService.getDashboard(),

        // Proposals-specific dashboard
        superadminProposalsApi.getDashboard(),
        superadminProposalsApi.getAllProposals({ limit: 50 }),
        superadminProposalsApi.getInviteCampaigns({ limit: 10 }),

        // Additional comprehensive data
        superadminApiService.getUsers({ limit: 20 }),
        superadminApiService.getCreditOverview(),
        superadminApiService.getSecurityAlerts({ limit: 10 })
      ])

      // Set main dashboard data (system health, user metrics, etc.)
      if (mainDashboardResult.success && mainDashboardResult.data) {
        setMainDashboardData(mainDashboardResult.data)
      }

      // Set proposals-specific dashboard data
      if (proposalsDashboardResult.success && proposalsDashboardResult.data) {
        setProposalsDashboardData(proposalsDashboardResult.data)
        setRecentApplications(proposalsDashboardResult.data.recent_applications || [])
      }

      // Set proposals data
      if (proposalsResult.success && proposalsResult.data) {
        setProposals(proposalsResult.data.proposals || [])
      }

      // Set campaigns data
      if (campaignsResult.success && campaignsResult.data) {
        setInviteCampaigns(campaignsResult.data.campaigns || [])
      }

      // Set users data
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data.users || [])
      }

      // Set credit overview
      if (creditOverviewResult.success && creditOverviewResult.data) {
        setCreditOverview(creditOverviewResult.data)
      }

      // Set security alerts
      if (securityAlertsResult.success && securityAlertsResult.data) {
        setSecurityAlerts(securityAlertsResult.data.alerts || [])
      }

      // If main dashboard fails but we have some data, continue
      if (!mainDashboardResult.success && !proposalsDashboardResult.success) {
        throw new Error(mainDashboardResult.error || proposalsDashboardResult.error || 'Failed to load dashboard data')
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
        response_due_date: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString(), // TODO: Make configurable
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
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="credits">Credits</TabsTrigger>
                <TabsTrigger value="proposals">Proposals</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* System Health & Main Metrics */}
                {mainDashboardData && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {mainDashboardData.system_health?.cpu_usage_percent !== undefined
                            ? `${mainDashboardData.system_health.cpu_usage_percent.toFixed(0)}%`
                            : <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                          }
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {mainDashboardData.system_health?.memory_usage_percent !== undefined
                            ? `CPU • ${mainDashboardData.system_health.memory_usage_percent.toFixed(0)}% Memory`
                            : <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                          }
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {mainDashboardData.user_statistics.total_users.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          +{mainDashboardData.user_statistics.new_registrations_today} today
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(mainDashboardData.revenue_analytics.total_revenue_usd_cents)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {mainDashboardData.revenue_analytics.monthly_growth_percent > 0 ? '+' : ''}
                          {mainDashboardData.revenue_analytics.monthly_growth_percent.toFixed(1)}% growth
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits in System</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {mainDashboardData.credit_system.credits_in_circulation.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {mainDashboardData.credit_system.total_credits_spent.toLocaleString()} spent
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Proposals Stats (if available) */}
                {proposalsDashboardData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Proposals Overview</CardTitle>
                      <CardDescription>B2B proposals and campaign management</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{proposalsDashboardData.total_proposals}</div>
                          <div className="text-sm text-muted-foreground">Total Proposals</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{proposalsDashboardData.active_proposals}</div>
                          <div className="text-sm text-muted-foreground">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{proposalsDashboardData.pending_brand_responses}</div>
                          <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {formatCurrency(proposalsDashboardData.total_proposed_value_usd_cents)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Value</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Security Alerts */}
                {securityAlerts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Alerts</CardTitle>
                      <CardDescription>Recent security events requiring attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {securityAlerts.slice(0, 5).map((alert) => (
                          <div key={alert.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`h-2 w-2 rounded-full ${
                                alert.severity === 'high' ? 'bg-red-500' :
                                alert.severity === 'medium' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`} />
                              <div>
                                <p className="font-medium">{alert.title}</p>
                                <p className="text-sm text-muted-foreground">{alert.message}</p>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Proposals */}
                {proposalsDashboardData?.recent_proposals && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Proposals</CardTitle>
                      <CardDescription>Latest proposal activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {proposalsDashboardData.recent_proposals.slice(0, 5).map((proposal) => (
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
                )}

                {/* Credit System Overview */}
                {creditOverview && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Credit System Overview</CardTitle>
                      <CardDescription>System-wide credit analytics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {creditOverview.overview.total_credits_in_system.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Credits</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {creditOverview.overview.active_wallets.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">Active Wallets</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {creditOverview.overview.recent_transactions_24h.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">24h Transactions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {creditOverview.overview.total_spent_all_time.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Spent</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Status Distribution */}
                {proposalsDashboardData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Proposal Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(proposalsDashboardData.proposals_by_status).map(([status, count]) => (
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

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <p className="text-muted-foreground">Manage platform users and permissions</p>
                  </div>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>

                {users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{user.full_name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {user.role}
                                </Badge>
                                <Badge
                                  className={`text-xs ${
                                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                                    user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {user.status}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">{user.email}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Credits: {user.credits.balance.toLocaleString()}</span>
                                <span>Recent Activity: {user.recent_activity}</span>
                                {user.teams.length > 0 && (
                                  <span>Teams: {user.teams.map(t => t.name).join(', ')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No users found</h3>
                      <p className="text-muted-foreground">User data will appear here</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Credits Tab */}
              <TabsContent value="credits" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Credits & Billing Management</h2>
                  <p className="text-muted-foreground">Monitor credit system and financial analytics</p>
                </div>

                {/* Credit Overview Stats */}
                {creditOverview && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                          <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {creditOverview.overview.total_credits_in_system.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            System-wide credits
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {creditOverview.overview.active_wallets.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Users with credits
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">24h Transactions</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {creditOverview.overview.recent_transactions_24h.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Recent activity
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {creditOverview.overview.total_spent_all_time.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            All-time spending
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Top Spenders */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Credit Spenders</CardTitle>
                        <CardDescription>Users with highest credit consumption</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {creditOverview.top_spenders.slice(0, 10).map((spender, index) => (
                            <div key={spender.email} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{spender.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{spender.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{spender.total_spent.toLocaleString()} credits</p>
                                <p className="text-sm text-muted-foreground">
                                  Balance: {spender.current_balance.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pricing Rules */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Credit Pricing Rules</CardTitle>
                        <CardDescription>System pricing configuration</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          {creditOverview.pricing_rules.map((rule) => (
                            <div key={rule.action_type} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium capitalize">
                                  {rule.action_type.replace('_', ' ')}
                                </h4>
                                <Badge variant={rule.is_active ? "default" : "secondary"}>
                                  {rule.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>Cost: {rule.cost_per_action} credits</p>
                                <p>Free allowance: {rule.free_monthly_allowance}/month</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Security Monitoring</h2>
                  <p className="text-muted-foreground">Monitor security alerts and system threats</p>
                </div>

                {securityAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {securityAlerts.map((alert) => (
                      <Card key={alert.id} className={`border-l-4 ${
                        alert.severity === 'high' ? 'border-l-red-500' :
                        alert.severity === 'medium' ? 'border-l-yellow-500' :
                        'border-l-blue-500'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{alert.title}</h3>
                                <Badge className={
                                  alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {alert.severity}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">{alert.message}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Type: {alert.type}</span>
                                <span>Time: {new Date(alert.timestamp).toLocaleString()}</span>
                                {alert.affected_user && (
                                  <span>User: {alert.affected_user}</span>
                                )}
                              </div>
                              {alert.suggested_actions.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-1">Suggested Actions:</p>
                                  <ul className="text-sm text-muted-foreground">
                                    {alert.suggested_actions.map((action, index) => (
                                      <li key={index}>• {action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            {alert.action_required && (
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No security alerts</h3>
                      <p className="text-muted-foreground">System security status: Good</p>
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

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Invite Campaigns</h2>
                    <p className="text-muted-foreground">Manage influencer invite campaigns</p>
                  </div>
                  <Button onClick={() => setIsInviteCampaignOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </div>

                {inviteCampaigns.length > 0 ? (
                  <div className="grid gap-4">
                    {inviteCampaigns.map((campaign) => (
                      <Card key={campaign.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg">{campaign.campaign_name}</h3>
                              <p className="text-muted-foreground">{campaign.campaign_description}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Type: {campaign.campaign_type}</span>
                                <span>Applications: {campaign.total_applications_received}</span>
                                <span>Approved: {campaign.total_applications_approved}</span>
                              </div>
                            </div>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No invite campaigns</h3>
                      <p className="text-muted-foreground mb-4">Create your first invite campaign</p>
                      <Button onClick={() => setIsInviteCampaignOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Influencer Applications</h2>
                  <p className="text-muted-foreground">Review and manage influencer applications</p>
                </div>

                {recentApplications.length > 0 ? (
                  <div className="space-y-4">
                    {recentApplications.map((application) => (
                      <Card key={application.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">@{application.instagram_username}</h3>
                                <span className="text-sm text-muted-foreground">
                                  {application.followers_count.toLocaleString()} followers
                                </span>
                              </div>
                              {application.full_name && (
                                <p className="text-muted-foreground">{application.full_name}</p>
                              )}
                              <p className="text-sm">{application.why_interested}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Category: {application.category}</span>
                                <span>Submitted: {formatDate(application.submitted_at)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(application.application_status)}>
                                {application.application_status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No applications</h3>
                      <p className="text-muted-foreground">
                        Applications will appear here when influencers apply to campaigns
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">System Analytics</h2>
                  <p className="text-muted-foreground">Comprehensive system analytics and insights</p>
                </div>

                {/* Performance Metrics */}
                {mainDashboardData && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle>API Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">
                          {mainDashboardData.performance_metrics.avg_api_response_time_ms}ms
                        </div>
                        <p className="text-sm text-muted-foreground">Average response time</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>RPS</span>
                            <span>{mainDashboardData.performance_metrics.requests_per_second}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Error Rate</span>
                            <span>{mainDashboardData.performance_metrics.error_rate_percent}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">
                          {mainDashboardData.user_statistics.active_users_last_7_days.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Active users (7 days)</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>30 days</span>
                            <span>{mainDashboardData.user_statistics.active_users_last_30_days.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>New today</span>
                            <span>{mainDashboardData.user_statistics.new_registrations_today}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Credit Flow</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">
                          {mainDashboardData.credit_system.credits_in_circulation.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Credits in circulation</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Distributed</span>
                            <span>{mainDashboardData.credit_system.total_credits_distributed.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Spent</span>
                            <span>{mainDashboardData.credit_system.total_credits_spent.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Recent Activities */}
                {mainDashboardData?.recent_activities && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent System Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mainDashboardData.recent_activities.slice(0, 10).map((activity) => (
                          <div key={activity.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className={`h-2 w-2 rounded-full ${
                              activity.type === 'system_alert' ? 'bg-red-500' :
                              activity.type === 'user_registration' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
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