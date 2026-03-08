"use client"

import { BrandInfluencer } from "@/services/adminProposalMasterApi"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StandardMetricCard } from "@/components/ui/standard-metric-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Camera,
  TrendingUp,
  CheckCircle,
  Heart,
  MessageCircle,
  Play,
  BarChart3,
  DollarSign,
} from "lucide-react"
import { getTierConfig, formatCount, formatCurrency, proposalMotion } from "./proposal-utils"
import { motion, AnimatePresence } from "motion/react"

// Friendly label for pricing keys
function pricingLabel(key: string): string {
  const labels: Record<string, string> = {
    post: "Post",
    reel: "Reel",
    story: "Story",
    carousel: "Carousel",
    video: "Video",
    live: "Live",
    ugc: "UGC",
  }
  return labels[key.toLowerCase()] ?? key
}

interface InfluencerDetailSheetProps {
  influencer: BrandInfluencer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isSelected: boolean
  onToggleSelection: (id: string) => void
  showPricing?: boolean
}

export function InfluencerDetailSheet({
  influencer,
  open,
  onOpenChange,
  isSelected,
  onToggleSelection,
  showPricing = true,
}: InfluencerDetailSheetProps) {
  const inf = influencer
  const pricing = inf?.sell_pricing ?? {}
  const pricingEntries = Object.entries(pricing).filter(
    ([, v]) => v !== null && v !== undefined
  )

  const tierConfig = inf?.tier ? getTierConfig(inf.tier) : null
  const TierIcon = tierConfig?.icon

  // Derived metrics
  const likesToFollowers =
    inf?.avg_likes && inf?.followers_count
      ? ((inf.avg_likes / inf.followers_count) * 100).toFixed(2)
      : null
  const commentsToLikes =
    inf?.avg_comments && inf?.avg_likes
      ? ((inf.avg_comments / inf.avg_likes) * 100).toFixed(2)
      : null
  const followersFollowingRatio =
    inf?.followers_count && inf?.following_count && inf.following_count > 0
      ? (inf.followers_count / inf.following_count).toFixed(1)
      : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0"
      >
        {!inf ? (
          <div className="p-6">
            <SheetHeader>
              <SheetTitle>Loading...</SheetTitle>
              <SheetDescription className="sr-only">
                Loading influencer details
              </SheetDescription>
            </SheetHeader>
          </div>
        ) : (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
            <SheetHeader className="text-left p-6 pb-4 bg-gradient-to-br from-muted/30 to-transparent">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-white dark:border-gray-800 shadow-md">
                    <AvatarImage src={inf.profile_image_url ?? undefined} />
                    <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                      {(inf.username ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {inf.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-white dark:border-gray-800">
                      <CheckCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <SheetTitle className="flex items-center gap-1.5 text-lg">
                    @{inf.username ?? "unknown"}
                  </SheetTitle>
                  {inf.full_name && (
                    <p className="text-sm text-muted-foreground">
                      {inf.full_name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-0.5">
                    {tierConfig && TierIcon && (
                      <Badge
                        className={`text-xs font-medium ${tierConfig.className} flex items-center gap-1`}
                      >
                        <TierIcon className="h-3 w-3" />
                        {tierConfig.label}
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <SheetDescription className="sr-only">
                Influencer profile details
              </SheetDescription>

              {/* Biography */}
              {inf.biography && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  {inf.biography}
                </p>
              )}
            </SheetHeader>
            </motion.div>

            {/* Tabs */}
            <Tabs
              defaultValue="overview"
              className="flex-1 flex flex-col overflow-hidden px-6"
            >
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex-1">
                  <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                  Pricing
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-5 pb-4">
                  {/* 3-col stats grid */}
                  <motion.div
                    variants={proposalMotion.staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-3 gap-3"
                  >
                    <StandardMetricCard icon={Users} label="Followers" value={formatCount(inf.followers_count)} className="p-0 [&_[class*=CardContent]]:p-3" />
                    <StandardMetricCard icon={Camera} label="Posts" value={formatCount(inf.posts_count)} className="p-0 [&_[class*=CardContent]]:p-3" />
                    <StandardMetricCard icon={TrendingUp} label="Engagement" value={inf.engagement_rate ? `${inf.engagement_rate.toFixed(1)}%` : "-"} className="p-0 [&_[class*=CardContent]]:p-3" />
                  </motion.div>

                  {/* Categories */}
                  {inf.categories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <h4 className="text-sm font-medium mb-2 tracking-wide">Categories</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {inf.categories.map((cat) => (
                          <Badge key={cat} variant="secondary">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Tags */}
                  {inf.tags && inf.tags.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <h4 className="text-sm font-medium mb-2 tracking-wide">Tags</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {inf.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-5 pb-4">
                  {/* 3-col avg metrics grid */}
                  <motion.div
                    variants={proposalMotion.staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-3 gap-3"
                  >
                    <StandardMetricCard icon={Heart} label="Avg Likes" value={formatCount(inf.avg_likes)} className="p-0 [&_[class*=CardContent]]:p-3" />
                    <StandardMetricCard icon={MessageCircle} label="Avg Comments" value={formatCount(inf.avg_comments)} className="p-0 [&_[class*=CardContent]]:p-3" />
                    <StandardMetricCard icon={Play} label="Avg Views" value={formatCount(inf.avg_views)} className="p-0 [&_[class*=CardContent]]:p-3" />
                  </motion.div>

                  {/* Engagement Rate with Progress */}
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Engagement Rate
                        </span>
                        <span className="text-sm font-bold">
                          {inf.engagement_rate
                            ? `${inf.engagement_rate.toFixed(2)}%`
                            : "-"}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(
                          (inf.engagement_rate ?? 0) * 10,
                          100
                        )}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {(inf.engagement_rate ?? 0) >= 5
                          ? "Excellent engagement"
                          : (inf.engagement_rate ?? 0) >= 3
                            ? "Above average engagement"
                            : (inf.engagement_rate ?? 0) >= 1
                              ? "Average engagement"
                              : "Below average engagement"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Followers/Following ratio */}
                  {followersFollowingRatio && (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              Followers / Following
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCount(inf.followers_count)} /{" "}
                              {formatCount(inf.following_count)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {followersFollowingRatio}x
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ratio
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Derived metrics */}
                  {(likesToFollowers || commentsToLikes) && (
                    <div className="grid grid-cols-2 gap-3">
                      {likesToFollowers && (
                        <StandardMetricCard icon={Heart} label="Likes / Followers" value={`${likesToFollowers}%`} className="p-0 [&_[class*=CardContent]]:p-3" />
                      )}
                      {commentsToLikes && (
                        <StandardMetricCard icon={MessageCircle} label="Comments / Likes" value={`${commentsToLikes}%`} className="p-0 [&_[class*=CardContent]]:p-3" />
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="space-y-5 pb-4">
                  {showPricing && pricingEntries.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content Type</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pricingEntries.map(([key, value], idx) => (
                          <TableRow key={key} className={idx % 2 === 1 ? "bg-muted/50" : ""}>
                            <TableCell className="font-medium">
                              {pricingLabel(key)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState
                      title="No pricing available"
                      description={showPricing ? "No pricing information available for this influencer" : "Pricing is hidden for this proposal"}
                      icons={[DollarSign]}
                    />
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <Separator />

            {/* Footer */}
            <SheetFooter className="p-6 pt-4">
              <Button
                className="w-full"
                variant={isSelected ? "outline" : "default"}
                onClick={() => onToggleSelection(inf.id)}
              >
                {isSelected ? (
                  <>Deselect Influencer</>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Select Influencer
                  </>
                )}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
