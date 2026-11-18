'use client'

/**
 * Merchant campaigns waiting for a yes.
 *
 * A self-serve merchant built this on their own and pressed submit. Nothing has gone to a
 * creator yet. Approving pushes it to the creators near the merchant the moment you press
 * the button. The card itself, with Approve and Needs a change on it, is MerchantCampaignCard,
 * shared with the lead panel on Partners so a campaign reads and behaves the same wherever it
 * is reviewed from. This file is the queue: read it, oldest first, and drop a card once it has
 * been decided.
 */

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Store } from 'lucide-react'
import { ReadState, SectionHead } from '@/components/console/surfaces'
import { MerchantCampaignCard } from '@/components/console/MerchantCampaignCard'
import {
  merchantAdminApi, type MerchantApiError, type MerchantCampaign,
} from '@/services/merchantAdminApi'

export function MerchantCampaignReviews({ onCount }: { onCount?: (n: number) => void }) {
  const [items, setItems] = useState<MerchantCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [notBuilt, setNotBuilt] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const r = await merchantAdminApi.listCampaigns('in_review')
      /* Oldest first. The merchant who has waited longest is the one about to give up. */
      const rows = [...r.items]
        .filter(c => c.status === 'in_review')
        .sort((a, b) => new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime())
      setItems(rows)
      setNotBuilt(false)
      onCount?.(rows.length)
    } catch (e) {
      const err = e as MerchantApiError
      if (err.status === 404) {
        // Not built yet on the server. That is an empty queue, not a broken one.
        setNotBuilt(true)
        setItems([])
        onCount?.(0)
      } else {
        setFailed(true)
        setItems([])
      }
    } finally {
      setLoading(false)
    }
  }, [onCount])

  useEffect(() => { load() }, [load])

  /* Open straight onto a card when the merchants page linked here with its id. */
  useEffect(() => {
    if (loading || typeof window === 'undefined') return
    const id = window.location.hash.replace('#', '')
    if (!id.startsWith('merchant-campaign-')) return
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading, items])

  const remove = (id: string) => setItems(list => {
    const next = list.filter(c => c.id !== id)
    onCount?.(next.length)
    return next
  })

  return (
    <section className="space-y-3" id="merchant-campaigns">
      <SectionHead
        icon={Store}
        title="Merchant campaigns"
        count={items.length}
        note="Built by a self-serve merchant and waiting for a yes. Approving pushes it to creators nearby."
      />

      <ReadState
        failed={failed}
        loading={loading}
        empty={items.length === 0}
        what="the merchant campaigns waiting"
        onRetry={load}
        nothing={notBuilt
          ? 'No merchant campaigns waiting. The review queue is not switched on at the server yet.'
          : 'No merchant campaigns waiting'}
        skeleton={<div className="flex items-center gap-2 py-6 text-ds-caption">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Reading the queue
        </div>}
      >
        <div className="flex flex-col gap-3">
          {items.map(c => (
            <MerchantCampaignCard key={c.id} c={c} onChanged={() => remove(c.id)} />
          ))}
        </div>
      </ReadState>
    </section>
  )
}
