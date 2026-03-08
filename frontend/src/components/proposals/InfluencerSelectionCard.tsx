"use client"

import { useRef } from "react"
import { BrandInfluencer } from "@/services/adminProposalMasterApi"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Camera,
  MessageCircle,
  Eye,
  CheckCircle,
  Video,
  Image as ImageIcon,
  GripVertical,
} from "lucide-react"
import { getTierConfig, formatCount, formatCurrency } from "./proposal-utils"
import { motion, useMotionValue, useSpring, AnimatePresence } from "motion/react"

interface InfluencerSelectionCardProps {
  influencer: BrandInfluencer
  isSelected: boolean
  onToggle: (id: string) => void
  onViewDetails: (influencer: BrandInfluencer) => void
  showPricing?: boolean
  dragListeners?: Record<string, Function>
}

export function InfluencerSelectionCard({
  influencer,
  isSelected,
  onToggle,
  onViewDetails,
  showPricing = true,
  dragListeners,
}: InfluencerSelectionCardProps) {
  const inf = influencer
  const pricing = inf.sell_pricing ?? {}
  const tierConfig = inf.tier ? getTierConfig(inf.tier) : null
  const TierIcon = tierConfig?.icon

  // 3D tilt
  const cardRef = useRef<HTMLDivElement>(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 20 })
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 20 })

  const supportsHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!supportsHover || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    rotateX.set(y * -8)
    rotateY.set(x * 8)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      style={{
        perspective: 800,
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Card
        className={`group relative overflow-hidden border-0 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer ${
          isSelected ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""
        }`}
        onClick={() => onToggle(inf.id)}
      >
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Drag handle */}
        {dragListeners && (
          <div
            className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            {...dragListeners}
          >
            <div className="p-1 rounded bg-white/80 dark:bg-gray-800/80 shadow-sm backdrop-blur-sm">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}

        <CardContent className="p-5 relative">
          {/* Avatar + username */}
          <div className="flex flex-col items-center text-center space-y-3 mb-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-white dark:border-gray-800 shadow-md">
                <AvatarImage src={inf.profile_image_url ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                  {(inf.username ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Verified badge */}
              {inf.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-white dark:border-gray-800">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
              {/* Selection check overlay with animation */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -top-1 -left-1 bg-primary rounded-full p-1 border-2 border-white dark:border-gray-800"
                  >
                    <CheckCircle className="h-3 w-3 text-primary-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-semibold text-sm">
                  @{inf.username ?? "unknown"}
                </span>
              </div>
              {inf.full_name && (
                <p className="text-xs text-muted-foreground">{inf.full_name}</p>
              )}
            </div>

            {/* Tier badge */}
            {tierConfig && TierIcon && (
              <Badge
                className={`text-xs font-medium ${tierConfig.className} flex items-center gap-1`}
              >
                <TierIcon className="h-3 w-3" />
                {tierConfig.label}
              </Badge>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="text-center p-2.5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border">
              <div className="text-base font-bold text-primary">
                {formatCount(inf.followers_count)}
              </div>
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                Followers
              </div>
            </div>
            <div className="text-center p-2.5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border">
              <div className="text-base font-bold text-primary">
                {inf.engagement_rate ? `${inf.engagement_rate.toFixed(1)}%` : "-"}
              </div>
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Engagement
              </div>
            </div>
            <div className="text-center p-2.5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border">
              <div className="text-base font-bold text-primary">
                {formatCount(inf.posts_count)}
              </div>
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Camera className="h-3 w-3" />
                Posts
              </div>
            </div>
            <div className="text-center p-2.5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border">
              <div className="text-base font-bold text-primary">
                {formatCount(inf.avg_likes)}
              </div>
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Avg Likes
              </div>
            </div>
          </div>

          {/* Categories */}
          {inf.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center mb-3">
              {inf.categories.slice(0, 3).map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
              {inf.categories.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{inf.categories.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Pricing */}
          {showPricing && Object.keys(pricing).length > 0 && (
            <>
              <Separator className="mb-3" />
              <div className="flex items-center justify-center gap-4 text-xs mb-3">
                {pricing.post !== undefined && pricing.post !== null && (
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    Post <span className="font-semibold text-foreground">{formatCurrency(pricing.post)}</span>
                  </span>
                )}
                {pricing.reel !== undefined && pricing.reel !== null && (
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3 text-muted-foreground" />
                    Reel <span className="font-semibold text-foreground">{formatCurrency(pricing.reel)}</span>
                  </span>
                )}
                {pricing.story !== undefined && pricing.story !== null && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    Story <span className="font-semibold text-foreground">{formatCurrency(pricing.story)}</span>
                  </span>
                )}
              </div>
            </>
          )}

          {/* View Details */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-dashed"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(inf)
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View Details
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
