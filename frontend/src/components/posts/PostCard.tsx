'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InstagramPostCDN } from '@/services/instagramCdnApi'
import { formatNumber } from '@/lib/utils'
// TEMP: Commented out problematic import
import { Heart, MessageCircle, Eye, MapPin, ExternalLink, Brain, Sparkles, Languages, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { SentimentBadge, LanguageBadge } from '@/components/ui/ai-insights'

interface PostCardProps {
  post: InstagramPostCDN
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
    window.open(`https://www.instagram.com/p/${post.id}/`, '_blank')
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Main Media */}
        <div className="relative aspect-square bg-gray-100">
          {post.media_type === 'video' ? (
            <div className="relative w-full h-full">
              {/* Video poster using CDN thumbnail */}
              <PostThumbnail
                post={post}
                size="large"
                className="w-full h-full object-cover"
                alt={post.caption?.substring(0, 100) || `Post ${post.id}`}
              />
              <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                Video
              </Badge>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <PostThumbnail
                post={post}
                size="large"
                className="w-full h-full object-cover"
                alt={post.caption?.substring(0, 100) || `Post ${post.id}`}
              />
              {post.media_type === 'carousel' && (
                <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                  Carousel
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

        {/* Media Type and AI Analysis Section */}
        <div className="mt-3 space-y-2">
          {/* Basic Media Type */}
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {post.media_type === 'GraphImage' && 'Image'}
              {post.media_type === 'GraphVideo' && 'Video'}
              {post.media_type === 'GraphSidecar' && 'Carousel'}
            </Badge>
          </div>

          {/* AI Analysis Results */}
          {(post.ai_analysis?.has_ai_analysis || post.ai_content_category) && (
            <div className="p-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border">
              <div className="flex items-center gap-1 mb-2">
                <Brain className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  AI Analysis
                </span>
                {(post.ai_analysis?.ai_processing_status === 'completed' || post.ai_content_category) && (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                )}
              </div>
              
              <div className="flex flex-wrap gap-1">
                {/* AI Content Category */}
                {(post.ai_analysis?.ai_content_category || post.ai_content_category) && (
                  <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    <Sparkles className="w-2 h-2 mr-1" />
                    {post.ai_analysis?.ai_content_category || post.ai_content_category}
                  </Badge>
                )}
                
                {/* AI Sentiment */}
                <SentimentBadge
                  sentimentScore={post.ai_analysis?.ai_sentiment_score || post.ai_sentiment_score}
                />
                
                {/* AI Language */}
                <LanguageBadge
                  languageCode={post.ai_analysis?.ai_language_code || post.ai_language_code}
                />
                
                {/* Analysis Date */}
                {(post.ai_analysis?.ai_analyzed_at || post.ai_analyzed_at) && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-2 h-2 mr-1" />
                    {new Date(post.ai_analysis?.ai_analyzed_at || post.ai_analyzed_at).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* AI Processing Status */}
          {(post.ai_analysis?.ai_processing_status === 'pending' || post.ai_analysis_status === 'pending') && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="font-medium">AI analysis in progress...</span>
              </div>
            </div>
          )}

          {/* No AI Analysis Available */}
          {!(post.ai_analysis?.has_ai_analysis || post.ai_content_category) && 
           !(post.ai_analysis?.ai_processing_status === 'pending' || post.ai_analysis_status === 'pending') && (
            <div className="p-2 bg-gray-50 dark:bg-gray-950/30 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Brain className="w-3 h-3 opacity-50" />
                <span>AI analysis not available for this post</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}