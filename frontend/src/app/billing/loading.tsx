export default function BillingLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded bg-muted animate-pulse" />
      </div>
      {/* Plan card */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-10 w-28 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-px bg-border" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-6 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      {/* Invoice table skeleton */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
