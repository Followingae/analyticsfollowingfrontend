"use client"

import { useState } from "react"
import { Heart, MessageCircle, Eye, Video, Image as ImageIcon, MoreVertical, ExternalLink, Trash2, TrendingUp, Hash, Globe, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PostCardProps {
  post: {
    id: string
    thumbnail: string | null
    url: string
    type: "static" | "reel"
    caption: string
    views: number
    likes: number
    comments: number
    engagementRate: number
    ai_content_category: string | null
    ai_sentiment: "positive" | "neutral" | "negative" | null
    ai_language_code: string | null
    creator_username: string
    creator_full_name: string
    creator_followers_count: number
    creator_profile_pic_url?: string | null
    creator_profile_pic_url_hd?: string | null
  }
  onRemove: (postId: string) => void
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

const getSentimentColor = (sentiment: string | null) => {
  switch (sentiment) {
    case "positive":
      return "text-green-600 bg-green-50/50 border-green-200"
    case "negative":
      return "text-red-600 bg-red-50/50 border-red-200"
    default:
      return "text-gray-600 bg-gray-50/50 border-gray-200"
  }
}

export function PostCard({ post, onRemove }: PostCardProps) {
  const [imageError, setImageError] = useState(false)
  const [profileImageError, setProfileImageError] = useState(false)

  // Backend sends engagement rate as a percentage (e.g., 1.9693 for 1.97%)
  // Cap at 100% max in case of calculation errors
  const engagementRatePercent = Math.min(post.engagementRate, 100).toFixed(2)

  // Use CDN URL from backend, with unavatar fallback
  const getProfilePicUrl = () => {
    if (!profileImageError && post.creator_profile_pic_url) {
      return post.creator_profile_pic_url
    }
    // Fallback to unavatar if CDN fails or is not available
    return `https://unavatar.io/instagram/${post.creator_username}`
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group border-0 bg-gradient-to-b from-background to-muted/20">
      {/* Post Image/Video Preview - FORCED square aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <img
          src={!imageError && post.thumbnail ? post.thumbnail : "/placeholder.jpg"}
          alt={`Post by ${post.creator_username}`}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageError(true)}
        />

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top badges container */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Post Type Badge - Simplified */}
          <div className="flex items-center gap-2">
            <div className="bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5">
              {post.type === "reel" ? (
                <Video className="h-3.5 w-3.5 text-white" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 text-white" />
              )}
              <span className="text-xs font-medium text-white capitalize">{post.type}</span>
            </div>
          </div>

          {/* Views Counter - More prominent for Reels */}
          {post.type === "reel" && post.views > 0 && (
            <div className="bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-medium text-white">{formatNumber(post.views)}</span>
            </div>
          )}
        </div>

        {/* AI Insights - Cleaner, bottom overlay */}
        {post.ai_content_category && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-black/40">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                <Sparkles className="h-3 w-3 text-yellow-300" />
                <span className="text-[10px] font-medium text-white">{post.ai_content_category}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col flex-1 bg-background">
        {/* Creator Info - Cleaner design */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            <AvatarImage
              src={getProfilePicUrl()}
              alt={post.creator_username}
              onError={() => setProfileImageError(true)}
            />
            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
              {post.creator_username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{post.creator_full_name}</p>
            <p className="text-xs text-muted-foreground">
              @{post.creator_username} • {formatNumber(post.creator_followers_count)} followers
            </p>
          </div>
        </div>

        {/* Engagement Metrics - Cleaner grid */}
        <div className={`grid ${post.type === "reel" ? "grid-cols-4" : "grid-cols-3"} gap-1.5 mb-4`}>
          <div className="bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-950/20 dark:to-red-950/10 rounded-lg p-2.5 text-center">
            <Heart className="h-4 w-4 mx-auto text-red-500 mb-1" />
            <p className="text-xs font-bold text-foreground">{formatNumber(post.likes)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 rounded-lg p-2.5 text-center">
            <MessageCircle className="h-4 w-4 mx-auto text-blue-500 mb-1" />
            <p className="text-xs font-bold text-foreground">{formatNumber(post.comments)}</p>
          </div>
          {post.type === "reel" && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/20 dark:to-emerald-950/10 rounded-lg p-2.5 text-center">
              <Eye className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
              <p className="text-xs font-bold text-foreground">{formatNumber(post.views)}</p>
            </div>
          )}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-2.5 text-center ring-1 ring-primary/20">
            <TrendingUp className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xs font-bold text-primary">{engagementRatePercent}%</p>
          </div>
        </div>

        {/* Caption Preview - Better typography */}
        {post.caption && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-xs leading-relaxed text-foreground/80 line-clamp-2">
              {post.caption}
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Actions - Redesigned buttons */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 hover:bg-primary/5 hover:text-primary transition-colors"
            onClick={() => window.open(post.url, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View Post
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 hover:bg-muted transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => onRemove(post.id)}
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}