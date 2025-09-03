"use client"

import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileImageWithFallbackProps {
  src?: string | null
  fallback?: string | null
  alt: string
  className?: string
  isPlaceholder?: boolean
}

export const ProfileImageWithFallback: React.FC<ProfileImageWithFallbackProps> = ({
  src,
  fallback,
  alt,
  className,
  isPlaceholder = false
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null)
  const [isLoading, setIsLoading] = useState(Boolean(src))
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Reset state when src changes
    setCurrentSrc(src || null)
    setIsLoading(Boolean(src))
    setHasError(false)
  }, [src])

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    
    // Try fallback if available and different from current src
    if (fallback && fallback !== currentSrc) {
      setCurrentSrc(fallback)
      setIsLoading(true)
      setHasError(false)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  return (
    <Avatar className={cn("relative", className)}>
      {currentSrc && !hasError && (
        <AvatarImage
          src={currentSrc}
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
          className={cn(
            "transition-opacity duration-200",
            isLoading ? "opacity-50" : "opacity-100"
          )}
        />
      )}
      
      <AvatarFallback className={cn(
        "bg-muted flex items-center justify-center",
        isPlaceholder && "bg-orange-50 text-orange-600"
      )}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </AvatarFallback>
      
      {isPlaceholder && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border-2 border-background" />
      )}
    </Avatar>
  )
}