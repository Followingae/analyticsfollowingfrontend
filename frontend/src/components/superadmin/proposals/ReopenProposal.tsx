'use client'

/**
 * Carrying on with a client who only said yes to part of the roster.
 *
 * Clients read a proposal as a menu. They take the two they are sure about, watch how it
 * goes, and come back for the rest — and until now that was the end of the conversation: the
 * campaign opened, everyone they had not taken was quietly unticked, the prices came off and
 * the remaining budget had nowhere to go. Minimalist confirmed 2 of 21 against 57,000 and
 * left 53,500 stranded.
 *
 * Re-opening keeps the yes and re-opens everything around it. This panel is the receipt for
 * that decision: who stays booked, what they already ate of the budget, and how many creators
 * go back on the table. The numbers are read from the server rather than derived here, so the
 * consequence stated in the dialog is the consequence that happens.
 */
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Loader2, RotateCcw, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { cdnAvatar } from '@/lib/avatar'
import { adminProposalApi, type ReopenState } from '@/services/adminProposalMasterApi'

const aed = (n?: number | null) =>
  n == null ? '—' : `AED ${Math.round(n).toLocaleString('en-US')}`

export function ReopenProposal({ proposalId, onDone }: { proposalId: string; onDone: () => void }) {
  const [state, setState] = useState<ReopenState | null>(null)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setState(await adminProposalApi.reopenPreview(proposalId))
    } catch { /* the panel simply does not appear */ }
  }, [proposalId])

  useEffect(() => { load() }, [load])

  if (!state?.can_reopen) return null

  const spent = state.committed ?? 0
  const cap = state.budget ?? 0
  const left = state.remaining ?? 0

  const submit = async () => {
    setSaving(true)
    try {
      const res = await adminProposalApi.reopen(proposalId, note)
      toast.success(res.message)
      setOpen(false)
      setNote('')
      onDone()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card className="border-emerald-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="size-4 text-emerald-600" />
            Confirmed in part
          </CardTitle>
          <CardDescription>
            {state.locked_count} creator{state.locked_count === 1 ? ' is' : 's are'} booked and running.
            {' '}{state.on_the_table} {state.on_the_table === 1 ? 'is' : 'are'} still on the table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {state.confirmed.map(c => (
              <div key={c.id} className="relative">
                <Avatar className="size-11 ring-2 ring-emerald-500">
                  <AvatarImage src={cdnAvatar(c.profile_image_url || undefined)} alt={c.username || ''} />
                  <AvatarFallback>{(c.username || '?')[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="size-3" />
                </span>
              </div>
            ))}
          </div>

          {cap > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                  <Wallet className="size-3.5" />Their budget
                </span>
                <span className="font-semibold tabular-nums">{aed(spent)} of {aed(cap)}</span>
              </div>
              <Progress value={Math.min(100, (spent / cap) * 100)} className="h-2" />
              <p className="mt-1.5 text-[12.5px] font-semibold text-muted-foreground">
                {left > 0 ? `${aed(left)} still to spend` : 'Fully committed'}
              </p>
            </div>
          )}

          <Button variant="outline" onClick={() => setOpen(true)}>
            <RotateCcw className="mr-2 size-4" />
            Re-open for more selections
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-open this proposal</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  The {state.locked_count} creator{state.locked_count === 1 ? '' : 's'} they already
                  confirmed stay booked on the running campaign. They cannot be unticked or removed,
                  and nothing about their deal changes.
                </p>
                <p>
                  The other {state.on_the_table} go back on the table at the prices they were quoted,
                  with {aed(left)} of their budget left to spend. You can add more creators before or
                  after they look again.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reopen-note">What are you sending back to them? (optional)</Label>
            <Textarea
              id="reopen-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Here are the rest of the shortlist plus four new names in your budget."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Re-open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
