"use client"

/**
 * One creator in the discover gallery.
 *
 * THE PHOTOGRAPH CARRIES NO TEXT.
 *
 * Three other surfaces in this product (the storefront tile, the old discover grid
 * and the service card) set the handle and the follower count on top of a
 * user-uploaded image behind a dark scrim. Because the worst upload in the grid
 * decides the scrim, every image in those grids is darkened to rescue one of them,
 * and the photography — the only thing a brand is actually here to look at — is
 * the part that pays for the legibility of the caption.
 *
 * So here the image is an image and the text is below it, on a solid surface, at
 * full contrast, with no overlay of any kind. Nothing is absolutely positioned
 * over the media element. The only things that sit near the image are the verified
 * tick and the unlocked pill, and both are in the text block underneath it.
 */

import * as React from "react"
import { BadgeCheck, Lock, MapPin } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DirectoryRow,
  countryLabel,
} from "@/services/discoveryDirectoryService"

/** 12.4K, 1.2M. Only ever called with a real number. */
function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

/**
 * An unknown engagement rate is an em dash, never 0%. A directory row has a null
 * engagement_rate whenever the profile came back with no readable posts, and a
 * zero there would read as "we measured this creator and they get no engagement".
 */
function formatEngagement(rate: number | null): string {
  if (rate === null || !Number.isFinite(rate)) return "—"
  return `${rate.toFixed(2)}%`
}

function initials(row: DirectoryRow): string {
  const source = row.full_name?.trim() || row.username
  return source.slice(0, 2).toUpperCase()
}

interface CreatorDirectoryCardProps {
  row: DirectoryRow
  onOpen: (row: DirectoryRow) => void
  busy?: boolean
}

export function CreatorDirectoryCard({
  row,
  onOpen,
  busy,
}: CreatorDirectoryCardProps) {
  const [imageFailed, setImageFailed] = React.useState(false)
  const place = row.city
    ? row.country
      ? `${row.city}, ${row.country}`
      : row.city
    : row.country
      ? countryLabel(row.country)
      : null

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-ds-surface border bg-card",
        "transition-shadow duration-200 hover:shadow-md"
      )}
    >
      {/* ---- The photograph. No children, no overlay, no gradient, no scrim. ---- */}
      {/* Not `relative`: there is deliberately no positioning context here, so
          nothing can ever be dropped on top of the photograph later. */}
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {row.cdn_avatar_url && !imageFailed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={row.cdn_avatar_url}
            alt={`${row.full_name || row.username} profile picture`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center bg-muted text-ds-title text-muted-foreground"
          >
            {initials(row)}
          </div>
        )}
      </div>

      {/* ---- Everything written, on a solid surface, beneath the image. ---- */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-ds-subheading">@{row.username}</h3>
            {row.is_verified && (
              <BadgeCheck
                className="size-4 shrink-0 text-primary"
                aria-label="Verified account"
              />
            )}
          </div>
          {row.full_name && (
            <p className="truncate text-ds-body-sm text-muted-foreground">
              {row.full_name}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {row.category && (
            <Badge variant="secondary" className="rounded-ds-sm font-normal">
              {row.category}
            </Badge>
          )}
          {/* No place on the row → no chip. Not "Unknown", not a blank chip. */}
          {place && (
            <span className="inline-flex items-center gap-1 text-ds-caption text-muted-foreground">
              <MapPin className="size-3" aria-hidden />
              {place}
            </span>
          )}
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-3 border-t pt-3">
          <div>
            <dt className="text-ds-overline text-muted-foreground">Followers</dt>
            <dd className="text-ds-body tabular-nums">
              {formatFollowers(row.followers_count)}
            </dd>
          </div>
          <div>
            <dt className="text-ds-overline text-muted-foreground">
              Engagement
            </dt>
            <dd
              className="text-ds-body tabular-nums"
              title={
                row.engagement_rate === null
                  ? "Not known for this creator"
                  : "Indicative — the measured figure comes with the full analytics"
              }
            >
              {formatEngagement(row.engagement_rate)}
            </dd>
          </div>
        </dl>

        {row.is_unlocked ? (
          <Button
            variant="secondary"
            className="w-full rounded-ds-control"
            onClick={() => onOpen(row)}
            disabled={busy}
          >
            Open analytics
            {row.unlock_days_remaining !== null && (
              <span className="ml-1 text-muted-foreground">
                · {row.unlock_days_remaining}d left
              </span>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full rounded-ds-control"
            onClick={() => onOpen(row)}
            disabled={busy}
          >
            <Lock className="size-4" aria-hidden />
            Unlock
          </Button>
        )}
      </div>
    </article>
  )
}

export { formatFollowers, formatEngagement }
