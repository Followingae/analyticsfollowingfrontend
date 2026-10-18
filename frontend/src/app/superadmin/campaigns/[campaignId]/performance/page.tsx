'use client'

/**
 * Performance: what the campaign actually produced once it was published.
 *
 * THE HOLE THIS FILLS. The platform has measured Instagram posts well for months and has
 * never shown a brand the results of their own campaign. Twenty-eight live campaigns, zero
 * posts attached to any of them. The delivery board's "it is live" rung already asks for the
 * post URL and writes it to a column nothing reads. This is where that link finally goes.
 *
 * ANYBODY ON THE CAMPAIGN MAY PASTE. ONLY THE SUPERADMIN RELEASES.
 * Recording that a creator published is running the campaign. Deciding the client may see
 * the numbers is a claim about results, and that is the thing he asked be held. So the box
 * is open to the team and the Release button is not, and a post sits in "Waiting on you"
 * until somebody who may answer does.
 *
 * IT POLLS, BRIEFLY AND ONLY WHILE SOMETHING IS MOVING. Apify takes tens of seconds, so the
 * paste returns at once and the row says "Reading it". The poll stops the moment nothing is
 * analysing, rather than running for as long as the tab is open: a screen left open on a
 * second monitor should not be a request every three seconds until Friday.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Link2, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReadState, SectionHead } from '@/components/console/surfaces'
import { useConfirm } from '@/components/console/confirm'
import {
  NoPostsYet, PerformanceTotals, PostGrid, PostTile,
} from '@/components/campaigns/performance/PerformanceGrid'
import { campaignPerformanceApi, type PerfReport } from '@/services/campaignPerformanceApi'

const POLL_MS = 4000

export default function CampaignPerformancePage() {
  const campaignId = useParams().campaignId as string
  const confirm = useConfirm()

  const [data, setData] = useState<PerfReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const d = await campaignPerformanceApi.team(campaignId)
      setData(d)
      setFailed(false)
    } catch (e) {
      if (!quiet) {
        setFailed(true)
        toast.error(e instanceof Error ? e.message : 'Could not read the results')
      }
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [campaignId])

  useEffect(() => { void load() }, [load])

  /* Only while something is genuinely in flight, and cleared on the way out. */
  useEffect(() => {
    const moving = (data?.posts || []).some((p) => p.status === 'analysing')
    if (!moving) return
    timer.current = setTimeout(() => void load(true), POLL_MS)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [data, load])

  const add = async () => {
    const v = url.trim()
    if (!v) return
    setAdding(true)
    try {
      const out = await campaignPerformanceApi.add(campaignId, v)
      toast.success(out.already_here ? 'That post is already on this campaign'
                                     : 'Added. Reading it from Instagram now.')
      setUrl('')
      await load(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add that link')
    } finally { setAdding(false) }
  }

  const decide = async (linkId: string, approve: boolean, label: string) => {
    let note: string | undefined
    if (!approve) {
      /* A refusal needs a reason, the same rule the approval queue keeps: an unexplained no
         comes back next week as the same request. */
      const ok = await confirm({
        kind: 'destructive',
        title: 'Turn this post down?',
        body: <>It stops being counted towards this campaign and the client will not see it.
               It also stops costing us anything to keep re-measuring.</>,
        losses: [{ label: 'The measurement is kept, the post just leaves the report', kept: true }],
        confirmLabel: 'Turn it down',
      })
      if (!ok) return
      note = 'Turned down from the campaign results'
    } else {
      const ok = await confirm({
        kind: 'routine',
        title: `Release ${label} to the client?`,
        body: <>From the moment you say yes this post and its numbers are on the client&apos;s
               results screen. We will re-count it every week for a month.</>,
        confirmLabel: 'Release it',
      })
      if (!ok) return
    }

    setBusy(linkId)
    try {
      await campaignPerformanceApi.decide(linkId, approve, note)
      toast.success(approve ? 'The client can see it now' : 'Turned down')
      await load(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not answer that')
    } finally { setBusy(null) }
  }

  const act = async (linkId: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(linkId)
    try {
      await fn()
      toast.success(done)
      await load(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not work')
    } finally { setBusy(null) }
  }

  const posts = data?.posts || []
  const waiting = posts.filter((p) => p.status === 'measured' || p.status === 'analysing')
  const live = posts.filter((p) => p.status === 'approved')
  const closed = posts.filter((p) => p.status === 'rejected' || p.status === 'failed')
  const canDecide = !!data?.can_decide

  return (
    <div className="space-y-6">
      {/* Paste it. One field, because one field is the whole job. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4
                            -translate-y-1/2 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void add() }}
            placeholder="Paste the link to a post that has gone live"
            className="pl-8"
          />
        </div>
        <Button onClick={add} disabled={adding || !url.trim()}>
          {adding ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  : <Plus className="mr-1.5 h-3.5 w-3.5" />}
          Add
        </Button>
      </div>

      <ReadState
        failed={failed}
        loading={loading}
        empty={posts.length === 0}
        what="this campaign’s results"
        onRetry={() => load()}
        nothing=""
        skeleton={<div className="flex items-center gap-2 py-10 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading the results
        </div>}
      >
        <div className="space-y-7">
          {data && <PerformanceTotals totals={data.totals} />}

          {waiting.length > 0 && (
            <section className="space-y-3">
              <SectionHead
                title={canDecide ? 'Waiting on you' : 'Waiting on Zain'}
                count={waiting.length}
                note={canDecide
                  ? 'The client cannot see these yet. Releasing one puts it on their results.'
                  : 'Measured, and held until a superadmin releases them to the client.'}
              />
              <PostGrid>
                {waiting.map((p) => (
                  <PostTile
                    key={p.link_id} post={p} side="team" canDecide={canDecide}
                    busy={busy === p.link_id}
                    onDecide={(ok) => decide(p.link_id, ok, p.username ? `@${p.username}` : 'this post')}
                  />
                ))}
              </PostGrid>
            </section>
          )}

          {live.length > 0 && (
            <section className="space-y-3">
              <SectionHead
                title="Live for the client"
                count={live.length}
                note="On their results screen. Re-counted every week for a month after the first post."
              />
              <PostGrid>
                {live.map((p) => (
                  <PostTile
                    key={p.link_id} post={p} side="team" canDecide={canDecide}
                    busy={busy === p.link_id}
                    onDecide={(ok) => decide(p.link_id, ok, p.username ? `@${p.username}` : 'this post')}
                  />
                ))}
              </PostGrid>
            </section>
          )}

          {closed.length > 0 && (
            <section className="space-y-3">
              <SectionHead title="Not counted" count={closed.length}
                           note="Turned down, or we could not read them." />
              <PostGrid>
                {closed.map((p) => (
                  <PostTile
                    key={p.link_id} post={p} side="team" canDecide={canDecide}
                    busy={busy === p.link_id}
                    onRetry={() => act(p.link_id,
                                       () => campaignPerformanceApi.retry(p.link_id),
                                       'Reading it again')}
                    onRemove={() => act(p.link_id,
                                        () => campaignPerformanceApi.remove(p.link_id),
                                        'Taken off the campaign')}
                  />
                ))}
              </PostGrid>
            </section>
          )}
        </div>
      </ReadState>

      {!loading && !failed && posts.length === 0 && <NoPostsYet side="team" />}
    </div>
  )
}
