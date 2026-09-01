"use client"

/**
 * Approvals — the decisions we have asked a founder for, and what came back.
 *
 * These go out as signed one-time links that need no login, which is the whole point: the
 * people who answer them are on a phone between meetings. The cost of that is that nobody
 * could see the state of them — an approval sent four days ago and never opened looked
 * exactly like one that was never raised. This is that view.
 *
 * Each request was a bordered card holding one sentence and a row of badges, stacked. That
 * is one edge per decision, and the edges said nothing the gap between rows did not. They
 * are list rows in one panel now, and the state a row is in carries a dot as well as a
 * word, so it survives a print-out and reads for anyone who cannot separate the colours.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Clock } from "lucide-react"
import { toast } from "sonner"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { Empty, PageHead, Panel, Row, type Tone } from "@/components/console/primitives"

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

  /**
   * A refused read is not "nothing is waiting on a founder".
   *
   * The catch toasted and left `items` at [], so a 500 drew the empty state: an all clear,
   * on the screen whose only job is to say what a founder still owes an answer to. The
   * failure is held so the page can say the list did not come back.
   */
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    setFailure(null)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/approvals`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Could not load")
      const j = await res.json()
      setItems(j?.data?.items ?? [])
    } catch (e) {
      const msg = (e as Error).message || "Could not load approvals"
      setFailure(msg)
      toast.error(msg)
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
        <div className="mx-auto max-w-4xl space-y-ds-5 p-4 md:p-7">
          <PageHead
            title="Approvals"
            sub="Decisions we have asked a founder for. Each one goes out as a link they can answer from their phone without logging in, so this is where you see whether they have."
          />

          {failure ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Could not load the approvals.</p>
              <p className="text-sm text-muted-foreground">
                {failure}. This is not an all clear: something may still be waiting on a founder.
              </p>
              <Button variant="outline" size="sm" onClick={() => { setLoading(true); load() }}>
                Try again
              </Button>
            </div>
          ) : loading ? (
            <Skeleton className="h-[320px] rounded-ds-2xl" />
          ) : (
            <>
              <Tabs value={tab} onValueChange={(v: string) => setTab(v as "waiting" | "answered")}>
                <TabsList>
                  <TabsTrigger value="waiting">Waiting ({waiting.length})</TabsTrigger>
                  <TabsTrigger value="answered">Answered ({answered.length})</TabsTrigger>
                </TabsList>
              </Tabs>

              <Panel
                title={tab === "waiting" ? "Waiting on a founder" : "Answered"}
                description={tab === "waiting"
                  ? "How long each one has sat there"
                  : "What came back, and who sent it"}
                flush
              >
                {shown.map((a) => {
                  const expired = !a.decided_at && a.expires_at && new Date(a.expires_at) < new Date()
                  const tone: Tone =
                    a.decision === "approved" ? "good"
                    : a.decision === "rejected" ? "neutral"
                    : expired ? "bad"
                    : "warn"
                  return (
                    <Row
                      key={a.id}
                      tone={tone}
                      title={
                        <span className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{ACTION_LABEL[a.action] ?? a.action}</Badge>
                          <span className="min-w-0 truncate font-normal">{a.summary}</span>
                        </span>
                      }
                      meta={
                        <>
                          {a.approver_email}
                          {a.requested_by_email ? ` · asked by ${a.requested_by_email}` : ""}
                          {a.decided_at
                            ? ` · answered ${ago(a.decided_at)}${a.decision_source ? ` by ${a.decision_source}` : ""}`
                            : ""}
                          {a.decision_note ? ` · “${a.decision_note}”` : ""}
                        </>
                      }
                      right={
                        <>
                          {a.decision === "approved" && (
                            <Badge variant="outline" className="gap-1 border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]">
                              <Check className="h-3 w-3" />Approved
                            </Badge>
                          )}
                          {a.decision === "rejected" && (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <X className="h-3 w-3" />Turned down
                            </Badge>
                          )}
                          {expired && (
                            <Badge variant="outline" className="border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]">
                              Expired
                            </Badge>
                          )}
                          {!a.decided_at && !expired && (
                            /* The wait was a hand-picked amber-600, a fourth amber beside the
                               three the console decides once. It names the tone token now. */
                            <Badge variant="outline" className="gap-1 border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]">
                              <Clock className="h-3 w-3" />{ago(a.created_at)}
                            </Badge>
                          )}
                        </>
                      }
                    />
                  )
                })}
                {shown.length === 0 && (
                  <Empty>
                    {tab === "waiting" ? "Nothing is waiting on a founder." : "Nothing answered yet."}
                  </Empty>
                )}
              </Panel>
            </>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
