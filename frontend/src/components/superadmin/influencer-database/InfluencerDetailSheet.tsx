"use client"

/**
 * One creator's record, in a sheet. Density tier: WORKING.
 *
 * The Rates tab is not rendered at all for anyone whose scope covers neither side of the
 * money. A disabled tab is an advertisement: it tells a business developer that rates exist
 * on this record and that they are the one being kept out.
 */
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
import { useMoneyColumns } from "./useMoneyColumns"

interface InfluencerDetailSheetProps {
  influencer: MasterInfluencer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, data: any) => void
  onRefresh: (id: string) => void
}

/* The console's tones, named once in globals.css, rather than a seventh set of palette
   steps picked by eye on this one sheet. */
const statusColors: Record<string, string> = {
  active: "border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]",
  inactive: "border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]",
  blacklisted: "border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]",
  pending: "border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]",
}

export function InfluencerDetailSheet({
  influencer,
  open,
  onOpenChange,
  onSave,
  onRefresh,
}: InfluencerDetailSheetProps) {
  const { canSeeCost, canSeeSell } = useMoneyColumns()
  if (!influencer) return null

  const showRates = canSeeCost || canSeeSell

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
      <SheetContent className="w-full sm:w-[700px] sm:max-w-[700px] overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-ds-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={influencer.profile_image_url || undefined} alt={influencer.username} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-ds-2">
                <SheetTitle className="truncate text-ds-heading">
                  @{influencer.username}
                </SheetTitle>
                {influencer.is_verified && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-[var(--tone-info-dot)]" />
                )}
                <Badge
                  variant="secondary"
                  className={statusColors[influencer.status] || ""}
                >
                  {influencer.status}
                </Badge>
              </div>
              {influencer.full_name && (
                <p className="truncate text-ds-caption text-muted-foreground">
                  {influencer.full_name}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex flex-col">
          <TabsList className="mx-6 mt-ds-3 flex w-auto flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {showRates && <TabsTrigger value="pricing">Rates</TabsTrigger>}
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="access">Sharing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-6 pt-ds-3">
            <InfluencerOverviewTab
              influencer={influencer}
              onSave={(data) => onSave(influencer.id, data)}
            />
          </TabsContent>

          <TabsContent value="analytics" className="p-6 pt-ds-3">
            <InfluencerAnalyticsTab
              influencer={influencer}
              onRefresh={() => onRefresh(influencer.id)}
            />
          </TabsContent>

          {showRates && (
            <TabsContent value="pricing" className="p-6 pt-ds-3">
              <InfluencerPricingTab
                influencer={influencer}
                onSave={(data) => onSave(influencer.id, data)}
              />
            </TabsContent>
          )}

          <TabsContent value="posts" className="p-6 pt-ds-3">
            <InfluencerPostsTab influencer={influencer} />
          </TabsContent>

          <TabsContent value="access" className="p-6 pt-ds-3">
            <InfluencerAccessTab influencer={influencer} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
