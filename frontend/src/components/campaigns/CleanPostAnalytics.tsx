"use client"

import {
  Heart,
  MessageCircle,
  Calendar,
  ExternalLink,
  MapPin,
  Hash,
  AtSign,
  Image as ImageIcon,
  Video,
  Grid3X3,
  Copy,
  User,
  CheckCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { PostAnalysisData, postAnalyticsApi } from "@/services/postAnalyticsApi"
import { toast } from "sonner"

interface CleanPostAnalyticsProps {
  post: {
    url: string
    analytics?: PostAnalysisData
  }
  index: number
}

export function CleanPostAnalytics({ post, index }: CleanPostAnalyticsProps) {
  if (!post.analytics) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground">Analyzing post...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const analytics = post.analytics

  // DEBUG: Log the actual data structure
  console.log('📊 POST ANALYTICS DATA:', JSON.stringify(analytics, null, 2))
  console.log('📊 POST ANALYTICS KEYS:', Object.keys(analytics))
  console.log('📊 SAMPLE VALUES:', {
    id: analytics.id,
    shortcode: analytics.shortcode,
    likes_count: analytics.likes_count,
    comments_count: analytics.comments_count,
    engagement_rate: analytics.engagement_rate,
    media_type: analytics.media_type,
    profile: analytics.profile,
    caption: analytics.caption,
    hashtags: analytics.hashtags,
    mentions: analytics.mentions
  })

  const formatNumber = (num: number) => {
    if (num === -1) return "Hidden"
    return postAnalyticsApi.formatEngagement(num)
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copied`)
  }

  return (
    <div className="space-y-6">
      {/* DEBUG: Show all available data */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">🐛 DEBUG: Available Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-yellow-100 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(analytics, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Main Post Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Post {index + 1}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 break-all">{post.url}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(post.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Post Image and Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Image Section */}
            <div className="space-y-4">
              {analytics.cdn_thumbnail_url && (
                <div className="relative">
                  <img
                    src={analytics.cdn_thumbnail_url}
                    alt="Post"
                    className="w-full rounded-lg border"
                  />
                  <Badge variant="secondary" className="absolute top-2 right-2">
                    CDN Optimized
                  </Badge>
                </div>
              )}

              {/* Media Type and Specs */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">{analytics.media_type || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dimensions</span>
                  <p className="font-medium">{analytics.width || 0} × {analytics.height || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Carousel</span>
                  <p className="font-medium">
                    {analytics.is_carousel ? `${analytics.carousel_media_count || 1} items` : 'Single'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Post ID</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-mono text-xs"
                    onClick={() => copyToClipboard(analytics.shortcode || analytics.id, 'Post ID')}
                  >
                    {analytics.shortcode || analytics.id || 'N/A'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="space-y-4">
              <h3 className="font-semibold">Engagement</h3>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Heart className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-2xl font-bold">{formatNumber(analytics.likes_count)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Likes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MessageCircle className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-2xl font-bold">{formatNumber(analytics.comments_count)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Comments</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {analytics.engagement_rate ? analytics.engagement_rate.toFixed(2) : '0.00'}%
                  </div>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                </CardContent>
              </Card>

              {/* Posted Date */}
              {analytics.posted_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Posted: {new Date(analytics.posted_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Creator Profile */}
          <div>
            <h3 className="font-semibold mb-4">Creator</h3>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={analytics.profile?.profile_pic_url} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">{analytics.profile?.full_name || 'Unknown'}</h4>
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-muted-foreground">@{analytics.profile?.username || 'unknown'}</p>

                {analytics.profile?.biography && (
                  <p className="text-sm mt-2 leading-relaxed">{analytics.profile.biography}</p>
                )}

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="font-bold">{formatNumber(analytics.profile?.followers_count || 0)}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{formatNumber(analytics.profile?.following_count || 0)}</div>
                    <div className="text-xs text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{formatNumber(analytics.profile?.posts_count || 0)}</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Content */}
          <div className="space-y-4">
            <h3 className="font-semibold">Content</h3>

            {analytics.caption && (
              <div>
                <h4 className="text-sm font-medium mb-2">Caption</h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{analytics.caption}</p>
                </div>
              </div>
            )}

            {analytics.hashtags && analytics.hashtags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Hashtags ({analytics.hashtags.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analytics.hashtags.map((hashtag, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => copyToClipboard(`#${hashtag}`, 'Hashtag')}
                    >
                      #{hashtag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analytics.mentions && analytics.mentions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AtSign className="h-4 w-4" />
                  Mentions ({analytics.mentions.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analytics.mentions.map((mention, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => copyToClipboard(`@${mention}`, 'Mention')}
                    >
                      @{mention}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location (if available) */}
          {analytics.location_name && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{analytics.location_name}</span>
              </div>
            </>
          )}

          <Separator />

          {/* Technical Details */}
          <div>
            <h3 className="font-semibold mb-4">Analysis Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Source</span>
                <p className="font-medium">{analytics.analysis_source || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Analyzed</span>
                <p className="font-medium">
                  {analytics.ai_analyzed_at ? new Date(analytics.ai_analyzed_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium">
                  {analytics.created_at ? new Date(analytics.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Instagram ID</span>
                <p className="font-mono text-xs">{analytics.instagram_post_id || 'N/A'}</p>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Raw Data (Collapsible) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Raw API Response</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(JSON.stringify(analytics, null, 2), 'Raw data')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(analytics, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}