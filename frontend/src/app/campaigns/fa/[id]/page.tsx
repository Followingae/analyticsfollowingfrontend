"use client"

/**
 * One influencer campaign: who has applied, and who is on it. Tier: WORKING.
 *
 * The screen had the same three faults as its list page. No padding, so it ran into the
 * sidebar. A failed load fell silently through an empty catch into a centred "No
 * applications yet" over an icon, which reads as nobody wanting the campaign when in fact
 * the read failed. And every applicant sat in a card of its own, so four applicants put
 * sixteen edges on the screen for one list of people.
 *
 * Accept and reject are the two things a brand comes here to do, so they stay exactly where
 * they were and behave exactly as they did.
 */

import { useCallback, useEffect, useState, use } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Check, X, User, BarChart3 } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FirstPartyAudienceAnalytics } from "@/components/analytics/FirstPartyAudienceAnalytics"
import { brandCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"
import {
  Empty,
  Failed,
  Page,
  PageHead,
  Sections,
  State,
  Waiting,
  type StateTone,
} from "@/components/campaigns/surface"

const APP_TONE: Record<string, StateTone> = {
  accepted: "good",
  rejected: "bad",
  pending: "warn",
  active: "good",
  completed: "info",
}

/** "View audience" trigger + dialog, shown only when the creator has real
 *  first-party Instagram data (member.analytics.has_first_party). */
function CreatorAudienceButton({ member }: { member: any }) {
  const analytics = member?.analytics
  if (!analytics?.has_first_party) {
    return <span className="text-ds-caption text-muted-foreground">Audience syncing</span>
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BarChart3 className="mr-1 h-4 w-4" />
          Audience
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member?.full_name || "Creator"}</DialogTitle>
        </DialogHeader>
        <FirstPartyAudienceAnalytics
          demographics={analytics.demographics}
          insights={analytics.insights}
          fetchedAt={analytics.fetched_at}
        />
      </DialogContent>
    </Dialog>
  )
}

/** One person in a list of people: an avatar mark, a name, a line about them, what you can
 *  do about it. Hairlines between, no box around. */
function PersonRow({
  name, meta, children,
}: { name: string; meta: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-ds-3 px-ds-4 py-ds-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-ds-full bg-muted">
        <User className="h-4 w-4 text-muted-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-ds-label">{name}</span>
        <span className="mt-1 block truncate text-ds-caption text-muted-foreground">{meta}</span>
      </span>
      <span className="flex shrink-0 items-center gap-ds-2">{children}</span>
    </div>
  )
}

export default function FACampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [applications, setApplications] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [appsState, setAppsState] = useState<"loading" | "ready" | "failed">("loading")
  const [partsState, setPartsState] = useState<"loading" | "ready" | "failed">("loading")

  const loadApps = useCallback(async () => {
    setAppsState("loading")
    try {
      const res = await brandCampaignApi.getApplications(id)
      if (res.success) {
        setApplications(res.data || [])
        setAppsState("ready")
      } else {
        setAppsState("failed")
      }
    } catch {
      setAppsState("failed")
    }
  }, [id])

  const loadParts = useCallback(async () => {
    setPartsState("loading")
    try {
      const res = await brandCampaignApi.getParticipants(id)
      if (res.success) {
        setParticipants(res.data || [])
        setPartsState("ready")
      } else {
        setPartsState("failed")
      }
    } catch {
      setPartsState("failed")
    }
  }, [id])

  useEffect(() => { loadApps(); loadParts() }, [loadApps, loadParts])

  const handleAccept = async (appId: string) => {
    try {
      await brandCampaignApi.acceptApplication(id, appId)
      toast.success("Application accepted")
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: "accepted" } : a))
    } catch { toast.error("Failed to accept") }
  }

  const handleReject = async (appId: string) => {
    try {
      await brandCampaignApi.rejectApplication(id, appId)
      toast.success("Application rejected")
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: "rejected" } : a))
    } catch { toast.error("Failed to reject") }
  }

  const pending = applications.filter((a) => a.status === "pending").length

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <Page width="page">
          <Sections>
            <PageHead
              title="Campaign details"
              sub="Creators who have asked to join, and the ones already on it."
              back={
                <Link
                  href="/campaigns/fa"
                  className="inline-flex w-fit items-center gap-ds-2 text-ds-body-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to influencer campaigns
                </Link>
              }
            />

            <Tabs defaultValue="applications" className="flex flex-col gap-ds-4">
              <TabsList>
                <TabsTrigger value="applications">
                  Applications
                  {/* Only a count we actually have. A failed read shows no badge rather than
                      a confident zero. */}
                  {appsState === "ready" && pending > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                      {pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="participants">
                  Participants
                  {partsState === "ready" && ` (${participants.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="applications" className="mt-0">
                {appsState === "loading" ? (
                  <Waiting lines={3} />
                ) : appsState === "failed" ? (
                  <Failed
                    what="We could not load the applications"
                    detail="Nobody has been accepted or rejected by this. It is a read that failed."
                    onRetry={loadApps}
                  />
                ) : applications.length === 0 ? (
                  <Empty>No creator has applied to this campaign yet.</Empty>
                ) : (
                  <div className="divide-y overflow-hidden rounded-ds-lg border">
                    {applications.map((app: any) => (
                      <PersonRow
                        key={app.id}
                        name={app.member_name || app.member?.full_name || "Influencer"}
                        meta={
                          <>
                            @{app.member_instagram || app.member?.instagram_username || "–"}
                            {(app.member_tier || app.member?.tier) &&
                              ` · ${app.member_tier || app.member?.tier}`}
                          </>
                        }
                      >
                        <CreatorAudienceButton member={app.member} />
                        {app.status === "pending" ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleReject(app.id)}>
                              <X className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                            <Button size="sm" onClick={() => handleAccept(app.id)}>
                              <Check className="mr-1 h-4 w-4" />
                              Accept
                            </Button>
                          </>
                        ) : (
                          <State tone={APP_TONE[app.status] || "neutral"}>{app.status}</State>
                        )}
                      </PersonRow>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="participants" className="mt-0">
                {partsState === "loading" ? (
                  <Waiting lines={3} />
                ) : partsState === "failed" ? (
                  <Failed
                    what="We could not load the participants"
                    detail="Everyone already on this campaign is still on it. This is a read that failed."
                    onRetry={loadParts}
                  />
                ) : participants.length === 0 ? (
                  <Empty>Nobody is on this campaign yet.</Empty>
                ) : (
                  <div className="divide-y overflow-hidden rounded-ds-lg border">
                    {participants.map((p: any) => (
                      <PersonRow
                        key={p.id}
                        name={p.member_name || p.member?.full_name || "Participant"}
                        meta={
                          p.joined_at
                            ? `Joined ${new Date(p.joined_at).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}`
                            : "–"
                        }
                      >
                        <CreatorAudienceButton member={p.member} />
                        <State tone={APP_TONE[p.status] || "neutral"}>{p.status}</State>
                      </PersonRow>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Sections>
        </Page>
      </BrandUserInterface>
    </AuthGuard>
  )
}
