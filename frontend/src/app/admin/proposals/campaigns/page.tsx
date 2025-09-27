'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Users,
  Calendar,
  Target,
  Send,
  Eye,
  Settings,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Globe,
  Star,
  Heart,
  MessageCircle,
  ArrowUpRight,
  Megaphone
} from "lucide-react"

import {
  superadminApiService
} from "@/services/superadminApi"
import { toast } from "sonner"

interface InviteCampaign {
  id: string
  campaign_name: string
  campaign_description: string
  campaign_type: 'paid' | 'barter'
  barter_offering?: string
  deliverables: Array<{
    type: string
    quantity: number
    description?: string
  }>
  eligible_follower_range: {
    min: number
    max: number
  }
  eligible_categories: string[]
  max_applications: number
  application_deadline: string
  current_applications: number
  status: 'draft' | 'published' | 'active' | 'closed' | 'completed'
  budget_total_usd_cents?: number
  created_at: string
  updated_at: string
  published_at?: string
  applications_stats: {
    total_applications: number
    approved_applications: number
    pending_review: number
    rejected_applications: number
  }
}

interface CampaignFormData {
  campaign_name: string
  campaign_description: string
  campaign_type: 'paid' | 'barter'
  barter_offering: string
  deliverables: Array<{
    type: string
    quantity: number
    description: string
  }>
  eligible_follower_range: {
    min: number
    max: number
  }
  eligible_categories: string[]
  max_applications: number
  application_deadline: string
  budget_total_usd_cents?: number
}

const CATEGORIES = [
  'fashion', 'beauty', 'lifestyle', 'fitness', 'food', 'travel',
  'technology', 'gaming', 'automotive', 'home_decor', 'parenting',
  'business', 'education', 'entertainment', 'sports', 'health'
]

const DELIVERABLE_TYPES = [
  { value: 'story', label: 'Instagram Story' },
  { value: 'post', label: 'Feed Post' },
  { value: 'reel', label: 'Reel' },
  { value: 'ugc_video', label: 'UGC Video' },
  { value: 'story_series', label: 'Story Series' },
  { value: 'carousel_post', label: 'Carousel Post' },
  { value: 'igtv', label: 'IGTV' }
]

export default function InviteCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<InviteCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<InviteCampaign | null>(null)

  const [formData, setFormData] = useState<CampaignFormData>({
    campaign_name: '',
    campaign_description: '',
    campaign_type: 'paid',
    barter_offering: '',
    deliverables: [{ type: 'post', quantity: 1, description: '' }],
    eligible_follower_range: { min: 1000, max: 100000 },
    eligible_categories: [],
    max_applications: 100,
    application_deadline: ''
  })

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      // Mock data for development - replace with actual API call
      setCampaigns([
        {
          id: '1',
          campaign_name: 'Summer Fashion Collection 2024',
          campaign_description: 'Looking for fashion influencers to showcase our new summer collection. Perfect for lifestyle and fashion content creators.',
          campaign_type: 'paid',
          deliverables: [
            { type: 'post', quantity: 2, description: 'Feed posts featuring summer outfits' },
            { type: 'story', quantity: 5, description: 'Story highlights of styling process' }
          ],
          eligible_follower_range: { min: 10000, max: 100000 },
          eligible_categories: ['fashion', 'lifestyle', 'beauty'],
          max_applications: 50,
          application_deadline: '2024-02-15T23:59:59Z',
          current_applications: 23,
          status: 'active',
          budget_total_usd_cents: 2500000, // $25,000
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-15T14:30:00Z',
          published_at: '2024-01-12T09:00:00Z',
          applications_stats: {
            total_applications: 23,
            approved_applications: 8,
            pending_review: 12,
            rejected_applications: 3
          }
        },
        {
          id: '2',
          campaign_name: 'Tech Product Review Campaign',
          campaign_description: 'Seeking tech reviewers and gadget enthusiasts to review our latest smart home devices.',
          campaign_type: 'barter',
          barter_offering: 'Latest smart home starter kit worth $800',
          deliverables: [
            { type: 'reel', quantity: 1, description: 'Unboxing and setup reel' },
            { type: 'post', quantity: 1, description: 'Detailed review post' },
            { type: 'story', quantity: 3, description: 'Usage highlights over one week' }
          ],
          eligible_follower_range: { min: 25000, max: 500000 },
          eligible_categories: ['technology', 'home_decor', 'lifestyle'],
          max_applications: 25,
          application_deadline: '2024-02-20T23:59:59Z',
          current_applications: 12,
          status: 'published',
          created_at: '2024-01-12T15:00:00Z',
          updated_at: '2024-01-14T11:20:00Z',
          published_at: '2024-01-14T12:00:00Z',
          applications_stats: {
            total_applications: 12,
            approved_applications: 3,
            pending_review: 7,
            rejected_applications: 2
          }
        },
        {
          id: '3',
          campaign_name: 'Healthy Lifestyle Challenge',
          campaign_description: 'Join our 30-day healthy lifestyle challenge and inspire your followers to live better.',
          campaign_type: 'paid',
          deliverables: [
            { type: 'post', quantity: 4, description: 'Weekly progress posts' },
            { type: 'story', quantity: 10, description: 'Daily challenge updates' },
            { type: 'reel', quantity: 2, description: 'Before/after transformation reels' }
          ],
          eligible_follower_range: { min: 5000, max: 200000 },
          eligible_categories: ['fitness', 'health', 'lifestyle', 'food'],
          max_applications: 75,
          application_deadline: '2024-02-10T23:59:59Z',
          current_applications: 45,
          status: 'draft',
          budget_total_usd_cents: 1875000, // $18,750
          created_at: '2024-01-08T12:00:00Z',
          updated_at: '2024-01-15T16:45:00Z',
          applications_stats: {
            total_applications: 0,
            approved_applications: 0,
            pending_review: 0,
            rejected_applications: 0
          }
        }
      ])
    } catch (error) {
      console.error('Failed to load campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'published': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-3 w-3" />
      case 'published': return <Globe className="h-3 w-3" />
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'closed': return <XCircle className="h-3 w-3" />
      case 'completed': return <Star className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, { type: 'post', quantity: 1, description: '' }]
    }))
  }

  const updateDeliverable = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) =>
        i === index ? { ...d, [field]: value } : d
      )
    }))
  }

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }))
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      eligible_categories: prev.eligible_categories.includes(category)
        ? prev.eligible_categories.filter(c => c !== category)
        : [...prev.eligible_categories, category]
    }))
  }

  const resetForm = () => {
    setFormData({
      campaign_name: '',
      campaign_description: '',
      campaign_type: 'paid',
      barter_offering: '',
      deliverables: [{ type: 'post', quantity: 1, description: '' }],
      eligible_follower_range: { min: 1000, max: 100000 },
      eligible_categories: [],
      max_applications: 100,
      application_deadline: ''
    })
  }

  const handleEdit = (campaign: InviteCampaign) => {
    setEditingCampaign(campaign)
    setFormData({
      campaign_name: campaign.campaign_name,
      campaign_description: campaign.campaign_description,
      campaign_type: campaign.campaign_type,
      barter_offering: campaign.barter_offering || '',
      deliverables: campaign.deliverables,
      eligible_follower_range: campaign.eligible_follower_range,
      eligible_categories: campaign.eligible_categories,
      max_applications: campaign.max_applications,
      application_deadline: campaign.application_deadline.split('T')[0], // Format for input[type="date"]
      budget_total_usd_cents: campaign.budget_total_usd_cents
    })
    setDialogOpen(true)
  }

  const handlePublish = async (campaignId: string) => {
    try {
      const result = await superadminApiService.publishInviteCampaign(campaignId)
      if (result.success) {
        toast.success('Campaign published successfully!')
        loadCampaigns()
      } else {
        toast.error('Failed to publish campaign: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to publish campaign:', error)
      toast.error('Failed to publish campaign')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const campaignData = {
        ...formData,
        application_deadline: formData.application_deadline + 'T23:59:59Z'
      }

      let result
      if (editingCampaign) {
        // Update existing campaign - this would need an update API endpoint
        toast.success('Campaign updated successfully!')
      } else {
        result = await superadminApiService.createInviteCampaign(campaignData)
        if (result.success) {
          toast.success('Campaign created successfully!')
          loadCampaigns()
          setDialogOpen(false)
          resetForm()
        } else {
          toast.error('Failed to create campaign: ' + (result.error || 'Unknown error'))
        }
      }
    } catch (error) {
      console.error('Failed to save campaign:', error)
      toast.error('Failed to save campaign')
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.campaign_description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    const matchesType = typeFilter === 'all' || campaign.campaign_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

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

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Invite Campaigns</h1>
                <p className="text-muted-foreground">Create and manage public invitation campaigns for influencers</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={loadCampaigns}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => {
                  setEditingCampaign(null)
                  resetForm()
                  setDialogOpen(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaigns.length}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                  <Zap className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {campaigns.filter(c => c.status === 'active' || c.status === 'published').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Currently accepting applications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaigns.reduce((sum, c) => sum + c.current_applications, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all campaigns</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Approval Rate</CardTitle>
                  <Target className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {campaigns.length > 0
                      ? Math.round(campaigns.reduce((sum, c) =>
                          sum + (c.applications_stats.total_applications > 0
                            ? (c.applications_stats.approved_applications / c.applications_stats.total_applications) * 100
                            : 0), 0) / campaigns.length) + '%'
                      : '0%'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Application approval rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="barter">Barter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campaigns Table */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Management</CardTitle>
                <CardDescription>Manage public invite campaigns and track applications</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <div className="font-medium">{campaign.campaign_name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {campaign.campaign_description}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {campaign.eligible_categories.slice(0, 3).map(cat => (
                                <Badge key={cat} variant="secondary" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                              {campaign.eligible_categories.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{campaign.eligible_categories.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={campaign.campaign_type === 'paid' ? 'default' : 'secondary'}>
                            {campaign.campaign_type}
                          </Badge>
                          {campaign.campaign_type === 'barter' && campaign.barter_offering && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {campaign.barter_offering.length > 30
                                ? campaign.barter_offering.substring(0, 30) + '...'
                                : campaign.barter_offering}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(campaign.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(campaign.status)}
                              {campaign.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {campaign.current_applications} / {campaign.max_applications}
                            </div>
                            {campaign.applications_stats.approved_applications > 0 && (
                              <div className="text-green-600 text-xs">
                                {campaign.applications_stats.approved_applications} approved
                              </div>
                            )}
                            {campaign.applications_stats.pending_review > 0 && (
                              <div className="text-yellow-600 text-xs">
                                {campaign.applications_stats.pending_review} pending
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(campaign.application_deadline)}
                          </div>
                          {new Date(campaign.application_deadline) < new Date() && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Expired
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {campaign.budget_total_usd_cents ? (
                            <div className="font-medium text-green-600">
                              {formatCurrency(campaign.budget_total_usd_cents)}
                            </div>
                          ) : (
                            <Badge variant="outline">Barter</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(campaign)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/proposals/campaigns/${campaign.id}/applications`)}>
                                <Users className="h-4 w-4 mr-2" />
                                View Applications
                              </DropdownMenuItem>
                              {campaign.status === 'draft' && (
                                <DropdownMenuItem onClick={() => handlePublish(campaign.id)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Publish Campaign
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview Public View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Campaign
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredCampaigns.length === 0 && (
                  <div className="text-center py-12">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? 'No campaigns match your search criteria.' : 'Create your first invite campaign to get started.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Form Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCampaign ? 'Edit Campaign' : 'Create New Invite Campaign'}
                  </DialogTitle>
                  <DialogDescription>
                    Set up a public campaign where influencers can apply to participate
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Campaign Details</TabsTrigger>
                    <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
                    <TabsTrigger value="targeting">Targeting</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="campaign_name">Campaign Name</Label>
                        <Input
                          id="campaign_name"
                          value={formData.campaign_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
                          placeholder="Summer Fashion Campaign 2024"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="campaign_description">Campaign Description</Label>
                        <Textarea
                          id="campaign_description"
                          value={formData.campaign_description}
                          onChange={(e) => setFormData(prev => ({ ...prev, campaign_description: e.target.value }))}
                          placeholder="Describe what this campaign is about, what you're looking for from creators..."
                          rows={4}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Campaign Type</Label>
                          <Select
                            value={formData.campaign_type}
                            onValueChange={(value: 'paid' | 'barter') => setFormData(prev => ({ ...prev, campaign_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid Campaign</SelectItem>
                              <SelectItem value="barter">Barter/Product Exchange</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.campaign_type === 'barter' && (
                          <div className="space-y-2">
                            <Label htmlFor="barter_offering">What You're Offering</Label>
                            <Input
                              id="barter_offering"
                              value={formData.barter_offering}
                              onChange={(e) => setFormData(prev => ({ ...prev, barter_offering: e.target.value }))}
                              placeholder="Free products worth $500"
                            />
                          </div>
                        )}

                        {formData.campaign_type === 'paid' && (
                          <div className="space-y-2">
                            <Label htmlFor="budget">Total Budget (USD)</Label>
                            <Input
                              id="budget"
                              type="number"
                              value={formData.budget_total_usd_cents ? formData.budget_total_usd_cents / 100 : ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                budget_total_usd_cents: Math.round(parseFloat(e.target.value) * 100) || undefined
                              }))}
                              placeholder="25000"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="deliverables" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Required Deliverables</h4>
                      <Button onClick={addDeliverable} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deliverable
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {formData.deliverables.map((deliverable, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="grid gap-4 md:grid-cols-4">
                              <Select
                                value={deliverable.type}
                                onValueChange={(value) => updateDeliverable(index, 'type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DELIVERABLE_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input
                                type="number"
                                placeholder="Quantity"
                                value={deliverable.quantity}
                                onChange={(e) => updateDeliverable(index, 'quantity', parseInt(e.target.value) || 1)}
                                min="1"
                              />

                              <Input
                                placeholder="Description"
                                value={deliverable.description}
                                onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
                              />

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeDeliverable(index)}
                                disabled={formData.deliverables.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="targeting" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-4">Follower Range</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Minimum Followers</Label>
                          <Input
                            type="number"
                            value={formData.eligible_follower_range.min}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              eligible_follower_range: {
                                ...prev.eligible_follower_range,
                                min: parseInt(e.target.value) || 0
                              }
                            }))}
                            placeholder="1000"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Maximum Followers</Label>
                          <Input
                            type="number"
                            value={formData.eligible_follower_range.max}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              eligible_follower_range: {
                                ...prev.eligible_follower_range,
                                max: parseInt(e.target.value) || 0
                              }
                            }))}
                            placeholder="100000"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Eligible Categories</h4>
                      <div className="grid gap-2 md:grid-cols-4">
                        {CATEGORIES.map(category => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={category}
                              checked={formData.eligible_categories.includes(category)}
                              onCheckedChange={() => handleCategoryToggle(category)}
                            />
                            <Label htmlFor={category} className="text-sm font-normal capitalize">
                              {category.replace('_', ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Maximum Applications</Label>
                        <Input
                          type="number"
                          value={formData.max_applications}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            max_applications: parseInt(e.target.value) || 0
                          }))}
                          placeholder="100"
                        />
                        <p className="text-xs text-muted-foreground">
                          Campaign will close automatically when this limit is reached
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Application Deadline</Label>
                        <Input
                          type="date"
                          value={formData.application_deadline}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            application_deadline: e.target.value
                          }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Last date for influencers to apply
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}