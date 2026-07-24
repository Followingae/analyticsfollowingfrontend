"use client"

/**
 * Public campaign performance report — no login, authorised by possession of the URL.
 *
 * Everything rendered here is COUNTED from the live posts. There is no estimated reach,
 * no sentiment, no projected value. Where a number cannot be measured the block is
 * omitted rather than filled with a zero — a client reading this is making spend
 * decisions on it.
 */

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { reportCampaignApi, type CampaignReport } from "@/services/reportCampaignApi"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Play, Users, FileImage, Loader2, ExternalLink, Info } from "lucide-react"

const compact = (n: number | null | undefined) =>
  n == null ? null : new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n)
const full = (n: number | null | undefined) =>
  n == null ? null : new Intl.NumberFormat("en").format(n)

function Logo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/followinglogo.svg" alt="Following" className={`${className} block dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Following Logo Dark Mode.svg" alt="Following" className={`${className} hidden dark:block`} />
    </>
  )
}

function Stat({ label, value, sub, icon }: {
  label: string; value: string | null; sub?: string | null; icon?: React.ReactNode
}) {
  if (value == null) return null   // never render a measured-looking zero
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {icon}{label}
        </div>
        <div className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export default function PublicCampaignReport() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<CampaignReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    reportCampaignApi
      .publicReport(String(token))
      .then((r) => setData(r.data))
      .catch((e) => setError((e as Error).message || "This report is not available"))
  }, [token])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <Logo className="mb-2 h-7 w-auto" />
        <h1 className="text-lg font-semibold">This report isn&apos;t available</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The link may have been revoked or replaced. Please ask your contact at Following for a
          current one.
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const { campaign, totals, posts, creators, tagging, measurement } = data
  const hasTagging =
    (tagging?.hashtags?.length ?? 0) > 0 ||
    (tagging?.mentions?.length ?? 0) > 0 ||
    (tagging?.tagged_accounts?.length ?? 0) > 0
  const erByFollowers = totals.engagement_rate_by_followers
  const erByViews = totals.engagement_rate_by_views

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Logo />
          <span className="text-xs text-muted-foreground">Campaign report</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <section>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{campaign.name}</h1>
            <Badge variant="secondary" className="font-normal">{campaign.brand_name}</Badge>
          </div>
          {campaign.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {campaign.description}
            </p>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Posts" value={full(totals.posts)} icon={<FileImage className="h-3.5 w-3.5" />}
                sub={totals.video_posts ? `${totals.video_posts} video` : null} />
          <Stat label="Creators" value={full(totals.creators)} icon={<Users className="h-3.5 w-3.5" />}
                sub={totals.combined_followers ? `${compact(totals.combined_followers)} combined followers` : null} />
          <Stat label="Engagement" value={full(totals.engagement)} icon={<Heart className="h-3.5 w-3.5" />}
                sub={`${full(totals.likes)} likes · ${full(totals.comments)} comments`} />
          {/* Plays, labelled as plays. Not "reach" — reach is only visible to the account owner. */}
          <Stat label="Video plays" value={full(totals.views)} icon={<Play className="h-3.5 w-3.5" />}
                sub={totals.video_posts ? `across ${totals.video_posts} video post${totals.video_posts === 1 ? "" : "s"}` : null} />
        </section>

        {(erByFollowers != null || erByViews != null) && (
          <section className="grid gap-3 sm:grid-cols-2">
            {erByFollowers != null && (
              <Stat label="Engagement rate (of followers)" value={`${erByFollowers.toFixed(2)}%`}
                    sub="Engagement ÷ combined follower count" />
            )}
            {erByViews != null && (
              <Stat label="Engagement rate (of plays)" value={`${erByViews.toFixed(2)}%`}
                    sub="Engagement ÷ video plays" />
            )}
          </section>
        )}

        {/* What the creators actually tagged. Counted from the published posts — this
            is the evidence for whether a paid deliverable met its brief. */}
        {hasTagging && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">What ran</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {tagging.hashtags.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <div className="text-xs font-medium text-muted-foreground">Hashtags used</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tagging.hashtags.slice(0, 12).map((h) => (
                        <Badge key={h.tag} variant="secondary" className="font-normal">
                          #{h.tag}
                          <span className="ml-1 text-muted-foreground">{h.posts}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {tagging.tagged_accounts.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <div className="text-xs font-medium text-muted-foreground">Accounts tagged</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tagging.tagged_accounts.slice(0, 12).map((t) => (
                        <Badge key={t.handle} variant="secondary" className="font-normal">
                          @{t.handle}
                          <span className="ml-1 text-muted-foreground">{t.posts}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {tagging.mentions.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <div className="text-xs font-medium text-muted-foreground">Mentioned in caption</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tagging.mentions.slice(0, 12).map((m) => (
                        <Badge key={m.handle} variant="secondary" className="font-normal">
                          @{m.handle}
                          <span className="ml-1 text-muted-foreground">{m.posts}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {creators.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Creators</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Creator</th>
                    <th className="px-4 py-2.5 text-right font-medium">Posts</th>
                    <th className="px-4 py-2.5 text-right font-medium">Likes</th>
                    <th className="px-4 py-2.5 text-right font-medium">Comments</th>
                    <th className="px-4 py-2.5 text-right font-medium">Plays</th>
                    <th className="px-4 py-2.5 text-right font-medium">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((c) => (
                    <tr key={c.username} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={c.avatar || undefined} alt={c.username} />
                            <AvatarFallback className="text-[10px]">
                              {c.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate font-medium">@{c.username}</div>
                            {c.followers != null && (
                              <div className="text-xs text-muted-foreground">
                                {compact(c.followers)} followers
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.posts}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{full(c.likes)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{full(c.comments)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {c.plays ? full(c.plays) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {full(c.engagement)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Posts</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                   className="group overflow-hidden rounded-lg border transition-colors hover:bg-accent/40">
                  {p.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt="" loading="lazy"
                         className="aspect-square w-full object-cover" />
                  )}
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium">
                        {p.creator ? `@${p.creator.username}` : "—"}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground tabular-nums">
                      {/* A hidden count is "—", never 0 — 0 would claim nobody engaged. */}
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />{p.likes != null ? compact(p.likes) : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />{p.comments != null ? compact(p.comments) : "—"}
                      </span>
                      {p.is_video && (
                        <span className="flex items-center gap-1" title="Instagram play count">
                          <Play className="h-3 w-3" />{p.plays != null ? compact(p.plays) : "—"}
                        </span>
                      )}
                      {p.duration_seconds != null && <span>{p.duration_seconds}s</span>}
                    </div>
                    {(p.hashtags.length > 0 || p.tagged_users.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {p.tagged_users.slice(0, 2).map((u) => (
                          <span key={u} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">@{u}</span>
                        ))}
                        {p.hashtags.slice(0, 3).map((h) => (
                          <span key={h} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">#{h}</span>
                        ))}
                      </div>
                    )}
                    {p.posted_at && (
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(p.posted_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Say plainly what these numbers are and are not. */}
        <section className="flex gap-2.5 rounded-lg border bg-muted/30 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">{measurement.note}</p>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 text-xs text-muted-foreground">
          <span>Prepared by Following</span>
          <a href="https://following.ae" target="_blank" rel="noopener noreferrer" className="hover:underline">
            following.ae
          </a>
        </div>
      </footer>
    </div>
  )
}
