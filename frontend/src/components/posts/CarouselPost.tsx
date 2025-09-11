'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InstagramPost } from '@/services/instagramApi'
import { formatNumber } from '@/lib/utils'
import { InstagramImage } from '@/components/ui/instagram-image'
import { proxyInstagramUrl } from '@/lib/image-proxy'
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  MessageCircle, 
  Eye, 
  MapPin, 
  ExternalLink,
  Play
} from 'lucide-react'

interface CarouselPostProps {
  post: InstagramPost
  className?: string
}

export default function CarouselPost({ post, className = '' }: CarouselPostProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!post.is_carousel || !post.images || post.images.length <= 1) {
    // Fall back to single image/video display
    return <SinglePostView post={post} className={className} />
  }

  const nextImage = () => {
    setCurrentIndex((prev) => 
      prev === post.images!.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? post.images!.length - 1 : prev - 1
    )
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

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

  const currentImage = post.images[currentIndex]

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative">
        {/* Carousel Container */}
        <div className="relative aspect-square bg-gray-100">
          <div className="relative w-full h-full">
            {currentImage?.is_video ? (
              <div className="relative w-full h-full">
                <video
                  controls
                  poster={proxyInstagramUrl(currentImage.proxied_url)}
                  className="w-full h-full object-cover"
                >
                  <source src={currentImage.proxied_url} type="video/mp4" />
                </video>
                <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                  <Play className="w-3 h-3 mr-1" />
                  Video
                </Badge>
              </div>
            ) : (
              <InstagramImage
                src={currentImage?.proxied_url || currentImage?.url}
                alt={`${post.shortcode} - Image ${currentIndex + 1}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Navigation Arrows */}
          {post.images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 h-auto"
                onClick={prevImage}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 h-auto"
                onClick={nextImage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1 bg-black/50 rounded-full px-3 py-2">
              {post.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-background' : 'bg-background/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* External Link Button */}
          <button
            onClick={openInstagramPost}
            className="absolute top-2 left-2 p-2 bg-black/70 rounded-full text-white hover:bg-black/80 transition-colors"
            title="View on Instagram"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Carousel Badge */}
          <Badge className="absolute top-2 right-2 bg-blue-600 text-white">
            📸 {currentIndex + 1}/{post.carousel_media_count}
          </Badge>
        </div>

        {/* Thumbnail Strip */}
        {post.images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {post.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                    index === currentIndex 
                      ? 'border-white scale-110' 
                      : 'border-white/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={image.proxied_url || image.url}
                    alt={`Thumbnail ${index + 1}`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Engagement Metrics */}
        <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
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
            {post.hashtags.slice(0, 5).map((hashtag) => (
              <Badge key={hashtag} variant="secondary" className="text-xs">
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
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {post.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{post.location.name}</span>
            </div>
          )}
          <span>{formatDate(post.posted_at)}</span>
        </div>

        {/* Media Type and Carousel Info */}
        <div className="mt-2 flex gap-2">
          <Badge variant="outline" className="text-xs">
            📱 Carousel
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {post.carousel_media_count} items
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// Single post component for non-carousel posts
function SinglePostView({ post, className }: CarouselPostProps) {
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
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative">
        <div className="relative aspect-square bg-gray-100">
          {post.is_video ? (
            <div className="relative w-full h-full">
              <video
                controls
                poster={proxyInstagramUrl(post.cdn_url_512 || post.display_url)}
                className="w-full h-full object-cover"
              >
                <source src={post.video_url} type="video/mp4" />
              </video>
              <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                <Play className="w-3 h-3 mr-1" />
                Video
              </Badge>
            </div>
          ) : (
            <InstagramImage
              src={post.cdn_url_512 || post.display_url}
              alt={post.caption?.substring(0, 100) || `Post by ${post.shortcode}`}
              className="w-full h-full object-cover"
            />
          )}

          <button
            onClick={openInstagramPost}
            className="absolute top-2 left-2 p-2 bg-black/70 rounded-full text-white hover:bg-black/80 transition-colors"
            title="View on Instagram"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Same content as carousel version */}
        <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
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

        {post.caption && (
          <p className="text-sm text-gray-800 mb-3 line-clamp-3">
            {post.caption}
          </p>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.hashtags.slice(0, 5).map((hashtag) => (
              <Badge key={hashtag} variant="secondary" className="text-xs">
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

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {post.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{post.location.name}</span>
            </div>
          )}
          <span>{formatDate(post.posted_at)}</span>
        </div>

        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            {post.media_type === 'GraphImage' && '📸 Image'}
            {post.media_type === 'GraphVideo' && '🎥 Video'}
            {post.media_type === 'GraphSidecar' && '📱 Carousel'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}