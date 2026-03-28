export default function DashboardLoading() {
  return (
    <div className="w-full min-h-0">
      <div className="w-full max-w-full space-y-6 p-4 md:p-6">
        {/* Welcome + Metrics row */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="rounded-xl border bg-card p-6 h-[140px]">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  <div className="h-6 w-32 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <div className="md:col-span-8">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-card p-6">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse mb-3" />
                  <div className="h-8 w-16 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Discovery + Charts row */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="rounded-xl border bg-card h-[320px] animate-pulse" />
          </div>
          <div className="md:col-span-3">
            <div className="rounded-xl border bg-card h-[320px] animate-pulse" />
          </div>
          <div className="md:col-span-3">
            <div className="rounded-xl border bg-card h-[320px] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
