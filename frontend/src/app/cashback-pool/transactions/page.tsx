"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { brandPoolApi } from "@/services/faAdminApi"
import { toast } from "sonner"

const TYPE_COLORS: Record<string, string> = {
  topup: "bg-green-500/10 text-green-600",
  campaign_reserve: "bg-amber-500/10 text-amber-600",
  cashback_payout: "bg-blue-500/10 text-blue-600",
  deal_payout: "bg-purple-500/10 text-purple-600",
  refund: "bg-red-500/10 text-red-600",
  adjustment: "bg-gray-500/10 text-gray-600",
}

export default function PoolTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await brandPoolApi.transactions(limit, offset)
        if (res.success) setTransactions(res.data || [])
      } catch {
        toast.error("Failed to load transactions")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [offset])

  const fmt = (cents: number) => `AED ${(Math.abs(cents) / 100).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <div className="space-y-6">
          <div>
            <Link href="/cashback-pool" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" />Back to Pool
            </Link>
            <h1 className="text-2xl font-bold">Pool Transactions</h1>
            <p className="text-muted-foreground text-sm">Complete history of all pool movements</p>
          </div>

          <Card>
            <CardContent className="p-0">
              {transactions.length === 0 && !loading ? (
                <p className="text-sm text-muted-foreground text-center py-12">No transactions yet</p>
              ) : (
                <div className="divide-y">
                  {transactions.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {t.amount_cents > 0 ? (
                          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{t.description || t.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(t.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <Badge variant="outline" className={TYPE_COLORS[t.type] || ""}>{t.type?.replace("_", " ")}</Badge>
                        <p className={`text-sm font-semibold min-w-[100px] text-right ${t.amount_cents > 0 ? "text-green-500" : "text-red-500"}`}>
                          {t.amount_cents > 0 ? "+" : "-"}{fmt(t.amount_cents)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOffset(offset + limit)} disabled={transactions.length < limit}>
              Next
            </Button>
          </div>
        </div>
      </BrandUserInterface>
    </AuthGuard>
  )
}
