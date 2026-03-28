import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="w-full min-h-0">
      <div className="@container/main w-full max-w-full space-y-6 p-4 md:p-6">

        {/* Row 1: Welcome + Metric Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
          {/* Welcome Section */}
          <div className="md:col-span-4">
            <Card className="h-full">
              <CardHeader className="flex items-start justify-center h-full">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-22 w-22 rounded-full shrink-0" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-8 w-36" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Metric Cards */}
          <div className="md:col-span-8">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Discovery + Charts */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
          {/* Discovery Placeholder */}
          <div className="md:col-span-6">
            <Card className="h-[320px]">
              <CardContent className="flex flex-col items-center justify-center h-full gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-80" />
                <Skeleton className="h-9 w-32 rounded-md" />
              </CardContent>
            </Card>
          </div>

          {/* Profile Analysis Chart */}
          <div className="md:col-span-3">
            <Card className="h-[320px]">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36 mt-1" />
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <Skeleton className="h-[180px] w-[180px] rounded-full" />
              </CardContent>
            </Card>
          </div>

          {/* Remaining Credits Chart */}
          <div className="md:col-span-3">
            <Card className="h-[320px]">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24 mt-1" />
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <Skeleton className="h-[180px] w-[180px] rounded-full" />
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
