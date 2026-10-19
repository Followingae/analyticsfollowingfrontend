/**
 * One post, opened.
 *
 * The grid answers "how did the campaign do". This answers "what was this post", and until
 * now there was no answer at all: clicking a tile left the platform for Instagram, so the
 * only way to read a creator's caption, see what they tagged or find out where they filmed
 * was to go and look at the thing we had already measured.
 *
 * ⚠️ NOTHING HERE COSTS ANOTHER CALL. Every field was stored at measurement time and simply
 * was never returned; the report endpoint now sends it. So this is not a new pipeline, it is
 * the one we already had, finally shown.
 *
 * ⚠️ A FIGURE WE DO NOT HAVE IS NOT A ZERO, and the distinction is the point of `Stat`:
 * a missing number says why it is missing. "Hidden by the creator" is reserved for
 * `like_and_view_counts_disabled`, which is Instagram's own switch. Anything else missing
 * is our failure to read it and says so, because telling a client their reel got no views
 * when we simply could not fetch the number is the worst thing this screen could do.
 */

'use client'

import {
  AtSign, Clock, ExternalLink, Hash, Heart, Languages, MapPin,
  MessageCircle, Music, Sparkles, Users, Eye,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { compact, num, type PerfPost } from '@/services/campaignPerformanceApi'

/** jsonb columns arrive as arrays of strings or of objects. Read either, show neither raw. */
function names(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => {
      if (typeof x === 'string') return x
      if (x && typeof x === 'object') {
        const o = x as Record<string, unknown>
        const n = o.username ?? o.name ?? o.handle
        return typeof n === 'string' ? n : null
      }
      return null
    })
    .filter((x): x is string => !!x)
}

function duration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

/** One number, or an honest sentence about why there isn't one. */
function Stat({ icon: Icon, label, value, missing }: {
  icon: typeof Eye
  label: string
  value: number | null | undefined
  missing: string
}) {
  const has = value !== null && value !== undefined
  return (
    <div className="rounded-ds-lg bg-muted/50 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase
                      tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3 w-3" />{label}
      </div>
      {has ? (
        <div className="mt-1 text-[22px] font-semibold leading-tight tabular-nums">
          {compact(value as number)}
        </div>
      ) : (
        <div className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground">{missing}</div>
      )}
    </div>
  )
}

function Row({ icon: Icon, label, children }: {
  icon: typeof MapPin; label: string; children: React.ReactNode
}) {
  return (
    <div className="flex gap-3 py-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-[13.5px] leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

export function PostDetail({ post, open, onOpenChange }: {
  post: PerfPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!post) return null

  const thumb = post.cdn_thumbnail_url || post.display_url
  const hidden = post.like_and_view_counts_disabled === true
  const tags = names(post.tagged_users)
  const coauthors = names(post.coauthor_producers)
  const hashtags = names(post.hashtags)
  const mentions = names(post.mentions)
  const dur = duration(post.video_duration)

  // The rate is named for what it was divided by. A reel routinely reaches many times its
  // creator's following, so an unlabelled percentage is a half truth whichever one it is.
  const rateBase = post.plays ? 'of the people who watched' : 'of their followers'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        <DialogTitle className="sr-only">
          {post.username ? `@${post.username}` : 'Post'} detail
        </DialogTitle>
        <DialogDescription className="sr-only">
          Everything measured on this post.
        </DialogDescription>

        <div className="grid gap-0 sm:grid-cols-[minmax(0,260px)_1fr]">
          {/* The post itself */}
          <div className="relative aspect-[4/5] overflow-hidden bg-muted sm:aspect-auto">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Eye className="h-6 w-6 text-muted-foreground/40" />
              </div>
            )}
          </div>

          <div className="min-w-0 p-6">
            {/* Who */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.profile_pic_url ?? undefined} alt="" />
                <AvatarFallback className="text-[11px]">
                  {(post.username || '?').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium leading-tight">
                  {post.full_name || post.username || 'Creator'}
                </p>
                <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                  {post.username ? `@${post.username}` : ''}
                  {post.followers_count ? ` · ${compact(post.followers_count)} followers` : ''}
                </p>
              </div>
            </div>

            {/* The numbers */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Stat icon={Eye} label="Views" value={post.plays}
                    missing={hidden ? 'Hidden by the creator' : 'We could not read this'} />
              <Stat icon={Heart} label="Likes" value={post.likes_count}
                    missing={hidden ? 'Hidden by the creator' : 'We could not read this'} />
              <Stat icon={MessageCircle} label="Comments" value={post.comments_count}
                    missing={post.comments_disabled
                      ? 'Comments turned off'
                      : 'We could not read this'} />
            </div>

            {post.engagement_rate != null && (
              <p className="mt-3 text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground tabular-nums">
                  {post.engagement_rate.toFixed(2)}%
                </span>{' '}
                engagement, {rateBase}.
              </p>
            )}

            {hidden && (
              <p className="mt-3 rounded-ds-lg bg-muted/50 px-3.5 py-2.5 text-[12.5px]
                            leading-relaxed text-muted-foreground">
                This creator has switched off public like and view counts on Instagram, so
                those numbers are not available to anybody. Everything else is measured
                normally.
              </p>
            )}

            {/* What it was */}
            <div className="mt-5 divide-y">
              {post.caption && (
                <Row icon={Sparkles} label="Caption">
                  <p className="whitespace-pre-line">{post.caption}</p>
                </Row>
              )}

              {(post.posted_at || dur || post.is_carousel) && (
                <Row icon={Clock} label="The post">
                  {[
                    post.posted_at
                      ? `Went up ${new Date(post.posted_at).toLocaleDateString('en-AE', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}`
                      : null,
                    post.media_type || (post.is_video ? 'Video' : null),
                    dur ? `${dur} long` : null,
                    post.is_carousel && post.carousel_media_count
                      ? `${post.carousel_media_count} frames`
                      : null,
                    post.has_audio === false ? 'No sound' : null,
                  ].filter(Boolean).join(' · ')}
                </Row>
              )}

              {post.location_name && (
                <Row icon={MapPin} label="Filmed at">{post.location_name}</Row>
              )}

              {hashtags.length > 0 && (
                <Row icon={Hash} label={`${hashtags.length} hashtags`}>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtags.map((h) => (
                      <Badge key={h} variant="secondary" className="rounded-full font-normal">
                        #{h.replace(/^#/, '')}
                      </Badge>
                    ))}
                  </div>
                </Row>
              )}

              {mentions.length > 0 && (
                <Row icon={AtSign} label={`${mentions.length} mentions`}>
                  <div className="flex flex-wrap gap-1.5">
                    {mentions.map((m) => (
                      <Badge key={m} variant="secondary" className="rounded-full font-normal">
                        @{m.replace(/^@/, '')}
                      </Badge>
                    ))}
                  </div>
                </Row>
              )}

              {(tags.length > 0 || coauthors.length > 0) && (
                <Row icon={Users} label={coauthors.length ? 'Tagged and collaborating' : 'Tagged'}>
                  {[...coauthors.map((c) => `@${c} (collaborator)`), ...tags.map((t) => `@${t}`)]
                    .join(', ')}
                </Row>
              )}

              {(post.ai_content_category || post.ai_sentiment || post.ai_language_code) && (
                <Row icon={Languages} label="Read by us">
                  {[
                    post.ai_content_category,
                    post.ai_sentiment ? `${post.ai_sentiment} in tone` : null,
                    post.ai_language_code ? post.ai_language_code.toUpperCase() : null,
                  ].filter(Boolean).join(' · ')}
                </Row>
              )}

              {post.has_audio && (
                <Row icon={Music} label="Sound">Has audio</Row>
              )}
            </div>

            <a href={post.url} target="_blank" rel="noreferrer"
               className={cn('mt-5 inline-flex items-center gap-1.5 text-[13.5px]',
                             'text-muted-foreground underline-offset-4 hover:underline')}>
              Open on Instagram <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { names as _namesForTest, num }
