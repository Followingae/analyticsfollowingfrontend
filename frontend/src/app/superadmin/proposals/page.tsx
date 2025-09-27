"use client"

import { useState, useEffect } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService, Proposal } from "@/services/superadminApi"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  RefreshCw,
  Search,
  FileText,
  TrendingUp,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Building,
  Calendar,
  Users,
  Activity,
  Plus,
  AlertTriangle
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default function SuperadminProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [proposalsOverview, setProposalsOverview] = useState<any>(null)
  const [brandProposals, setBrandProposals] = useState<any[]>([])
  const [proposalsDashboard, setProposalsDashboard] = useState<any>(null)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState("overview")

  // Filters
  const [filters, setFilters] = useState({
    status_filter: 'all',
    search: '',
    limit: 25,
    offset: 0
  })

  const [brandFilters, setBrandFilters] = useState({
    status: 'all',
    brand: '',
    limit: 25
  })

  const [backendAvailable, setBackendAvailable] = useState(true)

  // Create proposal state
  const [isCreateProposalOpen, setIsCreateProposalOpen] = useState(false)
  const [creatingProposal, setCreatingProposal] = useState(false)
  const [newProposal, setNewProposal] = useState({
    title: '',
    campaign_type: '',
    brand_name: '',
    brand_contact_email: '',
    description: '',
    budget: 0,
    priority: 'medium',
    timeline: {
      start_date: '',
      end_date: ''
    },
    requirements: {
      followers_min: 0,
      categories: [] as string[]
    }
  })

  const resetNewProposalForm = () => {
    setNewProposal({
      title: '',
      campaign_type: '',
      brand_name: '',
      brand_contact_email: '',
      description: '',
      budget: 0,
      priority: 'medium',
      timeline: {
        start_date: '',
        end_date: ''
      },
      requirements: {
        followers_min: 0,
        categories: []
      }
    })
  }

  const checkBackendHealth = async () => {
    try {
      const healthResult = await superadminApiService.checkBackendHealth()
      setBackendAvailable(healthResult.success)
      return healthResult.success
    } catch (error) {
      setBackendAvailable(false)
      return false
    }
  }

  const handleCreateProposal = async () => {
    // Validate required fields
    if (!newProposal.title.trim() || !newProposal.brand_name.trim() || !newProposal.brand_contact_email.trim() ||
        !newProposal.campaign_type || !newProposal.description.trim() || !newProposal.timeline.start_date ||
        !newProposal.timeline.end_date || newProposal.budget <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newProposal.brand_contact_email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate dates
    const startDate = new Date(newProposal.timeline.start_date)
    const endDate = new Date(newProposal.timeline.end_date)
    if (startDate >= endDate) {
      toast.error('End date must be after start date')
      return
    }

    try {
      setCreatingProposal(true)
      const result = await superadminApiService.createBrandProposal(newProposal)

      if (result.success) {
        toast.success('Proposal created successfully!')
        setIsCreateProposalOpen(false)
        resetNewProposalForm()
        // Refresh the proposals data
        loadProposalsData()
        if (currentTab === 'manage') {
          loadProposals()
        } else if (currentTab === 'brand') {
          loadBrandProposals()
        }
      } else {
        toast.error(result.error || 'Failed to create proposal')
      }
    } catch (error) {
      toast.error('Network error while creating proposal')
      console.error('Create proposal error:', error)
    } finally {
      setCreatingProposal(false)
    }
  }

  const loadProposalsData = async () => {
    try {
      setLoading(true)

      // Load overview data with error handling
      try {
        const overviewResult = await superadminApiService.getProposalsOverview()
        if (overviewResult.success && overviewResult.data) {
          setProposalsOverview(overviewResult.data)
        } else {
          console.warn('Proposals overview API returned error:', overviewResult.error)
          toast.error('Unable to load proposals overview data')
        }
      } catch (error) {
        console.error('Failed to load proposals overview:', error)
        toast.error('Failed to connect to proposals overview API')
      }

      // Load dashboard data with error handling
      try {
        const dashboardResult = await superadminApiService.getProposalsDashboard()
        if (dashboardResult.success && dashboardResult.data) {
          setProposalsDashboard(dashboardResult.data)
        } else {
          console.warn('Proposals dashboard API returned error:', dashboardResult.error)
          toast.error('Unable to load proposals dashboard data')
        }
      } catch (error) {
        console.error('Failed to load proposals dashboard:', error)
        toast.error('Failed to connect to proposals dashboard API')
      }
    } catch (error) {
      console.error('Failed to load proposals data:', error)
      toast.error('Failed to load proposals data')
    } finally {
      setLoading(false)
    }
  }

  const loadProposals = async () => {
    try {
      const filterParams: any = {
        limit: filters.limit,
        offset: filters.offset
      }

      if (filters.status_filter !== 'all') {
        filterParams.status_filter = filters.status_filter
      }
      if (filters.search.trim()) {
        filterParams.search = filters.search.trim()
      }

      const result = await superadminApiService.getProposals(filterParams)
      if (result.success && result.data) {
        setProposals(result.data.proposals || [])
      }
    } catch (error) {
      console.error('Failed to load proposals:', error)
    }
  }

  const loadBrandProposals = async () => {
    try {
      const filterParams: any = {
        limit: brandFilters.limit
      }

      if (brandFilters.status !== 'all') {
        filterParams.status = brandFilters.status
      }
      if (brandFilters.brand.trim()) {
        filterParams.brand = brandFilters.brand.trim()
      }

      const result = await superadminApiService.getBrandProposals(filterParams)
      if (result.success && result.data) {
        setBrandProposals(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load brand proposals:', error)
    }
  }

  const handleUpdateProposalStatus = async (proposalId: string, newStatus: string) => {
    try {
      const result = await superadminApiService.updateProposalStatus(proposalId, newStatus, `Status updated via admin dashboard`)
      if (result.success) {
        toast.success(`Proposal status updated to ${newStatus}`)
        loadProposals() // Refresh data
      } else {
        toast.error(result.error || 'Failed to update proposal status')
      }
    } catch (error) {
      toast.error('Network error while updating proposal status')
    }
  }

  useEffect(() => {
    const initialize = async () => {
      await checkBackendHealth()
      loadProposalsData()
    }
    initialize()
  }, [])

  useEffect(() => {
    if (currentTab === 'manage') {
      loadProposals()
    } else if (currentTab === 'brand') {
      loadBrandProposals()
    }
  }, [currentTab, filters, brandFilters])

  const formatNumber = (num: any) => {
    if (num === undefined || num === null || num === '' || typeof num !== 'number' || isNaN(num)) {
      return '0'
    }
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'rejected': case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Proposal Management</h1>
                  <p className="text-muted-foreground">Manage platform proposals and brand campaigns</p>
                </div>
                <div className="flex items-center gap-2">
                  {!backendAvailable && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Backend Offline
                    </Badge>
                  )}
                  <Button variant="outline" onClick={async () => {
                    await checkBackendHealth()
                    loadProposalsData()
                  }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Dialog open={isCreateProposalOpen} onOpenChange={setIsCreateProposalOpen}>
                    <DialogTrigger asChild>
                      <Button style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Proposal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create Brand Proposal</DialogTitle>
                        <DialogDescription>Create a new proposal for brand clients</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium">Proposal Title</label>
                            <Input
                              placeholder="Enter proposal title"
                              value={newProposal.title}
                              onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Campaign Type</label>
                            <Select value={newProposal.campaign_type} onValueChange={(value) =>
                              setNewProposal(prev => ({ ...prev, campaign_type: value }))
                            }>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select campaign type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="brand_collaboration">Brand Collaboration</SelectItem>
                                <SelectItem value="product_review">Product Review</SelectItem>
                                <SelectItem value="sponsored_content">Sponsored Content</SelectItem>
                                <SelectItem value="event_coverage">Event Coverage</SelectItem>
                                <SelectItem value="brand_ambassadorship">Brand Ambassadorship</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium">Brand Name</label>
                            <Input
                              placeholder="Enter brand name"
                              value={newProposal.brand_name}
                              onChange={(e) => setNewProposal(prev => ({ ...prev, brand_name: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Brand Contact Email</label>
                            <Input
                              type="email"
                              placeholder="Enter brand contact email"
                              value={newProposal.brand_contact_email}
                              onChange={(e) => setNewProposal(prev => ({ ...prev, brand_contact_email: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            placeholder="Enter proposal description and objectives..."
                            value={newProposal.description}
                            onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                            className="mt-1"
                            rows={4}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium">Budget ($)</label>
                            <Input
                              type="number"
                              placeholder="Enter budget amount"
                              value={newProposal.budget || ''}
                              onChange={(e) => setNewProposal(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={newProposal.priority} onValueChange={(value) =>
                              setNewProposal(prev => ({ ...prev, priority: value }))
                            }>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium">Start Date</label>
                            <Input
                              type="date"
                              value={newProposal.timeline.start_date}
                              onChange={(e) => setNewProposal(prev => ({
                                ...prev,
                                timeline: { ...prev.timeline, start_date: e.target.value }
                              }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">End Date</label>
                            <Input
                              type="date"
                              value={newProposal.timeline.end_date}
                              onChange={(e) => setNewProposal(prev => ({
                                ...prev,
                                timeline: { ...prev.timeline, end_date: e.target.value }
                              }))}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Minimum Followers Required</label>
                          <Input
                            type="number"
                            placeholder="Enter minimum followers (e.g., 10000)"
                            value={newProposal.requirements.followers_min || ''}
                            onChange={(e) => setNewProposal(prev => ({
                              ...prev,
                              requirements: { ...prev.requirements, followers_min: parseInt(e.target.value) || 0 }
                            }))}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Target Categories</label>
                          <Input
                            placeholder="Enter categories separated by commas (e.g., fashion, lifestyle, beauty)"
                            value={newProposal.requirements.categories.join(', ')}
                            onChange={(e) => setNewProposal(prev => ({
                              ...prev,
                              requirements: {
                                ...prev.requirements,
                                categories: e.target.value.split(',').map(cat => cat.trim()).filter(Boolean)
                              }
                            }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setIsCreateProposalOpen(false)
                          resetNewProposalForm()
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateProposal} disabled={creatingProposal} style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                          {creatingProposal ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              Create Proposal
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="manage">Manage Proposals</TabsTrigger>
                  <TabsTrigger value="brand">Brand Proposals</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {loading ? (
                    <div className="grid gap-4 md:grid-cols-4">
                      {[1,2,3,4].map(i => (
                        <Card key={i}>
                          <CardHeader>
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                          </CardHeader>
                          <CardContent>
                            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : proposalsDashboard ? (
                    <>
                      {/* Dashboard Metrics */}
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
                            <Activity className="h-4 w-4 text-[hsl(var(--primary))]" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {formatNumber(proposalsDashboard.pipeline_stats?.active_proposals || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Currently active
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenue Pipeline</CardTitle>
                            <DollarSign className="h-4 w-4 text-[hsl(var(--primary))]" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {formatCurrency(proposalsDashboard.revenue_projections?.total_pipeline_value || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Total pipeline
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Brand Engagement</CardTitle>
                            <Building className="h-4 w-4 text-[hsl(var(--primary))]" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {((proposalsDashboard.brand_engagement?.response_rate || 0) * 100).toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Response rate
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Influencer Participation</CardTitle>
                            <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {formatNumber(proposalsDashboard.influencer_participation?.total_participants || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Total participants
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Overview Statistics */}
                      {proposalsOverview && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardHeader>
                              <CardTitle>Proposal Status Distribution</CardTitle>
                              <CardDescription>Current status of all proposals</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {Object.entries(proposalsOverview.status_distribution || {}).map(([status, count]) => (
                                  <div key={status} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge className={getStatusColor(status)} variant="secondary">
                                        {status}
                                      </Badge>
                                    </div>
                                    <span className="font-medium">{formatNumber(count as number)}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Recent Success Metrics</CardTitle>
                              <CardDescription>Key performance indicators</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Success Rate:</span>
                                  <span className="font-medium text-green-600">
                                    {((proposalsOverview.success_metrics?.success_rate || 0) * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Avg Response Time:</span>
                                  <span className="font-medium">
                                    {proposalsOverview.success_metrics?.avg_response_time_days || 0} days
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Brand Retention:</span>
                                  <span className="font-medium">
                                    {((proposalsOverview.success_metrics?.brand_retention_rate || 0) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mb-4">
                        <Activity className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Dashboard Data Unavailable</h3>
                      <p className="text-muted-foreground mb-4">
                        Unable to load proposals dashboard data. This could be due to:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 mb-6 max-w-md mx-auto">
                        <li>• Backend API endpoints not yet implemented</li>
                        <li>• Network connectivity issues</li>
                        <li>• Insufficient permissions</li>
                        {!backendAvailable && <li>• Backend server appears to be offline</li>}
                      </ul>
                      <Button variant="outline" onClick={async () => {
                        await checkBackendHealth()
                        loadProposalsData()
                      }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Manage Proposals Tab */}
                <TabsContent value="manage" className="space-y-6">
                  {/* Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Search & Filters</CardTitle>
                      <CardDescription>Filter proposals by status and search criteria</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Search proposals..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, offset: 0 }))}
                            className="pl-10"
                          />
                        </div>

                        <Select value={filters.status_filter} onValueChange={(value) =>
                          setFilters(prev => ({ ...prev, status_filter: value, offset: 0 }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={() => setFilters({ status_filter: 'all', search: '', limit: 25, offset: 0 })}>
                          Clear Filters
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Proposals Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Campaign Proposals</CardTitle>
                      <CardDescription>Manage and review all campaign proposals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Proposal</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Timeline</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {proposals.map((proposal) => (
                            <TableRow key={proposal.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{proposal.title}</p>
                                  <p className="text-xs text-muted-foreground">{proposal.campaign_type}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{proposal.brand_name}</p>
                                  <p className="text-xs text-muted-foreground">{proposal.brand_contact_email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(proposal.budget)}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(proposal.status)} variant="secondary">
                                  {proposal.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={`text-sm font-medium capitalize ${getPriorityColor(proposal.priority)}`}>
                                  {proposal.priority}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs">
                                <div>
                                  <p>Start: {formatDate(proposal.timeline.start_date)}</p>
                                  <p>End: {formatDate(proposal.timeline.end_date)}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProposal(proposal)
                                      setIsDetailsOpen(true)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {proposal.status === 'pending' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUpdateProposalStatus(proposal.id, 'approved')}
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUpdateProposalStatus(proposal.id, 'rejected')}
                                      >
                                        <XCircle className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {proposals.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No proposals found matching your criteria
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Brand Proposals Tab */}
                <TabsContent value="brand" className="space-y-6">
                  {/* Brand Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Brand Proposal Filters</CardTitle>
                      <CardDescription>Filter brand proposals by status and brand name</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Input
                          placeholder="Search by brand..."
                          value={brandFilters.brand}
                          onChange={(e) => setBrandFilters(prev => ({ ...prev, brand: e.target.value }))}
                        />

                        <Select value={brandFilters.status} onValueChange={(value) =>
                          setBrandFilters(prev => ({ ...prev, status: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={() => setBrandFilters({ status: 'all', brand: '', limit: 25 })}>
                          Clear Filters
                        </Button>
                        <Button onClick={() => {
                          setCurrentTab('brand')
                          setIsCreateProposalOpen(true)
                        }} style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create New
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Brand Proposals List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Brand Proposals</CardTitle>
                      <CardDescription>Proposals created for brand clients</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {brandProposals.map((brandProposal, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{brandProposal.title || `Brand Proposal #${index + 1}`}</h4>
                                <p className="text-sm text-muted-foreground">{brandProposal.brand_name}</p>
                              </div>
                              <Badge variant="secondary">
                                {brandProposal.status || 'active'}
                              </Badge>
                            </div>
                            <div className="grid gap-2 md:grid-cols-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Budget: </span>
                                <span className="font-medium">{formatCurrency(brandProposal.budget || 0)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Influencers: </span>
                                <span className="font-medium">{brandProposal.assigned_influencers?.length || 0}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Created: </span>
                                <span className="font-medium">
                                  {brandProposal.created_at ? formatDate(brandProposal.created_at) : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {brandProposals.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No brand proposals found
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Proposal Details Dialog */}
              <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedProposal?.title}</DialogTitle>
                    <DialogDescription>
                      {selectedProposal?.brand_name} • {selectedProposal?.campaign_type}
                    </DialogDescription>
                  </DialogHeader>

                  {selectedProposal && (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h4 className="font-medium">Proposal Details</h4>
                          <div className="space-y-1 text-sm">
                            <div><span className="font-medium">Budget:</span> {formatCurrency(selectedProposal.budget)}</div>
                            <div><span className="font-medium">Status:</span>
                              <Badge className={`ml-2 ${getStatusColor(selectedProposal.status)}`} variant="secondary">
                                {selectedProposal.status}
                              </Badge>
                            </div>
                            <div><span className="font-medium">Priority:</span>
                              <span className={`ml-1 capitalize ${getPriorityColor(selectedProposal.priority)}`}>
                                {selectedProposal.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">Timeline</h4>
                          <div className="space-y-1 text-sm">
                            <div><span className="font-medium">Start Date:</span> {formatDate(selectedProposal.timeline.start_date)}</div>
                            <div><span className="font-medium">End Date:</span> {formatDate(selectedProposal.timeline.end_date)}</div>
                            <div><span className="font-medium">Created:</span> {formatDate(selectedProposal.created_at)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          {selectedProposal.description}
                        </p>
                      </div>

                      {/* Requirements */}
                      <div>
                        <h4 className="font-medium mb-2">Requirements</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Min Followers:</span> {formatNumber(selectedProposal.requirements.followers_min)}</div>
                          <div>
                            <span className="font-medium">Categories:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedProposal.requirements.categories.map((category, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Brand Contact */}
                      <div className="pt-4 border-t border-muted">
                        <h4 className="font-medium mb-2">Brand Contact</h4>
                        <div className="text-sm">
                          <div><span className="font-medium">Email:</span> {selectedProposal.brand_contact_email}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
      </div>
    </SuperadminLayout>
  )
}