"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { AuthGuard } from "@/components/AuthGuard"
import { adminProposalsApiService, AdminProposal, BrandProposal, PipelineSummary, ProposalMetrics } from "@/services/adminProposalsApi"
import {
  Plus,
  Users,
  Eye,
  Heart,
  BarChart3,
  Search,
  X,
  Edit3,
  Trash2,
  Calendar,
  TrendingUp,
  FileText,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  Target,
  AlertCircle,
  Filter,
  SortAsc,
  MoreHorizontal,
  MessageCircle,
  Activity,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<AdminProposal[]>([])
  const [proposalsLoading, setProposalsLoading] = useState(true)
  const [proposalsError, setProposalsError] = useState<string | null>(null)
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary | null>(null)
  
  const [isCreatingProposal, setIsCreatingProposal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<AdminProposal | null>(null)
  const [isEditingProposal, setIsEditingProposal] = useState(false)
  const [isViewingProposal, setIsViewingProposal] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    brand_user_id: '',
    proposal_title: '',
    proposal_description: '',
    executive_summary: '',
    service_type: 'influencer_marketing' as 'influencer_marketing' | 'content_creation' | 'brand_strategy' | 'campaign_management',
    service_description: '',
    deliverables: [''],
    proposed_budget_usd: 0,
    payment_terms: 'net_30' as 'net_30' | 'net_15' | 'upfront' | 'milestone',
    campaign_objectives: [''],
    target_audience_description: '',
    expected_results: '',
    priority_level: 'medium' as 'high' | 'medium' | 'low',
    admin_notes: '',
    tags: ['']
  })
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("created")
  const [currentTab, setCurrentTab] = useState("overview")

  const router = useRouter()

  // Load proposals from backend
  const loadProposals = async () => {
    setProposalsLoading(true)
    setProposalsError(null)
    try {
      const filters: any = {}
      if (statusFilter !== "all") filters.status = statusFilter
      if (serviceTypeFilter !== "all") filters.service_type = serviceTypeFilter
      if (priorityFilter !== "all") filters.priority_level = priorityFilter
      
      const result = await adminProposalsApiService.getAdminProposals(filters)
      if (result.success && result.data) {
        setProposals(result.data.proposals || [])
      } else {
        setProposalsError(result.error || 'Failed to load proposals')
      }
    } catch (error) {
      setProposalsError('Network error while loading proposals')
    } finally {
      setProposalsLoading(false)
    }
  }

  // Load pipeline summary
  const loadPipelineSummary = async () => {
    try {
      const result = await adminProposalsApiService.getPipelineSummary()
      if (result.success && result.data) {
        setPipelineSummary(result.data)
      }
    } catch (error) {

    }
  }

  useEffect(() => {
    loadProposals()
    loadPipelineSummary()
  }, [statusFilter, serviceTypeFilter, priorityFilter])

  // Create new proposal
  const handleCreateProposal = async () => {
    if (!formData.brand_user_id.trim() || !formData.proposal_title.trim()) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const proposalData = {
        ...formData,
        deliverables: formData.deliverables.filter(d => d.trim()),
        campaign_objectives: formData.campaign_objectives.filter(o => o.trim()),
        tags: formData.tags.filter(t => t.trim())
      }
      
      const result = await adminProposalsApiService.createProposal(proposalData)
      if (result.success && result.data) {
        setProposals(prev => [...prev, result.data!])
        resetForm()
        setIsCreatingProposal(false)
        toast.success(`Created proposal "${result.data.proposal_title}"`)
      } else {
        toast.error(result.error || 'Failed to create proposal')
      }
    } catch (error) {
      toast.error('Network error while creating proposal')
    }
  }

  // Send proposal to brand
  const handleSendProposal = async (proposalId: string) => {
    try {
      const result = await adminProposalsApiService.sendProposalToBrand(proposalId, {
        response_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        send_notification: true
      })
      
      if (result.success) {
        await loadProposals() // Refresh proposals
        toast.success("Proposal sent to brand successfully")
      } else {
        toast.error(result.error || 'Failed to send proposal')
      }
    } catch (error) {
      toast.error('Network error while sending proposal')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      brand_user_id: '',
      proposal_title: '',
      proposal_description: '',
      executive_summary: '',
      service_type: 'influencer_marketing',
      service_description: '',
      deliverables: [''],
      proposed_budget_usd: 0,
      payment_terms: 'net_30',
      campaign_objectives: [''],
      target_audience_description: '',
      expected_results: '',
      priority_level: 'medium',
      admin_notes: '',
      tags: ['']
    })
  }

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = proposal.proposal_title.toLowerCase().includes(query)
      const matchesDescription = proposal.proposal_description?.toLowerCase().includes(query)
      const matchesBrand = proposal.brand_user?.email?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesDescription && !matchesBrand) {
        return false
      }
    }
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case "created":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "title":
        return a.proposal_title.localeCompare(b.proposal_title)
      case "budget":
        return b.proposed_budget_usd - a.proposed_budget_usd
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return (priorityOrder[b.priority_level || 'medium'] || 2) - (priorityOrder[a.priority_level || 'medium'] || 2)
      default:
        return 0
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'under_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'negotiation': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'closed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-muted-foreground dark:text-gray-400'
    }
  }

  const formatCurrency = (amount: number) => {
    const formattedAmount = new Intl.NumberFormat('ar-AE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return (
      <>
        <span className="aed-currency">AED</span> {formattedAmount}
      </>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const addArrayField = (field: keyof typeof formData, value: string = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value]
    }))
  }

  const updateArrayField = (field: keyof typeof formData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }))
  }

  const removeArrayField = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  return (
    <AuthGuard requireAuth={true} requireSuperAdmin={true}>
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
                  <h1 className="text-3xl font-bold">Proposals</h1>
                  <p className="text-muted-foreground">Manage your brand marketing proposals and sales pipeline</p>
                </div>
                
                <Dialog open={isCreatingProposal} onOpenChange={setIsCreatingProposal}>
                  <DialogTrigger asChild>
                    <Button style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} className="hover:opacity-90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Proposal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Proposal</DialogTitle>
                      <DialogDescription>
                        Create a marketing services proposal for a brand
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Brand Email *</label>
                            <Input
                              placeholder="brand@example.com"
                              value={formData.brand_user_id}
                              onChange={(e) => setFormData(prev => ({ ...prev, brand_user_id: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Priority Level</label>
                            <Select value={formData.priority_level} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority_level: value }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High Priority</SelectItem>
                                <SelectItem value="medium">Medium Priority</SelectItem>
                                <SelectItem value="low">Low Priority</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Proposal Title *</label>
                          <Input
                            placeholder="e.g. Q1 2024 Influencer Marketing Campaign"
                            value={formData.proposal_title}
                            onChange={(e) => setFormData(prev => ({ ...prev, proposal_title: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Executive Summary</label>
                          <Textarea
                            placeholder="Brief overview of the proposal..."
                            value={formData.executive_summary}
                            onChange={(e) => setFormData(prev => ({ ...prev, executive_summary: e.target.value }))}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Service Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Service Type</label>
                            <Select value={formData.service_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, service_type: value }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="influencer_marketing">Influencer Marketing</SelectItem>
                                <SelectItem value="content_creation">Content Creation</SelectItem>
                                <SelectItem value="brand_strategy">Brand Strategy</SelectItem>
                                <SelectItem value="campaign_management">Campaign Management</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Payment Terms</label>
                            <Select value={formData.payment_terms} onValueChange={(value: any) => setFormData(prev => ({ ...prev, payment_terms: value }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="upfront">Upfront Payment</SelectItem>
                                <SelectItem value="net_15">Net 15 Days</SelectItem>
                                <SelectItem value="net_30">Net 30 Days</SelectItem>
                                <SelectItem value="milestone">Milestone Based</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Service Description</label>
                          <Textarea
                            placeholder="Detailed description of services to be provided..."
                            value={formData.service_description}
                            onChange={(e) => setFormData(prev => ({ ...prev, service_description: e.target.value }))}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Budget */}
                      <div>
                        <label className="text-sm font-medium">Proposed Budget (AED)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formData.proposed_budget_usd}
                          onChange={(e) => setFormData(prev => ({ ...prev, proposed_budget_usd: parseInt(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                      </div>

                      {/* Deliverables */}
                      <div>
                        <label className="text-sm font-medium">Deliverables</label>
                        <div className="space-y-2 mt-1">
                          {formData.deliverables.map((deliverable, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Deliverable ${index + 1}`}
                                value={deliverable}
                                onChange={(e) => updateArrayField('deliverables', index, e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeArrayField('deliverables', index)}
                                disabled={formData.deliverables.length <= 1}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addArrayField('deliverables')}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Deliverable
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setIsCreatingProposal(false)
                        resetForm()
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateProposal} style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} className="hover:opacity-90">
                        Create Proposal
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="proposals">All Proposals</TabsTrigger>
                  <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Pipeline Summary Cards */}
                  {pipelineSummary && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{pipelineSummary.total_proposals}</div>
                          <p className="text-xs text-muted-foreground">
                            {pipelineSummary.proposals_sent_this_month} sent this month
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Proposed Value</CardTitle>
                          <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatCurrency(pipelineSummary.total_proposed_value)}</div>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(pipelineSummary.approved_value)} approved
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                          <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{(pipelineSummary.conversion_rate * 100).toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">
                            {pipelineSummary.approved_proposals} approved
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{pipelineSummary.proposals_needing_follow_up}</div>
                          <p className="text-xs text-muted-foreground">
                            {pipelineSummary.overdue_responses} overdue responses
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Status Distribution */}
                  {pipelineSummary && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Proposal Status Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-muted-foreground">{pipelineSummary.draft_proposals}</div>
                            <div className="text-sm text-muted-foreground">Draft</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{pipelineSummary.sent_proposals}</div>
                            <div className="text-sm text-muted-foreground">Sent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{pipelineSummary.under_review}</div>
                            <div className="text-sm text-muted-foreground">Under Review</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{pipelineSummary.in_negotiation}</div>
                            <div className="text-sm text-muted-foreground">Negotiation</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* All Proposals Tab */}
                <TabsContent value="proposals" className="space-y-6">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search proposals..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-[250px] pl-10"
                        />
                      </div>
                      
                      {/* Filters */}
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Service Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Services</SelectItem>
                          <SelectItem value="influencer_marketing">Influencer Marketing</SelectItem>
                          <SelectItem value="content_creation">Content Creation</SelectItem>
                          <SelectItem value="brand_strategy">Brand Strategy</SelectItem>
                          <SelectItem value="campaign_management">Campaign Management</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Sort */}
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created">Recent</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="budget">Budget</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Proposals List */}
                  {proposalsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-muted-foreground">Loading proposals...</p>
                      </div>
                    </div>
                  )}

                  {proposalsError && !proposalsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <p className="text-red-600 dark:text-red-400">{proposalsError}</p>
                        <Button variant="outline" onClick={() => loadProposals()}>
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}

                  {!proposalsLoading && !proposalsError && (
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
                                      {proposal.brand_user?.email || proposal.brand_user_id}
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
                                    <Banknote className="h-4 w-4" />
                                    <span>{formatCurrency(proposal.proposed_budget_usd)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Created {formatDate(proposal.created_at)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    <span>{proposal.service_type.replace('_', ' ')}</span>
                                  </div>
                                  {proposal.sent_at && (
                                    <div className="flex items-center gap-1">
                                      <Send className="h-4 w-4" />
                                      <span>Sent {formatDate(proposal.sent_at)}</span>
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
                                        Send to Brand
                                      </Button>
                                    )}
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProposal(proposal)
                                        setIsViewingProposal(true)
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View Details
                                    </Button>
                                  </div>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Edit3 className="h-3 w-3 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <MessageCircle className="h-3 w-3 mr-2" />
                                        Add Communication
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Activity className="h-3 w-3 mr-2" />
                                        View Analytics
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
                              {searchQuery.trim() || statusFilter !== "all" || serviceTypeFilter !== "all" || priorityFilter !== "all"
                                ? "Try adjusting your search or filter criteria"
                                : "Create your first proposal to get started"
                              }
                            </p>
                            {(!searchQuery.trim() && statusFilter === "all" && serviceTypeFilter === "all" && priorityFilter === "all") && (
                              <Button className="mt-4" onClick={() => setIsCreatingProposal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Proposal
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Pipeline Tab */}
                <TabsContent value="pipeline">
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sales Pipeline View</h3>
                    <p className="text-muted-foreground">
                      Visual pipeline board coming soon...
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Proposal Details Dialog */}
              <Dialog open={isViewingProposal} onOpenChange={setIsViewingProposal}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedProposal?.proposal_title}</DialogTitle>
                    <DialogDescription>
                      Proposal details and status
                    </DialogDescription>
                  </DialogHeader>
                  {selectedProposal && (
                    <div className="space-y-6 py-4">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(selectedProposal.status)}>
                          {selectedProposal.status.replace('_', ' ')}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          Created {formatDate(selectedProposal.created_at)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Brand Information</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedProposal.brand_user?.email || selectedProposal.brand_user_id}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Budget</h4>
                          <p className="text-lg font-semibold">{formatCurrency(selectedProposal.proposed_budget_usd)}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Service Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedProposal.service_description || 'No description provided'}
                        </p>
                      </div>

                      {selectedProposal.deliverables && selectedProposal.deliverables.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Deliverables</h4>
                          <ul className="space-y-1">
                            {selectedProposal.deliverables.map((deliverable, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                {deliverable}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedProposal.brand_feedback && (
                        <div>
                          <h4 className="font-medium mb-2">Brand Feedback</h4>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm">{selectedProposal.brand_feedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setIsViewingProposal(false)}>
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}