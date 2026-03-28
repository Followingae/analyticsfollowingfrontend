export default function CampaignsLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded bg-muted animate-pulse" />
      </div>
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-border pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded bg-muted animate-pulse" />
        ))}
      </div>
      {/* Campaign cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="flex items-center gap-3 pt-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
