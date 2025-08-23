"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { campaignsApiService, EnhancedCampaign, CampaignDeliverable, CampaignMilestone, BudgetBreakdown, PerformanceSummary, CampaignTemplate } from "@/services/campaignsApi"
import { CampaignsSkeleton } from "@/components/skeletons"
import {
  Plus,
  Target,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  MoreHorizontal,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Edit,
  Trash2,
  BarChart3,
  Filter,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  Download,
  Upload,
  Mail,
  Share,
  FileText,
  Briefcase,
  ExternalLink,
  X,
  ArrowRight,
  AlertCircle,
  Settings,
  Activity,
  PieChart,
  Zap,
} from "lucide-react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserAvatar } from "@/components/UserAvatar"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/ui/empty-state"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function CampaignsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Enhanced campaigns data
  const [campaigns, setCampaigns] = useState<EnhancedCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [campaignsError, setCampaignsError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [dashboardData, setDashboardData] = useState<any>(null)

  // Load campaigns from backend
  const loadCampaigns = async () => {
    setCampaignsLoading(true)
    setCampaignsError(null)
    try {
      const filters: any = {}
      if (statusFilter !== "all") filters.status = statusFilter
      if (typeFilter !== "all") filters.campaign_type = typeFilter
      if (priorityFilter !== "all") filters.priority = priorityFilter
      
      const result = await campaignsApiService.getCampaigns(filters)
      if (result.success && result.data) {
        setCampaigns(result.data.campaigns || [])
      } else {
        setCampaignsError(result.error || 'Failed to load campaigns')
      }
    } catch (error) {
      setCampaignsError('Network error while loading campaigns')
    } finally {
      setCampaignsLoading(false)
    }
  }

  // Load dashboard data
  const loadDashboard = async () => {
    try {
      const result = await campaignsApiService.getDashboard()
      if (result.success && result.data) {
        setDashboardData(result.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
  }

  // Load templates
  const loadTemplates = async () => {
    try {
      const result = await campaignsApiService.getCampaignTemplates()
      if (result.success && result.data) {
        setTemplates(result.data.templates || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  useEffect(() => {
    loadCampaigns()
    loadDashboard()
    loadTemplates()
  }, [statusFilter, typeFilter, priorityFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planning":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          <Settings className="h-3 w-3 mr-1" />
          Planning
        </Badge>
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <PlayCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
          <PauseCircle className="h-3 w-3 mr-1" />
          Paused
        </Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
          <X className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesName = campaign.name.toLowerCase().includes(query)
      const matchesDescription = campaign.description?.toLowerCase().includes(query)
      const matchesClient = campaign.client_name?.toLowerCase().includes(query)
      if (!matchesName && !matchesDescription && !matchesClient) {
        return false
      }
    }
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case "created":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "name":
        return a.name.localeCompare(b.name)
      case "budget":
        return b.budget_allocated - a.budget_allocated
      case "completion":
        return b.completion_percentage - a.completion_percentage
      default:
        return 0
    }
  })

  // Campaign statistics
  const activeCampaigns = campaigns.filter(c => c.status === 'active')
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget_allocated, 0)
  const totalSpent = campaigns.reduce((sum, c) => sum + c.budget_spent, 0)
  const avgCompletion = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.completion_percentage, 0) / campaigns.length : 0

  return (
    <AuthGuard requireAuth={true}>
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
                  <h1 className="text-3xl font-bold">Campaigns</h1>
                  <p className="text-muted-foreground">Manage your marketing campaigns with deliverables and milestones</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Templates Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Zap className="h-4 w-4 mr-2" />
                        Templates
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <div className="p-2">
                        <h4 className="font-medium mb-2">Campaign Templates</h4>
                        {templates.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No templates available</p>
                        ) : (
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {templates.map((template) => (
                              <button
                                key={template.id}
                                className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                                onClick={() => router.push(`/campaigns/new?template=${template.id}`)}
                              >
                                <div className="font-medium text-sm">{template.template_name}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2">{template.template_description}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Used {template.usage_count} times
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Reports
                  </Button>
                  <Button onClick={() => router.push('/campaigns/new')}  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                    <Activity className="h-4 w-4 text-[#5100f3]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeCampaigns.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                    <DollarSign className="h-4 w-4 text-[#5100f3]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                    <Target className="h-4 w-4 text-[#5100f3]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{avgCompletion.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
                    <PieChart className="h-4 w-4 text-[#5100f3]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search campaigns..."
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
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="awareness">Awareness</SelectItem>
                      <SelectItem value="conversion">Conversion</SelectItem>
                      <SelectItem value="retention">Retention</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Recent</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="completion">Completion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Loading State */}
              {campaignsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading campaigns...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {campaignsError && !campaignsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <p className="text-red-600 dark:text-red-400">{campaignsError}</p>
                    <Button variant="outline" onClick={() => loadCampaigns()}>
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {/* Campaigns Grid */}
              {!campaignsLoading && !campaignsError && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="group">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold">{campaign.name}</CardTitle>
                            <div className="text-xs text-muted-foreground">
                              Started: {formatDate(campaign.start_date)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(campaign.status)}
                            <div className={`text-xs font-medium ${getPriorityColor(campaign.priority)}`}>
                              {campaign.priority}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4 pt-4">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{campaign.completion_percentage}%</span>
                          </div>
                          <Progress value={campaign.completion_percentage} />
                        </div>

                        {/* Key Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-semibold">{formatCurrency(campaign.budget_allocated)}</div>
                            <div className="text-xs text-muted-foreground">Budget</div>
                          </div>
                          <div>
                            <div className="font-semibold">{campaign.team_members?.length || 0}</div>
                            <div className="text-xs text-muted-foreground">Team Members</div>
                          </div>
                        </div>

                        {campaign.client_name && (
                          <div className="text-xs text-muted-foreground">
                            Client: {campaign.client_name}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-3 w-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Briefcase className="h-3 w-3 mr-2" />
                                Deliverables
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Target className="h-3 w-3 mr-2" />
                                Milestones
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="h-3 w-3 mr-2" />
                                Team
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <BarChart3 className="h-3 w-3 mr-2" />
                                Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!campaignsLoading && !campaignsError && filteredCampaigns.length === 0 && (
                <div className="flex justify-center py-12">
                  <EmptyState
                    title={searchQuery.trim() || statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all" 
                      ? "No campaigns found" 
                      : "No campaigns yet"
                    }
                    description={searchQuery.trim() || statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all"
                      ? "Try adjusting your search or filter criteria\nto find the campaigns you're looking for."
                      : "Create your first campaign to start tracking\nyour marketing performance and engagement."
                    }
                    icons={[Target, BarChart3, FileText]}
                    action={(!searchQuery.trim() && statusFilter === "all" && typeFilter === "all" && priorityFilter === "all") ? {
                      label: "Create Your First Campaign",
                      onClick: () => router.push('/campaigns/new')
                    } : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
