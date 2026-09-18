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
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronUp, ChevronDown, Gift, Trash2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AED, DELIVERABLE_TYPES,
  barterSubtotal, creatorSubtotal, followersLabel, unitSellPrice,
  type BarterMap, type DeliverableAssignmentMap, type MasterInfluencer,
} from "./types"

interface Props {
  addedInfluencers: MasterInfluencer[]
  deliverableAssignments: DeliverableAssignmentMap
  barter: BarterMap
  /** This whole proposal is a barter deal: everybody gets the product, and the question on
   *  each row is whether they have agreed to it. */
  isBarterProposal: boolean
  barterStates: Record<string, "asking" | "agreed" | "declined">
  onBarterState: (influencerId: string, state: "asking" | "agreed" | "declined") => void
  onToggleDeliverable: (influencerId: string, type: string) => void
  onUpdateQuantity: (influencerId: string, type: string, quantity: number) => void
  onApplyToAll: (type: string) => void
  onToggleBarter: (influencerId: string) => void
  onUpdateBarter: (influencerId: string, patch: { product?: string; valueAed?: number | null }) => void
  onRemove: (influencerId: string) => void
  onMove: (index: number, direction: -1 | 1) => void
  onOpenAnalytics: (username: string) => void
}

export function RosterPanel(p: Props) {
  const total = p.addedInfluencers.reduce(
    (sum, inf) => sum + creatorSubtotal(inf, p.deliverableAssignments[inf.id], p.barter[inf.id]),
    0
  )
  // Product is totalled apart from cash and always will be: the client hands it over
  // themselves, so adding the two would quote them a number nobody agreed to pay.
  const productTotal = barterSubtotal(p.barter, p.addedInfluencers.map((i) => i.id))
  const productCount = p.addedInfluencers.filter((i) => p.barter[i.id]?.paidInProduct).length

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
              const barter = p.barter[inf.id]
              const onProduct = Boolean(barter?.paidInProduct)
              const subtotal = creatorSubtotal(inf, assignments, barter)
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
                      {/* Has this creator agreed to THIS product?
                          The master-database flag says who usually says yes; it cannot say
                          who said yes to this hamper. Only the ones marked agreed are shown
                          to the client, so a client never picks somebody who then has to be
                          withdrawn. Somebody the database already knows takes barter starts
                          agreed; everyone else starts at asking. */}
                      {p.isBarterProposal ? (
                        <div className="flex items-center rounded-full border p-0.5">
                          {([
                            ["agreed", "Yes"],
                            ["asking", "Asking"],
                            ["declined", "No"],
                          ] as const).map(([state, label]) => {
                            // Untouched, this shows what the SERVER will decide when the
                            // row is created: a creator the master database already records
                            // as taking barter starts agreed. Defaulting the control to
                            // "asking" would have shown the operator a state that was about
                            // to be overwritten, and had them clicking to set what was
                            // already true.
                            const current = p.barterStates[inf.id]
                              ?? (inf.accepts_barter ? "agreed" : "asking")
                            const on = current === state
                            return (
                              <button
                                key={state}
                                type="button"
                                onClick={() => p.onBarterState(inf.id, state)}
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-150",
                                  on && state === "agreed" && "bg-primary text-primary-foreground",
                                  on && state === "asking" && "bg-muted-foreground/15 text-foreground",
                                  on && state === "declined" && "bg-destructive/10 text-destructive",
                                  !on && "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                      {/* Paid in product. Offered only where the master database records
                          that this creator will consider it: "will she take product" was
                          being answered from memory, per person, per deal. */}
                      {!p.isBarterProposal && inf.accepts_barter ? (
                        <Button
                          variant={onProduct ? "default" : "ghost"}
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => p.onToggleBarter(inf.id)}
                          title={inf.barter_note || "Pay this creator in product"}
                        >
                          <Gift className="h-3.5 w-3.5" />
                          {onProduct ? "In product" : "Barter"}
                        </Button>
                      ) : null}
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
                            {/* No rate on a barter deal. What this creator would have
                                charged is not what is happening here, and printing it
                                beside a product invites somebody to add the two up. */}
                            {!p.isBarterProposal && (
                              <span className="text-[10px] opacity-70 tabular-nums">
                                {AED} {price}
                              </span>
                            )}
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

                  {/* What they get instead of a fee. Two fields, both required in practice:
                      a barter row with no product named reads on the client's screen as a
                      creator working for nothing, and a value is what makes it a deal the
                      client can weigh. */}
                  {onProduct && (
                    <div className="mt-3 rounded-md border border-dashed bg-muted/30 p-2.5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          value={barter?.product ?? ""}
                          onChange={(e) => p.onUpdateBarter(inf.id, { product: e.target.value })}
                          placeholder="What they get, e.g. Dinner for two"
                          className="h-8 text-xs"
                          aria-label={`What @${inf.username} receives`}
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-muted-foreground">{AED}</span>
                          <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={barter?.valueAed ?? ""}
                            onChange={(e) => p.onUpdateBarter(inf.id, {
                              valueAed: e.target.value === "" ? null : Number(e.target.value),
                            })}
                            placeholder="Worth"
                            className="h-8 w-28 text-xs tabular-nums"
                            aria-label={`What it is worth for @${inf.username}`}
                          />
                        </div>
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {barter?.product?.trim()
                          ? "Shown to the client as product, not as a price. It is not added to what they pay."
                          : "Name the product. A barter line with nothing named reads as free."}
                      </p>
                      {inf.barter_note ? (
                        <p className="mt-1 text-[11px] text-muted-foreground/80">
                          They said: {inf.barter_note}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {p.isBarterProposal ? null : onProduct ? (
                    <p className="mt-2 text-xs font-medium tabular-nums text-muted-foreground">
                      In product{barter?.valueAed ? `: ${AED} ${barter.valueAed.toLocaleString()}` : ""}
                    </p>
                  ) : subtotal > 0 ? (
                    <p className="mt-2 text-xs font-medium text-foreground tabular-nums">
                      Subtotal: {AED} {subtotal.toLocaleString()}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* A barter roster has no money in it at all, so it counts heads instead: the
              client's allowance is a number of creators and this is how far through it the
              roster is. */}
          {p.isBarterProposal ? (
            <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                On this roster, agreed and shown to the client
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {p.addedInfluencers.filter(i => (p.barterStates[i.id] ?? (i.accepts_barter ? "agreed" : "asking")) === "agreed").length}
                <span className="text-muted-foreground"> / {p.addedInfluencers.length}</span>
              </p>
            </div>
          ) : (total > 0 || productTotal > 0) && (
            <div className="border-t bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {productCount > 0 ? "They pay" : "Total"} across {p.addedInfluencers.length} creator
                  {p.addedInfluencers.length !== 1 ? "s" : ""}
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {AED} {total.toLocaleString()}
                </p>
              </div>
              {/* The second number, never folded into the first. */}
              {productCount > 0 && (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    They hand over, to {productCount} creator{productCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm font-medium tabular-nums">
                    {AED} {productTotal.toLocaleString()} in product
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
