"use client"

import { useState, useEffect, Suspense } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, History, TrendingUp, PiggyBank, Lock } from "lucide-react"
import Link from "next/link"
import { brandPoolApi } from "@/services/faAdminApi"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

function CashbackPoolContent() {
  const searchParams = useSearchParams()
  const [balance, setBalance] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const topup = searchParams.get("topup")
    if (topup === "success") toast.success("Pool topped up successfully!")
    if (topup === "cancelled") toast.info("Topup cancelled")
  }, [searchParams])

  useEffect(() => {
    async function load() {
      try {
        const [b, t, c] = await Promise.all([
          brandPoolApi.balance(),
          brandPoolApi.transactions(10, 0),
          brandPoolApi.campaigns(),
        ])
        if (b.success) setBalance(b.data)
        if (t.success) setTransactions(t.data || [])
        if (c.success) setCampaigns(c.data || [])
      } catch (e) {
        toast.error("Failed to load pool data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fmt = (cents: number) => `AED ${(cents / 100).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Cashback Pool</h1>
              <p className="text-muted-foreground text-sm">Manage your AED cashback pool for influencer campaigns</p>
            </div>
            <div className="flex gap-2">
              <Link href="/cashback-pool/transactions">
                <Button variant="outline" size="sm"><History className="h-4 w-4 mr-2" />All Transactions</Button>
              </Link>
              <Link href="/cashback-pool/topup">
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Top Up</Button>
              </Link>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
                <Wallet className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{balance ? fmt(balance.available_cents ?? 0) : "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Reserved</CardTitle>
                <Lock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{balance ? fmt(balance.reserved_cents ?? 0) : "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Distributed</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{balance ? fmt(balance.distributed_cents ?? 0) : "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Funded</CardTitle>
                <PiggyBank className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{balance ? fmt(balance.total_funded_cents ?? 0) : "—"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions yet. Top up your pool to get started.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
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
                            {new Date(t.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${t.amount_cents > 0 ? "text-green-500" : "text-red-500"}`}>
                          {t.amount_cents > 0 ? "+" : ""}{fmt(t.amount_cents)}
                        </p>
                        <Badge variant="outline" className="text-xs">{t.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Funded Campaigns */}
          {campaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Funded Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <Badge variant="secondary" className="text-xs">{c.campaign_type}</Badge>
                      </div>
                      <Badge>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </BrandUserInterface>
    </AuthGuard>
  )
}

export default function CashbackPoolPage() {
  return (
    <Suspense>
      <CashbackPoolContent />
    </Suspense>
  )
}
