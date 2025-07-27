"use client"

import { useState } from "react"
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
  ExternalLink,
  X,
} from "lucide-react"

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false)
  
  const campaigns = [
    {
      id: 1,
      name: "Summer Fashion 2024",
      description: "Promote summer collection with fashion influencers",
      status: "active",
      startDate: "2024-06-01",
      endDate: "2024-08-31",
      budget: 15000,
      spent: 8500,
      creators: 5,
      reach: 1200000,
      engagement: 4.2,
      performance: 12.5,
      category: "Fashion",
      objective: "Brand Awareness",
      deliverables: ["3 Instagram Posts", "5 Stories", "1 Reel"],
      creators_list: [
        { name: "Sarah Johnson", username: "fashionista_sarah", avatar: "/avatars/01.png" },
        { name: "Emma Wilson", username: "style_emma", avatar: "/avatars/02.png" },
        { name: "Lisa Chen", username: "chic_lisa", avatar: "/avatars/03.png" }
      ]
    },
    {
      id: 2,
      name: "Tech Product Launch",
      description: "Launch new smartphone with tech reviewers",
      status: "completed",
      startDate: "2024-04-15",
      endDate: "2024-05-31",
      budget: 25000,
      spent: 23500,
      creators: 3,
      reach: 850000,
      engagement: 5.8,
      performance: 25.2,
      category: "Technology",
      objective: "Product Launch",
      deliverables: ["Unboxing Video", "Review Post", "Tech Stories"],
      creators_list: [
        { name: "Mike Chen", username: "tech_mike", avatar: "/avatars/04.png" },
        { name: "Alex Rodriguez", username: "gadget_alex", avatar: "/avatars/05.png" }
      ]
    },
    {
      id: 3,
      name: "Holiday Collection",
      description: "Winter holiday campaign across multiple verticals",
      status: "planning",
      startDate: "2024-11-01",
      endDate: "2024-12-31",
      budget: 30000,
      spent: 0,
      creators: 8,
      reach: 0,
      engagement: 0,
      performance: 0,
      category: "Lifestyle",
      objective: "Sales Drive",
      deliverables: ["Holiday Posts", "Gift Guides", "Seasonal Stories"],
      creators_list: []
    },
    {
      id: 4,
      name: "Fitness Challenge",
      description: "30-day fitness challenge with wellness influencers",
      status: "active",
      startDate: "2024-07-01",
      endDate: "2024-07-30",
      budget: 12000,
      spent: 4200,
      creators: 6,
      reach: 580000,
      engagement: 6.1,
      performance: 18.7,
      category: "Fitness",
      objective: "Community Building",
      deliverables: ["Daily Workout Posts", "Progress Stories", "Challenge Reels"],
      creators_list: [
        { name: "Anna Rodriguez", username: "fit_anna", avatar: "/avatars/06.png" },
        { name: "James Wilson", username: "strong_james", avatar: "/avatars/07.png" }
      ]
    },
    {
      id: 5,
      name: "Beauty Tutorial Series",
      description: "Makeup tutorial series with beauty creators",
      status: "paused",
      startDate: "2024-05-15",
      endDate: "2024-08-15",
      budget: 18000,
      spent: 9000,
      creators: 4,
      reach: 720000,
      engagement: 7.3,
      performance: 21.4,
      category: "Beauty",
      objective: "Education",
      deliverables: ["Tutorial Videos", "Product Reviews", "Before/After Posts"],
      creators_list: [
        { name: "Maya Patel", username: "beauty_maya", avatar: "/avatars/08.png" }
      ]
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <PlayCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      case "completed":
        return <Badge variant="secondary">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      case "planning":
        return <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Planning
        </Badge>
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
          <PauseCircle className="h-3 w-3 mr-1" />
          Paused
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
  const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
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
                <h1 className="text-3xl font-bold">Brand Campaign Hub</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Campaign Analytics
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Reports
                </Button>
                <Sheet open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
                  <SheetTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[450px] sm:w-[600px] p-8 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Create New Campaign</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      {/* Campaign Basics */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="campaign-name">Campaign Name</Label>
                          <Input
                            id="campaign-name"
                            placeholder="Enter campaign name..."
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="campaign-description">Description</Label>
                          <Textarea
                            id="campaign-description"
                            placeholder="Describe your campaign goals and messaging..."
                            className="mt-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                              id="start-date"
                              type="date"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="end-date">End Date</Label>
                            <Input
                              id="end-date"
                              type="date"
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Campaign Details */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Select>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fashion">Fashion & Style</SelectItem>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="fitness">Fitness & Health</SelectItem>
                                <SelectItem value="food">Food & Cooking</SelectItem>
                                <SelectItem value="beauty">Beauty & Skincare</SelectItem>
                                <SelectItem value="travel">Travel & Lifestyle</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="objective">Campaign Objective</Label>
                            <Select>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select objective" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="awareness">Brand Awareness</SelectItem>
                                <SelectItem value="engagement">Engagement</SelectItem>
                                <SelectItem value="conversions">Conversions</SelectItem>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="traffic">Website Traffic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="budget">Total Budget ($)</Label>
                          <Input
                            id="budget"
                            type="number"
                            placeholder="Enter total budget..."
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Deliverables */}
                      <div className="space-y-4">
                        <Label>Deliverables Required</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="posts" className="rounded" />
                            <label htmlFor="posts" className="text-sm">Instagram Posts</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="stories" className="rounded" />
                            <label htmlFor="stories" className="text-sm">Stories</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="reels" className="rounded" />
                            <label htmlFor="reels" className="text-sm">Reels</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="igtv" className="rounded" />
                            <label htmlFor="igtv" className="text-sm">IGTV</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="live" className="rounded" />
                            <label htmlFor="live" className="text-sm">Live Sessions</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="ugc" className="rounded" />
                            <label htmlFor="ugc" className="text-sm">UGC Content</label>
                          </div>
                        </div>
                      </div>

                      {/* Content Guidelines */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="content-guidelines">Content Guidelines</Label>
                          <Textarea
                            id="content-guidelines"
                            placeholder="Provide content guidelines, brand voice, hashtags, mentions..."
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="hashtags">Required Hashtags</Label>
                          <Input
                            id="hashtags"
                            placeholder="#yourbrand #campaign2024 #sponsored"
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Campaign URLs */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="landing-url">Landing Page URL</Label>
                          <Input
                            id="landing-url"
                            placeholder="https://yourbrand.com/campaign"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tracking-params">UTM Parameters</Label>
                          <Input
                            id="tracking-params"
                            placeholder="?utm_source=instagram&utm_campaign=summer2024"
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Creator Selection */}
                      <div className="space-y-4">
                        <Label>Creator Assignment</Label>
                        <div className="grid gap-2">
                          <Button variant="outline" className="justify-start">
                            <Users className="h-4 w-4 mr-2" />
                            Select from Portfolio
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Search className="h-4 w-4 mr-2" />
                            Discover New Creators
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Upload className="h-4 w-4 mr-2" />
                            Import Creator List
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            toast.success("Campaign saved as draft!")
                            setIsNewCampaignOpen(false)
                          }}
                        >
                          Save as Draft
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => {
                            toast.success("Campaign created successfully!")
                            setIsNewCampaignOpen(false)
                          }}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Create Campaign
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search campaigns by name, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Overview Cards */}
            <SectionCards mode="campaigns" />

            {/* Add Posts to Campaign Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Posts to Campaign
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Campaign</label>
                      <Select defaultValue="summer-2024">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="summer-2024">Summer Fashion 2024</SelectItem>
                          <SelectItem value="fitness-challenge">Fitness Challenge</SelectItem>
                          <SelectItem value="tech-launch">Tech Product Launch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content Type</label>
                      <Select defaultValue="post">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="post">Instagram Post</SelectItem>
                          <SelectItem value="reel">Instagram Reel</SelectItem>
                          <SelectItem value="story">Instagram Story</SelectItem>
                          <SelectItem value="igtv">IGTV Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Post URLs</label>
                    <textarea 
                      className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Enter Instagram post URLs (one per line):
https://www.instagram.com/p/ABC123/
https://www.instagram.com/p/DEF456/
https://www.instagram.com/reel/GHI789/"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => toast.success("Posts added and analysis started!")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Posts & Analyze
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => toast.info("CSV upload feature coming soon!")}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Upload CSV
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>💡 Posts will be automatically analyzed for performance metrics including likes, comments, shares, and engagement rates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaigns Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <CardDescription>{campaign.description}</CardDescription>
                        <Badge variant="outline" className="text-xs">{campaign.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(campaign.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Campaign
                            </DropdownMenuItem>
                            {campaign.status === 'active' && (
                              <DropdownMenuItem>
                                <PauseCircle className="h-4 w-4 mr-2" />
                                Pause Campaign
                              </DropdownMenuItem>
                            )}
                            {campaign.status === 'paused' && (
                              <DropdownMenuItem>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Resume Campaign
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Campaign Dates */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
                    </div>

                    {/* Budget Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">{formatCurrency(campaign.budget)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-medium">{formatCurrency(campaign.spent)}</span>
                      </div>
                      <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
                    </div>

                    {/* Post Analytics */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Post Performance</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Posts</span>
                          <span className="font-medium">12</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Engagement</span>
                          <span className="font-medium">{campaign.engagement}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Likes</span>
                          <span className="font-medium">{formatNumber(Math.floor(campaign.reach * 0.05))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Comments</span>
                          <span className="font-medium">{formatNumber(Math.floor(campaign.reach * 0.008))}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold">{campaign.creators}</div>
                        <div className="text-xs text-muted-foreground">Creators</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">
                          {campaign.reach > 0 ? formatNumber(campaign.reach) : '--'}
                        </div>
                        <div className="text-xs text-muted-foreground">Reach</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">
                          {campaign.performance > 0 ? `+${campaign.performance}%` : '--'}
                        </div>
                        <div className="text-xs text-muted-foreground">ROI</div>
                      </div>
                    </div>

                    {/* Export & Reporting Actions */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Campaign Reports</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Download className="h-3 w-3 mr-1" />
                          Export PDF
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          Email Report
                        </Button>
                      </div>
                    </div>

                    {/* Creator Avatars */}
                    {campaign.creators_list.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Active Creators</div>
                        <div className="flex -space-x-2">
                          {campaign.creators_list.slice(0, 4).map((creator, index) => (
                            <Avatar key={index} className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={creator.avatar} alt={creator.name} />
                              <AvatarFallback className="text-xs">
                                {creator.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {campaign.creators_list.length > 4 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                              +{campaign.creators_list.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Campaign Actions */}
                    <div className="space-y-2 pt-2 border-t">
                      <Button size="sm" className="w-full">
                        <ExternalLink className="h-3 w-3 mr-2" />
                        View All Posts
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Posts
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </div>

                    {/* Objective */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Objective</span>
                      <Badge variant="outline">{campaign.objective}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCampaigns.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search terms or filters."
                      : "Create your first campaign to get started with influencer marketing."
                    }
                  </p>
                  {(!searchTerm && statusFilter === "all") && (
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}