export default function SettingsLoading() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded bg-muted animate-pulse" />
      </div>
      {/* Profile section */}
      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-28 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}
