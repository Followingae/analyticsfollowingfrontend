"use client"

/**
 * A creator, as a card.
 *
 * This is the one place in the brand product where a card is the right answer: a creator
 * IS an object, you click it, and the page is a grid of them. So the card stays — but
 * everything drawn inside it that was not carrying information has gone.
 *
 * What came off. Two decorative gradient washes and a blurred blob behind the avatar; a
 * bordered, tinted box around each of the two figures (a box inside a box inside a box);
 * a lift-and-shadow hover on a card that is already a link. What went on instead: the
 * avatar is half again as large, because this is an influencer product and the face is the
 * content, and the figures sit on the ground with a single hairline above them.
 *
 * The honesty fix. `formatNumber` returned the string `'0'` for a null follower count and
 * engagement showed `N/A`. A creator with no followers or 0% engagement has not been
 * measured at zero, they have FAILED to scrape, and the difference matters because these
 * cards are how a brand decides who to pay. Both now render an en dash, through the shared
 * `compact` and `percent` helpers, and the card says plainly when a profile did not scrape.
 */

import React from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Plus, BadgeCheck, Clock } from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getCountryCode } from '@/lib/countryUtils'
import { toast } from 'sonner'
import { CreatorProfile } from '@/types/creator'
import { getOptimizedCountry } from '@/utils/cdnUtils'
import { compact, percent, unmeasured, UNKNOWN } from '@/components/brand/primitives'

interface CreatorGridCardProps {
  creator: CreatorProfile
  onAnalyticsClick?: (creator: CreatorProfile) => void
  onAddClick?: (creator: CreatorProfile) => void
  showAddButton?: boolean
  isAnalyzing?: boolean
}

/** Nano / Micro / Macro / Mega, from a follower count we actually have. */
function tierOf(followers: number | null | undefined): 'nano' | 'micro' | 'macro' | 'mega' | null {
  if (unmeasured(followers, true)) return null
  const f = followers as number
  if (f >= 1_000_000) return 'mega'
  if (f >= 100_000) return 'macro'
  if (f >= 10_000) return 'micro'
  return 'nano'
}

const TIER_LABEL = { nano: 'Nano', micro: 'Micro', macro: 'Macro', mega: 'Mega' } as const

export function CreatorGridCard({
  creator,
  onAnalyticsClick,
  onAddClick,
  showAddButton = false,
  isAnalyzing = false
}: CreatorGridCardProps) {
  const router = useRouter()

  const tier = tierOf(creator.followers_count)
  const country = getOptimizedCountry(creator)
  // Both of these are failed measurements when absent OR zero, so the card can say so
  // once rather than printing two dashes and leaving the brand to guess why.
  const noFollowers = unmeasured(creator.followers_count, true)
  const noEngagement = unmeasured(creator.engagement_rate, true)

  const handleAnalyticsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAnalyticsClick) {
      onAnalyticsClick(creator)
    } else {
      if (!creator.username) {
        toast.error('Creator username is missing')
        return
      }
      router.push(`/creator-analytics/${creator.username}`)
    }
  }

  // Only a live action when a handler is wired. Without one the "Add to list" feature has
  // no home yet, so the control is rendered disabled with a tooltip rather than firing a
  // dead-end toast.
  const addComingSoon = !onAddClick
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddClick) onAddClick(creator)
  }

  const handleCardClick = () => {
    if (!creator.username) {
      toast.error('Creator username is missing')
      return
    }
    router.push(`/creator-analytics/${creator.username}`)
  }

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick()
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Open analytics for @${creator.username}`}
      className="group relative flex cursor-pointer flex-col gap-ds-3 overflow-hidden p-6 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {/* The face, at a size that lets it carry the card. Never anything written over it. */}
      <div className="flex items-start gap-ds-3">
        <div className="relative shrink-0">
          <Avatar className="h-20 w-20">
            {/* Only R2 CDN URLs. Raw Instagram CDN URLs (scontent-*.cdninstagram.com)
                are hotlink-blocked and return 403 in the browser. */}
            <AvatarImage
              src={creator.cdn_avatar_url || `https://cdn.following.ae/profiles/ig/${creator.username}/profile_picture.webp`}
              alt={creator.username}
            />
            <AvatarFallback className="bg-muted text-ds-subheading text-muted-foreground">
              {creator.full_name?.charAt(0)?.toUpperCase() || creator.username?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          {creator.is_verified && (
            <BadgeCheck className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-card text-primary" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-ds-1 pt-1">
          <h3 className="truncate text-ds-label font-semibold leading-snug">
            {creator.full_name || creator.username}
          </h3>
          <p className="truncate text-ds-body-sm text-muted-foreground">@{creator.username}</p>

          <div className="mt-ds-1 flex flex-wrap items-center gap-ds-1">
            {tier && (
              <Badge variant="secondary" className="text-ds-caption font-medium">
                {TIER_LABEL[tier]}
              </Badge>
            )}
            {country && (
              <span className="inline-flex items-center gap-ds-1 text-ds-caption text-muted-foreground">
                <ReactCountryFlag
                  countryCode={getCountryCode(country)}
                  svg
                  style={{ width: '14px', height: '10px', borderRadius: '2px' }}
                  title={country}
                />
                {country}
              </span>
            )}
            {creator.days_remaining != null && (
              <span className="inline-flex items-center gap-ds-1 text-ds-caption text-muted-foreground">
                <Clock className="h-3 w-3" />
                {creator.days_remaining}d left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* The two figures. One hairline above them says "different subject"; nothing is
          drawn around either number, and the space between them does the separating. */}
      <div className="grid grid-cols-2 gap-ds-3 border-t border-border/70 pt-ds-3">
        <div>
          <p className="text-ds-caption text-muted-foreground">Followers</p>
          <p className="mt-0.5 text-ds-heading tabular-nums">{compact(creator.followers_count, true)}</p>
        </div>
        <div>
          <p className="text-ds-caption text-muted-foreground">Engagement</p>
          <p className="mt-0.5 text-ds-heading tabular-nums">{percent(creator.engagement_rate)}</p>
        </div>
      </div>

      {/* An en dash on its own invites the reader to assume a bad creator. Said once, in
          words, it is what it actually is: our data, not their performance. */}
      {(noFollowers || noEngagement) && !isAnalyzing && (
        <p className="text-ds-caption text-muted-foreground">
          {UNKNOWN} means we have not measured this yet, not that it is zero.
        </p>
      )}

      {isAnalyzing && (
        <p className="text-ds-caption text-muted-foreground">Analysing this profile now.</p>
      )}

      {/* The AI quality score, when there is one. A figure and its caption, on the ground,
          rather than a tinted bordered strip with a progress bar restating the same number. */}
      {!isAnalyzing && creator.ai_insights?.available && creator.ai_insights?.content_quality_score != null && (
        <p className="text-ds-caption text-muted-foreground">
          Content quality{' '}
          <span className="font-semibold tabular-nums text-foreground">
            {creator.ai_insights.content_quality_score.toFixed(1)}
          </span>{' '}
          out of 10
        </p>
      )}

      <div className="mt-auto flex gap-ds-2 pt-ds-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAnalyticsClick}
          className={showAddButton ? 'flex-1' : 'w-full'}
        >
          <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
          Analytics
        </Button>
        {showAddButton && (
          addComingSoon ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* span wrapper: disabled buttons don't emit the pointer events Radix
                      Tooltip listens for. */}
                  <span className="inline-flex">
                    <Button variant="outline" size="sm" disabled aria-label="Add to list, coming soon" className="px-2">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button variant="outline" size="sm" onClick={handleAddClick} aria-label="Add to list" className="px-2">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )
        )}
      </div>
    </Card>
  )
}
