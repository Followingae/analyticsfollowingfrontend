/**
 * Screen 3 — Compare offers. The screen that makes Run worth paying for.
 *
 * Every offer against one brief, side by side: the creator's own price, their
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
 *   • Say "no offers yet" when the request failed. Those are two states, not one.
 */
"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Inbox, ArrowLeft, Gavel } from "lucide-react"

import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui2/empty"
import { DataTable, DataTableColumnHeader } from "@/components/ui2/data-table"

import {
  runApi,
  DELIVERABLE_LABELS,
  POPULATION_LABELS,
  type Offer,
} from "@/services/runApi"
import { StateView, FailedState, LoadingState, useAsync } from "@/components/run/async-state"
import { Followers, Money, Num, Pct, SORT_MISSING_LAST, sortValue } from "@/components/run/value"
import { BriefStatusBadge, expiryLine } from "@/components/run/brief-status"
import { PAGE_SHELL, PAGE_STACK } from "@/components/run/scale"

export const dynamic = "force-dynamic"

function CompareScreen({ briefId }: { briefId: string }) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})

  const { state, reload } = useAsync(
    () => runApi.listOffers(briefId),
    [briefId],
    (data) => data.offers.length === 0
  )

  const toggle = (id: string) =>
    setSelected((current) => ({ ...current, [id]: !current[id] }))

  const selectedIds = Object.keys(selected).filter((id) => selected[id])

  const columns = React.useMemo<ColumnDef<Offer>[]>(
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
          const offer = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={offer.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{offer.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="text-ds-label truncate">@{offer.username}</span>
                <span className="text-ds-caption text-muted-foreground truncate">
                  {POPULATION_LABELS[offer.population]}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        id: "price",
        accessorFn: (offer) => sortValue(offer.price_fils),
        ...SORT_MISSING_LAST,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Their price" />,
        cell: ({ row }) => (
          <Money fils={row.original.price_fils} className="text-ds-label" />
        ),
      },
      {
        id: "followers",
        accessorFn: (offer) => sortValue(offer.followers),
        ...SORT_MISSING_LAST,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Followers" />,
        cell: ({ row }) => <Followers value={row.original.followers} />,
      },
      {
        id: "engagement",
        accessorFn: (offer) => sortValue(offer.engagement_rate),
        ...SORT_MISSING_LAST,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Engagement" />,
        cell: ({ row }) => {
          const offer = row.original
          // A failed scrape is stated, not rendered as a zero.
          if (offer.engagement_rate === null) {
            return (
              <span
                className="text-ds-caption text-muted-foreground"
                title={
                  offer.analytics_failed
                    ? "We tried to measure this creator and the measurement failed."
                    : "We have not measured this creator yet."
                }
              >
                Not measured
              </span>
            )
          }
          return <Pct value={offer.engagement_rate} />
        },
      },
      {
        id: "reliability",
        accessorFn: (offer) => sortValue(offer.reliability_score),
        ...SORT_MISSING_LAST,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reliability" />,
        cell: ({ row }) => {
          const offer = row.original
          // No history is not a bad score. It is no score.
          if (offer.reliability_score === null) {
            return (
              <span className="text-ds-caption text-muted-foreground" title="No completed campaigns with us yet">
                No history
              </span>
            )
          }
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-ds-label tabular-nums">{offer.reliability_score}</span>
              <span className="text-ds-caption text-muted-foreground">
                over <Num value={offer.campaigns_completed} /> campaigns
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
          <Link href="/run">
            <ArrowLeft /> All briefs
          </Link>
        </Button>

        <StateView
          state={state}
          loading={() => <LoadingState label="Loading the offers" />}
          failed={(error) => (
            <FailedState error={error} onRetry={reload} what="load the offers on this brief" />
          )}
          empty={() => (
            <Empty className="border-border rounded-ds-surface border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>No offers yet</EmptyTitle>
                <EmptyDescription>
                  The brief has gone out. Creators reply with their own price, and they
                  appear here as they do.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          ready={({ offers, brief }) => (
            <>
              <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-ds-title">{brief.title}</h1>
                    <BriefStatusBadge status={brief.status} />
                  </div>
                  <p className="text-ds-body text-muted-foreground">
                    <Num value={brief.offers_count ?? offers.length} /> of{" "}
                    <Num
                      value={brief.reached_count}
                      missingReason="We could not count the reach for this brief"
                    />{" "}
                    creators replied.
                  </p>
                  {brief.status === "expired" && (
                    <p className="text-ds-body-sm text-muted-foreground border-border border-s-2 ps-3">
                      {expiryLine(brief.expiry_reason)}
                    </p>
                  )}
                </div>

                <Button
                  className="rounded-ds-control"
                  disabled={selectedIds.length === 0 || brief.status === "awarded"}
                  onClick={() =>
                    router.push(`/run/${briefId}/award?offers=${selectedIds.join(",")}`)
                  }
                >
                  <Gavel />
                  Award {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}
                  {selectedIds.length === 1 ? "creator" : "creators"}
                </Button>
              </header>

              <DataTable
                columns={columns}
                data={offers}
                filterColumn="username"
                filterPlaceholder="Search creators…"
                emptyState="No offers match that search."
              />
            </>
          )}
        />
      </div>
    </div>
  )
}

export default function RunCompareOffersPage() {
  const params = useParams<{ briefId: string }>()
  return (
    <AuthGuard>
      <BrandUserInterface>
        <CompareScreen briefId={params.briefId} />
      </BrandUserInterface>
    </AuthGuard>
  )
}
