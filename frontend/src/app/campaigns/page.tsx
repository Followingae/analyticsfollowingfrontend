"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  ArrowRight,
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
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"

export default function CampaignsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState("all")
  
  const campaigns = [
    {
      id: 1,
      name: "Summer Fashion 2024",
      status: "active",
      startDate: "2024-06-01",
      endDate: "2024-08-31",
      budget: 55050,
      creators: 5,
      reach: 1200000,
      engagement: 4.2,
      performance: 12.5,
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
      status: "finished",
      startDate: "2024-04-15",
      endDate: "2024-05-31",
      budget: 91750,
      creators: 3,
      reach: 850000,
      engagement: 5.8,
      performance: 25.2,
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
      status: "add_creators",
      startDate: "2024-11-01",
      endDate: "2024-12-31",
      budget: 110100,
      creators: 0,
      reach: 0,
      engagement: 0,
      performance: 0,
      objective: "Sales Drive",
      deliverables: ["Holiday Posts", "Gift Guides", "Seasonal Stories"],
      creators_list: []
    },
    {
      id: 4,
      name: "Fitness Challenge",
      status: "active",
      startDate: "2024-07-01",
      endDate: "2024-07-30",
      budget: 44040,
      creators: 6,
      reach: 580000,
      engagement: 6.1,
      performance: 18.7,
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
      status: "add_creators",
      startDate: "2024-05-15",
      endDate: "2024-08-15",
      budget: 66060,
      creators: 0,
      reach: 720000,
      engagement: 7.3,
      performance: 21.4,
      objective: "Education",
      deliverables: ["Tutorial Videos", "Product Reviews", "Before/After Posts"],
      creators_list: []
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <PlayCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      case "finished":
        return <Badge variant="secondary">
          <CheckCircle className="h-3 w-3 mr-1" />
          Finished
        </Badge>
      case "add_creators":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          <Users className="h-3 w-3 mr-1" />
          Add Creators
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    const formattedAmount = new Intl.NumberFormat('ar-AE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
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
    return statusFilter === "all" || campaign.status === statusFilter
  })

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
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
                  <Download className="h-4 w-4 mr-2" />
                  Export Reports
                </Button>
                <Button onClick={() => router.push('/campaigns/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex justify-end">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                  <SelectItem value="add_creators">Add Creators</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Overview Cards */}
            <SectionCards mode="campaigns" />


            {/* Campaigns Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="relative overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{campaign.name}</CardTitle>
                        <div className="text-xs text-muted-foreground">
                          Started On: {formatDate(campaign.startDate)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(campaign.status)}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Key Stats */}
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <div className="text-sm font-semibold">{formatCurrency(campaign.budget)}</div>
                        <div className="text-xs text-muted-foreground">Budget</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{campaign.creators}</div>
                        <div className="text-xs text-muted-foreground">Creators</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {campaign.reach > 0 ? formatNumber(campaign.reach) : '--'}
                        </div>
                        <div className="text-xs text-muted-foreground">Reach</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {campaign.performance > 0 ? `+${campaign.performance}%` : '--'}
                        </div>
                        <div className="text-xs text-muted-foreground">ROI</div>
                      </div>
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
                    {statusFilter !== "all" 
                      ? "Try adjusting your filters."
                      : "Create your first campaign to get started with influencer marketing."
                    }
                  </p>
                  {statusFilter === "all" && (
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