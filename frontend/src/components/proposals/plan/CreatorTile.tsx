"use client"

/**
 * One creator on the wall.
 *
 * Every tile is the same size: a wall of equals reads as a shortlist, where varied sizes
 * imply a ranking we never made. Out of the line-up they sit in grey and come to full
 * colour when picked, so the plan is legible across the room.
 *
 * Two targets only — the tile adds or removes them, the strip opens their numbers. The
 * analytics strip is permanent rather than a hover affordance: it is how a marketing team
 * decides, so it cannot be hidden.
 */
import { memo } from "react"
import { Check, X, Users, Heart, Sparkles, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { cdnAvatar } from "@/lib/avatar"
import type { BrandInfluencer } from "@/services/adminProposalMasterApi"
import { creatorCost } from "./optimiser"

const fmt = (n?: number | null) =>
  n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`
const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-US")}`

interface Props {
  creator: BrandInfluencer
  chosen: boolean
  recommended: boolean
  why?: { title: string; value: string } | null
  showPricing: boolean
  onToggle: (c: BrandInfluencer) => void
  onOpen: (c: BrandInfluencer) => void
  onDecline: (c: BrandInfluencer) => void
  onUndecline: (c: BrandInfluencer) => void
}

export const CreatorTile = memo(function CreatorTile({
  creator: c, chosen, recommended, why, showPricing, onToggle, onOpen, onDecline, onUndecline,
}: Props) {
  const declined = !!c.declined_at
  const unread = !c.client_opened_at && !declined
  const er = c.measured?.engagement_rate ?? c.engagement_rate
  const cost = creatorCost(c)

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[20px] border bg-card shadow-sm transition-all",
        chosen ? "border-emerald-500 ring-2 ring-emerald-500/50" : "border-border",
        recommended && !chosen && "border-primary",
        declined ? "opacity-50" : "hover:-translate-y-0.5 hover:shadow-lg",
      )}
    >
      <button
        type="button"
        onClick={() => !declined && onToggle(c)}
        className="block w-full text-left"
        aria-label={chosen ? `Remove ${c.full_name || c.username}` : `Add ${c.full_name || c.username}`}
      >
        <img
          src={cdnAvatar(c.profile_image_url || undefined)}
          alt=""
          draggable={false}
          className={cn(
            "aspect-[3/4] w-full object-cover transition-[filter,transform] duration-500",
            chosen ? "grayscale-0" : "grayscale group-hover:grayscale-[.45]",
            declined && "grayscale brightness-75",
          )}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

        {why && recommended && !declined && (
          <span className="absolute left-3 top-3 z-[3] inline-flex max-w-[calc(100%-24px)] items-center gap-1.5 overflow-hidden rounded-full bg-primary px-2 py-1.5 text-[11px] font-bold text-primary-foreground shadow-md transition-[max-width] duration-300 max-w-7 group-hover:max-w-[calc(100%-24px)]">
            <Sparkles className="size-3.5 shrink-0" />
            <em className="not-italic whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">{why.title}</em>
          </span>
        )}

        <span
          className={cn(
            "absolute right-3 top-3 z-[2] grid size-8 place-items-center rounded-full border-[1.5px] backdrop-blur transition",
            chosen ? "scale-105 border-transparent bg-emerald-500 text-white" : "border-white/60 bg-black/30 text-white",
          )}
        >
          <Check className={cn("size-4 transition-opacity", chosen ? "opacity-100" : "opacity-0")} />
        </span>

        <div className="absolute inset-x-0 bottom-0 z-[2] flex flex-col gap-2 p-4 pb-[54px] text-white">
          <h3 className="flex items-center gap-1.5 text-base font-bold leading-tight tracking-[-0.03em] [text-shadow:0_2px_14px_rgba(0,0,0,.5)]">
            {c.full_name || c.username}
            {c.is_verified && <BadgeCheck className="size-4 shrink-0 opacity-85" />}
          </h3>
          <div className="flex items-center gap-4 text-[13px] font-semibold">
            <span className="inline-flex items-center gap-1.5"><Users className="size-3.5 opacity-80" />{fmt(c.followers_count)}</span>
            {er != null && <span className="inline-flex items-center gap-1.5"><Heart className="size-3.5 opacity-80" />{er.toFixed(2)}%</span>}
          </div>
          {showPricing && cost > 0 && (
            <div className="text-[15px] font-bold tracking-[-0.02em] [text-shadow:0_2px_10px_rgba(0,0,0,.5)]">{aed(cost)}</div>
          )}
        </div>
      </button>

      {!declined && (
        <>
          <button
            type="button"
            onClick={() => onOpen(c)}
            className={cn(
              "absolute inset-x-0 bottom-0 z-[3] flex items-center justify-center gap-2 border-t border-white/15 px-3 py-2.5 text-xs font-bold text-white backdrop-blur transition",
              unread ? "bg-primary text-primary-foreground" : "bg-black/50 hover:bg-primary hover:text-primary-foreground",
            )}
          >
            {unread ? "See their numbers" : "Analytics"}
          </button>
          <button
            type="button"
            onClick={() => onDecline(c)}
            title="Not for us"
            aria-label={`Turn down ${c.full_name || c.username}`}
            className="absolute right-3 top-3 z-[4] grid size-[30px] place-items-center rounded-full border border-white/25 bg-black/35 text-white opacity-0 backdrop-blur transition hover:bg-destructive group-hover:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        </>
      )}

      {declined && (
        <div className="absolute inset-x-0 bottom-0 z-[5] flex flex-col gap-1 bg-destructive px-3.5 py-3 text-white">
          <b className="text-[12.5px] font-bold">Not for us</b>
          <span className="text-xs">{c.declined_reason}</span>
          <button type="button" onClick={() => onUndecline(c)} className="mt-1 self-start text-[11.5px] font-bold underline opacity-85 hover:opacity-100">
            Undo
          </button>
        </div>
      )}
    </article>
  )
})
