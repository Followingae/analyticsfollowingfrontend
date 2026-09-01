/**
 * What the campaigns list looks like while it is on its way.
 *
 * The shapes are the ones that actually land, at the widths the page actually uses, so
 * nothing jumps when the data arrives. It is deliberately quiet: a skeleton is a promise
 * about layout, not a place for a shimmer or a spinner.
 */
export default function CampaignsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-ds-3 pb-ds-6 pt-ds-5 sm:px-ds-5" aria-busy="true">
      <div className="flex flex-col gap-ds-6">
        {/* Title and the one action */}
        <div className="flex flex-col gap-ds-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-ds-2">
            <div className="h-9 w-56 animate-pulse rounded bg-muted" />
            <div className="h-4 w-72 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-36 animate-pulse rounded-ds-control bg-muted" />
        </div>

        {/* Tabs */}
        <div className="flex gap-ds-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 w-28 animate-pulse rounded-ds-control bg-muted" />
          ))}
        </div>

        {/* The grid of campaigns */}
        <div className="grid grid-cols-1 gap-ds-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="overflow-hidden rounded-ds-lg border">
              <div className="aspect-[16/9] w-full animate-pulse bg-muted" />
              <div className="flex flex-col gap-ds-2 p-ds-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
