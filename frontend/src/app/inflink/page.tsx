/**
 * Screen 1 — Inflink. Every request this brand has posted.
 *
 * Two numbers say whether it worked: how many creators it reached, and how many of
 * them came back with a quote. An expired request carries the reason it expired,
 * which is the whole difference between a list and a graveyard.
 *
 * Reach and quotes are `number | null`. A request we could not count reach for shows
 * an em dash, not 0 — "reached 0 creators" is a damning claim about our own
 * distribution and it should only ever appear when it is true.
 */
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { FileText, Plus, ArrowRight, Users, MessageSquare, CalendarClock } from "lucide-react"

import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { LockedModuleCard } from "@/components/commercial/LockedModuleCard"
import { useCommercialAccount } from "@/hooks/useCommercialAccount"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui2/empty"
import { Item, ItemContent, ItemGroup } from "@/components/ui2/item"

import { inflinkApi, DELIVERABLE_LABELS, type RfpSummary } from "@/services/inflinkApi"
import { StateView, FailedState, LoadingState, useAsync } from "@/components/inflink/async-state"
import { Num, Money } from "@/components/inflink/value"
import { RfpStatusBadge, expiryLine } from "@/components/inflink/rfp-status"
import { PAGE_SHELL, PAGE_STACK } from "@/components/inflink/scale"

export const dynamic = "force-dynamic"

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function RfpRow({ rfp }: { rfp: RfpSummary }) {
  const router = useRouter()
  const asks = rfp.deliverables
    .map((d) => `${d.quantity}× ${DELIVERABLE_LABELS[d.type] ?? d.type}`)
    .join(", ")

  return (
    <Item
      variant="outline"
      className="hover:bg-accent/40 cursor-pointer flex-col items-stretch gap-4 rounded-ds-surface p-4 transition-colors md:flex-row md:items-center md:gap-6"
      onClick={() => router.push(`/inflink/${rfp.id}`)}
    >
      <ItemContent className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ds-subheading">{rfp.title}</span>
          <RfpStatusBadge status={rfp.status} />
        </div>

        <div className="text-ds-body-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
          {asks && <span>{asks}</span>}
          {rfp.market && <span>· {rfp.market}</span>}
          {rfp.deadline_at && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" aria-hidden />
              {formatDate(rfp.deadline_at)}
            </span>
          )}
        </div>

        {/* The line that stops this being a graveyard. */}
        {rfp.status === "expired" && (
          <p className="text-ds-body-sm text-muted-foreground border-border mt-1 border-s-2 ps-3">
            {expiryLine(rfp.expiry_reason)}
          </p>
        )}
      </ItemContent>

      {/* The two numbers. Stacked on a phone, a fixed rail on a desktop. */}
      <div className="grid shrink-0 grid-cols-3 gap-4 md:w-[300px] md:gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-ds-overline text-muted-foreground inline-flex items-center gap-1">
            <Users className="size-3" aria-hidden /> Reached
          </span>
          <span className="text-ds-subheading">
            <Num value={rfp.reached_count} missingReason="We could not count the reach for this request" />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-ds-overline text-muted-foreground inline-flex items-center gap-1">
            <MessageSquare className="size-3" aria-hidden /> Quoted
          </span>
          <span className="text-ds-subheading">
            <Num value={rfp.quotes_count} missingReason="We could not count the quotes on this request" />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-ds-overline text-muted-foreground">
            {rfp.budget_mode === "pot" ? "Pot" : "Per creator"}
          </span>
          <span className="text-ds-subheading">
            <Money fils={rfp.budget_fils} missingReason="No budget set on this request" />
          </span>
        </div>
      </div>

      <ArrowRight className="text-muted-foreground hidden size-4 shrink-0 md:block" aria-hidden />
    </Item>
  )
}

function InflinkScreen() {
  const { state, reload } = useAsync(
    () => inflinkApi.listRfps(),
    [],
    (data) => data.items.length === 0
  )

  return (
    <div className={PAGE_SHELL}>
      <div className={PAGE_STACK}>
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-ds-title">Inflink</h1>
            <p className="text-ds-body text-muted-foreground max-w-prose">
              Post a request for what you want made. It goes out to creators, they come
              back with their own price, and you award the ones you want.
            </p>
          </div>
          <Button asChild className="rounded-ds-control">
            <Link href="/inflink/new">
              <Plus /> Post a request
            </Link>
          </Button>
        </header>

        <StateView
          state={state}
          loading={() => <LoadingState label="Loading your requests" />}
          failed={(error) => (
            <FailedState error={error} onRetry={reload} what="load your requests" />
          )}
          empty={() => (
            <Empty className="border-border rounded-ds-surface border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No requests yet</EmptyTitle>
                <EmptyDescription>
                  A request is shorter than a proposal. You describe what you want made
                  and what you will pay; creators come back with a price.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild className="rounded-ds-control">
                  <Link href="/inflink/new">
                    <Plus /> Post your first request
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          )}
          ready={(data) => (
            <ItemGroup className="gap-4">
              {data.items.map((rfp, index) => (
                <motion.div
                  key={rfp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
                >
                  <RfpRow rfp={rfp} />
                </motion.div>
              ))}
            </ItemGroup>
          )}
        />
      </div>
    </div>
  )
}

/**
 * The module gate, rendered at the address the brand clicked.
 *
 * Only when we positively know the answer. If the billing call failed we let them
 * through, because taking away a page somebody pays for is worse than showing a page
 * they might not - and the server refuses the writes regardless
 * (require_product_module(MODULE_RUN) on every write in app/api/brief_routes.py), so
 * nothing can be started here without the module.
 */
function InflinkPage() {
  const account = useCommercialAccount()

  if (account.state === "loaded" && !account.owns.run) {
    return (
      <div className={PAGE_SHELL}>
        <div className={PAGE_STACK}>
          <header className="flex flex-col gap-2">
            <h1 className="text-ds-title">Inflink</h1>
            <p className="text-ds-body text-muted-foreground max-w-prose">
              Post a request for what you want made and let creators come to you with
              their own price.
            </p>
          </header>
          <LockedModuleCard module="run" />
        </div>
      </div>
    )
  }

  return <InflinkScreen />
}

export default function InflinkRfpsPage() {
  return (
    <AuthGuard>
      <BrandUserInterface>
        <InflinkPage />
      </BrandUserInterface>
    </AuthGuard>
  )
}
