'use client'

/**
 * The talent team's fastest path: paste handles, tag them, done.
 *
 * There are deliberately NO pricing fields here. A creator added this way lands in the
 * waiting room, and a superadmin prices and releases them later. The research is saved from
 * the first keystroke, whether or not any deal happens.
 *
 * Opened from inside an area, it remembers which one: the creator is placed back there the
 * moment they are approved, so nobody has to hold "these three were for Bateel" in their
 * head between adding and approval.
 */
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { creatorIntakeApi } from '@/services/creatorIntakeApi'

// The categories actually in use in the master database, most-used first.
const CATEGORIES = ['food', 'family', 'lifestyle', 'beauty', 'travel', 'fashion',
  'entertainment', 'fitness', 'automotive']
const MARKETS = ['UAE', 'KSA', 'Kuwait', 'Qatar', 'Bahrain', 'Oman']

const clean = (s: string) => s.trim().replace(/^@/, '').replace(/\/+$/, '').toLowerCase()

export function AddCreatorsDialog({
  open, onOpenChange, onAdded, areaId, areaName,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; onAdded?: () => void
  /** The area they were sourced for, when opened from one. */
  areaId?: string
  areaName?: string
}) {
  const [raw, setRaw] = useState('')
  const [handles, setHandles] = useState<string[]>([])
  const [cats, setCats] = useState<string[]>([])
  const [country, setCountry] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  // Handles arrive pasted in blocks — newline, comma or space separated.
  const absorb = (text: string) => {
    const parts = text.split(/[\s,]+/).map(clean).filter(Boolean)
    if (!parts.length) return
    setHandles((prev) => [...new Set([...prev, ...parts])])
    setRaw('')
  }

  const reset = () => { setRaw(''); setHandles([]); setCats([]); setCountry(null); setNote('') }

  const submit = async () => {
    const all = [...new Set([...handles, ...raw.split(/[\s,]+/).map(clean).filter(Boolean)])]
    if (!all.length) { toast.error('Paste at least one Instagram handle'); return }
    setBusy(true)
    try {
      const res = await creatorIntakeApi.add({
        usernames: all,
        categories: cats.length ? cats : undefined,
        country: country || undefined,
        note: note.trim() || undefined,
        list_id: areaId,
      })
      toast.success(res.data?.message || `${all.length} added to the waiting room`)
      reset(); onOpenChange(false); onAdded?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add creators')
    } finally { setBusy(false) }
  }

  const total = handles.length + raw.split(/[\s,]+/).map(clean).filter(Boolean).length

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add creators</DialogTitle>
          <DialogDescription>
            Paste handles — one per line, or comma separated.
            {areaName
              ? ` They come back into ${areaName} once they are priced and approved.`
              : ' Pricing and approval happen in the waiting room.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-ds-4">
          <div>
            <Label className="text-xs">Instagram handles</Label>
            {/* This border stays: it is not decoration around a group, it is the field
                itself — a tag input whose chips and textarea have to read as one control.
                Radius from the token scale rather than a Tailwind default. */}
            <div className="mt-1.5 rounded-ds-field border bg-muted/40 p-2.5">
              {handles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {handles.map((h) => (
                    <Badge key={h} variant="secondary" className="gap-1 pr-1">
                      @{h}
                      <button
                        type="button" aria-label={`Remove ${h}`}
                        className="rounded-sm p-0.5 hover:bg-background"
                        onClick={() => setHandles((p) => p.filter((x) => x !== h))}
                      ><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
              <Textarea
                value={raw} rows={handles.length ? 2 : 4}
                className="resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                placeholder={'@sarah.eats\n@dubaifoodie\n@mamaofthree'}
                onChange={(e) => setRaw(e.target.value)}
                onBlur={() => absorb(raw)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); absorb(raw) }
                }}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Category</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <Badge
                  key={c} role="button" tabIndex={0}
                  variant={cats.includes(c) ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => setCats((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setCats((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])
                    }
                  }}
                >{c}</Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Market</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {MARKETS.map((m) => (
                <Badge
                  key={m} role="button" tabIndex={0}
                  variant={country === m ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setCountry(country === m ? null : m)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCountry(country === m ? null : m) }
                  }}
                >{m}</Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Input
              className="mt-1.5" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. met at MEFCC — open to barter"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || total === 0}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Add {total > 0 ? total : ''} creator{total === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
