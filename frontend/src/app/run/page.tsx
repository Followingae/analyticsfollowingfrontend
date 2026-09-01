/**
 * Screen 1 — Briefs.
 *
 * Every brief the brand has posted, with the two numbers that say whether it worked:
 * how many creators it reached, and how many of them replied. An expired brief carries
 * the reason it expired, which is the whole difference between a list and a graveyard.
 *
 * Reach and replies are `number | null`. A brief we could not count reach for shows an
 * em dash, not 0 — "reached 0 creators" is a damning claim about our own distribution
 * and it should only ever appear when it is true.
 */
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { FileText, Plus, ArrowRight, Users, MessageSquare, CalendarClock } from "lucide-react"

import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
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

import { runApi, DELIVERABLE_LABELS, type BriefSummary } from "@/services/runApi"
import { StateView, FailedState, LoadingState, useAsync } from "@/components/run/async-state"
import { Num, Money } from "@/components/run/value"
import { BriefStatusBadge, expiryLine } from "@/components/run/brief-status"
import { PAGE_SHELL, PAGE_STACK } from "@/components/run/scale"

export const dynamic = "force-dynamic"

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function BriefRow({ brief }: { brief: BriefSummary }) {
  const router = useRouter()
  const asks = brief.deliverables
    .map((d) => `${d.quantity}× ${DELIVERABLE_LABELS[d.type] ?? d.type}`)
    .join(", ")

  return (
    <Item
      variant="outline"
      className="hover:bg-accent/40 cursor-pointer flex-col items-stretch gap-4 rounded-ds-surface p-4 transition-colors md:flex-row md:items-center md:gap-6"
      onClick={() => router.push(`/run/${brief.id}`)}
    >
      <ItemContent className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ds-subheading">{brief.title}</span>
          <BriefStatusBadge status={brief.status} />
        </div>

        <div className="text-ds-body-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
          {asks && <span>{asks}</span>}
          {brief.market && <span>· {brief.market}</span>}
          {brief.deadline_at && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" aria-hidden />
              {formatDate(brief.deadline_at)}
            </span>
          )}
        </div>

        {/* The line that stops this being a graveyard. */}
        {brief.status === "expired" && (
          <p className="text-ds-body-sm text-muted-foreground border-border mt-1 border-s-2 ps-3">
            {expiryLine(brief.expiry_reason)}
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
            <Num value={brief.reached_count} missingReason="We could not count the reach for this brief" />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-ds-overline text-muted-foreground inline-flex items-center gap-1">
            <MessageSquare className="size-3" aria-hidden /> Replied
          </span>
          <span className="text-ds-subheading">
            <Num value={brief.offers_count} missingReason="We could not count the replies for this brief" />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-ds-overline text-muted-foreground">
            {brief.budget_mode === "pot" ? "Pot" : "Per creator"}
          </span>
          <span className="text-ds-subheading">
            <Money fils={brief.budget_fils} missingReason="No budget set on this brief" />
          </span>
        </div>
      </div>

      <ArrowRight className="text-muted-foreground hidden size-4 shrink-0 md:block" aria-hidden />
    </Item>
  )
}

function BriefsScreen() {
  const { state, reload } = useAsync(
    () => runApi.listBriefs(),
    [],
    (data) => data.items.length === 0
  )

  return (
    <div className={PAGE_SHELL}>
      <div className={PAGE_STACK}>
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-ds-title">Briefs</h1>
            <p className="text-ds-body text-muted-foreground max-w-prose">
              Say what you want made. It reaches creators, they reply with their own price,
              and you pick.
            </p>
          </div>
          <Button asChild className="rounded-ds-control">
            <Link href="/run/new">
              <Plus /> Write a brief
            </Link>
          </Button>
        </header>

        <StateView
          state={state}
          loading={() => <LoadingState label="Loading your briefs" />}
          failed={(error) => (
            <FailedState error={error} onRetry={reload} what="load your briefs" />
          )}
          empty={() => (
            <Empty className="border-border rounded-ds-surface border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No briefs yet</EmptyTitle>
                <EmptyDescription>
                  A brief is shorter than a proposal. You describe what you want made and
                  what you will pay; creators come back with a price.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild className="rounded-ds-control">
                  <Link href="/run/new">
                    <Plus /> Write your first brief
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          )}
          ready={(data) => (
            <ItemGroup className="gap-4">
              {data.items.map((brief, index) => (
                <motion.div
                  key={brief.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
                >
                  <BriefRow brief={brief} />
                </motion.div>
              ))}
            </ItemGroup>
          )}
        />
      </div>
    </div>
  )
}

export default function RunBriefsPage() {
  return (
    <AuthGuard>
      <BrandUserInterface>
        <BriefsScreen />
      </BrandUserInterface>
    </AuthGuard>
  )
}
