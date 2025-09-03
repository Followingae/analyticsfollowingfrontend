"use client"

import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCDNMedia } from '@/hooks/useCDNMedia'

interface ProfileImageProps {
  profileId?: string
  originalUrl?: string | null
  alt: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  profileId,
  originalUrl,
  alt,
  className,
  size = 'md'
}) => {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Get CDN data if profileId is provided
  const cdnMedia = useCDNMedia(profileId)
  
  // Determine image source priority: CDN -> Original -> Placeholder
  const getImageSrc = (): string => {
    // Try CDN first (if available and not placeholder)
    if (cdnMedia.data?.avatar && !cdnMedia.data.avatar.placeholder) {
      return cdnMedia.data.avatar["256"] // Use 256px version for avatars
    }
    
    // Fallback to original URL if available and no error occurred
    if (originalUrl && !imageError) {
      return originalUrl
    }
    
    // Final fallback to placeholder
    return `https://via.placeholder.com/256x256/e2e8f0/6b7280?text=No+Image`
  }

  const handleError = () => {
    setIsLoading(false)
    setImageError(true)
  }

  const handleLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-20 w-20'
  }

  const isProcessing = cdnMedia.data?.processing_status?.queued && 
                     cdnMedia.data?.processing_status?.completion_percentage < 100

  return (
    <Avatar className={cn(sizeClasses[size], className, "relative")}>
      <AvatarImage
        src={getImageSrc()}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          "transition-opacity duration-200",
          isLoading ? "opacity-50" : "opacity-100"
        )}
      />
      
      <AvatarFallback className="bg-muted flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </AvatarFallback>
      
      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-background animate-pulse" />
      )}
    </Avatar>
  )
}