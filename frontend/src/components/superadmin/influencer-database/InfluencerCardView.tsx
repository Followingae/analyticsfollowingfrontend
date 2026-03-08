"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { InfluencerCard } from "./InfluencerCard"
import type { MasterInfluencer } from "@/types/influencerDatabase"

interface InfluencerCardViewProps {
  influencers: MasterInfluencer[]
  loading: boolean
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onViewDetails: (influencer: MasterInfluencer) => void
  onEditDetails: (influencer: MasterInfluencer) => void
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
}

function SkeletonCard() {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <Skeleton className="h-16 rounded-md" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

export function InfluencerCardView({
  influencers,
  loading,
  onViewDetails,
  onEditDetails,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
}: InfluencerCardViewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={`skeleton-${i}`} />
        ))}
      </div>
    )
  }

  if (influencers.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        No influencers found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {influencers.map((inf) => (
          <InfluencerCard
            key={inf.id}
            influencer={inf}
            onViewDetails={onViewDetails}
            onEditDetails={onEditDetails}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
