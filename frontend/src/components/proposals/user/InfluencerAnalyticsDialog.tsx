'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Instagram,
  MapPin,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  TrendingUp,
  Target,
  DollarSign,
  Globe,
  Clock,
  Award,
  BarChart3
} from 'lucide-react'

interface Influencer {
  id: string
  instagram_username: string
  followers_count: number
  engagement_rate: number
  avg_likes: number
  avg_comments: number
  profile_picture_url?: string
  location?: string
  gender_split?: {
    male: number
    female: number
  }
  age_groups?: {
    '18-24': number
    '25-34': number
    '35-44': number
    '45-54': number
    '55+': number
  }
  assigned_deliverables: Array<{
    type: string
    quantity: number
    description?: string
  }>
  estimated_reach?: number
  cost_per_post?: number
  recent_posts?: Array<{
    id: string
    image_url: string
    likes: number
    comments: number
    posted_at: string
  }>
  bio?: string
  categories?: string[]
  verified?: boolean
  business_account?: boolean
}

interface InfluencerAnalyticsDialogProps {
  influencer: Influencer | null
  isOpen: boolean
  onClose: () => void
  onSelect?: (influencerId: string) => void
  isSelected?: boolean
}

export function InfluencerAnalyticsDialog({
  influencer,
  isOpen,
  onClose,
  onSelect,
  isSelected = false
}: InfluencerAnalyticsDialogProps) {
  const [currentTab, setCurrentTab] = useState('overview')

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (!influencer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={influencer.profile_picture_url} />
                <AvatarFallback>
                  {influencer.instagram_username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">@{influencer.instagram_username}</span>
                  {influencer.verified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Award className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {formatNumber(influencer.followers_count)} followers
                  {influencer.location && (
                    <>
                      <span>•</span>
                      <MapPin className="h-4 w-4" />
                      {influencer.location}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onSelect && (
                <Button
                  onClick={() => onSelect(influencer.id)}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                >
                  {isSelected ? "Selected" : "Select"}
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Detailed analytics and performance metrics for this influencer
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="campaign">Campaign</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Followers</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatNumber(influencer.followers_count)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Engagement</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {influencer.engagement_rate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Avg. Likes</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatNumber(influencer.avg_likes)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Avg. Comments</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatNumber(influencer.avg_comments)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bio and Categories */}
            {(influencer.bio || influencer.categories) && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {influencer.bio && (
                    <div>
                      <label className="text-sm font-medium">Bio</label>
                      <p className="text-sm text-muted-foreground mt-1">{influencer.bio}</p>
                    </div>
                  )}

                  {influencer.categories && influencer.categories.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Categories</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {influencer.categories.map((category, index) => (
                          <Badge key={index} variant="outline">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Engagement Rate</span>
                      <span>{influencer.engagement_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(influencer.engagement_rate, 10)} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Industry average: 1-3%
                    </p>
                  </div>

                  {influencer.estimated_reach && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Estimated Reach per Post</span>
                        <span>{formatNumber(influencer.estimated_reach)}</span>
                      </div>
                      <Progress
                        value={(influencer.estimated_reach / influencer.followers_count) * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {((influencer.estimated_reach / influencer.followers_count) * 100).toFixed(1)}% of followers
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6 mt-6">
            {/* Gender Split */}
            {influencer.gender_split && (
              <Card>
                <CardHeader>
                  <CardTitle>Gender Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Male Audience</span>
                        <span>{influencer.gender_split.male.toFixed(0)}%</span>
                      </div>
                      <Progress value={influencer.gender_split.male} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Female Audience</span>
                        <span>{influencer.gender_split.female.toFixed(0)}%</span>
                      </div>
                      <Progress value={influencer.gender_split.female} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Age Groups */}
            {influencer.age_groups && (
              <Card>
                <CardHeader>
                  <CardTitle>Age Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(influencer.age_groups).map(([ageGroup, percentage]) => (
                      <div key={ageGroup}>
                        <div className="flex justify-between text-sm mb-2">
                          <span>{ageGroup} years</span>
                          <span>{percentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Location Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {influencer.location || 'Location not specified'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Primary audience location and time zone considerations
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6 mt-6">
            {/* Recent Posts */}
            {influencer.recent_posts && influencer.recent_posts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Posts Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {influencer.recent_posts.slice(0, 6).map((post) => (
                      <div key={post.id} className="space-y-2">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={post.image_url}
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {formatDate(post.posted_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {formatNumber(post.likes)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {formatNumber(post.comments)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(influencer.avg_likes)}
                    </div>
                    <p className="text-sm text-muted-foreground">Average Likes per Post</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(influencer.avg_comments)}
                    </div>
                    <p className="text-sm text-muted-foreground">Average Comments per Post</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Engagement quality score: High interaction rate indicates strong audience connection
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign Tab */}
          <TabsContent value="campaign" className="space-y-6 mt-6">
            {/* Assigned Deliverables */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Deliverables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {influencer.assigned_deliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">{deliverable.quantity}x {deliverable.type}</div>
                        {deliverable.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {deliverable.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {deliverable.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Campaign Projections */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {influencer.estimated_reach && (
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {formatNumber(influencer.estimated_reach)}
                      </div>
                      <p className="text-sm text-muted-foreground">Estimated Reach</p>
                    </div>
                  )}

                  {influencer.cost_per_post && (
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        ${influencer.cost_per_post.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Cost per Post</p>
                    </div>
                  )}
                </div>

                {influencer.estimated_reach && influencer.cost_per_post && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <div className="text-lg font-semibold">
                        ${(influencer.cost_per_post / (influencer.estimated_reach / 1000)).toFixed(2)} CPM
                      </div>
                      <p className="text-sm text-muted-foreground">Cost per 1,000 impressions</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Campaign Fit Score */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Fit Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Audience Alignment</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Content Quality</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Engagement Rate</span>
                      <span>95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <Separator />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">91%</div>
                    <p className="text-sm text-muted-foreground">Overall Campaign Fit Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}