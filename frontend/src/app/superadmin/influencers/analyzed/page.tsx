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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { CARD, PageHead, Stat, StatGrid } from "@/components/console/primitives"
import { Search, Users, BadgeCheck, TrendingUp, BarChart3, ArrowUpRight } from "lucide-react"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { cdnAvatar } from "@/lib/avatar"

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

/**
 * A follower count we do not have is a dash, not a zero.
 *
 * `if (!n) return "0"` caught null and undefined alongside a real zero, so a creator whose
 * analytics failed showed as a creator with no audience. On this screen in particular that
 * is the wrong way round: a failed scrape is the thing you are here to notice, and printing
 * it as a measured zero hides it among the genuinely small accounts.
 */
const fmt = (n?: number | null) => {
  if (n == null) return "—"
  if (n === 0) return "0"
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
  /**
   * A read that failed is not a database with nobody in it.
   *
   * The catch was `if (!append) setCreators([])` and nothing else, so a 500 or a dropped
   * connection landed on "No analyzed creators found" — with a line underneath explaining
   * that creators appear here once they are run through Creator Analytics. On a screen whose
   * whole subject is which creators we have measured, that is the platform reporting an
   * outage as a fact about our data. The response is also checked now: a non-2xx used to be
   * parsed as if it were a payload, and `data?.profiles ?? []` turned an error body into an
   * empty list without ever reaching the catch.
   */
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async (p: number, q: string, append: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: "24" })
      if (q) params.set("search", q)
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/influencers/analyzed?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error((body?.detail && String(body.detail)) || res.statusText || `HTTP ${res.status}`)
      }
      const json = await res.json()
      const data = json?.data ?? json
      const list: AnalyzedCreator[] = data?.profiles ?? []
      setCreators(prev => (append ? [...prev, ...list] : list))
      setTotal(data?.total ?? list.length)
      setHasMore(Boolean(data?.has_more))
      setFailure(null)
    } catch (e) {
      if (!append) { setCreators([]); setTotal(0) }
      setHasMore(false)
      setFailure(e instanceof Error && e.message ? e.message : "The request did not complete")
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
      <div className="space-y-ds-5">
        <PageHead
          title="Analyzed Creators"
          sub="Instagram creators run through Creator Analytics. Separate from the curated Master Database."
        />

        {/* Three metric cards, each with its own border, background and padding, sitting
            above a grid of cards that have borders too - so the screen opened with two
            layers of boxes before a single creator's name. The three figures are the same
            kind of thing in a row, which is the whole message a border round each was
            carrying, so the gap carries it instead and the numbers take the room.

            With the read failed there are no counts to give, so all three are a dash. A
            "0 analyzed creators" band over a broken request is the same lie in three
            places. */}
        <StatGrid cols={3}>
          <Stat icon={BarChart3} label="Analyzed creators" value={failure ? "—" : total}
                hint="Run through Creator Analytics" />
          <Stat icon={BadgeCheck} label="Verified on this page" value={failure ? "—" : verifiedCount} />
          <Stat icon={Users} label="Showing" value={failure ? "—" : creators.length}
                hint={failure ? undefined : `of ${total}`} />
        </StatGrid>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-ds-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-ds-2xl" />)}
          </div>
        ) : failure ? (
          <div className="py-ds-6 text-center">
            <p className="text-ds-subheading">Could not load the analyzed creators</p>
            <p className="mt-ds-2 text-ds-body text-muted-foreground">
              This is not an empty database. The list did not come back, so nothing on this
              screen is a count of what we hold.
            </p>
            <p className="mt-ds-2 text-ds-caption text-muted-foreground">{failure}</p>
            <Button variant="outline" size="sm" className="mt-ds-3"
                    onClick={() => { setPage(1); load(1, search, false) }}>
              Try again
            </Button>
          </div>
        ) : creators.length === 0 ? (
          /* Nothing to show is a sentence, not an illustration with three icons in it. */
          <p className="py-ds-6 text-center text-ds-body text-muted-foreground">
            {search
              ? `No analyzed creator matches "${search}".`
              : "No creator has been run through Creator Analytics yet."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-ds-3">
              {creators.map((c) => (
                /* One card per creator stays - each is a different person, which is the
                   one thing a border is for. It moves to the console card shell so its
                   radius and shadow match every other surface in here. */
                <Link key={c.id} href={`/creator-analytics/${c.username}`}
                      className={`${CARD} group block h-full bg-[var(--tone-neutral-wash)] p-ds-3 transition-colors
                                  hover:bg-black/[0.02] dark:hover:bg-white/[0.04]`}>
                      <div className="flex items-start gap-ds-2">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={cdnAvatar(c.profile_pic_url)} alt={c.username} />
                          <AvatarFallback>{(c.username || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="truncate font-medium text-sm">@{c.username}</p>
                            {c.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--tone-info-ink)]" />}
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
                      <div className="mt-ds-2 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-ds-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" /> {fmt(c.followers_count)}
                        </span>
                        <span className="flex items-center gap-ds-1 text-muted-foreground">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {c.engagement_rate != null ? `${c.engagement_rate.toFixed(2)}%` : "—"}
                        </span>
                      </div>
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
