import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DiscoverSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
              </div>
              
              {/* Filter Tabs */}
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20" />
                ))}
              </div>
              
              {/* Filter Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-28" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>

        {/* Creators Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                {/* Creator Avatar and Info */}
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-6" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-18" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </div>
                
                {/* Category Badge */}
                <Skeleton className="h-5 w-20 rounded-full" />
                
                {/* Engagement Preview */}
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center space-y-1">
                      <Skeleton className="h-6 w-6 mx-auto rounded" />
                      <Skeleton className="h-3 w-8 mx-auto" />
                    </div>
                    <div className="text-center space-y-1">
                      <Skeleton className="h-6 w-6 mx-auto rounded" />
                      <Skeleton className="h-3 w-8 mx-auto" />
                    </div>
                    <div className="text-center space-y-1">
                      <Skeleton className="h-6 w-6 mx-auto rounded" />
                      <Skeleton className="h-3 w-8 mx-auto" />
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}