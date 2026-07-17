"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Eye, ExternalLink, ImageOff } from "lucide-react"
import {
  isPresent, formatPct, formatCount, CONTENT_TYPE_LABELS,
  type CreatorAnalyticsV2,
} from "@/types/creatorAnalyticsV2"

/**
 * The posts themselves.
 *
 * The rebuilt payload kept only the best and worst post, so a brand could see two
 * posts out of ninety and had no way to actually look at the creator's work. The data
 * was already bought and stored; not showing it was waste.
 *
 * Thumbnails come from our own CDN (cdn.following.ae), attached by the API. Instagram's
 * own urls are signed, expiring and hotlink-blocked — they render as broken images.
 * A post with no mirrored thumbnail shows a plain placeholder rather than a dead <img>.
 */
export function PostsTabV2({ data }: { data: CreatorAnalyticsV2 }) {
  const rp = data.recent_posts
  const [showAll, setShowAll] = useState(false)

  if (!isPresent(rp) || rp.posts.length === 0) return null

  // Only posts we hold an image for. The pipeline analyses ~113 posts per creator but
  // the CDN only ever mirrored 12, so most posts have no usable image — Instagram's own
  // urls are signed and hotlink-blocked. Rendering the rest as grey placeholders would
  // be a wall of missing images pretending to be a gallery.
  const withImages = rp.posts.filter((p) => p.thumbnail_url)
  if (withImages.length === 0) return null

  const byView = rp.measured_by === "engagement_rate_by_view"
  const posts = showAll ? withImages : withImages.slice(0, 12)

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">
          {withImages.length} post{withImages.length === 1 ? "" : "s"}
        </p>
        <p className="text-xs text-muted-foreground">
          Engagement {byView ? "measured against views" : "measured against followers"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {posts.map((p) => (
          <Card key={p.shortcode ?? p.url} className="overflow-hidden pt-0">
            <div className="relative aspect-square bg-muted">
              {p.thumbnail_url ? (
                <Image
                  src={p.thumbnail_url}
                  alt={p.caption ?? "Post"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageOff className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
              <Badge
                variant="secondary"
                className="absolute left-2 top-2 bg-background/85 backdrop-blur-sm"
              >
                {CONTENT_TYPE_LABELS[p.type] ?? p.type}
              </Badge>
              {p.engagement_rate != null && (
                <Badge className="absolute right-2 top-2 bg-background/85 text-foreground backdrop-blur-sm tabular-nums hover:bg-background/85">
                  {formatPct(p.engagement_rate)}
                </Badge>
              )}
            </div>

            <CardContent className="space-y-2 px-3 pb-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {p.likes != null && (
                  <span className="flex items-center gap-1 tabular-nums">
                    <Heart className="h-3 w-3" />{formatCount(p.likes)}
                  </span>
                )}
                {p.comments != null && (
                  <span className="flex items-center gap-1 tabular-nums">
                    <MessageCircle className="h-3 w-3" />{formatCount(p.comments)}
                  </span>
                )}
                {p.views != null && (
                  <span className="flex items-center gap-1 tabular-nums">
                    <Eye className="h-3 w-3" />{formatCount(p.views)}
                  </span>
                )}
              </div>

              {p.caption && (
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {p.caption}
                </p>
              )}

              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {withImages.length > 12 && !showAll && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
            Show all {withImages.length}
          </Button>
        </div>
      )}
    </div>
  )
}
