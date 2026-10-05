/**
 * Screen 3 — Compare quotes. The screen that makes Inflink worth paying for.
 *
 * Every quote against one request, side by side: the creator's own price, their
 * followers, their real engagement, how reliably they have delivered before, and what
 * they are offering to make. Sortable on every number that matters.
 *
 * This is a decision surface, so the design is subtractive: one primary action per row
 * (select it, or don't), no badges competing for attention, no colour except where a
 * number is genuinely absent. Everything that is not a comparison has been removed.
 *
 * Three things it refuses to do:
 *   • Render 0% for a creator whose analytics failed. Those cells say "not measured",
 *     and — the part that is usually missed — they are unsortable in both directions,
 *     so our scrape failures cannot masquerade as a ranking. See value.tsx.
 *   • Show a cost or a margin. `price_fils` is the creator's own asking price; there
 *     is no second number in the type, and the service strips any that appear.
 *   • Say "no quotes yet" when the request to load them failed. Those are two
 *     states, not one.
 */
"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Inbox, ArrowLeft, Gavel, Ban } from "lucide-react"

import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui2/empty"
import { DataTable, DataTableColumnHeader } from "@/components/ui2/data-table"

import {
  inflinkApi,
  DELIVERABLE_LABELS,
  POPULATION_LABELS,
  type Quote,
} from "@/services/inflinkApi"
import { StateView, FailedState, LoadingState, useAsync } from "@/components/inflink/async-state"
import { Followers, Money, Num, Pct, SORT_MISSING_LAST, sortValue } from "@/components/inflink/value"
import { RfpStatusBadge, expiryLine } from "@/components/inflink/rfp-status"
import { PAGE_SHELL, PAGE_STACK } from "@/components/inflink/scale"

export const dynamic = "force-dynamic"

function CompareScreen({ rfpId }: { rfpId: string }) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})

  // No `isEmpty` predicate on purpose. "Nobody has quoted" is a state of the REQUEST,
  // not of the request-for-quotes: the header — its status, its reach, and the action
  // that pulls it — has to stay on screen, and a request nobody answered is precisely
  // the one a brand wants to pull. The empty case is rendered inside `ready` instead.
  const { state, reload } = useAsync(() => inflinkApi.listQuotes(rfpId), [rfpId])

  const [pulling, setPulling] = React.useState(false)
  const [confirmPull, setConfirmPull] = React.useState(false)

  const pull = async () => {
    setPulling(true)
    try {
      await inflinkApi.closeRfp(rfpId)
      setConfirmPull(false)
      toast.success("Request pulled", {
        description: "Every live quote has been withdrawn and the creators have been told.",
      })
      reload()
    } catch (error) {
      toast.error("We could not pull this request", {
        description:
          error instanceof Error ? error.message : "Nothing was changed. Please try again.",
      })
    } finally {
      setPulling(false)
    }
  }

  const toggle = (id: string) =>
    setSelected((current) => ({ ...current, [id]: !current[id] }))

  const selectedIds = Object.keys(selected).filter((id) => selected[id])

  const columns = React.useMemo<ColumnDef<Quote>[]>(
    () => [
      {
        id: "select",
        header: () => null,
        cell: ({ row }) => (
          <Checkbox
            checked={Boolean(selected[row.original.id])}
            onCheckedChange={() => toggle(row.original.id)}
            aria-label={`Select ${row.original.username}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "username",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Creator" />,
        cell: ({ row }) => {
          const quote = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={quote.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{quote.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="text-ds-label truncate">@{quote.username}</span>
                <span className="text-ds-caption text-muted-foreground truncate">
                  {POPULATION_LABELS[quote.population]}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        id: "price",
        accessorFn: (quote) => sortValue(quote.price_fils),
        ...SORT_MISSING_LAST,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Their price" />,
        cell: ({ row }) => (
          <Money fils={row.original.price_fils} className="text-ds-label" />
        ),
      },
      {
        id: "followers",
        accessorFn: (quote) => sortValue(quote.followers),
        ...SORT_MISSING_LAST,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Followers" />,
        cell: ({ row }) => <Followers value={row.original.followers} />,
      },
      {
        id: "engagement",
        accessorFn: (quote) => sortValue(quote.engagement_rate),
        ...SORT_MISSING_LAST,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Engagement" />,
        cell: ({ row }) => {
          const quote = row.original
          // A failed scrape is stated, not rendered as a zero.
          if (quote.engagement_rate === null) {
            return (
              <span
                className="text-ds-caption text-muted-foreground"
                title={
                  quote.analytics_failed
                    ? "We tried to measure this creator and the measurement failed."
                    : "We have not measured this creator yet."
                }
              >
                Not measured
              </span>
            )
          }
          return <Pct value={quote.engagement_rate} />
        },
      },
      {
        id: "reliability",
        accessorFn: (quote) => sortValue(quote.reliability_score),
        ...SORT_MISSING_LAST,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reliability" />,
        cell: ({ row }) => {
          const quote = row.original
          // No history is not a bad score. It is no score.
          if (quote.reliability_score === null) {
            return (
              <span className="text-ds-caption text-muted-foreground" title="No completed campaigns with us yet">
                No history
              </span>
            )
          }
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-ds-label tabular-nums">{quote.reliability_score}</span>
              <span className="text-ds-caption text-muted-foreground">
                over <Num value={quote.campaigns_completed} /> campaigns
              </span>
            </div>
          )
        },
      },
      {
        id: "offering",
        header: "Offering to make",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.offering.map((ask) => (
              <Badge key={ask.type} variant="secondary" className="rounded-ds-control font-normal">
                {ask.quantity}× {DELIVERABLE_LABELS[ask.type] ?? ask.type}
              </Badge>
            ))}
          </div>
        ),
      },
    ],
    [selected]
  )

  return (
    <div className={PAGE_SHELL}>
      <div className={PAGE_STACK}>
        <Button asChild variant="ghost" size="sm" className="rounded-ds-control -ms-2 w-fit">
          <Link href="/inflink">
            <ArrowLeft /> All requests
          </Link>
        </Button>

        <StateView
          state={state}
          loading={() => <LoadingState label="Loading the quotes" />}
          failed={(error) => (
            <FailedState error={error} onRetry={reload} what="load the quotes on this request" />
          )}
          // Unreachable: no isEmpty predicate is passed, so the hook never concludes
          // emptiness. Required by StateView, and required to stay honest — it must
          // not say "no quotes" over a request that simply failed to load.
          empty={() => (
            <FailedState error="" onRetry={reload} what="load the quotes on this request" />
          )}
          ready={({ quotes, rfp }) => (
            <>
              <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-ds-title">{rfp.title}</h1>
                    <RfpStatusBadge status={rfp.status} />
                  </div>
                  <p className="text-ds-body text-muted-foreground">
                    <Num value={rfp.quotes_count ?? quotes.length} /> of{" "}
                    <Num
                      value={rfp.reached_count}
                      missingReason="We could not count the reach for this request"
                    />{" "}
                    creators quoted.
                  </p>
                  {rfp.status === "expired" && (
                    <p className="text-ds-body-sm text-muted-foreground border-border border-s-2 ps-3">
                      {expiryLine(rfp.expiry_reason)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Pulling is only offered while there is something live to pull.
                      It is not destructive-styled: a brand changing their mind about
                      their own request is ordinary, and painting it red suggests they
                      are breaking something. */}
                  {rfp.status === "live" && (
                    <Button
                      variant="outline"
                      className="rounded-ds-control"
                      onClick={() => setConfirmPull(true)}
                    >
                      <Ban /> Pull this request
                    </Button>
                  )}
                  <Button
                    className="rounded-ds-control"
                    disabled={selectedIds.length === 0 || rfp.status === "awarded"}
                    onClick={() =>
                      router.push(`/inflink/${rfpId}/award?quotes=${selectedIds.join(",")}`)
                    }
                  >
                    <Gavel />
                    Award {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}
                    {selectedIds.length === 1 ? "creator" : "creators"}
                  </Button>
                </div>
              </header>

              {quotes.length === 0 ? (
                <Empty className="border-border rounded-ds-surface border border-dashed">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Inbox />
                    </EmptyMedia>
                    <EmptyTitle>No quotes yet</EmptyTitle>
                    <EmptyDescription>
                      The request has gone out. Creators reply with their own price, and
                      they appear here as they do.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <DataTable
                  columns={columns}
                  data={quotes}
                  filterColumn="username"
                  filterPlaceholder="Search creators…"
                  emptyState="No quotes match that search."
                />
              )}

              {/* The confirmation says what happens to the people who answered, by
                  name of consequence rather than "are you sure". */}
              <Dialog open={confirmPull} onOpenChange={(open: boolean) => !open && setConfirmPull(false)}>
                <DialogContent className="rounded-ds-overlay">
                  <DialogHeader>
                    <DialogTitle>Pull this request?</DialogTitle>
                    <DialogDescription asChild>
                      <div className="text-ds-body-sm flex flex-col gap-2">
                        <p>
                          It stops taking quotes and you will not be able to award it.
                          This cannot be undone — posting it again starts a new request.
                        </p>
                        <p>
                          {quotes.length === 0
                            ? "Nobody has quoted yet, so no creator is left waiting."
                            : `The ${quotes.length === 1 ? "creator" : quotes.length + " creators"} who already quoted will have their ${
                                quotes.length === 1 ? "quote" : "quotes"
                              } withdrawn, and we tell them it is not going ahead so nobody keeps making content for it.`}
                        </p>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      className="rounded-ds-control"
                      onClick={() => setConfirmPull(false)}
                    >
                      Keep it open
                    </Button>
                    <Button
                      variant="destructive"
                      className="rounded-ds-control"
                      disabled={pulling}
                      onClick={pull}
                    >
                      {pulling ? "Pulling…" : "Pull the request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        />
      </div>
    </div>
  )
}

export default function InflinkCompareQuotesPage() {
  const params = useParams<{ rfpId: string }>()
  return (
    <AuthGuard>
      <BrandUserInterface>
        <CompareScreen rfpId={params.rfpId} />
      </BrandUserInterface>
    </AuthGuard>
  )
}
