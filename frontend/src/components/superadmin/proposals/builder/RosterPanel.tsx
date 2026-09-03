"use client"

/**
 * The right half of the builder's workbench: the roster as it currently stands.
 *
 * This used to sit underneath the search results, which meant an operator
 * assembling a list could never see the list and the results at the same time.
 * Everything it had is still here — avatar, handle, followers, tier, category
 * badges, the Analytics button, the remove button, the seven deliverable pills
 * with their sell prices, the quantity steppers, the per-creator subtotal and
 * the proposal total.
 *
 * New: the roster's order is the order the creators are submitted in, so it can
 * be arranged; and a deliverable can be applied across the whole roster in one
 * click instead of seven times each.
 *
 * Sell prices only. Cost and margin are leadership-only and live nowhere in
 * this builder.
 */

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronUp, ChevronDown, Trash2, Users } from "lucide-react"
import {
  AED, DELIVERABLE_TYPES,
  creatorSubtotal, followersLabel, unitSellPrice,
  type DeliverableAssignmentMap, type MasterInfluencer,
} from "./types"

interface Props {
  addedInfluencers: MasterInfluencer[]
  deliverableAssignments: DeliverableAssignmentMap
  onToggleDeliverable: (influencerId: string, type: string) => void
  onUpdateQuantity: (influencerId: string, type: string, quantity: number) => void
  onApplyToAll: (type: string) => void
  onRemove: (influencerId: string) => void
  onMove: (index: number, direction: -1 | 1) => void
  onOpenAnalytics: (username: string) => void
}

export function RosterPanel(p: Props) {
  const total = p.addedInfluencers.reduce(
    (sum, inf) => sum + creatorSubtotal(inf, p.deliverableAssignments[inf.id]),
    0
  )

  /* Which bulk pills are worth offering: only deliverables somebody is priced for. */
  const bulkTypes = DELIVERABLE_TYPES.filter((dt) =>
    p.addedInfluencers.some((inf) => unitSellPrice(inf, dt.key) != null)
  )

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-medium">
            Roster
            <span className="ml-1.5 text-muted-foreground tabular-nums font-normal">
              {p.addedInfluencers.length}
            </span>
          </h3>
          {total > 0 && (
            <span className="text-sm font-semibold tabular-nums">
              {AED} {total.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {p.addedInfluencers.length === 0
            ? "Nothing added yet"
            : `Added Influencers (${p.addedInfluencers.length}): this order is the order they are sent in`}
        </p>
      </div>

      {p.addedInfluencers.length === 0 ? (
        <div className="px-4 py-14 text-center">
          <Users className="h-6 w-6 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm text-muted-foreground">
            Search on the left and add creators here.
          </p>
        </div>
      ) : (
        <>
          {/* Apply one deliverable across the whole roster */}
          {bulkTypes.length > 0 && (
            <div className="px-4 py-3 border-b bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Apply to everyone
              </p>
              <div className="flex flex-wrap gap-1.5">
                {bulkTypes.map((dt) => (
                  <button
                    key={dt.key}
                    type="button"
                    onClick={() => p.onApplyToAll(dt.key)}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-[640px] overflow-auto divide-y">
            {p.addedInfluencers.map((inf, index) => {
              const assignments = p.deliverableAssignments[inf.id] || []
              const subtotal = creatorSubtotal(inf, assignments)
              return (
                <div key={inf.id} className="px-4 py-3">
                  {/* Identity row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex flex-col -my-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => p.onMove(index, -1)}
                          className="text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-25 disabled:hover:text-muted-foreground/60"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={index === p.addedInfluencers.length - 1}
                          onClick={() => p.onMove(index, 1)}
                          className="text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-25 disabled:hover:text-muted-foreground/60"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={inf.profile_image_url} />
                        <AvatarFallback className="text-xs">
                          {(inf.username?.[0] ?? "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 leading-tight">
                        <p className="text-sm font-medium truncate">@{inf.username}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {followersLabel(inf.followers_count)} followers
                          </span>
                          {inf.tier && (
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {inf.tier}
                            </Badge>
                          )}
                          {(inf.categories ?? []).slice(0, 2).map((c) => (
                            <Badge key={c} variant="secondary" className="text-[10px]">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => p.onOpenAnalytics(inf.username)}
                      >
                        Analytics
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground transition-colors duration-150 hover:text-destructive"
                        onClick={() => p.onRemove(inf.id)}
                        aria-label={`Remove @${inf.username}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DELIVERABLE_TYPES.map((dt) => {
                      const price = unitSellPrice(inf, dt.key)
                      if (price == null) return null
                      const assignment = assignments.find((d) => d.type === dt.key)
                      const isActive = Boolean(assignment)
                      return (
                        <div key={dt.key} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => p.onToggleDeliverable(inf.id, dt.key)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                              isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                            }`}
                          >
                            {dt.label}
                            <span className="text-[10px] opacity-70 tabular-nums">
                              {AED} {price}
                            </span>
                          </button>
                          {isActive && (
                            <div className="flex items-center border rounded-md overflow-hidden">
                              <button
                                type="button"
                                aria-label={`One fewer ${dt.label}`}
                                className="px-1.5 py-0.5 text-xs transition-colors duration-150 hover:bg-muted"
                                onClick={() =>
                                  p.onUpdateQuantity(inf.id, dt.key, (assignment?.quantity || 1) - 1)
                                }
                              >
                                -
                              </button>
                              <span className="px-1.5 py-0.5 text-xs font-medium tabular-nums min-w-[20px] text-center border-x">
                                {assignment?.quantity || 1}
                              </span>
                              <button
                                type="button"
                                aria-label={`One more ${dt.label}`}
                                className="px-1.5 py-0.5 text-xs transition-colors duration-150 hover:bg-muted"
                                onClick={() =>
                                  p.onUpdateQuantity(inf.id, dt.key, (assignment?.quantity || 1) + 1)
                                }
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {subtotal > 0 && (
                    <p className="mt-2 text-xs font-medium text-foreground tabular-nums">
                      Subtotal: {AED} {subtotal.toLocaleString()}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Total across {p.addedInfluencers.length} creator
                {p.addedInfluencers.length !== 1 ? "s" : ""}
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {AED} {total.toLocaleString()}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
