"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Wallet, Search, Loader2, Instagram, ExternalLink } from "lucide-react"
import { faWalletApi } from "@/services/faAdminApi"
import { formatCurrencyAED } from "@/components/ui/currency"
import { toast } from "sonner"

const PAGE_SIZE = 50

const TIER_STYLES: Record<string, string> = {
  MEGA:  "bg-violet-500/10 text-violet-600 border-violet-300",
  MACRO: "bg-amber-500/10 text-amber-600 border-amber-300",
  MICRO: "bg-blue-500/10 text-blue-600 border-blue-300",
  NANO:  "bg-emerald-500/10 text-emerald-600 border-emerald-300",
}

interface FAWallet {
  member_id: string
  full_name: string
  instagram_username: string
  tier: string
  balance_available: number
  balance_pending_cashback: number
  balance_pending_withdrawal: number
  total_earned: number
  total_withdrawn: number
}

/** AED money cell. Amounts arrive as numbers in AED. */
function Money({ amount, className }: { amount: number | null | undefined; className?: string }) {
  return (
    <span className={`font-mono tabular-nums whitespace-nowrap ${className || ""}`}>
      <span className="text-muted-foreground text-xs mr-1">AED</span>
      {formatCurrencyAED(Number(amount) || 0)}
    </span>
  )
}

export default function FAWalletsPage() {
  const [wallets, setWallets] = useState<FAWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await faWalletApi.list({ search: search || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      const list = res?.data?.wallets ?? res?.data ?? []
      setWallets(Array.isArray(list) ? list : [])
      setTotal(res?.data?.total ?? (Array.isArray(list) ? list.length : 0))
    } catch {
      setError(true)
      toast.error("Failed to load creator wallets")
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => { load() }, [load])

  // Debounce search input → reset to first page
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0)
      setSearch(searchInput.trim())
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)
  const hasPrev = page > 0
  const hasNext = (page + 1) * PAGE_SIZE < total

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Creator Wallets</h1>
                {!loading && !error && (
                  <Badge variant="secondary" className="text-xs font-medium">{total} creators</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                Available, pending and lifetime balances for every creator (AED)
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or @username..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 w-72 h-9"
              />
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p className="text-sm">Loading wallets...</p>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <Wallet className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Couldn&apos;t load creator wallets</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={load}>Try again</Button>
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-center py-16">
                  <Wallet className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">
                    {search ? `No creators matching "${search}"` : "No creator wallets yet"}
                  </p>
                  {search && (
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearchInput("")}>Clear search</Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Pending cashback</TableHead>
                      <TableHead className="text-right">Withdrawing</TableHead>
                      <TableHead className="text-right">Lifetime earned</TableHead>
                      <TableHead className="text-right">Lifetime withdrawn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.map((w) => (
                      <TableRow key={w.member_id}>
                        <TableCell>
                          <div className="font-medium">{w.full_name || "—"}</div>
                          {w.instagram_username && (
                            <a
                              href={`https://instagram.com/${w.instagram_username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Instagram className="h-3 w-3" />
                              @{w.instagram_username}
                              <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[11px] px-2 ${TIER_STYLES[w.tier] || ""}`}>
                            {w.tier || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right"><Money amount={w.balance_available} className="font-semibold" /></TableCell>
                        <TableCell className="text-right"><Money amount={w.balance_pending_cashback} className="text-amber-600" /></TableCell>
                        <TableCell className="text-right"><Money amount={w.balance_pending_withdrawal} className="text-blue-600" /></TableCell>
                        <TableCell className="text-right text-muted-foreground"><Money amount={w.total_earned} /></TableCell>
                        <TableCell className="text-right text-muted-foreground"><Money amount={w.total_withdrawn} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {!loading && !error && wallets.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Showing {from}–{to} of {total}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
