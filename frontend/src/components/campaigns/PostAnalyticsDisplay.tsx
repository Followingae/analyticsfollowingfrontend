"use client"

import {
  Heart,
  MessageCircle,
  Eye,
  Play,
  Calendar,
  ExternalLink,
  MapPin,
  Music,
  Hash,
  AtSign,
  Clock,
  Video,
  Image,
  Zap,
  CheckCircle,
  Star,
  Copy,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PostAnalysisData, postAnalyticsApi } from "@/services/postAnalyticsApi"

interface PostAnalyticsDisplayProps {
  post: {
    url: string
    analytics?: PostAnalysisData
  }
  index: number
}

export function PostAnalyticsDisplay({ post, index }: PostAnalyticsDisplayProps) {
  if (!post.analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post {index + 1}</CardTitle>
          <CardDescription className="break-all">{post.url}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              <p className="text-sm text-muted-foreground">Analyzing post...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const analytics = post.analytics

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Post {index + 1}</CardTitle>
              <Badge variant="outline">
                {postAnalyticsApi.getMediaTypeIcon(analytics.post_type)} {analytics.post_type}
              </Badge>
              {analytics.sentiment && (
                <Badge className={postAnalyticsApi.getSentimentColor(analytics.sentiment)}>
                  {analytics.sentiment}
                </Badge>
              )}
              {analytics.is_sponsored && (
                <Badge variant="secondary">
                  <Zap className="h-3 w-3 mr-1" />
                  Sponsored
                </Badge>
              )}
            </div>
            <CardDescription className="break-all text-xs">{post.url}</CardDescription>
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

      <CardContent>
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="creator">Creator</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Heart className="h-4 w-4 text-red-500 mr-1" />
                  <span className="font-semibold">{postAnalyticsApi.formatEngagement(analytics.likes_count || analytics.raw_apify_data?.likesCount)}</span>
                </div>
                <div className="text-xs text-muted-foreground">Likes</div>
              </div>

              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <MessageCircle className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="font-semibold">{postAnalyticsApi.formatEngagement(analytics.comments_count || analytics.raw_apify_data?.commentsCount)}</span>
                </div>
                <div className="text-xs text-muted-foreground">Comments</div>
              </div>

              {(analytics.video_views_count || analytics.raw_apify_data?.videoViewCount) && (
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Eye className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-semibold">{postAnalyticsApi.formatEngagement(analytics.video_views_count || analytics.raw_apify_data?.videoViewCount)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
              )}

              {(analytics.video_plays_count || analytics.raw_apify_data?.videoPlayCount) && (
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Play className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="font-semibold">{postAnalyticsApi.formatEngagement(analytics.video_plays_count || analytics.raw_apify_data?.videoPlayCount)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Plays</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Engagement Rate</span>
              <Badge variant="outline" className="text-lg">
                {analytics.engagement_rate?.toFixed(2) || '0.00'}%
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span>Posted: {new Date(analytics.created_at).toLocaleString()}</span>
              </div>
              {analytics.video_duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Duration: {analytics.video_duration}s</span>
                </div>
              )}
              {analytics.location_name && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>{analytics.location_name}</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {(analytics.caption || analytics.raw_apify_data?.caption) && (
              <div>
                <h4 className="font-medium mb-2">Caption</h4>
                <ScrollArea className="h-32 w-full rounded border p-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {analytics.caption || analytics.raw_apify_data?.caption}
                  </p>
                </ScrollArea>
              </div>
            )}

            {((analytics.hashtags && analytics.hashtags.length > 0) ||
              (analytics.raw_apify_data?.hashtags && analytics.raw_apify_data.hashtags.length > 0)) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4" />
                  <h4 className="font-medium">
                    Hashtags ({(analytics.hashtags || analytics.raw_apify_data?.hashtags || []).length})
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(analytics.hashtags || analytics.raw_apify_data?.hashtags || []).slice(0, 10).map((hashtag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      #{hashtag}
                    </Badge>
                  ))}
                  {(analytics.hashtags || analytics.raw_apify_data?.hashtags || []).length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{(analytics.hashtags || analytics.raw_apify_data?.hashtags || []).length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {((analytics.mentions && analytics.mentions.length > 0) ||
              (analytics.raw_apify_data?.mentions && analytics.raw_apify_data.mentions.length > 0)) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AtSign className="h-4 w-4" />
                  <h4 className="font-medium">
                    Mentions ({(analytics.mentions || analytics.raw_apify_data?.mentions || []).length})
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(analytics.mentions || analytics.raw_apify_data?.mentions || []).map((mention, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      @{mention}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analytics.music_info && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Music className="h-4 w-4" />
                  <h4 className="font-medium">Music</h4>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{analytics.music_info.song_name}</p>
                  <p className="text-sm text-muted-foreground">by {analytics.music_info.artist_name}</p>
                  {analytics.music_info.uses_original_audio && (
                    <Badge variant="secondary" className="mt-1">Original Audio</Badge>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="creator" className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={analytics.creator_profile_pic || analytics.raw_apify_data?.ownerUsername} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">
                    {analytics.creator_full_name || analytics.raw_apify_data?.ownerFullName || 'Unknown Creator'}
                  </h4>
                  {analytics.creator_is_verified && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{analytics.creator_username || analytics.raw_apify_data?.ownerUsername || 'unknown'}
                </p>
                {analytics.creator_follower_count && (
                  <p className="text-xs text-muted-foreground">
                    {postAnalyticsApi.formatEngagement(analytics.creator_follower_count)} followers
                  </p>
                )}
              </div>
            </div>

            {((analytics.tagged_users && analytics.tagged_users.length > 0) ||
              (analytics.raw_apify_data?.taggedUsers && analytics.raw_apify_data.taggedUsers.length > 0)) && (
              <div>
                <h4 className="font-medium mb-2">
                  Tagged Users ({(analytics.tagged_users || analytics.raw_apify_data?.taggedUsers || []).length})
                </h4>
                <div className="space-y-2">
                  {(analytics.tagged_users || analytics.raw_apify_data?.taggedUsers || []).map((user, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.profile_pic_url} />
                        <AvatarFallback className="text-xs">
                          {(user.username || user.full_name || 'U')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.full_name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">@{user.username || 'unknown'}</span>
                      {user.is_verified && (
                        <CheckCircle className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Media Type:</span>
                <p className="text-muted-foreground">{analytics.post_type || 'Unknown'}</p>
              </div>
              <div>
                <span className="font-medium">Media Count:</span>
                <p className="text-muted-foreground">{analytics.media_count || 1}</p>
              </div>
              {analytics.raw_apify_data?.dimensionsWidth && analytics.raw_apify_data?.dimensionsHeight && (
                <div>
                  <span className="font-medium">Dimensions:</span>
                  <p className="text-muted-foreground">
                    {analytics.raw_apify_data.dimensionsWidth} × {analytics.raw_apify_data.dimensionsHeight}
                  </p>
                </div>
              )}
              {(analytics.video_duration || analytics.raw_apify_data?.videoDuration) && (
                <div>
                  <span className="font-medium">Duration:</span>
                  <p className="text-muted-foreground">
                    {analytics.video_duration || analytics.raw_apify_data?.videoDuration} seconds
                  </p>
                </div>
              )}
            </div>

            {(analytics.display_url || analytics.raw_apify_data?.displayUrl) && (
              <div>
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="relative w-full max-w-sm mx-auto">
                  <img
                    src={analytics.display_url || analytics.raw_apify_data?.displayUrl}
                    alt="Post preview"
                    className="w-full rounded-lg border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {((analytics.media_urls && analytics.media_urls.length > 1) ||
              (analytics.raw_apify_data?.images && analytics.raw_apify_data.images.length > 0)) && (
              <div>
                <h4 className="font-medium mb-2">All Media URLs</h4>
                <div className="space-y-1">
                  {(analytics.media_urls || analytics.raw_apify_data?.images || []).map((url, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Image className="h-3 w-3" />
                      <span className="truncate">{url}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="raw" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Raw Apify Data</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(analytics.raw_apify_data, null, 2))
                  // You could add a toast here
                }}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy JSON
              </Button>
            </div>
            <ScrollArea className="h-96 w-full rounded border">
              <pre className="p-4 text-xs">
                {JSON.stringify(analytics.raw_apify_data, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}