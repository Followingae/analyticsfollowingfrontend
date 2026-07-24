"use client"

/**
 * The operator's view of a Report Campaign.
 *
 * This screen was missing: the list linked straight to /campaigns/[id]/posts (the old
 * generic campaign screen), so the only way to actually SEE a report was to mint a
 * share link and open the public page. The report now lives in the app, and the share
 * link is one action on it rather than a prerequisite for reading it.
 *
 * Every figure here is counted. Nothing is estimated, nothing is inferred.
 */

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import {
  reportCampaignApi, shareUrlFor, type CampaignReport,
} from "@/services/reportCampaignApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft, Plus, Link2, Copy, Check, Loader2, ExternalLink, EyeOff,
  Heart, MessageCircle, Play, Users, FileImage, Info, RefreshCw,
} from "lucide-react"

const compact = (n: number | null | undefined) =>
  n == null ? null : new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n)
const full = (n: number | null | undefined) =>
  n == null ? null : new Intl.NumberFormat("en").format(n)

function Stat({ label, value, sub, icon }: {
  label: string; value: string | null; sub?: string | null; icon?: React.ReactNode
}) {
  // A figure we cannot measure renders nothing — never a zero that reads as measured.
  if (value == null) return null
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

export default function ReportCampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<CampaignReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await reportCampaignApi.report(String(id))
      setData(r.data)
      const list = await reportCampaignApi.list()
      setToken(list?.data?.campaigns?.find((c) => c.id === String(id))?.share_token ?? null)
    } catch (e) {
      setError((e as Error).message || "Could not load this report")
    }
  }, [id])

  useEffect(() => { if (id) load() }, [id, load])

  const share = async () => {
    setBusy(true)
    try {
      const r = await reportCampaignApi.createShare(String(id))
      setToken(r.data.token)
      await navigator.clipboard.writeText(shareUrlFor(r.data.token)).catch(() => {})
      setCopied(true); setTimeout(() => setCopied(false), 2000)
      toast.success(r.data.created ? "Share link created and copied" : "Existing link copied")
    } catch (e) {
      toast.error((e as Error).message || "Could not create share link")
    } finally { setBusy(false) }
  }

  const revoke = async () => {
    setConfirmRevoke(false); setBusy(true)
    try {
      await reportCampaignApi.revokeShare(String(id))
      setToken(null)
      toast.success("Link revoked")
    } catch (e) {
      toast.error((e as Error).message || "Could not revoke")
    } finally { setBusy(false) }
  }

  if (error) {
    return (
      <SuperadminLayout>
        <div className="p-6"><p className="text-sm text-muted-foreground">{error}</p></div>
      </SuperadminLayout>
    )
  }
  if (!data) {
    return (
      <SuperadminLayout>
        <div className="flex justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </SuperadminLayout>
    )
  }

  const { campaign, totals, posts, creators, tagging, measurement } = data
  const hasTagging =
    (tagging?.hashtags?.length ?? 0) > 0 ||
    (tagging?.mentions?.length ?? 0) > 0 ||
    (tagging?.tagged_accounts?.length ?? 0) > 0

  return (
    <SuperadminLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 gap-1.5 text-muted-foreground">
              <Link href="/superadmin/report-campaigns"><ArrowLeft className="h-3.5 w-3.5" /> Report campaigns</Link>
            </Button>
            <h1 className="truncate text-2xl font-semibold tracking-tight">{campaign.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{campaign.brand_name}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/campaigns/${campaign.id}/posts`}><Plus className="h-3.5 w-3.5" /> Add posts</Link>
            </Button>
            {token && (
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <a href={`/r/${token}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Client view
                </a>
              </Button>
            )}
            <Button size="sm" variant={token ? "secondary" : "default"} className="gap-1.5"
                    disabled={busy} onClick={share}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : copied ? <Check className="h-3.5 w-3.5" />
                : token ? <Copy className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              {copied ? "Copied" : token ? "Copy link" : "Create share link"}
            </Button>
            {token && (
              <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground"
                      disabled={busy} onClick={() => setConfirmRevoke(true)}>
                <EyeOff className="h-3.5 w-3.5" /> Revoke
              </Button>
            )}
          </div>
        </div>

        {totals.posts === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <FileImage className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No posts yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add the post and reel links this campaign produced and the report builds itself.
                </p>
              </div>
              <Button asChild className="mt-2 gap-1.5">
                <Link href={`/campaigns/${campaign.id}/posts`}><Plus className="h-4 w-4" /> Add posts</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Posts" value={full(totals.posts)} icon={<FileImage className="h-3.5 w-3.5" />}
                    sub={totals.video_posts ? `${totals.video_posts} video` : null} />
              <Stat label="Creators" value={full(totals.creators)} icon={<Users className="h-3.5 w-3.5" />}
                    sub={totals.combined_followers ? `${compact(totals.combined_followers)} combined followers` : null} />
              <Stat label="Engagement" value={full(totals.engagement)} icon={<Heart className="h-3.5 w-3.5" />}
                    sub={`${full(totals.likes)} likes · ${full(totals.comments)} comments`} />
              <Stat label="Video plays" value={full(totals.views)} icon={<Play className="h-3.5 w-3.5" />}
                    sub="Instagram play count — not reach" />
            </section>

            {(totals.engagement_rate_by_followers != null || totals.engagement_rate_by_views != null) && (
              <section className="grid gap-3 sm:grid-cols-2">
                {totals.engagement_rate_by_followers != null && (
                  <Stat label="Engagement rate (of followers)"
                        value={`${totals.engagement_rate_by_followers.toFixed(2)}%`}
                        sub="Engagement ÷ combined follower count" />
                )}
                {totals.engagement_rate_by_views != null && (
                  <Stat label="Engagement rate (of plays)"
                        value={`${totals.engagement_rate_by_views.toFixed(2)}%`}
                        sub="Engagement ÷ video plays" />
                )}
              </section>
            )}

            {/* Compliance evidence — captured on every scrape, previously never shown. */}
            {hasTagging && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold">What ran</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {tagging.hashtags.length > 0 && (
                    <Card><CardContent className="p-5">
                      <div className="text-xs font-medium text-muted-foreground">Hashtags used</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tagging.hashtags.slice(0, 12).map((h) => (
                          <Badge key={h.tag} variant="secondary" className="font-normal">
                            #{h.tag}<span className="ml-1 text-muted-foreground">{h.posts}</span>
                          </Badge>
                        ))}
                      </div>
                    </CardContent></Card>
                  )}
                  {tagging.tagged_accounts.length > 0 && (
                    <Card><CardContent className="p-5">
                      <div className="text-xs font-medium text-muted-foreground">Accounts tagged</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tagging.tagged_accounts.slice(0, 12).map((t) => (
                          <Badge key={t.handle} variant="secondary" className="font-normal">
                            @{t.handle}<span className="ml-1 text-muted-foreground">{t.posts}</span>
                          </Badge>
                        ))}
                      </div>
                    </CardContent></Card>
                  )}
                  {tagging.mentions.length > 0 && (
                    <Card><CardContent className="p-5">
                      <div className="text-xs font-medium text-muted-foreground">Mentioned in caption</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tagging.mentions.slice(0, 12).map((m) => (
                          <Badge key={m.handle} variant="secondary" className="font-normal">
                            @{m.handle}<span className="ml-1 text-muted-foreground">{m.posts}</span>
                          </Badge>
                        ))}
                      </div>
                    </CardContent></Card>
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
                                <AvatarFallback className="text-[10px]">{c.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="truncate font-medium">@{c.username}</div>
                                {c.followers != null && (
                                  <div className="text-xs text-muted-foreground">{compact(c.followers)} followers</div>
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
                          <td className="px-4 py-3 text-right font-medium tabular-nums">{full(c.engagement)}</td>
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {posts.map((p) => (
                    <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                       className="group overflow-hidden rounded-lg border transition-colors hover:bg-accent/40">
                      {p.thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                      )}
                      <div className="space-y-2 p-3">
                        <div className="truncate text-xs font-medium">
                          {p.creator ? `@${p.creator.username}` : "—"}
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground tabular-nums">
                          {/* Hidden counts show an em dash — 0 would claim no engagement. */}
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{p.likes != null ? compact(p.likes) : "—"}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{p.comments != null ? compact(p.comments) : "—"}</span>
                          {p.is_video && (
                            <span className="flex items-center gap-1"><Play className="h-3 w-3" />{p.plays != null ? compact(p.plays) : "—"}</span>
                          )}
                        </div>
                        {(p.tagged_users.length > 0 || p.hashtags.length > 0) && (
                          <div className="flex flex-wrap gap-1">
                            {p.tagged_users.slice(0, 2).map((u) => (
                              <span key={u} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">@{u}</span>
                            ))}
                            {p.hashtags.slice(0, 2).map((h) => (
                              <span key={h} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">#{h}</span>
                            ))}
                          </div>
                        )}
                        {p.music?.song && (
                          <div className="truncate text-[10px] text-muted-foreground">♪ {p.music.song}</div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section className="flex gap-2.5 rounded-lg border bg-muted/30 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">{measurement.note}</p>
            </section>
          </>
        )}

        <AlertDialog open={confirmRevoke} onOpenChange={(o: boolean) => !o && setConfirmRevoke(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this report link?</AlertDialogTitle>
              <AlertDialogDescription>
                Anyone holding the link for <strong>{campaign.name}</strong> — including the
                client — will stop being able to open it. You can create a new one, but it
                will be a different URL.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it live</AlertDialogCancel>
              <AlertDialogAction onClick={revoke}>Revoke link</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SuperadminLayout>
  )
}
