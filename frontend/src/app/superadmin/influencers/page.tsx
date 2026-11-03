"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { InfluencerDatabasePage } from "@/components/superadmin/influencer-database/InfluencerDatabasePage"
import { CreatorsHubHeader } from "@/components/console/CreatorsHubHeader"
import { NetworkBrowser } from "@/components/scout/NetworkBrowser"
import { useAdminAccess } from "@/hooks/useAdminAccess"

/**
 * The Creator database. "Database" is the page as it has always been (main analytics, the
 * default). "All creators" adds everyone light analytics has found, with app creators
 * marked, and lets founders Add to Database in one click (which runs main analytics).
 */
export default function SuperadminInfluencersPage() {
  const [view, setView] = useState<"database" | "all">("database")
  const { canDestroy } = useAdminAccess()
  return (
    <SuperadminLayout>
      {/* The database header below carries Add a creator and Import a spreadsheet, in
          reach of the table they act on. The hub's own button would be a third way to do
          the same job, and the only black one of the three. */}
      <CreatorsHubHeader hideAction />
      <div className="mb-4 inline-flex w-fit rounded-full border bg-background p-1">
        {([["database", "Database"], ["all", "All creators"]] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setView(k)}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${view === k
                    ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>
      {view === "database" ? <InfluencerDatabasePage /> : <NetworkBrowser defaultSegment="all" canAdd={canDestroy} />}
    </SuperadminLayout>
  )
}
