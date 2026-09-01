"use client"

/**
 * Every movement in and out of the cashback pool. Density tier: SCANNING.
 *
 * This is a ledger, so it is deliberately the tightest screen in the campaign area. Rows sit
 * on hairlines at the 32 to 36 pixel floor rather than in cards, amounts are right aligned so
 * they compare down the column, and the air goes around the table instead of inside it.
 *
 * Two things were dishonest here and are not any more. A failed read fell through to "No
 * transactions yet", which tells a client their pool has never moved when in fact we could
 * not ask; that is now its own state with a retry. And every amount was printed with a bare
 * U+20C3, a codepoint no shipped system font carries, so a page about money was rendering
 * empty rectangles where the currency should be.
 */

import { useCallback, useEffect, useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { brandPoolApi } from "@/services/faAdminApi"
import { toast } from "sonner"
import {
  Cell,
  Empty,
  Failed,
  Ledger,
  LedgerHead,
  Money,
  Page,
  PageHead,
  Sections,
  State,
  Waiting,
  type StateTone,
} from "@/components/campaigns/surface"

/** A movement's kind, as a word plus a tone. Money leaving is not an error, so it is never
 *  red: a routine deduction is typography, and red stays with genuine failures. */
const TYPE_STATE: Record<string, { label: string; tone: StateTone }> = {
  topup: { label: "Top up", tone: "good" },
  campaign_reserve: { label: "Reserved", tone: "warn" },
  cashback_payout: { label: "Cashback paid", tone: "info" },
  deal_payout: { label: "Deal paid", tone: "info" },
  refund: { label: "Refund", tone: "good" },
  adjustment: { label: "Adjustment", tone: "neutral" },
}

export default function PoolTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await brandPoolApi.transactions(limit, offset)
      // BE returns data:{transactions:[...], total, ...}; mirror the summary page.
      if (res.success) {
        const payload: any = res.data ?? res
        setTransactions(Array.isArray(payload) ? payload : (payload?.transactions ?? []))
        setFailed(false)
      } else {
        setFailed(true)
      }
    } catch (error) {
      console.error('Failed to load cashback transactions:', error)
      toast.error("Failed to load transactions")
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [offset])

  useEffect(() => { load() }, [load])

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <Page width="page">
          <Sections>
            <PageHead
              title="Pool transactions"
              sub="Every movement in and out of your cashback pool, newest first."
              back={
                <Link
                  href="/billing?tab=cashback-pool"
                  className="inline-flex w-fit items-center gap-ds-2 text-ds-body-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to cashback pool
                </Link>
              }
            />

            <div className="flex flex-col gap-ds-4">
              {loading ? (
                <Waiting lines={6} />
              ) : failed ? (
                <Failed
                  what="We could not load your transactions"
                  detail="Your pool has not changed, we just could not read its history. Nothing below is a real figure until this loads."
                  onRetry={load}
                />
              ) : transactions.length === 0 ? (
                <Empty>
                  {offset === 0
                    ? "Nothing has moved in or out of your pool yet."
                    : "No further transactions on this page."}
                </Empty>
              ) : (
                <Ledger>
                  <LedgerHead
                    cols={[
                      { key: "what", label: "What happened" },
                      { key: "when", label: "When" },
                      { key: "kind", label: "Kind" },
                      { key: "amount", label: "Amount", align: "right" },
                    ]}
                  />
                  <tbody>
                    {transactions.map((t: any) => {
                      const cents = Number(t.amount_cents)
                      const known = Number.isFinite(cents)
                      const incoming = known && cents > 0
                      const kind = TYPE_STATE[t.type] || {
                        label: String(t.type || "Movement").replace(/_/g, " "),
                        tone: "neutral" as StateTone,
                      }
                      return (
                        <tr key={t.id} className="border-b last:border-0">
                          <Cell className="font-medium">
                            <span className="flex items-center gap-ds-2">
                              {known &&
                                (incoming ? (
                                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                ))}
                              <span className="truncate">{t.description || kind.label}</span>
                            </span>
                          </Cell>
                          <Cell className="text-muted-foreground">
                            {t.created_at
                              ? new Date(t.created_at).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "–"}
                          </Cell>
                          <Cell>
                            <State tone={kind.tone}>{kind.label}</State>
                          </Cell>
                          <Cell align="right" className="font-medium">
                            {/* A movement whose amount did not arrive is a dash, not a zero. */}
                            {known ? (
                              <>
                                {incoming ? "+" : "−"}
                                <Money amount={Math.abs(cents) / 100} decimals={2} />
                              </>
                            ) : (
                              <Money amount={null} />
                            )}
                          </Cell>
                        </tr>
                      )
                    })}
                  </tbody>
                </Ledger>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={loading || failed || transactions.length < limit}
                >
                  Next
                </Button>
              </div>
            </div>
          </Sections>
        </Page>
      </BrandUserInterface>
    </AuthGuard>
  )
}
