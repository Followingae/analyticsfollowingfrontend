"use client"

import * as React from "react"
import { useState } from "react"
import { 
  Search, 
  Plus, 
  Users, 
  Eye, 
  Heart, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  ExternalLink,
  MoreHorizontal,
  Filter,
  Download
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
import { MetricCard } from "@/components/analytics-cards"

interface UnlockedCreator {
  id: string
  username: string
  fullName: string
  profilePic: string
  followers: number
  engagementRate: number
  avgLikes: number
  avgComments: number
  category: string
  isVerified: boolean
  contentQuality: number
  unlockedDate: string
  lastAnalyzed: string
  trends: {
    followers: number
    engagement: number
    likes: number
  }
  recentPosts: number
}

const unlockedCreators: UnlockedCreator[] = [
  {
    id: "1",
    username: "tech_reviewer_mike",
    fullName: "Mike Chen",
    profilePic: "/avatars/creator2.jpg",
    followers: 186000,
    engagementRate: 5.8,
    avgLikes: 8200,
    avgComments: 245,
    category: "Technology",
    isVerified: true,
    contentQuality: 8.7,
    unlockedDate: "2024-01-15",
    lastAnalyzed: "2 hours ago",
    trends: {
      followers: 2.1,
      engagement: -0.3,
      likes: 5.2
    },
    recentPosts: 8
  },
  {
    id: "2",
    username: "fashionista_sarah",
    fullName: "Sarah Johnson",
    profilePic: "/avatars/creator1.jpg",
    followers: 245000,
    engagementRate: 4.2,
    avgLikes: 10300,
    avgComments: 156,
    category: "Fashion",
    isVerified: true,
    contentQuality: 9.1,
    unlockedDate: "2024-01-10",
    lastAnalyzed: "4 hours ago",
    trends: {
      followers: 3.2,
      engagement: 0.8,
      likes: 7.1
    },
    recentPosts: 12
  }
]

export default function CreatorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCreator, setSelectedCreator] = useState<UnlockedCreator | null>(null)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-red-500" />
    return <div className="h-3 w-3" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600"
    if (trend < 0) return "text-red-600"
    return "text-muted-foreground"
  }

  const filteredCreators = unlockedCreators.filter(creator =>
    creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalFollowers = unlockedCreators.reduce((sum, creator) => sum + creator.followers, 0)
  const avgEngagement = unlockedCreators.reduce((sum, creator) => sum + creator.engagementRate, 0) / unlockedCreators.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Creators</h1>
          <p className="text-muted-foreground">Manage and analyze your unlocked creators</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Creator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Creator Manually</DialogTitle>
                <DialogDescription>
                  Enter an Instagram username to add to your creators list
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Enter Instagram username..." />
                <Button className="w-full">Add Creator</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Creators"
          value={unlockedCreators.length.toString()}
          change={12}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Reach"
          value={formatNumber(totalFollowers)}
          change={8.2}
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Engagement"
          value={`${avgEngagement.toFixed(1)}%`}
          change={-1.2}
          icon={<Heart className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Active Campaigns"
          value="3"
          change={50}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Creators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Creators List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCreators.map((creator) => (
          <Card key={creator.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={creator.profilePic} alt={creator.username} />
                    <AvatarFallback>
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{creator.fullName}</h3>
                      {creator.isVerified && (
                        <Badge variant="secondary" className="px-1 py-0">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">@{creator.username}</p>
                    <Badge variant="outline" className="mt-1">{creator.category}</Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedCreator(creator)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Full Analytics
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Followers</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(creator.trends.followers)}
                      <span className={getTrendColor(creator.trends.followers)}>
                        {creator.trends.followers > 0 ? '+' : ''}{creator.trends.followers}%
                      </span>
                    </div>
                  </div>
                  <p className="font-semibold">{formatNumber(creator.followers)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Engagement</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(creator.trends.engagement)}
                      <span className={getTrendColor(creator.trends.engagement)}>
                        {creator.trends.engagement > 0 ? '+' : ''}{creator.trends.engagement}%
                      </span>
                    </div>
                  </div>
                  <p className="font-semibold">{creator.engagementRate}%</p>
                </div>
              </div>

              {/* Content Quality */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Content Quality</span>
                  <span className="font-medium">{creator.contentQuality}/10</span>
                </div>
                <Progress value={creator.contentQuality * 10} className="h-2" />
              </div>

              {/* Recent Activity */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Recent Posts</span>
                  <span className="font-medium">{creator.recentPosts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Analyzed</span>
                  <span className="font-medium">{creator.lastAnalyzed}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={() => setSelectedCreator(creator)}>
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analytics
                </Button>
                <Button size="sm" variant="outline">
                  <Calendar className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Creator Detail Modal */}
      <Dialog open={!!selectedCreator} onOpenChange={() => setSelectedCreator(null)}>
        <DialogContent className="max-w-4xl">
          {selectedCreator && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedCreator.profilePic} alt={selectedCreator.username} />
                    <AvatarFallback>
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedCreator.fullName}
                      {selectedCreator.isVerified && (
                        <Badge variant="secondary" className="px-1 py-0">✓</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{selectedCreator.username}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="posts">Recent Posts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      title="Followers"
                      value={formatNumber(selectedCreator.followers)}
                      change={selectedCreator.trends.followers}
                      icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    />
                    <MetricCard
                      title="Engagement Rate"
                      value={`${selectedCreator.engagementRate}%`}
                      change={selectedCreator.trends.engagement}
                      icon={<Heart className="h-4 w-4 text-muted-foreground" />}
                    />
                    <MetricCard
                      title="Avg Likes"
                      value={formatNumber(selectedCreator.avgLikes)}
                      change={selectedCreator.trends.likes}
                      icon={<Heart className="h-4 w-4 text-muted-foreground" />}
                    />
                    <MetricCard
                      title="Avg Comments"
                      value={formatNumber(selectedCreator.avgComments)}
                      change={2.1}
                      icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="analytics">
                  <Card>
                    <CardContent className="text-center py-8">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Detailed Analytics</h3>
                      <p className="text-muted-foreground">Advanced analytics coming soon</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="posts">
                  <Card>
                    <CardContent className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Recent Posts</h3>
                      <p className="text-muted-foreground">Post analytics coming soon</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {filteredCreators.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No creators found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Start by discovering and unlocking creators'}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Discover Creators
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}