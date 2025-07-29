"use client"

import * as React from "react"
import { useState } from "react"
import { 
  Plus, 
  Target, 
  Users, 
  Eye, 
  Heart, 
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  ExternalLink,
  MoreHorizontal,
  Download,
  FileSpreadsheet,
  FileText,
  Share,
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
  StopCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MetricCard } from "@/components/analytics-cards"

interface Campaign {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  budget: number
  spent: number
  startDate: string
  endDate: string
  creators: {
    id: string
    username: string
    profilePic: string
    posts: number
  }[]
  metrics: {
    totalReach: number
    totalEngagements: number
    totalLikes: number
    totalComments: number
    totalShares: number
    avgEngagementRate: number
  }
  brandLogo?: string
  tags: string[]
}

const sampleCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Summer Fashion Collection 2024",
    description: "Promote our new summer collection with fashion influencers",
    status: "active",
    budget: 15000,
    spent: 8500,
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    creators: [
      {
        id: "1",
        username: "fashionista_sarah",
        profilePic: "/avatars/creator1.jpg",
        posts: 3
      },
      {
        id: "2",
        username: "style_maven_emma",
        profilePic: "/avatars/creator2.jpg",
        posts: 2
      }
    ],
    metrics: {
      totalReach: 1250000,
      totalEngagements: 52000,
      totalLikes: 45000,
      totalComments: 4200,
      totalShares: 2800,
      avgEngagementRate: 4.16
    },
    tags: ["Fashion", "Summer", "Collection"]
  },
  {
    id: "2",
    name: "Tech Product Launch",
    description: "Launch campaign for our new smartphone with tech reviewers",
    status: "completed",
    budget: 25000,
    spent: 24800,
    startDate: "2023-12-01",
    endDate: "2023-12-31",
    creators: [
      {
        id: "3",
        username: "tech_reviewer_mike",
        profilePic: "/avatars/creator3.jpg",
        posts: 4
      }
    ],
    metrics: {
      totalReach: 980000,
      totalEngagements: 67000,
      totalLikes: 58000,
      totalComments: 6200,
      totalShares: 2800,
      avgEngagementRate: 6.84
    },
    tags: ["Technology", "Product Launch", "Smartphone"]
  }
]

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(sampleCampaigns)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    budget: "",
    startDate: "",
    endDate: ""
  })

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
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

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return <PlayCircle className="h-3 w-3" />
      case 'paused': return <PauseCircle className="h-3 w-3" />
      case 'completed': return <StopCircle className="h-3 w-3" />
      default: return null
    }
  }

  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0)
  const totalSpent = campaigns.reduce((sum, campaign) => sum + campaign.spent, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalReach = campaigns.reduce((sum, campaign) => sum + campaign.metrics.totalReach, 0)

  const handleCreateCampaign = () => {
    // Add campaign creation logic here
    setShowCreateDialog(false)
    setNewCampaign({
      name: "",
      description: "",
      budget: "",
      startDate: "",
      endDate: ""
    })
  }

  const handleExportCampaign = (campaign: Campaign, format: 'pdf' | 'excel') => {
    // Add export logic here
    console.log(`Exporting ${campaign.name} as ${format}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage and track your influencer marketing campaigns</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new influencer marketing campaign
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="Enter campaign name..."
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your campaign..."
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="0"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleCreateCampaign} className="w-full">
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Campaigns"
          value={activeCampaigns.toString()}
          change={25}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Budget"
          value={`AED ${totalBudget.toLocaleString()}`}
          change={12}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Spent"
          value={`AED ${totalSpent.toLocaleString()}`}
          change={8}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Reach"
          value={formatNumber(totalReach)}
          change={15}
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Campaigns List */}
      <div className="grid gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1 capitalize">{campaign.status}</span>
                    </Badge>
                  </div>
                  <CardDescription className="max-w-2xl">
                    {campaign.description}
                  </CardDescription>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {campaign.creators.length} creators
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Campaign
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExportCampaign(campaign, 'pdf')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportCampaign(campaign, 'excel')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Campaign
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Budget Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget Usage</span>
                  <span className="font-medium">
                    {formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}
                  </span>
                </div>
                <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
              </div>

              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Reach</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(campaign.metrics.totalReach)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm font-medium">Engagements</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(campaign.metrics.totalEngagements)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Avg. Engagement</span>
                  </div>
                  <p className="text-2xl font-bold">{campaign.metrics.avgEngagementRate}%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                    <Share className="h-4 w-4" />
                    <span className="text-sm font-medium">Shares</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(campaign.metrics.totalShares)}</p>
                </div>
              </div>

              {/* Creators */}
              <div className="space-y-3">
                <h4 className="font-medium">Campaign Creators</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {campaign.creators.map((creator) => (
                    <div key={creator.id} className="flex items-center gap-2 bg-muted rounded-lg p-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={creator.profilePic} alt={creator.username} />
                        <AvatarFallback>
                          <Users className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">@{creator.username}</span>
                      <Badge variant="outline" className="text-xs">
                        {creator.posts} posts
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {campaign.tags && campaign.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Tags</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {campaign.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Detail Modal */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedCampaign && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedCampaign.name}
                  <Badge className={getStatusColor(selectedCampaign.status)}>
                    {getStatusIcon(selectedCampaign.status)}
                    <span className="ml-1 capitalize">{selectedCampaign.status}</span>
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedCampaign.description}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="creators">Creators</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      title="Total Reach"
                      value={formatNumber(selectedCampaign.metrics.totalReach)}
                      icon={<Eye className="h-4 w-4 text-muted-foreground" />}
                    />
                    <MetricCard
                      title="Engagements"
                      value={formatNumber(selectedCampaign.metrics.totalEngagements)}
                      icon={<Heart className="h-4 w-4 text-muted-foreground" />}
                    />
                    <MetricCard
                      title="Budget Used"
                      value={`${((selectedCampaign.spent / selectedCampaign.budget) * 100).toFixed(1)}%`}
                      icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                    />
                    <MetricCard
                      title="Avg. Engagement"
                      value={`${selectedCampaign.metrics.avgEngagementRate}%`}
                      icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="creators">
                  <div className="space-y-4">
                    {selectedCampaign.creators.map((creator) => (
                      <Card key={creator.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={creator.profilePic} alt={creator.username} />
                              <AvatarFallback>
                                <Users className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">@{creator.username}</p>
                              <p className="text-sm text-muted-foreground">{creator.posts} posts in this campaign</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Profile
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="posts">
                  <Card>
                    <CardContent className="text-center py-8">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Campaign Posts</h3>
                      <p className="text-muted-foreground">Individual post analytics coming soon</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first influencer marketing campaign
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}