'use client'

/**
 * The brand's own entitlements read, fetched once for the whole billing page.
 *
 * It is a hook rather than a call inside the modules panel because one field on
 * it, `payment.invoiced`, decides what the WHOLE page looks like: whether a card
 * is ever mentioned, whether plan changes are self serve, and whether the
 * cashback tab is shown. Fetching it lower down would mean the page rendering a
 * card control for a moment and then taking it away.
 *
 * The discriminator is `team_id`, NOT how many modules came back
 * -------------------------------------------------------------
 * An empty `modules` list is a legitimate 200, so it is never a reason to fall
 * back. It is also, as of the AFTER INSERT trigger on `teams` that grants
 * `find`, no longer expected: every live team has at least one module and a new
 * team gets one at INSERT time. Both things are true at once, and the rule holds
 * either way, which is the point of keying off `team_id` instead. An earlier
 * version of this hook treated an empty list as "the route is not live" and
 * would have thrown away a correct answer for one real team, and worse, thrown
 * away `payment.invoiced` with it.
 *
 * That flag is trustworthy even when `modules` is empty, because it is read from
 * `teams` and the team owner's `users` row rather than from the entitlements
 * table. Gating the page's card-versus-invoice decision on modules being
 * non-empty is the one heuristic here that would produce a genuinely wrong page:
 * an invoiced client with no entitlement rows would be shown a card form.
 *
 * Five states:
 *
 *   loading  in flight
 *   loaded   200 with a team_id. Authoritative, including an empty module list,
 *            which simply means nothing is switched on. The modules panel says
 *            so out loud if that ever arrives, rather than correcting it in
 *            silence: a fallback nobody sees fire is a fallback nobody notices
 *            has gone stale.
 *   no_team  200 with team_id null. The signed-in user is on no team, so there
 *            is genuinely no account to bill. Not an outage, and not a case for
 *            the fallback.
 *   absent   404. The route is not deployed, so the caller falls back to what
 *            the product enforces today.
 *   failed   a 500, or nothing came back. Said out loud, never rendered as a
 *            fact about what the account has.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  fetchAccountModules,
  NotDeployedError,
  type BrandModulesSnapshot,
} from '@/services/brandBillingApi'

export type BrandModulesState = 'loading' | 'loaded' | 'no_team' | 'absent' | 'failed'

export interface BrandModulesResult {
  state: BrandModulesState
  /**
   * Set for ANY 200, including one with no modules and one with no team. Read
   * `payment` off this whenever it is here: it is right even when the module
   * list is empty.
   */
  snapshot: BrandModulesSnapshot | null
  /** True once the request has finished, however it finished. */
  settled: boolean
  reload: () => void
}

export function useBrandModules(enabled: boolean): BrandModulesResult {
  const [state, setState] = useState<BrandModulesState>('loading')
  const [snapshot, setSnapshot] = useState<BrandModulesSnapshot | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setState('loading')

    fetchAccountModules()
      .then((data) => {
        if (cancelled) return
        // The snapshot is kept either way. `payment` is authoritative on any
        // 200, and it is the half of this payload the page cannot get wrong.
        setSnapshot(data)
        setState(data.teamId ? 'loaded' : 'no_team')
      })
      .catch((e) => {
        if (cancelled) return
        setSnapshot(null)
        setState(e instanceof NotDeployedError ? 'absent' : 'failed')
      })

    return () => {
      cancelled = true
    }
  }, [enabled, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return {
    state,
    snapshot,
    settled: enabled ? state !== 'loading' : true,
    reload,
  }
}
