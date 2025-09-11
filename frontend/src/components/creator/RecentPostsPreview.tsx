import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Clock } from "lucide-react"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import type { RecentPostPreview } from "@/types/creatorTypes"

interface RecentPostsPreviewProps {
  recentPosts: RecentPostPreview[]
  username: string
}

export function RecentPostsPreview({ recentPosts, username }: RecentPostsPreviewProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return 'Now'
      if (diffInHours < 24) return `${diffInHours}h`
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `${diffInDays}d`
      const diffInWeeks = Math.floor(diffInDays / 7)
      return `${diffInWeeks}w`
    } catch {
      return 'Recently'
    }
  }

  if (!recentPosts.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            No recent posts available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Recent Posts
          <Badge variant="secondary" className="text-xs">
            {recentPosts.length} posts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {recentPosts.map((post) => (
            <div 
              key={post.post_id} 
              className="group cursor-pointer rounded-lg overflow-hidden border hover:border-primary/50 transition-colors"
            >
              {/* Post Thumbnail */}
              <div className="aspect-square relative overflow-hidden bg-muted">
                <img
                  src={post.cdn_url_512 || post.thumbnail_url}
                  alt={`Post by ${username}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    
                    // If CDN URL fails, try original thumbnail
                    if (post.cdn_url_512 && target.src === post.cdn_url_512 && !target.dataset.triedOriginal) {
                      target.dataset.triedOriginal = 'true'
                      target.src = post.thumbnail_url
                      return
                    }
                    
                    // Final fallback to placeholder
                    target.src = `https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=${username}`
                  }}
                />
                
                {/* Engagement Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-4 text-white text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{formatNumber(post.likes_count)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{formatNumber(post.comments_count)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Post Info */}
              <div className="p-2 space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(post.posted_at)}
                </div>
                
                {post.caption_preview && (
                  <p className="text-xs text-foreground line-clamp-2 leading-tight">
                    {post.caption_preview}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {formatNumber(post.likes_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {formatNumber(post.comments_count)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {recentPosts.length >= 6 && (
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs text-center text-muted-foreground">
              Showing recent {recentPosts.length} posts • More available in detailed view
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}