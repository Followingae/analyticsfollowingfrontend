"use client"

/**
 * Approvals — the decisions we have asked a founder for, and what came back.
 *
 * These go out as signed one-time links that need no login, which is the whole point: the
 * people who answer them are on a phone between meetings. The cost of that is that nobody
 * could see the state of them — an approval sent four days ago and never opened looked
 * exactly like one that was never raised. This is that view.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Check, X, Clock, MailQuestion } from "lucide-react"
import { toast } from "sonner"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

interface ApprovalRow {
  id: string
  entity_type: string
  action: string
  summary: string
  approver_email: string
  created_at: string
  expires_at: string | null
  decided_at: string | null
  decision: string | null
  decision_source: string | null
  decision_note: string | null
  requested_by_email: string | null
}

const ACTION_LABEL: Record<string, string> = {
  approve_creator: "Release a creator",
  confirm_rate: "Confirm a rate",
  send_proposal: "Send a proposal",
  send_agreement: "Send an agreement",
  issue_invoice: "Issue an invoice",
  payout_run: "Release a payment run",
}

const ago = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"waiting" | "answered">("waiting")

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/approvals`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Could not load")
      const j = await res.json()
      setItems(j?.data?.items ?? [])
    } catch (e) {
      toast.error((e as Error).message || "Could not load approvals")
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const waiting = useMemo(() => items.filter(i => !i.decided_at), [items])
  const answered = useMemo(() => items.filter(i => i.decided_at), [items])
  const shown = tab === "waiting" ? waiting : answered

  return (
    <AuthGuard>
      <SuperAdminInterface>
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold">Approvals</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Decisions we have asked a founder for. Each one goes out as a link they can answer
              from their phone without logging in — this is where you see whether they have.
            </p>
          </div>

          <Tabs value={tab} onValueChange={(v: string) => setTab(v as "waiting" | "answered")}>
            <TabsList>
              <TabsTrigger value="waiting">Waiting ({waiting.length})</TabsTrigger>
              <TabsTrigger value="answered">Answered ({answered.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : shown.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border">
                  <MailQuestion className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium">
                  {tab === "waiting" ? "Nothing is waiting on a founder" : "Nothing answered yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {shown.map((a) => {
                const expired = !a.decided_at && a.expires_at && new Date(a.expires_at) < new Date()
                return (
                  <Card key={a.id}>
                    <CardContent className="flex flex-wrap items-start gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{ACTION_LABEL[a.action] ?? a.action}</Badge>
                          {a.decision === "approved" && (
                            <Badge className="gap-1"><Check className="h-3 w-3" />Approved</Badge>
                          )}
                          {a.decision === "rejected" && (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <X className="h-3 w-3" />Turned down
                            </Badge>
                          )}
                          {expired && <Badge variant="outline" className="text-muted-foreground">Expired</Badge>}
                          {!a.decided_at && !expired && (
                            <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3" />{ago(a.created_at)}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm">{a.summary}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {a.approver_email}
                          {a.requested_by_email ? ` · asked by ${a.requested_by_email}` : ""}
                          {a.decided_at
                            ? ` · answered ${ago(a.decided_at)}${a.decision_source ? ` by ${a.decision_source}` : ""}`
                            : ""}
                        </p>
                        {a.decision_note && (
                          <p className="mt-1 text-xs italic text-muted-foreground">“{a.decision_note}”</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
