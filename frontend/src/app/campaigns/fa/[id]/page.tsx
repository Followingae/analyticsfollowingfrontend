"use client"

import { useState, useEffect, use } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Check, X, User, Clock, FileCheck } from "lucide-react"
import Link from "next/link"
import { brandCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"

export default function FACampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [applications, setApplications] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [loadingParts, setLoadingParts] = useState(true)

  useEffect(() => {
    async function loadApps() {
      try {
        const res = await brandCampaignApi.getApplications(id)
        if (res.success) setApplications(res.data || [])
      } catch { /* empty */ } finally { setLoadingApps(false) }
    }
    async function loadParts() {
      try {
        const res = await brandCampaignApi.getParticipants(id)
        if (res.success) setParticipants(res.data || [])
      } catch { /* empty */ } finally { setLoadingParts(false) }
    }
    loadApps()
    loadParts()
  }, [id])

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

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <div className="space-y-6">
          <Link href="/campaigns/fa" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />Back to Influencer Campaigns
          </Link>

          <h1 className="text-2xl font-bold">Campaign Details</h1>

          <Tabs defaultValue="applications">
            <TabsList>
              <TabsTrigger value="applications">
                Applications
                {applications.filter((a) => a.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                    {applications.filter((a) => a.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="participants">Participants ({participants.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="mt-4">
              {loadingApps ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
              ) : applications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No applications yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {applications.map((app: any) => (
                    <Card key={app.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{app.member_name || app.member?.full_name || "Influencer"}</p>
                            <p className="text-sm text-muted-foreground">
                              @{app.member_instagram || app.member?.instagram_username || "—"} · {app.member_tier || app.member?.tier || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {app.status === "pending" ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleReject(app.id)}>
                                <X className="h-4 w-4 mr-1" />Reject
                              </Button>
                              <Button size="sm" onClick={() => handleAccept(app.id)}>
                                <Check className="h-4 w-4 mr-1" />Accept
                              </Button>
                            </>
                          ) : (
                            <Badge variant={app.status === "accepted" ? "default" : "destructive"}>
                              {app.status}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="participants" className="mt-4">
              {loadingParts ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
              ) : participants.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No participants yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {participants.map((p: any) => (
                    <Card key={p.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">{p.member_name || p.member?.full_name || "Participant"}</p>
                            <p className="text-sm text-muted-foreground">
                              Joined {new Date(p.joined_at).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </BrandUserInterface>
    </AuthGuard>
  )
}
