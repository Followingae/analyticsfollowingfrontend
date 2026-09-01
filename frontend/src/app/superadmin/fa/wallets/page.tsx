"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
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
import { PageHead } from "@/components/console/primitives"
import { FaPage, Failed, Loading, Nothing, Section, TIER_BADGE, TONE_TEXT } from "../_ui"
import { Search, Instagram, ExternalLink } from "lucide-react"
import { faWalletApi } from "@/services/faAdminApi"
import { formatCurrencyAED } from "@/components/ui/currency"
import { toast } from "sonner"

const PAGE_SIZE = 50

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

/**
 * AED money cell. Amounts arrive as numbers in AED.
 *
 * An absent amount is a dash. `Number(amount) || 0` turned a missing balance into a
 * confident nought, which on a wallets screen reads as "this creator is owed nothing".
 */
function Money({ amount, className }: { amount: number | null | undefined; className?: string }) {
  if (amount == null) return <span className="text-muted-foreground">—</span>
  return (
    <span className={`whitespace-nowrap tabular-nums ${className || ""}`}>
      <span className="mr-1 text-xs text-muted-foreground">AED</span>
      {formatCurrencyAED(Number(amount))}
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
      toast.error("Could not load creator wallets")
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
        <FaPage>
          <PageHead
            title="Creator wallets"
            sub="What every creator is holding: available now, cashback still clearing, and what they have earned and taken out over their whole time with us. All figures in AED."
            action={
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search a name or @username"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-9 w-72 pl-9"
                />
              </div>
            }
          />

          {/* The table sat inside a Card: a rounded edge drawn around a grid that already
              has rules of its own. The card comes off; the heading and the row rule carry
              the same structure with two fewer edges. */}
          <Section
            title="Every creator"
            description={
              !loading && !error
                ? `${total} creator${total === 1 ? "" : "s"}${search ? ` matching “${search}”` : ""}`
                : undefined
            }
          >
            {loading ? (
              <Loading label="Loading wallets" />
            ) : error ? (
              <Failed what="creator wallets" onRetry={load} />
            ) : wallets.length === 0 ? (
              <div className="space-y-ds-2">
                <Nothing>
                  {search ? `No creator matches “${search}”.` : "No creator holds a wallet yet."}
                </Nothing>
                {search && (
                  <Button variant="outline" size="sm" onClick={() => setSearchInput("")}>
                    Clear the search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Cashback clearing</TableHead>
                      <TableHead className="text-right">Withdrawing</TableHead>
                      <TableHead className="text-right">Earned, all time</TableHead>
                      <TableHead className="text-right">Withdrawn, all time</TableHead>
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
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <Instagram className="h-3 w-3" />
                              @{w.instagram_username}
                              <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`px-2 text-[11px] ${TIER_BADGE[w.tier] || ""}`}>
                            {w.tier || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right"><Money amount={w.balance_available} className="font-semibold" /></TableCell>
                        <TableCell className="text-right"><Money amount={w.balance_pending_cashback} className={TONE_TEXT.warn} /></TableCell>
                        <TableCell className="text-right"><Money amount={w.balance_pending_withdrawal} /></TableCell>
                        <TableCell className="text-right text-muted-foreground"><Money amount={w.total_earned} /></TableCell>
                        <TableCell className="text-right text-muted-foreground"><Money amount={w.total_withdrawn} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Section>

          {!loading && !error && wallets.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Showing {from} to {to} of {total}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </FaPage>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
