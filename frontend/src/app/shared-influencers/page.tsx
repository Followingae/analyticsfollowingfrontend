"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { superadminApiService } from "@/services/superadminApi"
import { toast } from "sonner"
import type { SharedInfluencerForUser } from "@/types/influencerDatabase"
import { formatCount, formatCents, getEngagementColor } from "@/types/influencerDatabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Users, Loader2, CheckCircle, Inbox } from "lucide-react"

export default function SharedInfluencersPage() {
  const [influencers, setInfluencers] = useState<SharedInfluencerForUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const loadShared = useCallback(async () => {
    try {
      setLoading(true)
      const result = await superadminApiService.getSharedInfluencersForUser()
      if (result.success && result.data) {
        const data = result.data as any
        setInfluencers(data.influencers || data || [])
      }
    } catch {
      toast.error("Failed to load shared influencers")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadShared()
  }, [loadShared])

  const filtered = influencers.filter((inf) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      inf.username.toLowerCase().includes(q) ||
      inf.full_name.toLowerCase().includes(q) ||
      inf.categories.some((c) => c.toLowerCase().includes(q))
    )
  })

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8" />
              Shared Influencers
            </h1>
            <p className="text-muted-foreground">
              Influencer profiles shared with your account
            </p>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, username, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Influencers</CardTitle>
              <CardDescription>
                {filtered.length} influencer{filtered.length !== 1 ? "s" : ""} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>
                    {influencers.length === 0
                      ? "No influencers have been shared with your account"
                      : "No influencers match your search"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Followers</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Sell Price (Post)</TableHead>
                      <TableHead>Sell Price (Reel)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inf) => (
                      <TableRow key={inf.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {inf.profile_image_url ? (
                                <img
                                  src={inf.profile_image_url}
                                  alt={inf.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                inf.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">@{inf.username}</span>
                                {inf.is_verified && (
                                  <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{inf.full_name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCount(inf.followers_count)}
                        </TableCell>
                        <TableCell>
                          {inf.engagement_rate !== undefined ? (
                            <span className={`font-medium ${getEngagementColor(inf.engagement_rate)}`}>
                              {inf.engagement_rate.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {inf.categories.slice(0, 3).map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {inf.sell_pricing?.sell_post_price_usd_cents != null
                            ? formatCents(inf.sell_pricing.sell_post_price_usd_cents)
                            : <span className="text-muted-foreground">--</span>}
                        </TableCell>
                        <TableCell>
                          {inf.sell_pricing?.sell_reel_price_usd_cents != null
                            ? formatCents(inf.sell_pricing.sell_reel_price_usd_cents)
                            : <span className="text-muted-foreground">--</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
