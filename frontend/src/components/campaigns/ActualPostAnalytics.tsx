"use client"

import {
  Heart,
  MessageCircle,
  Eye,
  Calendar,
  ExternalLink,
  MapPin,
  Hash,
  AtSign,
  Image as ImageIcon,
  Video,
  Copy,
  User,
  Music,
  Clock,
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

interface ActualPostAnalyticsProps {
  post: {
    url: string
    analytics?: PostAnalysisData
  }
  index: number
}

export function ActualPostAnalytics({ post, index }: ActualPostAnalyticsProps) {
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

            {/* Image Section - CDN Optimized Display */}
            <div className="space-y-4">
              {(() => {
                // 🔑 UPDATED: CDN URL now available at TOP LEVEL (data.cdn_thumbnail_url)
                // URL Format: https://cdn.following.ae/posts/{shortcode}/thumbnail.webp

                // ✅ Method 1: Top-Level Access (Recommended)
                const topLevelCdnUrl = analytics.cdn_thumbnail_url

                // ✅ Method 2: Nested Access (Fallback)
                const nestedCdnUrl = analytics.media?.cdn_thumbnail_url

                // ✅ Original Instagram URLs (Final Fallback)
                const originalUrl = analytics.media?.display_url || analytics.raw_data?.displayUrl

                // Smart fallback chain: Top-level CDN → Nested CDN → Original
                const imageUrl = topLevelCdnUrl || nestedCdnUrl || originalUrl
                const isCdnOptimized = !!(topLevelCdnUrl || nestedCdnUrl)


                if (!imageUrl) {
                  console.warn('⚠️ NO IMAGE URL FOUND in analytics data')
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">❌ No image URL found in post data</p>
                    </div>
                  )
                }

                return (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Post thumbnail"
                      className="w-full rounded-lg border shadow-sm"
                      loading="lazy"
                      onError={(e) => {
                        // Smart fallback: CDN → Original
                        if (isCdnOptimized && originalUrl && imageUrl !== originalUrl) {
                          ;(e.target as HTMLImageElement).src = originalUrl
                        }
                      }}
                    />

                    {/* CDN Status Badge */}
                    {isCdnOptimized && (
                      <Badge variant="secondary" className="absolute top-2 right-2 bg-green-100 text-green-800 border-green-200">
                        <Zap className="h-3 w-3 mr-1" />
                        CDN Optimized
                      </Badge>
                    )}

                    {/* Original Quality Badge */}
                    {!isCdnOptimized && imageUrl && (
                      <Badge variant="outline" className="absolute top-2 right-2 bg-orange-50 text-orange-600 border-orange-200">
                        Original Quality
                      </Badge>
                    )}

                    {/* Media Type Badge */}
                    {(analytics.media?.type || analytics.media_type) && (
                      <Badge variant="outline" className="absolute top-2 left-2">
                        {(analytics.media?.type || analytics.media_type) === "Video" && <Video className="h-3 w-3 mr-1" />}
                        {(analytics.media?.type || analytics.media_type) === "Image" && <ImageIcon className="h-3 w-3 mr-1" />}
                        {analytics.media?.type || analytics.media_type}
                      </Badge>
                    )}
                  </div>
                )
              })()}

              {/* CDN & Media Information */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Media Type</span>
                  <p className="font-medium">{analytics.media?.type || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CDN Status</span>
                  <div className="flex items-center gap-1">
                    {analytics.cdn_thumbnail_url ? (
                      <>
                        <Zap className="h-3 w-3 text-green-600" />
                        <span className="font-medium text-green-600">Primary CDN</span>
                      </>
                    ) : analytics.media?.cdn_thumbnail_url ? (
                      <>
                        <Zap className="h-3 w-3 text-blue-600" />
                        <span className="font-medium text-blue-600">Fallback CDN</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-orange-600">Original Only</span>
                      </>
                    )}
                  </div>
                </div>
                {analytics.media?.video_view_count > 0 && (
                  <div>
                    <span className="text-muted-foreground">Video Views</span>
                    <p className="font-medium">{formatNumber(analytics.media.video_view_count)}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Post ID</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-mono text-xs"
                    onClick={() => copyToClipboard(analytics.shortcode, 'Post ID')}
                  >
                    {analytics.shortcode}
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
                      <span className="text-2xl font-bold">{formatNumber(analytics.engagement?.likes_count || 0)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Likes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MessageCircle className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-2xl font-bold">{formatNumber(analytics.engagement?.comments_count || 0)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Comments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Eye className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-2xl font-bold">{formatNumber(analytics.engagement?.video_view_count || 0)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Video Views</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-2">
                      {formatNumber(analytics.engagement?.total_engagement || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Engagement</p>
                  </CardContent>
                </Card>

                {/* Engagement Rate */}
                {analytics.raw_data?.followerCount && analytics.engagement?.total_engagement && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {((analytics.engagement.total_engagement / analytics.raw_data.followerCount) * 100).toFixed(2)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Engagement Rate</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Posted Date */}
              {analytics.timestamps?.posted_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Posted: {new Date(analytics.timestamps.posted_at).toLocaleDateString()}</span>
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
                <AvatarImage src={analytics.raw_data?.ownerProfilePicUrl} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">{analytics.raw_data?.ownerFullName || 'Unknown'}</h4>
                </div>
                <p className="text-muted-foreground">@{analytics.raw_data?.ownerUsername || 'unknown'}</p>

                <div className="mt-2 space-y-1">
                  <div>
                    <span className="text-sm text-muted-foreground">Owner ID: </span>
                    <span className="text-sm font-mono">{analytics.raw_data?.ownerId}</span>
                  </div>
                  {analytics.raw_data?.followerCount && (
                    <div>
                      <span className="text-sm text-muted-foreground">Followers: </span>
                      <span className="text-sm font-medium">{formatNumber(analytics.raw_data.followerCount)}</span>
                    </div>
                  )}
                  {analytics.raw_data?.followingCount && (
                    <div>
                      <span className="text-sm text-muted-foreground">Following: </span>
                      <span className="text-sm font-medium">{formatNumber(analytics.raw_data.followingCount)}</span>
                    </div>
                  )}
                  {analytics.raw_data?.mediaCount && (
                    <div>
                      <span className="text-sm text-muted-foreground">Posts: </span>
                      <span className="text-sm font-medium">{formatNumber(analytics.raw_data.mediaCount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Content */}
          <div className="space-y-4">
            <h3 className="font-semibold">Content</h3>

            {analytics.content?.caption && (
              <div>
                <h4 className="text-sm font-medium mb-2">Caption</h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{analytics.content.caption}</p>
                </div>
              </div>
            )}

            {analytics.content?.hashtags && analytics.content.hashtags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Hashtags ({analytics.content.hashtags.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analytics.content.hashtags.map((hashtag, i) => (
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

            {analytics.content?.mentions && analytics.content.mentions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AtSign className="h-4 w-4" />
                  Mentions ({analytics.content.mentions.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analytics.content.mentions.map((mention, i) => (
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

            {/* Music Info */}
            {analytics.raw_data?.musicInfo && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Music
                </h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{analytics.raw_data.musicInfo.song_name}</p>
                  <p className="text-sm text-muted-foreground">by {analytics.raw_data.musicInfo.artist_name}</p>
                  {analytics.raw_data.musicInfo.uses_original_audio && (
                    <Badge variant="secondary" className="mt-1">Original Audio</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Video Duration */}
            {analytics.raw_data?.videoDuration && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Duration: {analytics.raw_data.videoDuration.toFixed(1)}s</span>
              </div>
            )}

            {/* Additional Media Info */}
            {analytics.raw_data?.accessibility_caption && (
              <div>
                <h4 className="text-sm font-medium mb-2">Accessibility Caption</h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{analytics.raw_data.accessibility_caption}</p>
                </div>
              </div>
            )}

            {/* Carousel Media */}
            {analytics.raw_data?.sidecar_media_ids && analytics.raw_data.sidecar_media_ids.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Carousel Items ({analytics.raw_data.sidecar_media_ids.length})
                </h4>
                <div className="text-sm text-muted-foreground">
                  Multiple media items in this post
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          {analytics.location?.name && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{analytics.location.name}</span>
                <span className="text-xs text-muted-foreground">({analytics.location.id})</span>
              </div>
            </>
          )}

          <Separator />

          {/* Technical Details */}
          <div>
            <h3 className="font-semibold mb-4">Analysis Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium">
                  {analytics.timestamps?.created_at ? new Date(analytics.timestamps.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Post ID</span>
                <p className="font-mono text-xs">{analytics.post_id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Profile ID</span>
                <p className="font-mono text-xs">{analytics.profile_id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Product Type</span>
                <p className="font-medium">{analytics.raw_data?.productType || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {analytics.ai_analysis && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-4">AI Analysis</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <p className="font-medium">{analytics.ai_analysis.content_category?.category || 'Not analyzed'}</p>
                    {analytics.ai_analysis.content_category?.confidence && (
                      <p className="text-xs text-muted-foreground">
                        Confidence: {(analytics.ai_analysis.content_category.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sentiment</span>
                    <p className="font-medium">{analytics.ai_analysis.sentiment?.label || 'Not analyzed'}</p>
                    {analytics.ai_analysis.sentiment?.score && (
                      <p className="text-xs text-muted-foreground">
                        Score: {analytics.ai_analysis.sentiment.score.toFixed(3)}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Language</span>
                    <p className="font-medium">{analytics.ai_analysis.language?.code || 'Not detected'}</p>
                    {analytics.ai_analysis.language?.confidence && (
                      <p className="text-xs text-muted-foreground">
                        Confidence: {(analytics.ai_analysis.language.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version</span>
                    <p className="font-medium">{analytics.ai_analysis.version}</p>
                  </div>
                </div>

                {/* AI Insights */}
                {analytics.ai_analysis.insights && analytics.ai_analysis.insights.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">AI Insights</h4>
                    <div className="space-y-2">
                      {analytics.ai_analysis.insights.map((insight, i) => (
                        <div key={i} className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Topics */}
                {analytics.ai_analysis.topics && analytics.ai_analysis.topics.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Content Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {analytics.ai_analysis.topics.map((topic, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </CardContent>
      </Card>

    </div>
  )
}