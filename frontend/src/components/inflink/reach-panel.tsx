/**
 * Step 2 — who this request reaches, shown before it is posted, split by population.
 *
 * This is the best screen in the module and the reason step 2 exists at all: a real
 * count of creators who match what the brand just described, produced by the same
 * query the fan-out runs a moment later. Not an impressions estimate, not a reach
 * multiple, not a model. The same filters, the same ceiling, the same rows.
 *
 * It has to stay honest now that one of the two populations cannot be reached, and
 * that takes THREE states per slice, not two:
 *
 *   counted      a number. Shown.
 *   unreachable  Inflink has not built the endpoint, so this request will not reach
 *                that population — and we know it will not. The slice says so in
 *                words, and the combined total is OUR count, because our count is
 *                genuinely the whole of what goes out.
 *   uncounted    we asked and could not tell. The slice says so, and the total is
 *                WITHHELD, because a total that may be missing a population the
 *                request will still reach is the one number here that would mislead.
 *
 * The middle state is new, and it is the fix. Treating "there is no door" as "we
 * could not count" withheld the total forever and implied there were creators out
 * there we had merely failed to count. There are not. There is no door.
 */
"use client"

import * as React from "react"
import { motion } from "motion/react"
import { AlertTriangle, Info, Users } from "lucide-react"

import {
  POPULATION_BLURBS,
  POPULATION_LABELS,
  type ReachEstimate,
  type ReachSlice,
} from "@/services/inflinkApi"
import { Followers, Money, Num } from "@/components/inflink/value"

/** Why a slice has no number, said to the person rather than to the log. */
const NO_COUNT: Record<"unreachable" | "uncounted", string> = {
  unreachable:
    "These creators are not reachable at the moment, so this request will not go to " +
    "them. Everything above still goes out, and nothing here is waiting on it.",
  uncounted:
    "We could not count this population right now. Posting still reaches it, we just " +
    "cannot tell you how many before you do.",
}

function Slice({ slice, index }: { slice: ReachSlice; index: number }) {
  const { status } = slice
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

      {status === "counted" ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-ds-display">
              <Num value={slice.creators} missingReason="Not counted" />
            </span>
            <span className="text-ds-body-sm text-muted-foreground">
              {slice.creators === 1 ? "creator" : "creators"}
            </span>
          </div>

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
        </>
      ) : (
        /* No number, and the reason it has none. Never a 0, and never an em dash on
           its own — an em dash with no sentence next to it reads as a failure of
           ours whether or not anything failed. */
        <div className="flex items-start gap-3">
          {status === "unreachable" ? (
            <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          )}
          <p className="text-ds-body-sm text-muted-foreground">{NO_COUNT[status]}</p>
        </div>
      )}
    </motion.div>
  )
}

export function ReachPanel({ reach }: { reach: ReachEstimate }) {
  const unreachable = reach.slices.filter((slice) => slice.status === "unreachable")

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-muted/40 rounded-ds-surface flex flex-col gap-2 border p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <Users className="text-muted-foreground size-5 shrink-0" aria-hidden />
          <div className="flex flex-col">
            <span className="text-ds-label">This request reaches</span>
            <span className="text-ds-body-sm text-muted-foreground">
              Creators who match what you asked for, counted now.
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-ds-title">
            {/* Withheld only while a population is genuinely uncounted. */}
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
            total. The request will still reach both when you post it.
          </p>
        </div>
      )}

      {!reach.partial && unreachable.length > 0 && (
        <div className="rounded-ds-surface text-ds-body-sm flex items-start gap-3 border bg-muted/30 p-4">
          <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-muted-foreground">
            {unreachable.map((slice) => POPULATION_LABELS[slice.population]).join(" and ")}{" "}
            {unreachable.length === 1 ? "is" : "are"} not reachable at the moment, so the
            total above is everyone this request goes to. Nothing is pending and there is
            nothing to retry.
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
