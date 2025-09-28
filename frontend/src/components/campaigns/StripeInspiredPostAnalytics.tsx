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
  Grid3X3,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
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
import { PostAnalysisData, postAnalyticsApi } from "@/services/postAnalyticsApi"
import { toast } from "sonner"

interface StripeInspiredPostAnalyticsProps {
  post: {
    url: string
    analytics?: PostAnalysisData
  }
  index: number
}

export function StripeInspiredPostAnalytics({ post, index }: StripeInspiredPostAnalyticsProps) {
  if (!post.analytics) {
    return (
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
                  <div className="h-8 w-8 rounded-full border-4 border-white border-t-transparent animate-spin" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full blur-xl animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Analyzing Instagram Post
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Our AI is processing the post data and generating comprehensive analytics. This usually takes 15-20 seconds.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const analytics = post.analytics
  const normalizedData = postAnalyticsApi.normalizePostData(analytics)
  const imageUrl = postAnalyticsApi.getOptimalImageUrl(analytics)

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copied to clipboard`)
  }

  const formatNumber = (num: number) => {
    if (num === -1) return "Hidden"
    return postAnalyticsApi.formatEngagement(num)
  }

  return (
    <div className="space-y-8">

        {/* Hero Section */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-2 gap-0">

              {/* Post Image Section */}
              <div className="relative p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="relative max-w-md mx-auto">
                  {imageUrl && (
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
                      <img
                        src={imageUrl}
                        alt="Instagram post"
                        className="relative w-full rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      {analytics.cdn_thumbnail_url && (
                        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
                          <Zap className="w-3 h-3 mr-1" />
                          CDN Optimized
                        </Badge>
                      )}
                      {normalizedData.carousel.isCarousel && (
                        <Badge className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                          <Grid3X3 className="w-3 h-3 mr-1" />
                          Carousel ({normalizedData.carousel.mediaCount})
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Post Type Badge */}
                <div className="absolute bottom-8 left-8">
                  <Badge className="bg-white/10 backdrop-blur-sm text-white border-white/20 text-lg px-4 py-2">
                    {normalizedData.media.type === "Video" && <Video className="w-4 h-4 mr-2" />}
                    {normalizedData.media.type === "Image" && <ImageIcon className="w-4 h-4 mr-2" />}
                    {normalizedData.media.type === "Carousel" && <Grid3X3 className="w-4 h-4 mr-2" />}
                    {normalizedData.media.type}
                  </Badge>
                </div>
              </div>

              {/* Key Metrics Section */}
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Post Analytics
                    </h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(post.url, '_blank')}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-slate-600 text-lg">
                    Comprehensive insights for your Instagram content
                  </p>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 border border-red-100/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 text-white">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700">Likes</p>
                        <p className="text-2xl font-bold text-red-900">{formatNumber(normalizedData.likes)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700">Comments</p>
                        <p className="text-2xl font-bold text-blue-900">{formatNumber(normalizedData.comments)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-700">Engagement</p>
                        <p className="text-2xl font-bold text-emerald-900">{normalizedData.engagementRate.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-700">Posted</p>
                        <p className="text-lg font-bold text-purple-900">
                          {new Date(normalizedData.postedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media Info */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-100/50">
                  <h3 className="font-semibold text-slate-900 mb-3">Media Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Dimensions</span>
                      <p className="font-mono font-medium">{normalizedData.media.width} × {normalizedData.media.height}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">CDN Status</span>
                      <p className="font-medium">
                        {analytics.cdn_thumbnail_url ? (
                          <span className="text-emerald-700">✅ Optimized</span>
                        ) : (
                          <span className="text-amber-700">⚠️ Original</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creator Profile Section */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Creator Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="w-20 h-20 ring-4 ring-white shadow-xl">
                  <AvatarImage src={normalizedData.creator.profilePicUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-600 text-white text-xl">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2">
                  <CheckCircle className="w-6 h-6 text-blue-500 bg-white rounded-full" />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{normalizedData.creator.fullName}</h3>
                  <p className="text-lg text-slate-600">@{normalizedData.creator.username}</p>
                  {normalizedData.creator.biography && (
                    <p className="text-slate-700 mt-2 leading-relaxed">{normalizedData.creator.biography}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="text-2xl font-bold text-blue-900">{formatNumber(normalizedData.creator.followersCount)}</div>
                    <div className="text-sm text-blue-700 font-medium">Followers</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50">
                    <div className="text-2xl font-bold text-purple-900">{formatNumber(normalizedData.creator.postsCount)}</div>
                    <div className="text-sm text-purple-700 font-medium">Posts</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50">
                    <div className="text-2xl font-bold text-emerald-900">{normalizedData.engagementRate.toFixed(1)}%</div>
                    <div className="text-sm text-emerald-700 font-medium">Avg. Engagement</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Analysis Section */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Caption & Content */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-slate-600" />
                Caption & Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {normalizedData.caption && (
                <div className="p-4 rounded-xl bg-slate-50 border">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {normalizedData.caption}
                  </p>
                </div>
              )}

              {normalizedData.hashtags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">
                      Hashtags ({normalizedData.hashtags.length})
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {normalizedData.hashtags.slice(0, 10).map((hashtag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => copyToClipboard(`#${hashtag}`, 'Hashtag')}
                      >
                        #{hashtag}
                      </Badge>
                    ))}
                    {normalizedData.hashtags.length > 10 && (
                      <Badge variant="outline">
                        +{normalizedData.hashtags.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {normalizedData.mentions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AtSign className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold text-slate-900">
                      Mentions ({normalizedData.mentions.length})
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {normalizedData.mentions.map((mention, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer hover:bg-purple-100 transition-colors"
                        onClick={() => copyToClipboard(`@${mention}`, 'Mention')}
                      >
                        @{mention}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-slate-600" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Location */}
              {normalizedData.location.name && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-900">Location</span>
                  </div>
                  <p className="text-red-800">{normalizedData.location.name}</p>
                </div>
              )}

              {/* Media Specs */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Media Specifications</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-slate-50">
                    <span className="text-slate-600">Type</span>
                    <p className="font-medium text-slate-900">{normalizedData.media.type}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <span className="text-slate-600">Resolution</span>
                    <p className="font-mono font-medium text-slate-900">
                      {normalizedData.media.width} × {normalizedData.media.height}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <span className="text-slate-600">CDN</span>
                    <p className="font-medium text-slate-900">
                      {analytics.cdn_thumbnail_url ? 'Optimized' : 'Original'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <span className="text-slate-600">Carousel</span>
                    <p className="font-medium text-slate-900">
                      {normalizedData.carousel.isCarousel ? `${normalizedData.carousel.mediaCount} items` : 'Single'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Analysis Metadata */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50">
                <h4 className="font-semibold text-indigo-900 mb-2">Analysis Metadata</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Source</span>
                    <span className="font-medium text-indigo-900">{analytics.analysis_source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Analyzed</span>
                    <span className="font-medium text-indigo-900">
                      {new Date(analytics.ai_analyzed_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Post ID</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-mono text-xs text-indigo-900 hover:text-indigo-700"
                      onClick={() => copyToClipboard(analytics.shortcode, 'Post ID')}
                    >
                      {analytics.shortcode}
                      <Copy className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Raw Data Debug Section */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-slate-600" />
                Raw API Response
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(JSON.stringify(analytics, null, 2), 'Raw data')}
                className="shadow-sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-slate-50 p-4 rounded-xl overflow-auto max-h-96 border">
              {JSON.stringify(analytics, null, 2)}
            </pre>
          </CardContent>
        </Card>

    </div>
  )
}