import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Calendar, Brain, TrendingUp, Languages, Smile, Meh, Frown } from "lucide-react"
import type { PostWithAI } from "@/types/creatorTypes"
import { CDNImage } from "@/components/ui/cdn-image"

interface CompletePostsGalleryProps {
  posts: PostWithAI[]
  username: string
  cdnPosts?: Array<{
    mediaId: string
    thumbnail: string
    fullSize: string
    available: boolean
  }>
}

export function CompletePostsGallery({ posts, username, cdnPosts }: CompletePostsGalleryProps) {
  const [selectedPost, setSelectedPost] = useState<PostWithAI | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="h-3 w-3 text-green-500" />
      case 'negative':
        return <Frown className="h-3 w-3 text-red-500" />
      default:
        return <Meh className="h-3 w-3 text-yellow-500" />
    }
  }

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'above_average':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'below_average':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
    }
  }

  if (!posts.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Complete Posts Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No posts available for analysis
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Complete Posts Analysis
          </div>
          <Badge variant="secondary" className="text-sm">
            {posts.length} posts analyzed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post, index) => (
            <div 
              key={post.post_id}
              className="group cursor-pointer rounded-lg overflow-hidden border hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
              onClick={() => {
                setSelectedPost(post)
                setShowDetails(true)
              }}
            >
              {/* Post Image */}
              <div className="aspect-square relative overflow-hidden bg-muted">
                <CDNImage
                  cdnUrl={cdnPosts?.[index]?.thumbnail}
                  fallbackUrl={post.media_url}
                  alt={`Post by ${username}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  size="small"
                />
                
                {/* Engagement Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white text-sm space-y-2 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{formatNumber(post.likes_count)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{formatNumber(post.comments_count)}</span>
                      </div>
                    </div>
                    <div className="text-xs opacity-80">Click for AI insights</div>
                  </div>
                </div>

                {/* Performance Badge */}
                <div className="absolute top-2 right-2">
                  <Badge className={`text-xs px-1.5 py-0.5 ${getPerformanceColor(post.engagement_performance)}`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {post.engagement_performance.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Post Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.posted_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    {getSentimentIcon(post.ai_sentiment)}
                    <span className="capitalize">{post.ai_sentiment}</span>
                  </div>
                </div>

                {/* AI Category */}
                <Badge variant="outline" className="text-xs w-full justify-center truncate">
                  {post.ai_content_category}
                </Badge>

                {/* Language */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Languages className="h-3 w-3" />
                  <span>{post.ai_language}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Post Details Modal/Expanded View */}
        {showDetails && selectedPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Post AI Analysis</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowDetails(false)
                      setSelectedPost(null)
                    }}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Post Image */}
                  <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden">
                    <img
                      src={selectedPost.media_url}
                      alt="Selected post"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Post Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-red-500">
                        <Heart className="h-5 w-5" />
                        <span className="text-lg font-semibold">{formatNumber(selectedPost.likes_count)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-blue-500">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-lg font-semibold">{formatNumber(selectedPost.comments_count)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Content Category</span>
                        <Badge className="mt-1 w-full justify-center">
                          {selectedPost.ai_content_category}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Language</span>
                        <Badge variant="outline" className="mt-1 w-full justify-center">
                          <Languages className="h-3 w-3 mr-1" />
                          {selectedPost.ai_language}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Sentiment</span>
                        <div className="flex items-center gap-2 mt-1">
                          {getSentimentIcon(selectedPost.ai_sentiment)}
                          <span className="text-sm capitalize">{selectedPost.ai_sentiment}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(selectedPost.ai_sentiment_score * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Performance</span>
                        <Badge className={`mt-1 w-full justify-center ${getPerformanceColor(selectedPost.engagement_performance)}`}>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {selectedPost.engagement_performance.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Caption */}
                  {selectedPost.caption && (
                    <div className="pt-4 border-t">
                      <span className="text-sm font-medium">Caption</span>
                      <p className="text-sm text-muted-foreground mt-1 max-h-32 overflow-y-auto">
                        {selectedPost.caption}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground text-center pt-2">
                    Posted on {formatDate(selectedPost.posted_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}