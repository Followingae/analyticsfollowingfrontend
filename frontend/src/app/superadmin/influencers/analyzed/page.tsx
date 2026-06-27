"use client"

/**
 * Superadmin → Influencer Database → Analyzed Creators.
 *
 * The creators run through Creator Analytics (the `profiles` table) - distinct
 * from the curated Master Database and from Add/Import. Each links to the full
 * /creator-analytics/[username] report.
 */

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { StandardMetricCard } from "@/components/ui/standard-metric-card"
import { Search, Users, BadgeCheck, TrendingUp, BarChart3, ArrowUpRight } from "lucide-react"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

export const dynamic = "force-dynamic"

interface AnalyzedCreator {
  id: string
  username: string
  full_name?: string
  profile_pic_url?: string
  followers_count?: number
  engagement_rate?: number | null
  is_verified?: boolean
  category?: string
  content_type?: string
}

const fmt = (n?: number) => {
  if (!n) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function AnalyzedCreatorsPage() {
  const [creators, setCreators] = useState<AnalyzedCreator[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async (p: number, q: string, append: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: "24" })
      if (q) params.set("search", q)
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/influencers/analyzed?${params}`)
      const json = await res.json()
      const data = json?.data ?? json
      const list: AnalyzedCreator[] = data?.profiles ?? []
      setCreators(prev => (append ? [...prev, ...list] : list))
      setTotal(data?.total ?? list.length)
      setHasMore(Boolean(data?.has_more))
    } catch {
      if (!append) setCreators([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search, false) }, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [search, load])

  const verifiedCount = creators.filter(c => c.is_verified).length

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analyzed Creators</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Instagram creators run through Creator Analytics. Separate from the curated Master Database.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StandardMetricCard icon={BarChart3} label="Analyzed Creators" value={total} subtitle="in the analytics DB" />
          <StandardMetricCard icon={BadgeCheck} label="Verified (this page)" value={verifiedCount} />
          <StandardMetricCard icon={Users} label="Showing" value={creators.length} subtitle={`of ${total}`} />
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading && creators.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
          </div>
        ) : creators.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No analyzed creators found"
              description={search ? "Try a different search." : "Creators appear here once they're run through Creator Analytics."}
              icons={[Search, Users, BarChart3]}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {creators.map((c) => (
                <Link key={c.id} href={`/creator-analytics/${c.username}`}>
                  <Card className="group h-full transition-colors hover:bg-accent/40">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={c.profile_pic_url || undefined} alt={c.username} />
                          <AvatarFallback>{(c.username || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="truncate font-medium text-sm">@{c.username}</p>
                            {c.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
                            <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{c.full_name || "-"}</p>
                          {(c.content_type || c.category) && (
                            <Badge variant="secondary" className="mt-1.5 capitalize text-[10px]">
                              {c.content_type || c.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" /> {fmt(c.followers_count)}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {c.engagement_rate != null ? `${c.engagement_rate.toFixed(2)}%` : "-"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => { const next = page + 1; setPage(next); load(next, search, true) }}
                >
                  {loading ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </SuperadminLayout>
  )
}
