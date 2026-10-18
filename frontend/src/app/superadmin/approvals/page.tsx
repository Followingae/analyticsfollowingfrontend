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
 *
 * It now speaks the console's vocabulary rather than its own dialect of it:
 *
 *   - the wait is `Age`, which keeps the two clocks apart. How long this has sat with the
 *     approver is one fact; how far past the link's own expiry it has gone is another, and
 *     a request can be two days old and four days past its date.
 *   - who holds it is `Owner`, so a row reads "Waiting on hajar@following.ae" rather than
 *     printing a bare address and leaving you to infer the rest.
 *   - the two views are `FilterBar` chips named after who is blocking, with counts that
 *     stay on screen at zero, because "nothing is waiting on a founder" is the answer this
 *     screen exists to give and it has to be legible without clicking anything.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { Panel, Row, type Tone } from "@/components/console/primitives"
import { Age, FilterBar, NoMatches, Owner, type FilterChip } from "@/components/console/surfaces"
import { ActionIcon } from "@/components/console/Glyph"
import { MoneyHubHeader } from "@/components/console/MoneyHubHeader"
import { approvalsApi } from "@/services/approvalsApi"
import { HeldActions } from "@/components/console/HeldActions"

interface ApprovalRow {
  id: string
  entity_type: string
  /** The thing the decision is about. Needed to nudge: the endpoint is addressed by the
   *  thing waiting, not by the approval's own id. */
  entity_id?: string | null
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
  /** When somebody last asked again, and how many times they have. A decision on its
   *  fourth ask is a conversation to have, not another email to send. */
  reminded_at?: string | null
  reminder_count?: number | null
}

/** How often this has been asked again, said the way a person would say it. */
const askedAgain = (n?: number | null) =>
  !n || n < 1 ? null : n === 1 ? "asked again once" : `asked again ${n} times`

/**
 * One nudge button, with the in-flight state on it so a double click cannot send twice.
 *
 * No dialog in front of it. A reminder decides nothing and is undone by ignoring it, and a
 * confirmation would make asking feel heavier than the decision being asked about. The
 * toast afterwards is the receipt.
 *
 * The address is the name here, the same rule the rest of this screen keeps: we hold no
 * display name for an approver, and reading one out of the left of an @ invents it.
 */
function NudgeButton({
  entityType,
  entityId,
  action,
  approverEmail,
}: {
  entityType: string
  entityId: string
  action?: string
  approverEmail: string
}) {
  const [sending, setSending] = useState(false)
  const send = async () => {
    setSending(true)
    try {
      const r = await approvalsApi.remind(entityType, entityId, action)
      if (r.ok) {
        toast.success(`${r.approver_email || approverEmail} has been emailed.`, {
          description: `They can answer straight from it without logging in.${r.note ? ` ${r.note}.` : ""}`,
        })
      } else {
        // A 404 or a 429. Both are replies, so neither is red.
        toast.message(r.answer)
      }
    } catch (e) {
      toast.error((e as Error).message || "Could not send the reminder")
    } finally {
      setSending(false)
    }
  }
  return (
    <Button variant="outline" size="sm" className="gap-1.5" disabled={sending} onClick={send}>
      <ActionIcon verb="nudge" />
      {sending ? "Nudging" : "Nudge"}
    </Button>
  )
}

const ACTION_LABEL: Record<string, string> = {
  approve_creator: "Release a creator",
  confirm_rate: "Confirm a rate",
  send_proposal: "Send a proposal",
  send_agreement: "Send an agreement",
  issue_invoice: "Issue an invoice",
  payout_run: "Release a payment run",
}

const DAY = 86_400_000

const ago = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}

/** Whole days this has sat. `Age` decides when that earns a colour, not this screen. */
const daysSince = (iso?: string | null) => {
  if (!iso) return 0
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
  return Number.isFinite(d) ? Math.max(0, d) : 0
}

/** How far past the link's own expiry, or nothing when it has not passed. The second clock. */
const lateBy = (iso?: string | null) => {
  if (!iso) return undefined
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
  return Number.isFinite(d) && d > 0 ? d : undefined
}

/** Two letters for the avatar chip. The address is kept as the name: these are the
 *  identities the screen has, and turning an address into a guessed display name would be
 *  inventing a person's name from the left of an @. */
const initialsOf = (email?: string | null) =>
  email ? email.slice(0, 2).toUpperCase() : undefined

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

  /* Named after who is blocking rather than after a status, and the counts render at zero:
     on this screen a nought is the most useful thing the bar can say. Neither chip is
     pruned: for a founder "Waiting on a founder" is still only part of this view, not the
     whole of it, so hiding it would take her switch back to her own queue away. */
  const chips: FilterChip[] = [
    { key: "waiting", label: "Waiting on a founder", n: waiting.length },
    { key: "answered", label: "Answered", n: answered.length },
  ]

  return (
    <AuthGuard>
      <SuperAdminInterface>
        <div className="mx-auto max-w-4xl space-y-ds-5 p-4 md:p-7">
          <MoneyHubHeader
            title="Approvals"
            sub="Two queues. Things the platform stopped and is holding for you, and decisions we have asked a founder for by email."
          />

          {/* First, because nothing in it has happened. The queue below is a record of
              decisions already asked for; this one is work that is stopped until somebody
              answers, and a person reading top to bottom should meet that first. */}
          <HeldActions />

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
              <FilterBar
                chips={chips}
                value={tab}
                onChange={(k: string) => setTab(k as "waiting" | "answered")}
              />

              {/* Nothing has ever been raised: the counts above have said so, and a card
                  drawn round an apology says nothing they did not. */}
              {items.length > 0 && (
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
                          <span className="inline-flex items-center gap-1.5">
                            {/* Who is holding it, as a sentence. `Owner` has two tenses and
                                neither of them fits a decision that is already made, so an
                                answered row names the approver in prose instead of claiming
                                she still has it. */}
                            {a.decided_at ? (
                              <span>Answered by {a.approver_email}</span>
                            ) : (
                              <Owner
                                name={a.approver_email}
                                waiting
                                initials={initialsOf(a.approver_email)}
                              />
                            )}
                            {a.requested_by_email ? <span>· asked by {a.requested_by_email}</span> : null}
                            {a.decided_at
                              ? <span>· {ago(a.decided_at)}{a.decision_source ? ` by ${a.decision_source}` : ""}</span>
                              : null}
                            {a.decision_note ? <span>· “{a.decision_note}”</span> : null}
                            {/* How often somebody has already asked. On the fourth ask the
                                answer is not another email, and this row is where that
                                becomes visible. */}
                            {!a.decided_at && askedAgain(a.reminder_count)
                              ? <span>· {askedAgain(a.reminder_count)}</span>
                              : null}
                          </span>
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
                            {/* The wait was a hand-picked amber-600, a fourth amber beside the
                                three the console decides once, and it put the age and the
                                overdue-by into one number. `Age` keeps them apart and owns
                                the colour: amber at four days, red once the link's own date
                                has passed. */}
                            {!a.decided_at && (
                              <Age days={daysSince(a.created_at)} lateDays={lateBy(a.expires_at)} />
                            )}
                            {/* Only on a row that is actually waiting, and only when the
                                row knows WHICH THING is waiting: the endpoint is addressed
                                by the entity, so without an entity id there is nothing to
                                nudge and a button here would only ever answer 404. */}
                            {!a.decided_at && a.entity_id && (
                              <NudgeButton
                                entityType={a.entity_type}
                                entityId={a.entity_id}
                                action={a.action}
                                approverEmail={a.approver_email}
                              />
                            )}
                          </>
                        }
                      />
                    )
                  })}
                  {/* The user filtered to this view and it came up empty. That is the one
                      case a list is allowed to say something rather than vanish, because
                      they caused it and need to know it was the chip, not the data. */}
                  {shown.length === 0 && <NoMatches />}
                </Panel>
              )}
            </>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
