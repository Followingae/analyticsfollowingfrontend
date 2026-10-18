'use client'

/**
 * What a campaign produced, as a grid.
 *
 * ONE COMPONENT FOR BOTH AUDIENCES, for the same reason the content wall is one component:
 * the client's results and ours are the same posts, and the server has already removed what
 * is not theirs. Two grids is how a client's report and ours drift until neither can be
 * trusted.
 *
 * WHY A GRID AND NOT CARDS DOWN A PAGE. The question this screen answers is "how did the
 * campaign do", which is a question about the SET. A page of one-post-per-row is a page you
 * scroll to count, and twelve posts became twelve screens. The tiles are sized so a dozen
 * posts fit above the fold, because comparing them is the whole job.
 *
 * NOTHING HERE PRINTS A ZERO IT DID NOT MEASURE. Instagram returns no like count when a
 * creator hides it, and 1,571 of the posts we hold are in that state. A dash means "not
 * visible to us", a zero would mean "nobody liked it", and the second one is a lie that
 * reads as a result. The roll-up says how many posts it could not read rather than quietly
 * averaging over them.
 */

import { useState } from 'react'
import {
  AlertTriangle, Check, Clock, ExternalLink, Eye, Heart, Loader2,
  MessageCircle, RefreshCw, Trash2, X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { CARD } from '@/components/console/primitives'
import { cn } from '@/lib/utils'
import {
  compact, num, type PerfPost, type PerfReport, type PostStatus,
} from '@/services/campaignPerformanceApi'

const STATE: Record<PostStatus, { label: string; tone: string }> = {
  analysing: { label: 'Reading it', tone: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]' },
  measured: { label: 'Waiting on you', tone: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' },
  approved: { label: 'Live for the client', tone: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]' },
  rejected: { label: 'Turned down', tone: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]' },
  failed: { label: 'Could not read it', tone: 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]' },
}

function initials(name?: string | null, username?: string | null) {
  const s = (name || username || '?').trim()
  return s.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

/** One counted figure. A dash when we could not read it, and the reason on hover. */
function Metric({ icon: Icon, value, what }: {
  icon: React.ComponentType<{ className?: string }>
  value: number | null
  what: string
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-ds-caption tabular-nums">
            <Icon className="h-3 w-3 text-muted-foreground" />
            {compact(value)}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {value == null
            ? `${what}: not visible to us on this post`
            : `${num(value)} ${what.toLowerCase()}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function PerformanceTotals({ totals }: { totals: PerfReport['totals'] }) {
  if (!totals.posts) return null

  const un = totals.unmeasured
  const blind = un.likes + un.comments + un.plays

  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: 'Posts', value: num(totals.posts),
      hint: totals.creators ? `from ${totals.creators} creator${totals.creators === 1 ? '' : 's'}` : undefined },
    { label: 'Views', value: compact(totals.plays),
      hint: un.plays ? `${un.plays} post${un.plays === 1 ? '' : 's'} not counted` : undefined },
    { label: 'Likes', value: compact(totals.likes),
      hint: un.likes ? `${un.likes} post${un.likes === 1 ? '' : 's'} hidden by the creator` : undefined },
    { label: 'Comments', value: compact(totals.comments),
      hint: un.comments ? `${un.comments} post${un.comments === 1 ? '' : 's'} not counted` : undefined },
    // Both rates, named for their denominator. A reel routinely reaches many times the
    // creator's following, so one number alone is a half-truth whichever one it is.
    { label: 'Engagement', value: totals.engagement_rate_by_plays != null
        ? `${totals.engagement_rate_by_plays}%` : '—',
      hint: 'of people who saw it' },
    { label: 'Against following', value: totals.engagement_rate_by_followers != null
        ? `${totals.engagement_rate_by_followers}%` : '—',
      hint: totals.followers ? `${compact(totals.followers)} combined` : undefined },
  ]

  return (
    <div className="space-y-2">
      <div className={cn(CARD, 'grid grid-cols-2 divide-x divide-y bg-card sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0')}>
        {tiles.map((t) => (
          <div key={t.label} className="px-4 py-3.5">
            <p className="text-ds-overline uppercase text-muted-foreground">{t.label}</p>
            <p className="mt-1 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
              {t.value}
            </p>
            {t.hint && <p className="mt-1.5 text-ds-caption text-muted-foreground">{t.hint}</p>}
          </div>
        ))}
      </div>

      {/* Said once, under the numbers, rather than as a dash somebody has to interpret. */}
      {blind > 0 && (
        <p className="flex items-start gap-1.5 text-ds-caption text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Some counts are hidden by the creator on Instagram and are left out of the totals
          rather than counted as nothing.
        </p>
      )}
    </div>
  )
}

export function PostTile({ post, side, canDecide, busy, onDecide, onRetry, onRemove }: {
  post: PerfPost
  side: 'team' | 'brand'
  canDecide?: boolean
  busy?: boolean
  onDecide?: (approve: boolean) => void
  onRetry?: () => void
  onRemove?: () => void
}) {
  const state = post.status ? STATE[post.status] : null
  const thumb = post.cdn_thumbnail_url || post.display_url
  const waiting = post.status === 'analysing'

  return (
    <article className={cn(CARD, 'flex flex-col overflow-hidden bg-card')}>
      {/* The picture. 4:5 rather than the 9:13 the content wall uses: that one is a review
          screen where the content IS the point, this one is a results grid where the
          numbers are, and a tall tile pushed them off the bottom of every row. */}
      <a href={post.url} target="_blank" rel="noreferrer"
         className="group relative block aspect-[4/5] overflow-hidden bg-muted
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-primary">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" loading="lazy"
               className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center">
            {waiting
              ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/60" />
              : <Eye className="h-5 w-5 text-muted-foreground/40" />}
          </div>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 opacity-0
                         backdrop-blur-sm transition group-hover:opacity-100">
          <ExternalLink className="h-3 w-3 text-white" />
        </span>
        {/* Our own state, never the client's. */}
        {side === 'team' && state && post.status !== 'approved' && (
          <Badge variant="outline"
                 className={cn('absolute left-2 top-2 border-transparent', state.tone)}>
            {state.label}
          </Badge>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={post.profile_pic_url ?? undefined} alt="" />
            <AvatarFallback className="text-[10px]">
              {initials(post.full_name, post.username)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-ds-caption font-medium">
            {post.username ? `@${post.username}` : 'Creator unknown'}
          </span>
        </div>

        {waiting ? (
          <p className="text-ds-caption text-muted-foreground">Reading it from Instagram</p>
        ) : post.status === 'failed' ? (
          <p className="text-ds-caption text-[var(--tone-bad-ink)]">
            {post.failure_reason || 'We could not read this post'}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Metric icon={Eye} value={post.plays} what="Views" />
            <Metric icon={Heart} value={post.likes_count} what="Likes" />
            <Metric icon={MessageCircle} value={post.comments_count} what="Comments" />
            {post.engagement_rate != null && (
              <span className="text-ds-caption font-medium tabular-nums">
                {post.engagement_rate}%
              </span>
            )}
          </div>
        )}

        {/* How fresh the numbers are. Said on the client's copy too: a figure with no date
            on it invites somebody to assume it is live to the second. */}
        {post.last_refreshed_at && !waiting && post.status !== 'failed' && (
          <p className="mt-auto inline-flex items-center gap-1 text-ds-caption text-muted-foreground">
            <Clock className="h-3 w-3" />
            Counted {new Date(post.last_refreshed_at).toLocaleDateString()}
          </p>
        )}

        {side === 'team' && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {canDecide && post.status === 'measured' && (
              <>
                <Button size="sm" className="h-7 flex-1 px-2 text-ds-caption"
                        disabled={busy} onClick={() => onDecide?.(true)}>
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Check className="mr-1 h-3 w-3" />}
                  Release
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-ds-caption"
                        disabled={busy} onClick={() => onDecide?.(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
            {post.status === 'failed' && (
              <Button size="sm" variant="outline" className="h-7 flex-1 px-2 text-ds-caption"
                      disabled={busy} onClick={onRetry}>
                <RefreshCw className="mr-1 h-3 w-3" /> Try again
              </Button>
            )}
            {canDecide && (post.status === 'rejected' || post.status === 'failed') && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-ds-caption"
                      disabled={busy} onClick={onRemove}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

/** The grid itself. Dense on purpose: the set is the message. */
export function PostGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
                    2xl:grid-cols-6">
      {children}
    </div>
  )
}

/** Shared by both sides so the empty case cannot say two different things. */
export function NoPostsYet({ side }: { side: 'team' | 'brand' }) {
  const [shown] = useState(true)
  if (!shown) return null
  return (
    <div className="rounded-ds-2xl border border-dashed border-black/[0.10] py-14 text-center
                    dark:border-white/[0.12]">
      <p className="text-ds-label">Nothing has gone live yet</p>
      <p className="mx-auto mt-2 max-w-md text-ds-caption text-muted-foreground">
        {side === 'brand'
          ? 'Results appear here once your creators publish and we have checked the numbers.'
          : 'Paste the link to a post that has gone live and we will measure it.'}
      </p>
    </div>
  )
}
