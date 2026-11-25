'use client'

/**
 * Brand briefs: the links we send brands so they can give us a full campaign brief.
 *
 * Make a link for a brand account (its name and logo go on the brief) or for a brand that is
 * not on the platform yet, send it however you talk to them, and watch it come back. A sent
 * brief lands on Requests as a client request; a founder turns it into the brand's sourcing
 * round from the brief itself.
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, FileText, Loader2, Plus, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { CARD, PageHead } from '@/components/console/primitives'
import { brandBriefs, type AdminBrief, type BrandAccount } from '@/services/brandBriefApi'
import { STATUS, BrandLogo, ago } from './shared'
import { cn } from '@/lib/utils'

export default function BriefsPage() {
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout><Briefs /></SuperadminLayout>
    </AuthGuard>
  )
}

function Briefs() {
  const router = useRouter()
  const [rows, setRows] = useState<AdminBrief[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [creating, setCreating] = useState(false)

  const load = () => brandBriefs.list().then(setRows).catch(() => setFailed(true))
  useEffect(() => { load() }, [])

  const counts = useMemo(() => {
    const c = { waiting: 0, filling: 0, in: 0 }
    for (const r of rows || []) {
      if (r.status === 'sent' || r.status === 'opened') c.waiting++
      else if (r.status === 'in_progress') c.filling++
      else if (r.status === 'submitted') c.in++
    }
    return c
  }, [rows])

  return (
    <div className="space-y-ds-6">
      <PageHead
        title="Brand briefs"
        sub="Send a brand a link, they fill in their campaign brief with the assistant, and it comes back to Requests. A founder turns it into a sourcing round."
        action={<Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" />New brief link</Button>}
      />

      {rows && rows.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="rounded-full border px-3 py-1">{counts.waiting} not started</span>
          <span className="rounded-full border px-3 py-1">{counts.filling} being filled</span>
          <span className="rounded-full border bg-[var(--tone-info-wash)] px-3 py-1 font-medium text-foreground">{counts.in} sent to us</span>
        </div>
      )}

      <div className={cn(CARD, 'overflow-hidden bg-card')}>
        {failed ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">Could not load the briefs. Refresh to try again.</p>
        ) : rows === null ? (
          <div className="flex items-center gap-2 px-6 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></span>
            <p className="text-base font-semibold">No brief links yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">Make one for a brand and send it to them. They can attach a brief they already have and the assistant fills in the rest.</p>
            <Button className="mt-2" onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" />New brief link</Button>
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map(r => (
              <li key={r.id}>
                <Link href={`/work/briefs/${r.id}`}
                      className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[auto_1fr_170px_150px_110px]">
                  <BrandLogo name={r.brand_name} url={r.brand_logo_url} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.brand_name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.campaign_name || 'Campaign not named yet'}
                      {r.doc_name && <span className="ml-2 inline-flex items-center gap-1"><FileText className="h-3 w-3" />{r.doc_name}</span>}
                    </p>
                  </div>
                  <span className="col-start-2 md:col-start-auto">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', STATUS[r.status].tone)}>
                      {STATUS[r.status].label}
                    </span>
                  </span>
                  <span className="col-start-2 text-sm text-muted-foreground md:col-start-auto">
                    {r.status === 'submitted' || r.status === 'sourcing'
                      ? (r.gaps.length ? `${r.gaps.length} thing${r.gaps.length === 1 ? '' : 's'} missing` : 'Complete')
                      : r.status === 'in_progress' ? `${Math.max(0, 16 - r.gaps.length)} of 16 answered` : ''}
                  </span>
                  <span className="col-start-2 text-sm text-muted-foreground md:col-start-auto md:text-right">{ago(r.updated_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateDialog open={creating} onOpenChange={setCreating}
                    onCreated={b => { setCreating(false); load(); router.push(`/work/briefs/${b.id}?new=1`) }} />
    </div>
  )
}

function CreateDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; onCreated: (b: AdminBrief) => void
}) {
  const [q, setQ] = useState('')
  const [brands, setBrands] = useState<BrandAccount[]>([])
  const [picked, setPicked] = useState<BrandAccount | null>(null)
  const [freeName, setFreeName] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => brandBriefs.brands(q).then(setBrands).catch(() => setBrands([])), 200)
    return () => clearTimeout(t)
  }, [q, open])
  useEffect(() => {
    if (!open) { setQ(''); setPicked(null); setFreeName(''); setNote('') }
  }, [open])

  const create = async () => {
    setBusy(true)
    try {
      const b = await brandBriefs.create({
        team_id: picked?.id || null, brand_name: picked ? undefined : freeName.trim(),
        note: note.trim() || undefined,
      })
      onCreated(b)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not make the link')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New brief link</DialogTitle>
          <DialogDescription>Tag the brand account so the brief carries their name and logo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Brand account</Label>
            {picked ? (
              <div className="flex items-center justify-between rounded-xl border p-3">
                <span className="flex items-center gap-3"><BrandLogo name={picked.name} url={picked.logo_url} size={32} /><span className="font-medium">{picked.name}</span></span>
                <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>Change</Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder="Search brand accounts" />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border">
                  {brands.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">No brand account found.</p>
                  ) : brands.map(b => (
                    <button key={b.id} type="button" onClick={() => setPicked(b)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted">
                      <BrandLogo name={b.name} url={b.logo_url} size={28} />{b.name}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs text-muted-foreground">Not on the platform yet? Type their name</Label>
                  <Input value={freeName} onChange={e => setFreeName(e.target.value)} placeholder="Brand name" />
                </div>
              </>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>A note on the brief <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Great speaking today. Here is the brief we mentioned." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={create} disabled={busy || (!picked && !freeName.trim())}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}Make the link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

