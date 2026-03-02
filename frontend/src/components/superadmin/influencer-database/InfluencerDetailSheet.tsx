"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle } from "lucide-react"
import type { MasterInfluencer } from "@/types/influencerDatabase"
import { InfluencerOverviewTab } from "./InfluencerOverviewTab"
import { InfluencerAnalyticsTab } from "./InfluencerAnalyticsTab"
import { InfluencerPricingTab } from "./InfluencerPricingTab"
import { InfluencerPostsTab } from "./InfluencerPostsTab"
import { InfluencerAccessTab } from "./InfluencerAccessTab"

interface InfluencerDetailSheetProps {
  influencer: MasterInfluencer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, data: any) => void
  onRefresh: (id: string) => void
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  blacklisted: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
}

export function InfluencerDetailSheet({
  influencer,
  open,
  onOpenChange,
  onSave,
  onRefresh,
}: InfluencerDetailSheetProps) {
  if (!influencer) return null

  const initials = influencer.full_name
    ? influencer.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : influencer.username.slice(0, 2).toUpperCase()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-[700px] overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={influencer.profile_image_url || undefined} alt={influencer.username} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg truncate">
                  @{influencer.username}
                </SheetTitle>
                {influencer.is_verified && (
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
                <Badge
                  variant="secondary"
                  className={statusColors[influencer.status] || ""}
                >
                  {influencer.status}
                </Badge>
              </div>
              {influencer.full_name && (
                <p className="text-sm text-muted-foreground truncate">
                  {influencer.full_name}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex flex-col">
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-6 pt-4">
            <InfluencerOverviewTab
              influencer={influencer}
              onSave={(data) => onSave(influencer.id, data)}
            />
          </TabsContent>

          <TabsContent value="analytics" className="p-6 pt-4">
            <InfluencerAnalyticsTab
              influencer={influencer}
              onRefresh={() => onRefresh(influencer.id)}
            />
          </TabsContent>

          <TabsContent value="pricing" className="p-6 pt-4">
            <InfluencerPricingTab
              influencer={influencer}
              onSave={(data) => onSave(influencer.id, data)}
            />
          </TabsContent>

          <TabsContent value="posts" className="p-6 pt-4">
            <InfluencerPostsTab influencer={influencer} />
          </TabsContent>

          <TabsContent value="access" className="p-6 pt-4">
            <InfluencerAccessTab influencer={influencer} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
