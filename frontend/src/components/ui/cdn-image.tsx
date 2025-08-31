"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useOptimalImageUrl, useCDNProcessingStatus } from "@/hooks/useCDNMedia"
import { cdnMediaService } from "@/services/cdnMediaApi"

interface CDNImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  cdnUrl?: string | null
  fallbackUrl?: string | null
  size?: 'small' | 'large'
  showProcessing?: boolean
  username?: string
}

/**
 * CDN-optimized image component that handles the migration from Instagram URLs
 */
export function CDNImage({
  cdnUrl,
  fallbackUrl,
  size = 'large',
  showProcessing = false,
  username,
  className,
  alt,
  ...props
}: CDNImageProps) {
  const optimalUrl = useOptimalImageUrl(cdnUrl, fallbackUrl, size)
  const [hasError, setHasError] = React.useState(false)
  
  // Get processing status if username is provided
  const processingStatus = useCDNProcessingStatus(username || '')

  const handleError = React.useCallback(() => {
    setHasError(true)
  }, [])

  const handleLoad = React.useCallback(() => {
    setHasError(false)
  }, [])

  // If image failed and we have a fallback, use placeholder
  const finalUrl = hasError 
    ? (size === 'large' 
        ? cdnMediaService.getPlaceholderUrls().avatar.large 
        : cdnMediaService.getPlaceholderUrls().avatar.small)
    : optimalUrl

  return (
    <div className="relative">
      <img
        src={finalUrl}
        alt={alt}
        className={cn("object-cover", className)}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
      
      {/* Processing overlay */}
      {showProcessing && processingStatus.isProcessing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-[inherit]">
          <div className="text-center text-white text-xs">
            <div className="mb-1">Processing...</div>
            <div className="w-16 bg-white/20 rounded-full h-1">
              <div 
                className="bg-white h-1 rounded-full transition-all duration-300"
                style={{ width: `${processingStatus.completionPercentage}%` }}
              />
            </div>
            <div className="mt-1">{Math.round(processingStatus.completionPercentage)}%</div>
          </div>
        </div>
      )}
      
      {/* CDN indicator (dev mode) */}
      {process.env.NODE_ENV === 'development' && cdnUrl && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">
          CDN
        </div>
      )}
    </div>
  )
}

/**
 * Profile avatar component using CDN system
 */
interface ProfileAvatarProps {
  profile: {
    id?: string
    full_name?: string
    username?: string
    profile_pic_url?: string
    profile_pic_url_hd?: string
  }
  cdnMedia?: {
    avatar: {
      small: string
      large: string
      available: boolean
    }
  }
  size?: 'small' | 'large' | number
  showProcessing?: boolean
  className?: string
}

export function ProfileAvatar({ 
  profile, 
  cdnMedia, 
  size = 'large', 
  showProcessing = false,
  className 
}: ProfileAvatarProps) {
  const sizeClass = typeof size === 'number' 
    ? `w-${size} h-${size}` 
    : size === 'small' 
      ? 'w-8 h-8' 
      : 'w-12 h-12'
  
  const imageSize = typeof size === 'string' ? size : 'large'
  const cdnUrl = cdnMedia?.avatar?.available 
    ? (imageSize === 'large' ? cdnMedia.avatar.large : cdnMedia.avatar.small)
    : null
  
  const fallbackUrl = profile.profile_pic_url_hd || profile.profile_pic_url

  return (
    <div className={cn("relative rounded-full overflow-hidden", sizeClass, className)}>
      <CDNImage
        cdnUrl={cdnUrl}
        fallbackUrl={fallbackUrl}
        size={imageSize}
        showProcessing={showProcessing}
        username={profile.username}
        alt={profile.full_name || profile.username || 'Profile'}
        className="w-full h-full"
      />
    </div>
  )
}

/**
 * Post thumbnail component using CDN system
 */
interface PostThumbnailProps {
  post: {
    id?: string
    mediaId?: string
    thumbnail_url?: string
  }
  cdnPost?: {
    thumbnail: string
    fullSize: string
    available: boolean
  }
  size?: 'small' | 'large'
  className?: string
  alt?: string
}

export function PostThumbnail({ 
  post, 
  cdnPost, 
  size = 'small',
  className,
  alt = 'Post'
}: PostThumbnailProps) {
  const cdnUrl = cdnPost?.available 
    ? (size === 'large' ? cdnPost.fullSize : cdnPost.thumbnail)
    : null

  return (
    <CDNImage
      cdnUrl={cdnUrl}
      fallbackUrl={post.thumbnail_url}
      size={size}
      alt={alt}
      className={cn("rounded-lg", className)}
    />
  )
}