/**
 * Screen 4 — Award.
 *
 * Awarding creates the campaign and locks every price at the number the creator asked
 * for. It cannot be undone, so it is a page rather than a dialog: a dialog over the
 * comparison table invites a reflexive confirm, and this is the one action in the
 * module with no way back.
 *
 * The confirmation shows two things before it will proceed — exactly who is being
 * awarded, and the total. Both are read from the server (`/award/preview`) rather than
 * summed in the browser from the rows that happened to be on screen, so the number the
 * brand agrees to is the number the server will charge.
 *
 * Every price here is a sell price: the creator's own asking price is the only number
 * in the flow. There is no cost to hide because the type has no field for one.
 *
 * If any awarded price is unknown, the total is null and the button stays disabled.
 * A total that quietly treats a missing price as 0 is the exact failure rule 1 exists
 * to prevent, and here it would be a financial one.
 */
"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, ArrowLeft, Gavel } from "lucide-react"

import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemGroup } from "@/components/ui2/item"

import { runApi, type AwardPreview } from "@/services/runApi"
import { FailedState, LoadingState, StateView, useAsync } from "@/components/run/async-state"
import { Money } from "@/components/run/value"
import { PAGE_SHELL, PAGE_STACK } from "@/components/run/scale"

export const dynamic = "force-dynamic"

function AwardScreen({ briefId, offerIds }: { briefId: string; offerIds: string[] }) {
  const router = useRouter()
  const [awarding, setAwarding] = React.useState(false)

  const { state, reload } = useAsync(
    () => runApi.previewAward(briefId, offerIds),
    [briefId, offerIds.join(",")],
    (data) => data.preview.count === 0
  )

  const confirm = async (preview: AwardPreview) => {
    setAwarding(true)
    try {
      const result = await runApi.award(briefId, offerIds)
      toast.success("Awarded", {
        description: `${result.awarded_count} ${result.awarded_count === 1 ? "creator is" : "creators are"} booked. Prices are locked.`,
      })
      router.push(`/run/${briefId}/workspace?campaign=${result.campaign_id}`)
    } catch (error) {
      toast.error("We could not award this brief", {
        description: error instanceof Error ? error.message : "Nothing was changed. Please try again.",
      })
      setAwarding(false)
    }
  }

  return (
    <div className={PAGE_SHELL}>
      <div className={`${PAGE_STACK} mx-auto max-w-2xl`}>
        <Button asChild variant="ghost" size="sm" className="rounded-ds-control -ms-2 w-fit">
          <Link href={`/run/${briefId}`}>
            <ArrowLeft /> Back to the offers
          </Link>
        </Button>

        <StateView
          state={state}
          loading={() => <LoadingState label="Working out the total" />}
          failed={(error) => (
            <FailedState error={error} onRetry={reload} what="work out what this would cost" />
          )}
          empty={() => (
            <FailedState
              error="No offers were selected."
              what="award anything"
              onRetry={() => router.push(`/run/${briefId}`)}
            />
          )}
          ready={({ preview }) => {
            // A total we cannot compute must not become a total the brand agrees to.
            const totalUnknown = preview.total_fils === null
            const missingPrices = preview.offers.filter((o) => o.price_fils === null)

            return (
              <div className="flex flex-col gap-6">
                <header className="flex flex-col gap-2">
                  <h1 className="text-ds-title">Award this brief</h1>
                  <p className="text-ds-body text-muted-foreground">
                    This creates the campaign and locks each creator's price at what they
                    asked for. It cannot be undone.
                  </p>
                </header>

                <section className="flex flex-col gap-3">
                  <h2 className="text-ds-overline text-muted-foreground">
                    Who is being awarded ({preview.count})
                  </h2>
                  <ItemGroup className="bg-card rounded-ds-surface divide-y border">
                    {preview.offers.map((offer) => (
                      <Item key={offer.offer_id} className="justify-between gap-4">
                        <ItemContent>
                          <span className="text-ds-label">@{offer.username}</span>
                        </ItemContent>
                        <Money
                          fils={offer.price_fils}
                          missingReason="This creator did not give a price — we cannot award them"
                          className="text-ds-label"
                        />
                      </Item>
                    ))}
                  </ItemGroup>
                </section>

                <section className="bg-muted/40 rounded-ds-surface flex flex-col gap-3 border p-4 md:p-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-ds-label">Total, locked on award</span>
                    <span className="text-ds-heading">
                      <Money
                        fils={preview.total_fils}
                        missingReason="One of these offers has no price, so there is no honest total"
                      />
                    </span>
                  </div>
                  {preview.budget_remaining_fils !== null && (
                    <div className="text-ds-body-sm text-muted-foreground flex items-baseline justify-between gap-4 border-t pt-3">
                      <span>Left in the pot after this</span>
                      <Money fils={preview.budget_remaining_fils} />
                    </div>
                  )}
                </section>

                {totalUnknown && (
                  <div className="rounded-ds-surface text-ds-body-sm flex items-start gap-3 border border-amber-500/25 bg-amber-500/5 p-4">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                    <p className="text-muted-foreground">
                      {missingPrices.length === 1
                        ? `@${missingPrices[0]?.username} has no price on their offer, so we cannot total this.`
                        : `${missingPrices.length} of these offers have no price, so we cannot total this.`}{" "}
                      Go back and deselect them, or ask us to chase the price.
                    </p>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button asChild variant="ghost" className="rounded-ds-control">
                    <Link href={`/run/${briefId}`}>Cancel</Link>
                  </Button>
                  <Button
                    onClick={() => confirm(preview)}
                    disabled={awarding || totalUnknown}
                    className="rounded-ds-control"
                  >
                    <Gavel />
                    {awarding
                      ? "Awarding…"
                      : `Award ${preview.count} ${preview.count === 1 ? "creator" : "creators"}`}
                  </Button>
                </div>
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}

function AwardPageInner() {
  const params = useParams<{ briefId: string }>()
  const search = useSearchParams()
  const offerIds = (search.get("offers") ?? "").split(",").filter(Boolean)
  return <AwardScreen briefId={params.briefId} offerIds={offerIds} />
}

export default function RunAwardPage() {
  return (
    <AuthGuard>
      <BrandUserInterface>
        <React.Suspense fallback={<LoadingState />}>
          <AwardPageInner />
        </React.Suspense>
      </BrandUserInterface>
    </AuthGuard>
  )
}
