'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, Send, UserPlus, CheckCircle2, RotateCcw, Flag, ArrowUp, ArrowDown, Plus, Trash2,
} from 'lucide-react'
import { proposalApprovalApi, type ApprovalStep } from '@/services/proposalApprovalApi'
import { clientApi } from '@/services/clientManagementApi'
import { ClientCommercialTab } from '@/components/clients/ClientCommercialTab'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-muted text-foreground' },
  building: { label: 'Building (talent manager)', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  pending_internal_review: { label: 'Internal review', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  internal_changes_requested: { label: 'Changes requested', cls: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  internally_approved: { label: 'Internally approved', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  sent: { label: 'Sent to client', cls: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
}

const APPROVER_ROLES = [
  { value: 'cofounder', label: 'Cofounder' },
  { value: 'ceo', label: 'CEO' },
  { value: 'account_manager', label: 'Account Manager' },
]

export default function ProposalApprovalPage() {
  const params = useParams()
  const router = useRouter()
  const proposalId = params.id as string

  const [ws, setWs] = useState<any>(null)
  const [chain, setChain] = useState<any>(null)
  const [talentManagers, setTalentManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // form state
  const [assignTM, setAssignTM] = useState('')
  const [steps, setSteps] = useState<Partial<ApprovalStep>[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [newRate, setNewRate] = useState('')
  const [approveNotes, setApproveNotes] = useState('')
  const [sendBackNotes, setSendBackNotes] = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const genShare = () => run(async () => {
    const res = await proposalApprovalApi.createShare(proposalId)
    const url = `${window.location.origin}${res.data?.share_path || ''}`
    setShareUrl(url)
    try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
  })

  const load = async () => {
    setLoading(true); setErr(null)
    try {
      const [wsRes, chainRes, tmRes] = await Promise.all([
        proposalApprovalApi.getWorkspace(proposalId),
        proposalApprovalApi.getChain(proposalId),
        clientApi.listStaff('talent_manager').catch(() => ({ data: [] })),
      ])
      setWs(wsRes.data)
      setChain(chainRes.data)
      setSteps((chainRes.data?.steps || []).map((s: ApprovalStep) => ({ ...s })))
      setTalentManagers(tmRes.data || [])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (proposalId) load() }, [proposalId])

  const run = async (fn: () => Promise<any>) => {
    setBusy(true); setErr(null)
    try { await fn(); await load() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Action failed') }
    finally { setBusy(false) }
  }

  if (loading) {
    return <SuperadminLayout><div className="p-6 text-muted-foreground">Loading…</div></SuperadminLayout>
  }
  if (!ws) {
    return <SuperadminLayout><div className="p-6 text-muted-foreground">{err || 'Proposal not found'}</div></SuperadminLayout>
  }

  const status: string = ws.proposal?.status
  const sb = STATUS_LABEL[status] || { label: status, cls: 'bg-muted' }
  const budgetVisible: boolean = ws.budget_visible
  // Role-based visibility — only show each actor the cards they can act on.
  const viewer = ws.viewer || {}
  const chainEditable = ['draft', 'building', 'internal_changes_requested'].includes(status)
  const canEditChain = viewer.is_operator && chainEditable

  return (
    <SuperadminLayout>
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/superadmin/proposals')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ws.proposal?.campaign_name || ws.proposal?.title || 'Proposal'}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={sb.cls}>{sb.label}</Badge>
              {status === 'pending_internal_review' && chain?.current_approval_step && (
                <span className="text-sm text-muted-foreground">Awaiting step {chain.current_approval_step}</span>
              )}
              {ws.proposal?.internal_round > 0 && (
                <span className="text-xs text-muted-foreground">round {ws.proposal.internal_round}</span>
              )}
            </div>
          </div>
          {budgetVisible && ws.proposal?.total_budget != null && (
            <div className="ml-auto text-right">
              <div className="text-xs text-muted-foreground">Total budget</div>
              <div className="text-lg font-semibold">AED {Number(ws.proposal.total_budget).toLocaleString('en-AE')}</div>
            </div>
          )}
        </div>

        {err && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT: influencers + TM build */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Influencers</CardTitle>
                  <CardDescription>{(ws.influencers || []).length} added{budgetVisible ? '' : ' · per-influencer pricing only'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Followers</TableHead>
                      <TableHead>Rate (AED)</TableHead>
                      <TableHead>Internal</TableHead>
                      <TableHead className="text-right">Review</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(ws.influencers || []).map((inf: any) => {
                      const rate = inf.sell_price_snapshot?.reel ?? inf.estimated_cost ?? '—'
                      return (
                        <TableRow key={inf.id}>
                          <TableCell className="font-medium">@{inf.username || '—'}<div className="text-xs text-muted-foreground">{inf.full_name}</div></TableCell>
                          <TableCell>{inf.followers_count ? Number(inf.followers_count).toLocaleString() : '—'}</TableCell>
                          <TableCell>{rate === '—' ? '—' : `AED ${Number(rate).toLocaleString('en-AE')}`}</TableCell>
                          <TableCell>
                            {inf.internal_status === 'approved' && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>}
                            {inf.internal_status === 'flagged' && <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20" title={inf.internal_flag_note || ''}>Flagged</Badge>}
                            {(!inf.internal_status || inf.internal_status === 'pending') && <Badge variant="outline">Pending</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" disabled={busy} title="Approve"
                                onClick={() => run(() => proposalApprovalApi.reviewInfluencer(proposalId, inf.id, 'approved'))}>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button size="sm" variant="ghost" disabled={busy} title="Flag"
                                onClick={() => {
                                  const note = window.prompt('Reason for flag (optional):') || undefined
                                  run(() => proposalApprovalApi.reviewInfluencer(proposalId, inf.id, 'flagged', note))
                                }}>
                                <Flag className="h-4 w-4 text-orange-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {(ws.influencers || []).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No influencers yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Talent manager: add creator + submit (active while building) */}
            {viewer.is_assigned_tm && (status === 'building' || status === 'internal_changes_requested') && (
              <Card>
                <CardHeader>
                  <CardTitle>Add creator (talent manager)</CardTitle>
                  <CardDescription>Adds to the master database and attaches to this proposal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[180px]">
                      <Label className="text-xs">Instagram handle</Label>
                      <Input placeholder="@handle" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                    </div>
                    <div className="w-40">
                      <Label className="text-xs">Reel rate (AED)</Label>
                      <Input type="number" placeholder="0" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
                    </div>
                    <Button disabled={busy || !newUsername.trim()} onClick={() => run(async () => {
                      const cents = newRate ? Math.round(parseFloat(newRate) * 100) : undefined
                      await proposalApprovalApi.addCreator(proposalId, {
                        username: newUsername.trim(),
                        cost_pricing: cents ? { cost_reel_aed_cents: cents } : undefined,
                        sell_pricing: cents ? { sell_reel_aed_cents: cents } : undefined,
                      })
                      setNewUsername(''); setNewRate('')
                    })}>
                      <UserPlus className="mr-1 h-4 w-4" /> Add
                    </Button>
                  </div>
                  <Button variant="default" disabled={busy || (ws.influencers || []).length === 0}
                    onClick={() => run(() => proposalApprovalApi.submit(proposalId))}>
                    <Send className="mr-1 h-4 w-4" /> Submit for internal approval
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: chain, operator + approver actions, history */}
          <div className="space-y-6">
            {/* Operator: assign TM (before review starts) */}
            {viewer.is_operator && (status === 'draft' || status === 'building' || status === 'internal_changes_requested') && (
              <Card>
                <CardHeader><CardTitle>Operator</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Send for influencer adding → talent manager</Label>
                    <div className="mt-1 flex gap-2">
                      <Select value={assignTM} onValueChange={setAssignTM}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Pick talent manager" /></SelectTrigger>
                        <SelectContent>
                          {talentManagers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name || t.email}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button disabled={busy || !assignTM} onClick={() => run(() => proposalApprovalApi.sendForAdding(proposalId, assignTM))}>Assign</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client share (once internally approved) */}
            {viewer.is_operator && status === 'internally_approved' && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader>
                  <CardTitle>Client share link</CardTitle>
                  <CardDescription>Internally approved. Share with the client — they see samples + a sign/pay gate.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button disabled={busy} onClick={genShare}><Send className="mr-1 h-4 w-4" />Generate share link</Button>
                  {shareUrl && (
                    <div className="rounded-md border bg-background p-2 text-xs break-all">
                      {shareUrl}
                      <div className="text-muted-foreground mt-1">Copied to clipboard.</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Approval chain builder */}
            <Card>
              <CardHeader>
                <CardTitle>Approval chain</CardTitle>
                <CardDescription>Maker (talent manager) → these approvers → client send.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canEditChain ? (
                  <>
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border p-2">
                        <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                        <Select value={s.approver_role || ''} onValueChange={(v) => setSteps((p) => p.map((x, j) => j === i ? { ...x, approver_role: v } : x))}>
                          <SelectTrigger className="h-8 flex-1"><SelectValue placeholder="Role" /></SelectTrigger>
                          <SelectContent>{APPROVER_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => setSteps((p) => { const a = [...p]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })}><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" disabled={i === steps.length - 1} onClick={() => setSteps((p) => { const a = [...p]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; return a })}><ArrowDown className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setSteps((p) => p.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSteps((p) => [...p, { approver_role: 'cofounder' }])}><Plus className="mr-1 h-3.5 w-3.5" />Step</Button>
                      <Button size="sm" disabled={busy || steps.length === 0}
                        onClick={() => run(() => proposalApprovalApi.setChain(proposalId, steps.map((s, i) => ({ step_order: i + 1, approver_role: s.approver_role, approver_user_id: s.approver_user_id, name: s.name }))))}>
                        Save chain
                      </Button>
                    </div>
                  </>
                ) : (
                  // Read-only chain view (non-operators, or locked once review starts)
                  <ol className="space-y-1.5">
                    {(chain?.steps || steps).map((s: any, i: number) => {
                      const isCurrent = chain?.current_approval_step === (s.step_order ?? i + 1)
                      return (
                        <li key={i} className={`flex items-center gap-2 rounded-md border p-2 text-sm ${isCurrent ? 'border-amber-500/40 bg-amber-500/5' : ''}`}>
                          <span className="w-5 text-xs text-muted-foreground">{s.step_order ?? i + 1}</span>
                          <span className="capitalize flex-1">{(s.approver_role || '').replace(/_/g, ' ') || 'Approver'}</span>
                          {isCurrent && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">current</Badge>}
                        </li>
                      )
                    })}
                    {(chain?.steps || steps).length === 0 && <li className="text-sm text-muted-foreground">No approval steps yet.</li>}
                  </ol>
                )}
              </CardContent>
            </Card>

            {/* Approver actions (during review) */}
            {viewer.is_current_approver && status === 'pending_internal_review' && (
              <Card>
                <CardHeader><CardTitle>Approver — step {chain?.current_approval_step}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Textarea placeholder="Approval note (optional)" value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} />
                  <Button className="w-full" disabled={busy} onClick={() => run(async () => { await proposalApprovalApi.approveStep(proposalId, approveNotes || undefined); setApproveNotes('') })}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Approve this step
                  </Button>
                  <Textarea placeholder="Send-back reason (required)" value={sendBackNotes} onChange={(e) => setSendBackNotes(e.target.value)} />
                  <Button variant="outline" className="w-full" disabled={busy || !sendBackNotes.trim()}
                    onClick={() => run(async () => { await proposalApprovalApi.sendBack(proposalId, sendBackNotes); setSendBackNotes('') })}>
                    <RotateCcw className="mr-1 h-4 w-4" /> Send back to talent manager
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* History */}
            <Card>
              <CardHeader><CardTitle>History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(chain?.history || []).length === 0 && <p className="text-sm text-muted-foreground">No activity yet</p>}
                {(chain?.history || []).map((h: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm border-l-2 pl-3 py-0.5">
                    <span className="font-medium capitalize">{String(h.action).replace('_', ' ')}</span>
                    <span className="text-muted-foreground">{h.approver_name || ''}{h.step_order ? ` · step ${h.step_order}` : ''}{h.notes ? ` — ${h.notes}` : ''}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Client commercial gate — agreement + invoice, surfaced at the send-to-client stage */}
        {viewer.is_operator && ws.team_id && (status === 'internally_approved' || status === 'sent') && (
          <Card>
            <CardHeader>
              <CardTitle>Client commercial — agreement & invoice</CardTitle>
              <CardDescription>
                Upload + send the agreement and create the advance invoice here. The client signs &amp; pays on the share link;
                the full influencer list unlocks only once the agreement is <strong>signed</strong> and the advance invoice is <strong>paid</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientCommercialTab teamId={ws.team_id} proposalId={proposalId} />
            </CardContent>
          </Card>
        )}
      </div>
    </SuperadminLayout>
  )
}
