import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The shape of the brand dashboard while it loads.
 *
 * This used to draw the PREVIOUS layout: a bordered welcome card at `md:col-span-4`, three
 * metric cards, a `col-span-6` discovery tile and two 320px dials in a 12-column grid. The
 * page it stood in for had already been rewritten to a borderless header, two figures, a
 * 640px tile and two 280px dials, so every cold load resolved into a visible layout snap
 * that read as a rendering bug. The skeleton had become the last surviving artifact of a
 * design the team deliberately abandoned, shown to every user on every cold load.
 *
 * A skeleton's only job is to promise the shape of what is arriving, so this one is kept in
 * step with BrandDashboardContent by hand. If the page's grid changes, change it here too.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex w-full flex-1 flex-col gap-ds-5 px-4 py-6 md:px-8 md:py-8">

      {/* The greeting: avatar, "Welcome," and the client's name. No card, no border. */}
      <div className="flex items-center gap-ds-4">
        <Skeleton className="h-[90px] w-[90px] shrink-0 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
      </div>

      {/* Two figures in a StatBand: a caption, a 38px number, a line of meaning. */}
      <div className="grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="px-2 py-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-ds-2 h-9 w-24" />
            <Skeleton className="mt-ds-2 h-3 w-48" />
          </div>
        ))}
      </div>

      {/* The discovery tile: half width, 280px tall. */}
      <div className="max-w-[640px]">
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>

      {/* Usage this cycle: the group label, then two 280px dials side by side. */}
      <div className="flex flex-col gap-ds-3">
        <Skeleton className="h-3 w-32" />
        <div className="grid grid-cols-1 gap-ds-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="flex h-[280px] flex-col items-center justify-center gap-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
