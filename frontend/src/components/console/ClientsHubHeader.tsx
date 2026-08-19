'use client'

/**
 * The client hub header.
 *
 * Screens built at different times read as different places: the clients we bill, the ones
 * who have gone quiet, and the quotes we have out. They are one job — who we sell to, and
 * what we have quoted them — so they get one header and one tab row.
 *
 * A fourth tab, sourcing rounds, has been retired. Brand rosters (under Creators) replaced
 * it and the table behind it is empty in production, so it was a tab that led to nothing.
 *
 * This component owns nothing but the header. Each page keeps its own body exactly as it
 * was, which is why adopting it is a two-line edit rather than a rewrite.
 */
import * as React from 'react'
import { Building2, FileText, PhoneOff } from 'lucide-react'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { Hub, type HubTab } from './Hub'
import { Stat, StatGrid } from './primitives'

const TABS: HubTab[] = [
  { label: 'Clients', href: '/work/clients', module: 'clients' },
  { label: 'Brands', href: '/work/brands', module: 'clients' },
  { label: 'Proposals', href: '/work/proposals', module: 'proposals' },
]

interface Headline {
  /** Clients on the books — the `total` the client list reports, not the page of rows. */
  clients: number | null
  /** Brands with a week or more of silence, and the worse bucket underneath it. */
  quiet: number | null
  atRisk: number | null
  /** Proposals sitting with a client: sent, in review, or more asked for. */
  out: number | null
}

/**
 * Every number here comes from an endpoint a viewer may be refused. One 403 must cost that
 * one stat and nothing else, so each request is settled on its own and a stat with no answer
 * is simply not rendered — never a zero, which would read as a fact.
 */
function useHeadline(enabled: boolean): Headline {
  const { can, loading } = useAdminAccess()
  const [h, setH] = React.useState<Headline>({ clients: null, quiet: null, atRisk: null, out: null })

  const mayClients = can('clients')
  const mayProposals = can('proposals')

  React.useEffect(() => {
    if (!enabled || loading) return
    let active = true

    const get = async (path: string) => {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}${path}`)
      if (!res.ok) throw new Error(String(res.status))
      return res.json()
    }

    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

    Promise.allSettled([
      mayClients ? get('/api/v1/admin/clients?limit=1') : Promise.reject(),
      mayClients ? get('/api/v1/admin/brands/heartbeat') : Promise.reject(),
      mayProposals ? get('/api/v1/admin/proposals/stats') : Promise.reject(),
    ]).then(([clients, beat, proposals]) => {
      if (!active) return
      const summary = beat.status === 'fulfilled' ? (beat.value?.data?.summary ?? {}) : {}
      setH({
        clients: clients.status === 'fulfilled' ? num(clients.value?.total) : null,
        quiet: beat.status === 'fulfilled' ? num(summary.quiet) : null,
        atRisk: beat.status === 'fulfilled' ? num(summary.at_risk) : null,
        out: proposals.status === 'fulfilled' ? num(proposals.value?.data?.active_proposals) : null,
      })
    })

    return () => { active = false }
  }, [enabled, loading, mayClients, mayProposals])

  return h
}

export function ClientsHubHeader({
  /** The screen's own main action — the header is shared, the button is not. */
  action,
  /** The headline row belongs on the Clients tab only; the other three have their own. */
  showStats = false,
  /**
   * The one line that explains *this* tab. The hub's own sub-line explains the destination,
   * so the sentence a screen used to carry in its title block moves here rather than being
   * dropped — nothing a page said before should stop being said.
   */
  note,
}: {
  action?: React.ReactNode
  showStats?: boolean
  note?: React.ReactNode
}) {
  const h = useHeadline(showStats)

  return (
    <Hub
      title="Clients"
      sub="Who we sell to, and what we have quoted them. Clients are on the books, brands are the earlier conversations, and proposals are the quotes sitting with them."
      tabs={TABS}
      action={action}
    >
      {note && (
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{note}</p>
      )}

      {showStats && (h.clients !== null || h.quiet !== null || h.out !== null) && (
        <StatGrid cols={3}>
          {h.clients !== null && (
            <Stat
              label="Clients on the books"
              value={h.clients}
              icon={Building2}
              hint="Companies with an account and a name on it"
            />
          )}
          {h.quiet !== null && (
            <Stat
              label="Gone quiet"
              value={h.quiet}
              tone={h.quiet > 0 ? 'warn' : 'good'}
              icon={PhoneOff}
              hint={
                h.quiet > 0
                  ? `A week or more of silence${h.atRisk ? `, and ${h.atRisk} past a fortnight` : ''}`
                  : 'Something has moved with everyone this week'
              }
            />
          )}
          {h.out !== null && (
            <Stat
              label="Quotes out with a client"
              value={h.out}
              tone={h.out > 0 ? 'info' : 'neutral'}
              icon={FileText}
              hint="Sent and waiting on their answer"
            />
          )}
        </StatGrid>
      )}
    </Hub>
  )
}
