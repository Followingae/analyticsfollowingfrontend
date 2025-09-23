"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Share,
  ExternalLink,
  Download,
  Calendar,
  TrendingUp,
  Users,
  BarChart3,
  Instagram,
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
  AreaChart
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export default function ContentInsightsPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const params = useParams()

  // TODO: Replace with real backend data
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // TODO: Implement actual API call to fetch content data
    // fetchCampaignContent(params.id, params.contentId).then(setPost)
    setLoading(false)
  }, [params.id, params.contentId])

  // Fallback post structure for development
  const fallbackPost = {
    id: 1,
    creator: {
      name: "Sarah Johnson",
      username: "fashionista_sarah",
      avatar: "/avatars/01.png",
      followers: 250000,
    },
    type: "post",
    caption: "Summer vibes with the new Fashion Forward collection! ✨ #SummerFashion2024 #OOTD #Style",
    postedDate: "2024-07-15T10:30:00Z",
    imageUrl: "/post-images/post1.jpg",
    likes: 12500,
    comments: 340,
    shares: 85,
    saves: 180,
    reach: 85000,
    impressions: 125000,
    engagement: 4.8,
    platform: "instagram",
    hashtags: ["#SummerFashion2024", "#OOTD", "#Style", "#FashionForward"],
    mentions: ["@fashionforward"],
    location: "Dubai, UAE"
  }

  const campaign = {
    id: 1,
    name: "Summer Fashion 2024",
    brandName: "Fashion Forward",
    brandLogo: theme === 'dark' ? "/Following Logo Dark Mode.svg" : "/followinglogo.svg"
  }

  // Performance over time data
  const performanceData = [
    { time: "0h", likes: 0, comments: 0, shares: 0, reach: 0 },
    { time: "1h", likes: 850, comments: 12, shares: 3, reach: 5200 },
    { time: "2h", likes: 1200, comments: 18, shares: 5, reach: 8100 },
    { time: "4h", likes: 2100, comments: 32, shares: 8, reach: 12800 },
    { time: "8h", likes: 4200, comments: 85, shares: 18, reach: 24500 },
    { time: "12h", likes: 6800, comments: 145, shares: 32, reach: 38200 },
    { time: "24h", likes: 9200, comments: 220, shares: 52, reach: 58000 },
    { time: "48h", likes: 11200, comments: 285, shares: 68, reach: 72000 },
    { time: "72h", likes: 12100, comments: 320, shares: 78, reach: 81000 },
    { time: "96h", likes: 12500, comments: 340, shares: 85, reach: 85000 },
  ]

  // Audience demographics
  const ageData = [
    { age: "18-24", percentage: 35, fill: "hsl(var(--chart-1))" },
    { age: "25-34", percentage: 42, fill: "hsl(var(--chart-2))" },
    { age: "35-44", percentage: 18, fill: "hsl(var(--chart-3))" },
    { age: "45+", percentage: 5, fill: "hsl(var(--chart-4))" },
  ]

  const genderData = [
    { gender: "Female", percentage: 68, fill: "hsl(var(--chart-1))" },
    { gender: "Male", percentage: 32, fill: "hsl(var(--chart-2))" },
  ]

  const locationData = [
    { location: "UAE", value: 4200, fill: "hsl(var(--chart-1))" },
    { location: "Saudi Arabia", value: 3800, fill: "hsl(var(--chart-2))" },
    { location: "Kuwait", value: 2100, fill: "hsl(var(--chart-3))" },
    { location: "Qatar", value: 1800, fill: "hsl(var(--chart-4))" },
    { location: "Other", value: 1600, fill: "hsl(var(--chart-5))" },
  ]

  const chartConfig = {
    likes: {
      label: "Likes",
      color: "hsl(var(--chart-1))",
    },
    comments: {
      label: "Comments", 
      color: "hsl(var(--chart-2))",
    },
    shares: {
      label: "Shares",
      color: "hsl(var(--chart-3))",
    },
    reach: {
      label: "Reach",
      color: "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
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

  if (loading || !post) {
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
              <div className="flex items-center justify-center py-12">
                <p>Loading content...</p>
              </div>
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
                    <h1 className="text-2xl font-bold">Content Insights</h1>
                    <p className="text-muted-foreground">{campaign.name} • {post?.creator.name}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Instagram
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Post Overview */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="w-80 h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Instagram className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Post Preview</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={post.creator.avatar} alt={post.creator.name} />
                        <AvatarFallback>{post.creator.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{post.creator.name}</h3>
                        <p className="text-sm text-muted-foreground">@{post.creator.username}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto capitalize">
                        {post.type}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm">{post.caption}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Posted on {formatDate(post.postedDate)}</span>
                      </div>
                      {post.location && (
                        <p className="text-sm text-muted-foreground">📍 {post.location}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reach</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(post.reach)}</div>
                  <p className="text-xs text-muted-foreground">
                    {((post.reach / post.creator.followers) * 100).toFixed(1)}% of followers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(post.impressions)}</div>
                  <p className="text-xs text-muted-foreground">
                    {(post.impressions / post.reach).toFixed(1)}x frequency
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Likes</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(post.likes)}</div>
                  <p className="text-xs text-muted-foreground">
                    {((post.likes / post.reach) * 100).toFixed(1)}% like rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comments</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(post.comments)}</div>
                  <p className="text-xs text-muted-foreground">
                    {((post.comments / post.reach) * 100).toFixed(2)}% comment rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{post.engagement}%</div>
                  <p className="text-xs text-muted-foreground">
                    Above average
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>How this post performed in the first 96 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="likes" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="comments" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="reach" 
                        stroke="hsl(var(--chart-4))" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Audience Demographics */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Age Demographics</CardTitle>
                  <CardDescription>Audience age distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ageData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="percentage"
                        >
                          {ageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="mt-4 space-y-2">
                    {ageData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.fill.replace('hsl(var(--chart-', 'hsl(var(--chart-').replace('))', '))') }}
                          />
                          <span>{item.age}</span>
                        </div>
                        <span className="font-medium">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gender Split</CardTitle>
                  <CardDescription>Audience gender distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="percentage"
                        >
                          {genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="mt-4 space-y-2">
                    {genderData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.fill.replace('hsl(var(--chart-', 'hsl(var(--chart-').replace('))', '))') }}
                          />
                          <span>{item.gender}</span>
                        </div>
                        <span className="font-medium">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Locations</CardTitle>
                  <CardDescription>Where your audience is from</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={locationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="location" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Actions</CardTitle>
                  <CardDescription>Breakdown of user interactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Likes</span>
                    </div>
                    <span className="text-sm font-medium">{formatNumber(post.likes)} ({((post.likes / (post.likes + post.comments + post.shares)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Comments</span>
                    </div>
                    <span className="text-sm font-medium">{formatNumber(post.comments)} ({((post.comments / (post.likes + post.comments + post.shares)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Shares</span>
                    </div>
                    <span className="text-sm font-medium">{formatNumber(post.shares)} ({((post.shares / (post.likes + post.comments + post.shares)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Saves</span>
                    </div>
                    <span className="text-sm font-medium">{formatNumber(post.saves)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Benchmarks</CardTitle>
                  <CardDescription>How this post compares to averages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Engagement Rate</span>
                      <span className="font-medium">{post.engagement}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((post.engagement / 6) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Above industry average (3.2%)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Reach Rate</span>
                      <span className="font-medium">{((post.reach / post.creator.followers) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(((post.reach / post.creator.followers) * 100 / 40) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Good reach for follower count</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}