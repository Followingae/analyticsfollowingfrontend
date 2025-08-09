'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InstagramPost } from '@/services/instagramApi'
import { formatNumber } from '@/lib/utils'
import { InstagramImage } from '@/components/ui/instagram-image'
import { proxyInstagramUrlCached } from '@/lib/image-cache'
import { Heart, MessageCircle, Eye, MapPin, ExternalLink } from 'lucide-react'

interface PostCardProps {
  post: InstagramPost
}

export default function PostCard({ post }: PostCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const openInstagramPost = () => {
    window.open(`https://www.instagram.com/p/${post.shortcode}/`, '_blank')
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Main Media */}
        <div className="relative aspect-square bg-gray-100">
          {post.is_video ? (
            <div className="relative w-full h-full">
              <video
                controls
                poster={proxyInstagramUrlCached(post.images?.[0]?.proxied_url || post.display_url)}
                className="w-full h-full object-cover"
              >
                <source src={post.video_url} type="video/mp4" />
              </video>
              <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                Video
              </Badge>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <InstagramImage
                src={post.images?.[0]?.proxied_url || post.display_url}
                alt={post.caption?.substring(0, 100) || `Post by ${post.shortcode}`}
                className="w-full h-full object-cover"
              />
              {post.is_carousel && (
                <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                  📸 {post.carousel_media_count}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Carousel Navigation */}
        {post.is_carousel && post.images && post.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1 bg-black/50 rounded-full px-2 py-1">
              {post.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* External Link Button */}
        <button
          onClick={openInstagramPost}
          className="absolute top-2 left-2 p-2 bg-black/70 rounded-full text-white hover:bg-black/80 transition-colors"
          title="View on Instagram"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      <CardContent className="p-4">
        {/* Engagement Metrics */}
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{formatNumber(post.likes_count)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{formatNumber(post.comments_count)}</span>
          </div>
          {post.video_view_count && (
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{formatNumber(post.video_view_count)}</span>
            </div>
          )}
          <Badge variant="outline" className="ml-auto">
            {post.engagement_rate}% engagement
          </Badge>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-800 mb-3 line-clamp-3">
            {post.caption}
          </p>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.hashtags.slice(0, 5).map((hashtag, index) => (
              <Badge key={`${hashtag}-${index}`} variant="secondary" className="text-xs">
                {hashtag}
              </Badge>
            ))}
            {post.hashtags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{post.hashtags.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Location and Date */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {post.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{post.location.name}</span>
            </div>
          )}
          <span>{formatDate(post.posted_at)}</span>
        </div>

        {/* Media Type and AI Badges */}
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {post.media_type === 'GraphImage' && '📸 Image'}
            {post.media_type === 'GraphVideo' && '🎥 Video'}
            {post.media_type === 'GraphSidecar' && '📱 Carousel'}
          </Badge>
          
          {/* AI Content Category - New Structure */}
          {(post.ai_analysis?.ai_content_category || post.ai_content_category) && (
            <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              🧠 {post.ai_analysis?.ai_content_category || post.ai_content_category}
            </Badge>
          )}
          
          {/* AI Sentiment - New Structure */}
          {(post.ai_analysis?.ai_sentiment || post.ai_sentiment) && (
            <Badge className={`text-xs ${
              (post.ai_analysis?.ai_sentiment || post.ai_sentiment) === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              (post.ai_analysis?.ai_sentiment || post.ai_sentiment) === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {(post.ai_analysis?.ai_sentiment || post.ai_sentiment) === 'positive' && '😊'}
              {(post.ai_analysis?.ai_sentiment || post.ai_sentiment) === 'negative' && '😔'}
              {(post.ai_analysis?.ai_sentiment || post.ai_sentiment) === 'neutral' && '😐'}
              {post.ai_analysis?.ai_sentiment || post.ai_sentiment}
            </Badge>
          )}
          
          {/* AI Language - New Structure */}
          {(post.ai_analysis?.ai_language || post.ai_language_code) && (
            <Badge variant="outline" className="text-xs">
              🌐 {(post.ai_analysis?.ai_language || post.ai_language_code)?.toUpperCase()}
            </Badge>
          )}
          
          {/* AI Processing Status for posts */}
          {post.ai_analysis?.ai_processing_status === 'pending' && (
            <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              ⏳ Analyzing...
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}