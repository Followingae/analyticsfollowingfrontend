/**
 * Step 2 — who this brief reaches, shown before it is posted, split by population.
 *
 * This is the one screen that makes the two-product argument visible: Following
 * creators and Inflink creators are two different populations, and a brief reaches
 * both. Showing them as one blended number would hide exactly the thing worth seeing.
 *
 * The reach number here is real — it comes from `POST /run/briefs/reach`, which counts
 * creators matching the draft. It is not an impressions estimate and it is not
 * multiplied by anything. If a population cannot be counted, that slice shows an em
 * dash and the total is withheld: a total that silently omits a failed slice is worse
 * than no total, because the brand would post against it.
 */
"use client"

import * as React from "react"
import { motion } from "motion/react"
import { AlertTriangle, Users } from "lucide-react"

import {
  POPULATION_BLURBS,
  POPULATION_LABELS,
  type ReachEstimate,
  type ReachSlice,
} from "@/services/runApi"
import { Followers, Money, Num } from "@/components/run/value"

function Slice({ slice, index }: { slice: ReachSlice; index: number }) {
  const uncounted = slice.creators === null
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className="bg-card rounded-ds-surface flex flex-col gap-4 border p-4 md:p-6"
    >
      <div className="flex flex-col gap-1">
        <span className="text-ds-label">{POPULATION_LABELS[slice.population]}</span>
        <span className="text-ds-body-sm text-muted-foreground">
          {POPULATION_BLURBS[slice.population]}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-ds-display">
          <Num
            value={slice.creators}
            missingReason="We could not count this population for this brief"
          />
        </span>
        <span className="text-ds-body-sm text-muted-foreground">
          {slice.creators === 1 ? "creator" : "creators"}
        </span>
      </div>

      {uncounted ? (
        <p className="text-ds-body-sm text-muted-foreground">
          We could not count this population right now. Posting still reaches it, we
          just cannot tell you how many before you do.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-ds-overline text-muted-foreground">Combined followers</span>
            <span className="text-ds-subheading">
              <Followers value={slice.followers} missingReason="Not counted" />
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-ds-overline text-muted-foreground">Typical price</span>
            <span className="text-ds-subheading">
              <Money
                fils={slice.median_price_fils}
                missingReason="Not enough priced creators to say"
              />
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export function ReachPanel({ reach }: { reach: ReachEstimate }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-muted/40 rounded-ds-surface flex flex-col gap-2 border p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <Users className="text-muted-foreground size-5 shrink-0" aria-hidden />
          <div className="flex flex-col">
            <span className="text-ds-label">This brief reaches</span>
            <span className="text-ds-body-sm text-muted-foreground">
              Creators who match what you asked for, across both populations.
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-ds-title">
            {/* Withheld rather than summed when a slice failed. */}
            <Num
              value={reach.total_creators}
              missingReason="One population could not be counted, so a total would be misleading"
            />
          </span>
          <span className="text-ds-body-sm text-muted-foreground">creators</span>
        </div>
      </div>

      {reach.partial && (
        <div className="rounded-ds-surface text-ds-body-sm flex items-start gap-3 border border-amber-500/25 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <p className="text-muted-foreground">
            One of the two populations did not answer, so we are not showing a combined
            total. The brief will still reach both when you post it.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reach.slices.map((slice, index) => (
          <Slice key={slice.population} slice={slice} index={index} />
        ))}
      </div>
    </div>
  )
}
