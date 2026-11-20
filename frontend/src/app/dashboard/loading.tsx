/* The brand home's shape while it loads: the greeting, the cloud, four tiles. */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] w-full flex-col gap-6 p-4 sm:p-6">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-muted" />
      <div className="min-h-[44dvh] flex-[3] animate-pulse rounded-[20px] bg-muted/60" />
      <div className="grid flex-[2] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="min-h-[150px] animate-pulse rounded-[20px] bg-muted/60" />)}
      </div>
    </div>
  )
}
