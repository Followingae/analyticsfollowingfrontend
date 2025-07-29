"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Eye,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Edit,
  Trash2,
  UserPlus,
  Instagram,
  ExternalLink,
  Download,
  Filter,
} from "lucide-react"
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Label,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart
} from "recharts"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export default function CampaignAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  
  // TODO: Replace with real backend data
  const [campaign, setCampaign] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // TODO: Implement actual API calls to fetch campaign data
    // fetchCampaign(params.id).then(setCampaign)
    // fetchCampaignAnalytics(params.id).then(setAnalytics)
    // fetchCampaignCreators(params.id).then(setCreators)
    setLoading(false)
  }, [params.id])

  // Fallback campaign structure for development
  const fallbackCampaign = {
    id: 1,
    name: "Summer Fashion 2024",
    status: "active",
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    budget: 55050,
    objective: "Brand Awareness",
    description: "Promote summer collection with fashion influencers across Instagram and TikTok platforms.",
    brandName: "Fashion Forward",
    brandLogo: "/followinglogo.svg"
  }

  const analytics = {
    totalReach: 1250000,
    totalImpressions: 3200000,
    totalEngagement: 186000,
    engagementRate: 5.8,
    ctr: 2.3,
    conversions: 1240,
    roi: 285,
    avgCPM: 12.5,
    totalPosts: 28,
    totalStories: 45,
    totalReels: 12
  }

  const creators = [
    {
      id: 1,
      name: "Sarah Johnson",
      username: "fashionista_sarah",
      avatar: "/avatars/01.png",
      followers: 250000,
      engagement: 4.2,
      posts: 3,
      stories: 5,
      reels: 1,
      reach: 180000,
      impressions: 420000,
      likes: 28500,
      comments: 1250,
      shares: 340,
      status: "active"
    },
    {
      id: 2,
      name: "Emma Wilson", 
      username: "style_emma",
      avatar: "/avatars/02.png",
      followers: 180000,
      engagement: 5.1,
      posts: 2,
      stories: 4,
      reels: 2,
      reach: 145000,
      impressions: 380000,
      likes: 24200,
      comments: 980,
      shares: 290,
      status: "active"
    },
    {
      id: 3,
      name: "Lisa Chen",
      username: "chic_lisa", 
      avatar: "/avatars/03.png",
      followers: 320000,
      engagement: 3.8,
      posts: 4,
      stories: 6,
      reels: 1,
      reach: 220000,
      impressions: 580000,
      likes: 32100,
      comments: 1580,
      shares: 420,
      status: "pending"
    }
  ]

  const contentPosts = [
    {
      id: 1,
      creator: creators[0],
      type: "post",
      caption: "Summer vibes with the new Fashion Forward collection! ✨ #SummerFashion2024",
      postedDate: "2024-07-15",
      imageUrl: "/post-images/post1.jpg",
      likes: 12500,
      comments: 340,
      shares: 85,
      reach: 85000,
      impressions: 125000,
      engagement: 4.8,
      platform: "instagram"
    },
    {
      id: 2,
      creator: creators[1],
      type: "reel",
      caption: "Get ready with me using Fashion Forward's latest pieces! 💫",
      postedDate: "2024-07-14",
      imageUrl: "/post-images/reel1.jpg",
      likes: 18200,
      comments: 560,
      shares: 140,
      reach: 95000,
      impressions: 180000,
      engagement: 5.2,
      platform: "instagram"
    },
    {
      id: 3,
      creator: creators[0],
      type: "story",
      caption: "Behind the scenes of our summer shoot 📸",
      postedDate: "2024-07-13",
      imageUrl: "/post-images/story1.jpg",
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 45000,
      impressions: 48000,
      engagement: 2.1,
      platform: "instagram"
    },
    {
      id: 4,
      creator: creators[2],
      type: "post",
      caption: "Obsessed with these summer essentials from @fashionforward! Perfect for vacation vibes 🌴",
      postedDate: "2024-07-12",
      imageUrl: "/post-images/post2.jpg",
      likes: 15800,
      comments: 420,
      shares: 110,
      reach: 105000,
      impressions: 160000,
      engagement: 4.2,
      platform: "instagram"
    }
  ]

  // Chart data
  const performanceData = [
    { date: "Jul 1", reach: 45000, engagement: 2100, impressions: 62000 },
    { date: "Jul 2", reach: 52000, engagement: 2800, impressions: 74000 },
    { date: "Jul 3", reach: 48000, engagement: 2400, impressions: 68000 },
    { date: "Jul 4", reach: 61000, engagement: 3200, impressions: 89000 },
    { date: "Jul 5", reach: 58000, engagement: 3100, impressions: 82000 },
    { date: "Jul 6", reach: 65000, engagement: 3600, impressions: 94000 },
    { date: "Jul 7", reach: 72000, engagement: 4200, impressions: 108000 },
  ]

  const contentTypeData = [
    { type: "Posts", count: analytics.totalPosts, fill: "#8b5cf6" },
    { type: "Stories", count: analytics.totalStories, fill: "#f59e0b" },
    { type: "Reels", count: analytics.totalReels, fill: "#10b981" },
  ]

  const totalContent = analytics.totalPosts + analytics.totalStories + analytics.totalReels

  const engagementData = [
    { metric: "Likes", value: 75400, fill: "hsl(var(--chart-1))" },
    { metric: "Comments", value: 12800, fill: "hsl(var(--chart-2))" },
    { metric: "Shares", value: 3200, fill: "hsl(var(--chart-3))" },
  ]

  const creatorPerformanceData = creators.map(creator => ({
    name: creator.name.split(' ')[0],
    reach: creator.reach,
    engagement: creator.engagement,
    posts: creator.posts + creator.stories + creator.reels
  }))

  const chartConfig = {
    reach: {
      label: "Reach",
      color: "hsl(var(--chart-1))",
    },
    engagement: {
      label: "Engagement",
      color: "hsl(var(--chart-2))",
    },
    impressions: {
      label: "Impressions",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Pending</Badge>
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

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
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 bg-black">
                    <AvatarImage src={campaign.brandLogo} alt={campaign.brandName} />
                    <AvatarFallback className="text-white">{campaign.brandName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold">{campaign.name}</h1>
                    <p className="text-muted-foreground">{campaign.brandName} • {campaign.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Campaign
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Creators
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Campaign
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Campaign Info Bar */}
            <Card>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatCurrency(campaign.budget)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{creators.length} Creators</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(campaign.status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatNumber(analytics.totalReach)}</div>
                      <p className="text-xs text-muted-foreground">
                        +12.5% from last period
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatNumber(analytics.totalEngagement)}</div>
                      <p className="text-xs text-muted-foreground">
                        {analytics.engagementRate}% engagement rate
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatNumber(analytics.conversions)}</div>
                      <p className="text-xs text-muted-foreground">
                        {analytics.ctr}% click-through rate
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">ROI</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">+{analytics.roi}%</div>
                      <p className="text-xs text-muted-foreground">
                        Return on investment
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Performance Over Time Chart */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="text-blue-900 dark:text-blue-100">Campaign Performance Over Time</CardTitle>
                      <CardDescription className="text-blue-700 dark:text-blue-300">Daily reach and engagement trends with interactive hover</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={performanceData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                            <defs>
                              <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" opacity={0.6} />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fill: '#64748b', fontSize: 12 }}
                              axisLine={{ stroke: '#cbd5e1' }}
                            />
                            <YAxis 
                              tick={{ fill: '#64748b', fontSize: 12 }}
                              axisLine={{ stroke: '#cbd5e1' }}
                            />
                            <ChartTooltip 
                              content={<ChartTooltipContent />}
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="reach" 
                              stroke="#3b82f6"
                              strokeWidth={3}
                              fill="url(#reachGradient)"
                              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "#ffffff" }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="engagement" 
                              stroke="#f59e0b"
                              strokeWidth={3}
                              fill="url(#engagementGradient)"
                              dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2, fill: "#ffffff" }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Content Distribution Interactive Pie Chart */}
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <CardTitle className="text-purple-900 dark:text-purple-100">Content Distribution</CardTitle>
                      <CardDescription className="text-purple-700 dark:text-purple-300">Interactive breakdown with hover details</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center space-y-4">
                        {/* Chart Container */}
                        <div className="relative w-48 h-48">
                          <ChartContainer config={chartConfig} className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <defs>
                                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
                                  </filter>
                                </defs>
                                <Pie
                                  data={contentTypeData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={90}
                                  paddingAngle={2}
                                  dataKey="count"
                                  stroke="#ffffff"
                                  strokeWidth={3}
                                  filter="url(#shadow)"
                                >
                                  {contentTypeData.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={entry.fill}
                                      style={{
                                        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))',
                                        transition: 'all 0.2s ease-in-out'
                                      }}
                                    />
                                  ))}
                                </Pie>
                                <ChartTooltip 
                                  content={<ChartTooltipContent />}
                                  contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                          
                          {/* Center Label */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                              {totalContent}
                            </div>
                            <div className="text-sm text-purple-700 dark:text-purple-300">
                              Total
                            </div>
                          </div>
                        </div>

                        {/* Professional Legend */}
                        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                          {contentTypeData.map((item, index) => (
                            <div key={index} className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <div 
                                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                                  style={{ backgroundColor: item.fill }}
                                />
                              </div>
                              <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                {item.count}
                              </div>
                              <div className="text-xs text-purple-700 dark:text-purple-300">
                                {item.type}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Engagement Breakdown Bar Chart */}
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
                    <CardHeader>
                      <CardTitle className="text-emerald-900 dark:text-emerald-100">Engagement Breakdown</CardTitle>
                      <CardDescription className="text-emerald-700 dark:text-emerald-300">Likes, Comments & Shares with interactive bars</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={engagementData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.6}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" opacity={0.6} />
                            <XAxis 
                              dataKey="metric" 
                              tick={{ fill: '#64748b', fontSize: 12 }}
                              axisLine={{ stroke: '#a7f3d0' }}
                            />
                            <YAxis 
                              tick={{ fill: '#64748b', fontSize: 12 }}
                              axisLine={{ stroke: '#a7f3d0' }}
                            />
                            <ChartTooltip 
                              content={<ChartTooltipContent />}
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Bar 
                              dataKey="value" 
                              fill="url(#barGradient)" 
                              radius={[8, 8, 0, 0]}
                              stroke="#10b981"
                              strokeWidth={1}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Creator Performance Bar Chart */}
                  <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
                    <CardHeader>
                      <CardTitle className="text-orange-900 dark:text-orange-100">Creator Reach</CardTitle>
                      <CardDescription className="text-orange-700 dark:text-orange-300">Reach by creator with interactive comparison</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={creatorPerformanceData} layout="horizontal" margin={{ top: 20, right: 30, left: 50, bottom: 20 }}>
                            <defs>
                              <linearGradient id="creatorGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" opacity={0.6} />
                            <XAxis 
                              type="number" 
                              tick={{ fill: '#64748b', fontSize: 12 }}
                              axisLine={{ stroke: '#fdba74' }}
                            />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={60}
                              tick={{ fill: '#64748b', fontSize: 12 }}
                              axisLine={{ stroke: '#fdba74' }}
                            />
                            <ChartTooltip 
                              content={<ChartTooltipContent />}
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Bar 
                              dataKey="reach" 
                              fill="url(#creatorGradient)" 
                              radius={[0, 8, 8, 0]}
                              stroke="#f97316"
                              strokeWidth={1}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Creators */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Creators</CardTitle>
                    <CardDescription>Based on engagement rate and total reach</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {creators.slice(0, 3).map((creator, index) => (
                      <div key={creator.id} className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                          {index + 1}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={creator.avatar} alt={creator.name} />
                          <AvatarFallback>{creator.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{creator.name}</p>
                          <p className="text-sm text-muted-foreground">@{creator.username}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-sm font-semibold">{formatNumber(creator.reach)}</p>
                              <p className="text-xs text-muted-foreground">Reach</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold">{creator.engagement}%</p>
                              <p className="text-xs text-muted-foreground">Engagement</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold">{creator.posts + creator.stories + creator.reels}</p>
                              <p className="text-xs text-muted-foreground">Content</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                {/* Content Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Campaign Content</h2>
                    <p className="text-muted-foreground">All content posted by creators for this campaign</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Content</SelectItem>
                        <SelectItem value="post">Posts</SelectItem>
                        <SelectItem value="story">Stories</SelectItem>
                        <SelectItem value="reel">Reels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {contentPosts.map((post) => (
                    <Card key={post.id} className="relative overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.creator.avatar} alt={post.creator.name} />
                              <AvatarFallback>{post.creator.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{post.creator.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">@{post.creator.username}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {post.type}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <BarChart3 className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/campaigns/${campaign.id}/content/${post.id}`)}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  View Insights
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View on Instagram
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Post Details */}
                        <div className="space-y-2">
                          <p className="text-sm">{post.caption}</p>
                          <p className="text-xs text-muted-foreground">
                            Posted on {formatDate(post.postedDate)}
                          </p>
                        </div>

                        {/* Performance Stats */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <div className="text-sm font-semibold">{formatNumber(post.reach)}</div>
                            <div className="text-xs text-muted-foreground">Reach</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{formatNumber(post.impressions)}</div>
                            <div className="text-xs text-muted-foreground">Impressions</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{post.engagement}%</div>
                            <div className="text-xs text-muted-foreground">Engagement</div>
                          </div>
                        </div>

                        {/* Engagement Breakdown */}
                        {post.type !== "story" && (
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="text-xs font-medium">{formatNumber(post.likes)}</div>
                              <div className="text-xs text-muted-foreground">Likes</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium">{formatNumber(post.comments)}</div>
                              <div className="text-xs text-muted-foreground">Comments</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium">{formatNumber(post.shares)}</div>
                              <div className="text-xs text-muted-foreground">Shares</div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>


              <TabsContent value="performance" className="space-y-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
                  <p className="text-muted-foreground">Advanced performance metrics and charts will be displayed here</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}