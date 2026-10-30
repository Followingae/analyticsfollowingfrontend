'use client'

/**
 * Links: a short link per creator per retailer, every click counted, every sale credited.
 *
 * THE ORDER OF THIS SCREEN IS THE ORDER OF THE JOB. Add the retailer pages; every creator on
 * the roster gets a link to each one there and then. Paste the brand's own codes if they gave
 * us any. Hand the creators their links. Then sales come back three ways (the retailer's
 * postback, their spreadsheet, or one typed in by hand) and the numbers fill in at the top.
 *
 * ANYBODY ON THE CAMPAIGN MAY SET IT UP. ONLY THE SUPERADMIN RELEASES. Same rule as published
 * results: the brand's screen says nothing until somebody who answers for the numbers says
 * it may.
 *
 * A child tab of the campaign shell, so it never mounts its own layout.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ChevronDown, Copy, FileUp, Link2, Loader2, Pencil, Plus, RefreshCw, Store, Trash2, Upload,
  UserPlus, Webhook, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ReadState, SectionHead } from '@/components/console/surfaces'
import { useConfirm } from '@/components/console/confirm'
import { CARD } from '@/components/console/primitives'
import {
  ClickBreakdowns, CopyButton, CreatorCell, DailyClicksChart, LinksTotals, RetailerCards, copyText,
} from '@/components/campaigns/links/LinksResults'
import { cn } from '@/lib/utils'
import {
  count, money, trackedLinksApi,
  type CodeRow, type Destination, type DestinationInput, type SaleRow, type TeamLinksReport,
  type TrackedLink,
} from '@/services/trackedLinksApi'

const SOURCE: Record<string, string> = {
  postback: 'Postback', import: 'Spreadsheet', manual: 'By hand',
}

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

const handleOf = (l: { username: string | null }) => (l.username ? `@${l.username}` : 'Unnamed')

export default function CampaignLinksPage() {
  const campaignId = useParams().campaignId as string
  const confirm = useConfirm()

  const [data, setData] = useState<TeamLinksReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      setData(await trackedLinksApi.team(campaignId))
      setFailed(false)
    } catch (e) {
      if (!quiet) {
        setFailed(true)
        toast.error(e instanceof Error ? e.message : 'Could not read the links')
      }
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [campaignId])

  useEffect(() => { void load() }, [load])

  /** Run one change, say what happened, re-read quietly. */
  const act = async <T,>(key: string, fn: () => Promise<T>, done: string | ((r: T) => string)) => {
    setBusy(key)
    try {
      const r = await fn()
      toast.success(typeof done === 'function' ? done(r) : done)
      await load(true)
      return r
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not work')
      return undefined
    } finally { setBusy(null) }
  }

  const destLabel = useMemo(() => {
    const m: Record<string, string> = {}
    for (const d of data?.destinations || []) m[d.id] = d.label
    return m
  }, [data])

  const release = async (visible: boolean) => {
    const ok = await confirm(visible ? {
      kind: 'routine',
      title: 'Show the brand their clicks and sales?',
      body: <>From the moment you say yes the brand sees every creator&apos;s link, clicks, sales
             and revenue on their campaign. They never see the retailer set-up or single orders.</>,
      confirmLabel: 'Show the brand',
    } : {
      kind: 'routine',
      title: 'Hide clicks and sales from the brand?',
      body: <>Their screen goes back to saying the numbers appear once the links are checked.
             Nothing is lost.</>,
      confirmLabel: 'Hide it',
    })
    if (!ok) return
    await act('release', () => trackedLinksApi.release(campaignId, visible),
              visible ? 'The brand can see it now' : 'Hidden from the brand')
  }

  const copyAll = () => {
    const lines = (data?.links || []).filter((l) => !l.disabled).map((l) => {
      const code = l.discount_code ? ` (code ${l.discount_code})` : ''
      return `${handleOf(l)} | ${destLabel[l.destination_id] || 'Retailer'}: ${l.short_url}${code}`
    })
    void copyText(lines.join('\n'), `${lines.length} link${lines.length === 1 ? '' : 's'} copied`)
  }

  const links = data?.links || []
  const dests = data?.destinations || []
  const currency = data?.totals.currency || 'AED'

  return (
    <ReadState
      failed={failed}
      loading={loading}
      empty={!data}
      what="this campaign’s links"
      onRetry={() => load()}
      skeleton={<div className="flex items-center gap-2 py-10 text-ds-caption">
        <Loader2 className="h-4 w-4 animate-spin" /> Reading the links
      </div>}
    >
      {data && (
        <div className="space-y-9">
          {/* Who can see it, and the two things you reach for most. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ReleaseState data={data} busy={busy === 'release'} onChange={release} />
            <div className="flex flex-wrap gap-2">
              {dests.length > 0 && (
                <Button variant="outline" size="sm" disabled={busy === 'generate'}
                        onClick={() => act('generate', () => trackedLinksApi.generate(campaignId),
                          (r) => r.links_made
                            ? `${r.links_made} new link${r.links_made === 1 ? '' : 's'} made`
                            : 'Everyone on the roster already has their links')}>
                  {busy === 'generate' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                       : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                  Create missing links
                </Button>
              )}
              {links.length > 0 && (
                <Button size="sm" onClick={copyAll}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy all links
                </Button>
              )}
            </div>
          </div>

          {links.length > 0 && (
            <section className="space-y-3">
              <LinksTotals totals={data.totals} />
              {!!data.totals.unattributed && (
                <p className="text-ds-caption text-muted-foreground">
                  {data.totals.unattributed} sale{data.totals.unattributed === 1 ? '' : 's'} could
                  not be tied to a creator. They count in the totals, not against anyone.
                </p>
              )}
              <DailyClicksChart daily={data.daily} />
              {dests.length > 1 && <RetailerCards retailers={data.by_retailer} currency={currency} />}
              <ClickBreakdowns byCountry={data.by_country} byDevice={data.by_device} byApp={data.by_app} />
            </section>
          )}

          <Retailers
            campaignId={campaignId} dests={dests} busy={busy} act={act} confirm={confirm}
          />

          {links.length > 0 && (
            <CreatorLinks links={links} destLabel={destLabel} currency={currency} busy={busy}
                          act={act} />
          )}

          {dests.length > 0 && (
            <OffRoster campaignId={campaignId} dests={dests} busy={busy} act={act} />
          )}

          {links.length > 0 && <BrandCodes campaignId={campaignId} busy={busy} act={act} />}

          {dests.length > 0 && (
            <Sales campaignId={campaignId} data={data} destLabel={destLabel} busy={busy} act={act}
                   confirm={confirm} />
          )}

          {dests.length > 0 && <Postback url={data.postback_url} />}
        </div>
      )}
    </ReadState>
  )
}

type Act = <T,>(key: string, fn: () => Promise<T>, done: string | ((r: T) => string)) =>
  Promise<T | undefined>
type Confirm = ReturnType<typeof useConfirm>

/* ══ Release ═════════════════════════════════════════════════════════════════════════════ */

function ReleaseState({ data, busy, onChange }: {
  data: TeamLinksReport
  busy: boolean
  onChange: (v: boolean) => void
}) {
  if (data.can_release) {
    return (
      <label className="flex items-center gap-2.5 text-[13.5px]">
        <Switch checked={data.released} disabled={busy} onCheckedChange={onChange} />
        <span className="font-medium">Brand can see this</span>
        {data.released && data.released_at && (
          <span className="text-ds-caption text-muted-foreground">since {fmtDate(data.released_at)}</span>
        )}
      </label>
    )
  }
  return (
    <p className="flex items-center gap-2 text-[13.5px]">
      <span className={cn('size-2 rounded-full', data.released ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
      {data.released
        ? <>The brand can see this{data.released_at ? ` since ${fmtDate(data.released_at)}` : ''}.</>
        : 'Held from the brand until a superadmin releases it.'}
    </p>
  )
}

/* ══ Retailers ═══════════════════════════════════════════════════════════════════════════ */

function DestinationFields({ value, onChange, open }: {
  value: DestinationInput
  onChange: (v: DestinationInput) => void
  open?: boolean
}) {
  const [adv, setAdv] = useState(!!open)
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr_0.8fr]">
        <div className="space-y-1.5">
          <Label className="text-[12px]">Retailer</Label>
          <Input value={value.label} placeholder="Ulta Beauty"
                 onChange={(e) => onChange({ ...value, label: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px]">Product page</Label>
          <Input value={value.url} placeholder="https://www.ulta.com/p/..."
                 onChange={(e) => onChange({ ...value, url: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px]">Country <span className="text-muted-foreground">(optional)</span></Label>
          <Input value={value.country || ''} placeholder="US"
                 onChange={(e) => onChange({ ...value, country: e.target.value })} />
        </div>
      </div>
      <Collapsible open={adv} onOpenChange={setAdv}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground">
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', adv && 'rotate-180')} /> Advanced
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="max-w-sm space-y-1.5">
            <Label className="text-[12px]">Sub-id parameter</Label>
            <Input value={value.click_param || ''} placeholder="subid"
                   onChange={(e) => onChange({ ...value, click_param: e.target.value })} />
            <p className="text-ds-caption text-muted-foreground">
              The name the retailer&apos;s affiliate network uses to report sales back by click.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

const BLANK_DEST: DestinationInput = { label: '', url: '', country: '', click_param: '' }

function Retailers({ campaignId, dests, busy, act, confirm }: {
  campaignId: string
  dests: Destination[]
  busy: string | null
  act: Act
  confirm: Confirm
}) {
  const [draft, setDraft] = useState<DestinationInput>(BLANK_DEST)
  const [adding, setAdding] = useState(dests.length === 0)
  const [editing, setEditing] = useState<Destination | null>(null)
  const [edit, setEdit] = useState<DestinationInput>(BLANK_DEST)

  const add = async () => {
    const r = await act('dest-add', () => trackedLinksApi.addDestination(campaignId, draft),
      (r) => r.links_made
        ? `Added. ${r.links_made} link${r.links_made === 1 ? '' : 's'} made for the roster.`
        : 'Added. Nobody is on the roster yet, so no links were made.')
    if (r) { setDraft(BLANK_DEST); setAdding(false) }
  }

  const save = async () => {
    if (!editing) return
    const r = await act('dest-edit', () => trackedLinksApi.editDestination(editing.id, edit), 'Saved')
    if (r !== undefined) setEditing(null)
  }

  const retire = async (d: Destination) => {
    const ok = await confirm({
      kind: 'destructive',
      title: `Retire ${d.label}?`,
      body: <>Every creator&apos;s link to {d.label} stops counting and sends people to our home
             page instead. Use it when the page is gone or the brand has stopped selling there.</>,
      losses: [
        { label: 'The links stop forwarding to the retailer' },
        { label: 'Clicks and sales already counted stay on record', kept: true },
      ],
      confirmLabel: 'Retire it',
    })
    if (!ok) return
    await act(`dest-${d.id}`, () => trackedLinksApi.retireDestination(d.id), `${d.label} retired`)
  }

  return (
    <section>
      <SectionHead
        icon={Store} title="Retailers" count={dests.length}
        note="Where the links send people. Adding one makes a link for everyone on the roster."
        action={!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add a retailer
          </Button>
        )}
      />
      <div className="space-y-3">
        {dests.length > 0 && (
          <ul className={cn(CARD, 'divide-y bg-card')}>
            {dests.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">
                    {d.label}
                    {d.country && <span className="ml-2 text-[12px] font-normal text-muted-foreground">{d.country}</span>}
                    {d.click_param && (
                      <span className="ml-2 font-mono text-[11.5px] font-normal text-muted-foreground">
                        sub-id {d.click_param}
                      </span>
                    )}
                  </p>
                  <a href={d.url} target="_blank" rel="noreferrer"
                     className="block truncate text-[12.5px] text-muted-foreground hover:underline">
                    {d.url}
                  </a>
                </div>
                <Button variant="ghost" size="sm" className="h-8"
                        onClick={() => {
                          setEditing(d)
                          setEdit({ label: d.label, url: d.url, country: d.country || '',
                                    click_param: d.click_param || '' })
                        }}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-muted-foreground"
                        disabled={busy === `dest-${d.id}`} onClick={() => retire(d)}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Retire
                </Button>
              </li>
            ))}
          </ul>
        )}

        {adding && (
          <div className={cn(CARD, 'space-y-3 bg-card p-4')}>
            <DestinationFields value={draft} onChange={setDraft} />
            <div className="flex gap-2">
              <Button size="sm" onClick={add}
                      disabled={busy === 'dest-add' || !draft.label.trim() || !draft.url.trim()}>
                {busy === 'dest-add' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Add and make links
              </Button>
              {dests.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setDraft(BLANK_DEST) }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o: boolean) => { if (!o) setEditing(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit {editing?.label}</DialogTitle></DialogHeader>
          <DestinationFields value={edit} onChange={setEdit} open={!!edit.click_param} />
          <p className="text-ds-caption text-muted-foreground">
            Links already handed out keep working. They forward to the new page from the next tap.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={busy === 'dest-edit' || !edit.label.trim() || !edit.url.trim()}>
              {busy === 'dest-edit' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

/* ══ Per creator ═════════════════════════════════════════════════════════════════════════ */

/** Click to edit, Enter or leaving the field saves, Escape puts it back. */
function InlineEdit({ value, placeholder, mono, onSave }: {
  value: string | null
  placeholder: string
  mono?: boolean
  onSave: (v: string) => Promise<unknown>
}) {
  const [editing, setEditing] = useState(false)
  const [v, setV] = useState(value || '')
  const saving = useRef(false)

  useEffect(() => { if (!editing) setV(value || '') }, [value, editing])

  const commit = async () => {
    if (saving.current) return
    if (v.trim() === (value || '')) { setEditing(false); return }
    saving.current = true
    await onSave(v.trim())
    saving.current = false
    setEditing(false)
  }

  if (editing) {
    return (
      <Input
        autoFocus value={v} onChange={(e) => setV(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void commit()
          if (e.key === 'Escape') { setV(value || ''); setEditing(false) }
        }}
        className={cn('h-7 min-w-[120px] px-2 text-[12.5px]', mono && 'font-mono')}
        placeholder={placeholder}
      />
    )
  }
  return (
    <button type="button" onClick={() => setEditing(true)}
            className={cn('max-w-[220px] truncate rounded px-1 py-0.5 text-left text-[12.5px] hover:bg-muted',
                          mono && 'font-mono', !value && 'text-muted-foreground/70')}
            title={value || undefined}>
      {value || placeholder}
    </button>
  )
}

function CreatorLinks({ links, destLabel, currency, busy, act }: {
  links: TrackedLink[]
  destLabel: Record<string, string>
  currency: string
  busy: string | null
  act: Act
}) {
  return (
    <section>
      <SectionHead
        icon={Link2} title="Creators' links" count={links.length}
        note="Hand each creator theirs. A brand tracking link, when set, is where the link forwards; we still count the tap."
      />
      <div className={cn(CARD, 'overflow-x-auto bg-card')}>
        <table className="w-full min-w-[1080px] text-[13px]">
          <thead>
            <tr className="border-b text-left text-[12px] text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Creator</th>
              <th className="px-3 py-2.5 font-medium">Retailer</th>
              <th className="px-3 py-2.5 font-medium">Short link</th>
              <th className="px-3 py-2.5 font-medium">Brand code</th>
              <th className="px-3 py-2.5 font-medium">Brand tracking link</th>
              <th className="px-3 py-2.5 text-right font-medium">Clicks</th>
              <th className="px-3 py-2.5 text-right font-medium">Unique</th>
              <th className="px-3 py-2.5 text-right font-medium">Sales</th>
              <th className="px-3 py-2.5 text-right font-medium">Revenue</th>
              <th className="px-4 py-2.5 text-right font-medium">On</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id} className={cn('border-b last:border-0', l.disabled && 'opacity-55')}>
                <td className="px-4 py-2">
                  <CreatorCell username={l.username} fullName={l.full_name} pic={l.profile_pic_url} />
                </td>
                <td className="px-3 py-2">{destLabel[l.destination_id]}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-0.5">
                    <span className="font-mono text-[12.5px]">{l.short_url.replace(/^https?:\/\//, '')}</span>
                    <CopyButton text={l.short_url} />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <InlineEdit value={l.discount_code} placeholder="Add code" mono
                              onSave={(v) => act(`link-${l.id}`,
                                () => trackedLinksApi.editLink(l.id, { discount_code: v || null }),
                                v ? 'Code saved' : 'Code cleared')} />
                </td>
                <td className="px-3 py-2">
                  <InlineEdit value={l.target_url} placeholder="Add link"
                              onSave={(v) => act(`link-${l.id}`,
                                () => trackedLinksApi.editLink(l.id, { target_url: v || null }),
                                v ? 'Tracking link saved' : 'Tracking link cleared')} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{count(l.clicks)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{count(l.unique_clicks)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{count(l.sales)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {l.revenue_cents ? money(l.revenue_cents, currency) : ''}
                </td>
                <td className="px-4 py-2 text-right">
                  <Switch checked={!l.disabled} disabled={busy === `link-${l.id}`}
                          aria-label={l.disabled ? 'Switch this link on' : 'Switch this link off'}
                          onCheckedChange={(on: boolean) => act(`link-${l.id}`,
                            () => trackedLinksApi.editLink(l.id, { disabled: !on }),
                            on ? 'Link switched on' : 'Link switched off. It now sends people to our home page.')} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function OffRoster({ campaignId, dests, busy, act }: {
  campaignId: string
  dests: Destination[]
  busy: string | null
  act: Act
}) {
  const [open, setOpen] = useState(false)
  const [dest, setDest] = useState(dests[0]?.id || '')
  const [label, setLabel] = useState('')

  const add = async () => {
    const r = await act('off-roster', () => trackedLinksApi.addLink(campaignId, dest, label.trim()),
                        `Link made for @${label.trim().replace(/^@/, '')}`)
    if (r) { setLabel(''); setOpen(false) }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="-mt-6 text-muted-foreground" onClick={() => setOpen(true)}>
        <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add a link for someone not on the roster
      </Button>
    )
  }
  return (
    <div className={cn(CARD, 'space-y-3 bg-card p-4')}>
      <div>
        <h3 className="text-[14px] font-semibold">A link for someone not on the roster</h3>
        <p className="text-ds-caption text-muted-foreground">A brand ambassador, say. Their clicks and sales count here too.</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-56 space-y-1.5">
          <Label className="text-[12px]">Retailer</Label>
          <Select value={dest} onValueChange={setDest}>
            <SelectTrigger><SelectValue placeholder="Pick a retailer" /></SelectTrigger>
            <SelectContent>
              {dests.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-56 space-y-1.5">
          <Label className="text-[12px]">Handle</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="@handle"
                 onKeyDown={(e) => { if (e.key === 'Enter' && dest && label.trim()) void add() }} />
        </div>
        <Button size="sm" className="h-9" disabled={busy === 'off-roster' || !dest || !label.trim()} onClick={add}>
          {busy === 'off-roster' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Make the link
        </Button>
        <Button size="sm" variant="ghost" className="h-9" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}

/* ══ The brand's codes ═══════════════════════════════════════════════════════════════════ */

const looksLikeUrl = (s: string) => /^https?:\/\//i.test(s) || /^www\./i.test(s)

/**
 * One row per line. Tabs if the line has any (a paste from a sheet), commas otherwise.
 *   handle, code
 *   handle, code, tracking link
 *   handle, retailer, code, tracking link
 * A lone value that is plainly a web address is taken as the tracking link, not a code.
 */
function parseCodes(text: string): CodeRow[] {
  const rows: CodeRow[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const cells = (line.includes('\t') ? line.split('\t') : line.split(',')).map((c) => c.trim())
    const handle = (cells[0] || '').replace(/^@/, '')
    if (!handle || /^(handle|username|creator|instagram)$/i.test(handle)) continue
    const row: CodeRow = { username: handle }
    if (cells.length >= 4) {
      row.retailer = cells[1] || undefined
      row.discount_code = cells[2] || undefined
      row.target_url = cells[3] || undefined
    } else {
      for (const c of cells.slice(1)) {
        if (!c) continue
        if (looksLikeUrl(c)) row.target_url = c
        else if (!row.discount_code) row.discount_code = c
      }
    }
    if (row.discount_code || row.target_url) rows.push(row)
  }
  return rows
}

function BrandCodes({ campaignId, busy, act }: { campaignId: string; busy: string | null; act: Act }) {
  const [text, setText] = useState('')
  const [unmatched, setUnmatched] = useState<string[]>([])
  const rows = useMemo(() => parseCodes(text), [text])

  const send = async () => {
    const r = await act('codes', () => trackedLinksApi.importCodes(campaignId, rows),
                        (r) => `${r.updated} link${r.updated === 1 ? '' : 's'} updated`)
    if (r) {
      setUnmatched(r.unmatched)
      if (!r.unmatched.length) setText('')
    }
  }

  return (
    <section>
      <SectionHead
        title="Brand's codes"
        note="If the brand gave each creator a discount code or their own tracking link, paste them here."
      />
      <div className={cn(CARD, 'space-y-3 bg-card p-4')}>
        <Textarea
          value={text} onChange={(e) => { setText(e.target.value); setUnmatched([]) }} rows={5}
          className="font-mono text-[12.5px]"
          placeholder={'handle, code\nhandle, code, tracking link\nhandle, retailer, code, tracking link'}
        />
        <p className="text-ds-caption text-muted-foreground">
          One creator per line, separated by commas or pasted straight from a sheet. Without a
          retailer the code goes on every link that creator has.
        </p>

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-ds-xl border">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-3 py-1.5 font-medium">Creator</th>
                  <th className="px-3 py-1.5 font-medium">Retailer</th>
                  <th className="px-3 py-1.5 font-medium">Code</th>
                  <th className="px-3 py-1.5 font-medium">Tracking link</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-1.5">@{r.username}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{r.retailer || 'Every retailer'}</td>
                    <td className="px-3 py-1.5 font-mono">{r.discount_code}</td>
                    <td className="max-w-[320px] truncate px-3 py-1.5">{r.target_url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 8 && (
              <p className="border-t px-3 py-1.5 text-ds-caption text-muted-foreground">
                and {rows.length - 8} more
              </p>
            )}
          </div>
        )}

        {unmatched.length > 0 && (
          <div className="rounded-ds-xl border border-amber-200/70 bg-amber-50/40 px-3 py-2 text-[12.5px]
                          dark:border-amber-900/40 dark:bg-amber-950/15">
            <p className="font-medium">No link matched {unmatched.length === 1 ? 'this handle' : 'these handles'}:</p>
            <p className="mt-0.5 font-mono">{unmatched.map((h) => `@${h}`).join(', ')}</p>
            <p className="mt-1 text-muted-foreground">
              Check the spelling, or add them with &quot;a link for someone not on the roster&quot;.
            </p>
          </div>
        )}

        <Button size="sm" disabled={!rows.length || busy === 'codes'} onClick={send}>
          {busy === 'codes' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Save {rows.length || ''} code{rows.length === 1 ? '' : 's'}
        </Button>
      </div>
    </section>
  )
}

/* ══ Sales ═══════════════════════════════════════════════════════════════════════════════ */

/** A small CSV reader: quoted fields, doubled quotes, commas, semicolons or tabs. */
function parseCsv(text: string): string[][] {
  const first = text.split(/\r?\n/, 1)[0] || ''
  const sep = first.includes('\t') ? '\t'
    : (first.split(';').length > first.split(',').length ? ';' : ',')
  const out: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === sep) { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((c) => c.trim())) out.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some((c) => c.trim())) out.push(row)
  return out
}

const COLUMNS: Record<keyof Omit<SaleRow, 'link_id'>, string[]> = {
  order_ref: ['order', 'order_id', 'order_ref', 'order id', 'order number', 'orderid'],
  amount: ['amount', 'sale_amount', 'revenue', 'sale amount', 'total', 'value'],
  currency: ['currency', 'cur'],
  occurred_at: ['date', 'occurred_at', 'order date', 'order_date'],
  code: ['code', 'coupon', 'discount_code', 'promo', 'coupon code'],
  click_id: ['click', 'click_id', 'subid', 'sub_id', 'sub1', 'aff_sub'],
  username: ['username', 'creator', 'handle', 'influencer'],
}

function salesFromCsv(text: string): { rows: SaleRow[]; mapped: string[] } {
  const grid = parseCsv(text)
  if (grid.length < 2) return { rows: [], mapped: [] }
  const head = grid[0].map((h) => h.trim().toLowerCase())
  const idx: Partial<Record<keyof SaleRow, number>> = {}
  for (const [key, names] of Object.entries(COLUMNS) as [keyof SaleRow, string[]][]) {
    const i = head.findIndex((h) => names.includes(h))
    if (i >= 0) idx[key] = i
  }
  const rows = grid.slice(1).map((cells) => {
    const r: SaleRow = { order_ref: '' }
    for (const [key, i] of Object.entries(idx) as [keyof SaleRow, number][]) {
      const v = (cells[i] || '').trim()
      if (v) (r as unknown as Record<string, string>)[key] = key === 'username' ? v.replace(/^@/, '') : v
    }
    return r
  }).filter((r) => r.order_ref)
  return { rows, mapped: Object.keys(idx) }
}

function Sales({ campaignId, data, destLabel, busy, act, confirm }: {
  campaignId: string
  data: TeamLinksReport
  destLabel: Record<string, string>
  busy: string | null
  act: Act
  confirm: Confirm
}) {
  const [mode, setMode] = useState<null | 'hand' | 'import'>(null)
  const conversions = data.conversions

  const remove = async (id: string, order: string) => {
    const ok = await confirm({
      kind: 'destructive',
      title: `Delete order ${order}?`,
      body: <>Use it for a sale entered by mistake. It comes off the creator&apos;s numbers and the
             brand&apos;s totals.</>,
      losses: [{ label: 'The sale is removed for good' }],
      confirmLabel: 'Delete the sale',
    })
    if (!ok) return
    await act(`sale-${id}`, () => trackedLinksApi.deleteSale(id), 'Sale deleted')
  }

  return (
    <section>
      <SectionHead
        title="Sales" count={conversions.length}
        note="From the retailer's postback, their spreadsheet, or typed in by hand. The same order is never counted twice."
        action={(
          <div className="flex gap-2">
            <Button variant={mode === 'hand' ? 'secondary' : 'outline'} size="sm"
                    onClick={() => setMode(mode === 'hand' ? null : 'hand')}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add one
            </Button>
            <Button variant={mode === 'import' ? 'secondary' : 'outline'} size="sm"
                    onClick={() => setMode(mode === 'import' ? null : 'import')}>
              <FileUp className="mr-1.5 h-3.5 w-3.5" /> Import a spreadsheet
            </Button>
          </div>
        )}
      />
      <div className="space-y-3">
        {mode === 'hand' && (
          <SaleByHand campaignId={campaignId} links={data.links} destLabel={destLabel} busy={busy}
                      act={act} onDone={() => setMode(null)} />
        )}
        {mode === 'import' && (
          <SaleImport campaignId={campaignId} busy={busy} act={act} onDone={() => setMode(null)} />
        )}

        {conversions.length > 0 && (
          <div className={cn(CARD, 'overflow-x-auto bg-card')}>
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="border-b text-left text-[12px] text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Creator</th>
                  <th className="px-3 py-2.5 font-medium">Retailer</th>
                  <th className="px-3 py-2.5 font-medium">Order</th>
                  <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Came in by</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {conversions.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      {c.username ? `@${c.username}` : <span className="text-muted-foreground">Not tied to a creator</span>}
                    </td>
                    <td className="px-3 py-2">{c.retailer}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]">{c.order_ref}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(c.amount_cents, c.currency || 'AED')}</td>
                    <td className="px-3 py-2">{fmtDate(c.occurred_at)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{SOURCE[c.source] || c.source}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground"
                              aria-label="Delete this sale" disabled={busy === `sale-${c.id}`}
                              onClick={() => remove(c.id, c.order_ref)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function SaleByHand({ campaignId, links, destLabel, busy, act, onDone }: {
  campaignId: string
  links: TrackedLink[]
  destLabel: Record<string, string>
  busy: string | null
  act: Act
  onDone: () => void
}) {
  const [linkId, setLinkId] = useState('')
  const [order, setOrder] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('AED')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const save = async () => {
    const r = await act('sale-add', () => trackedLinksApi.addSale(campaignId, {
      order_ref: order.trim(), amount: amount.trim() || null, currency: currency.trim() || 'AED',
      occurred_at: date || null, link_id: linkId || null,
    }), (r) => r.duplicates ? 'That order is already recorded' : 'Sale added')
    if (r) onDone()
  }

  return (
    <div className={cn(CARD, 'bg-card p-4')}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-64 space-y-1.5">
          <Label className="text-[12px]">Creator</Label>
          <Select value={linkId} onValueChange={setLinkId}>
            <SelectTrigger><SelectValue placeholder="Whose link it came through" /></SelectTrigger>
            <SelectContent>
              {links.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {handleOf(l)} | {destLabel[l.destination_id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40 space-y-1.5">
          <Label className="text-[12px]">Order</Label>
          <Input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="Order number" />
        </div>
        <div className="w-32 space-y-1.5">
          <Label className="text-[12px]">Amount</Label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="250.00" />
        </div>
        <div className="w-20 space-y-1.5">
          <Label className="text-[12px]">Currency</Label>
          <Input value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
        </div>
        <div className="w-40 space-y-1.5">
          <Label className="text-[12px]">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button size="sm" className="h-9" disabled={busy === 'sale-add' || !order.trim() || !linkId} onClick={save}>
          {busy === 'sale-add' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Add the sale
        </Button>
        <Button size="sm" variant="ghost" className="h-9" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  )
}

const MAPPED_NAME: Record<string, string> = {
  order_ref: 'order', amount: 'amount', currency: 'currency', occurred_at: 'date',
  code: 'code', click_id: 'click id', username: 'creator',
}

function SaleImport({ campaignId, busy, act, onDone }: {
  campaignId: string
  busy: string | null
  act: Act
  onDone: () => void
}) {
  const [file, setFile] = useState<string | null>(null)
  const [parsed, setParsed] = useState<{ rows: SaleRow[]; mapped: string[] } | null>(null)
  const [result, setResult] = useState<{ stored: number; duplicates: number; unattributed: number } | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const read = async (f: File) => {
    setResult(null)
    setFile(f.name)
    setParsed(salesFromCsv(await f.text()))
  }

  const canMatch = !!parsed && ['code', 'click_id', 'username'].some((k) => parsed.mapped.includes(k))

  const send = async () => {
    if (!parsed) return
    const r = await act('sale-import', () => trackedLinksApi.importSales(campaignId, parsed.rows),
                        (r) => `${r.stored} sale${r.stored === 1 ? '' : 's'} stored`)
    if (r) { setResult(r); setParsed(null); setFile(null) }
  }

  return (
    <div className={cn(CARD, 'space-y-3 bg-card p-4')}>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={input} type="file" accept=".csv,.tsv,.txt,text/csv" className="hidden"
               onChange={(e) => { const f = e.target.files?.[0]; if (f) void read(f); e.target.value = '' }} />
        <Button size="sm" variant="outline" onClick={() => input.current?.click()}>
          <Upload className="mr-1.5 h-3.5 w-3.5" /> {file ? 'Choose another file' : 'Choose a CSV'}
        </Button>
        {file && <span className="text-[12.5px] text-muted-foreground">{file}</span>}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onDone}>
          <X className="mr-1 h-3.5 w-3.5" /> Close
        </Button>
      </div>
      <p className="text-ds-caption text-muted-foreground">
        The first row names the columns. We read order, amount, currency and date, and match each
        sale to a creator by its code, click id or creator handle.
      </p>

      {parsed && (parsed.rows.length === 0 ? (
        <p className="text-[13px]">
          No rows with an order number. The file needs a column called order, order_id or order_ref.
        </p>
      ) : (
        <>
          <p className="text-[13px]">
            {parsed.rows.length} order{parsed.rows.length === 1 ? '' : 's'}. Read:{' '}
            {parsed.mapped.map((k) => MAPPED_NAME[k] || k).join(', ')}.
          </p>
          {!canMatch && (
            <p className="text-[12.5px] text-amber-700 dark:text-amber-400">
              No code, click id or creator column, so these sales will not be tied to anyone.
            </p>
          )}
          <div className="overflow-x-auto rounded-ds-xl border">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-3 py-1.5 font-medium">Order</th>
                  <th className="px-3 py-1.5 font-medium">Amount</th>
                  <th className="px-3 py-1.5 font-medium">Date</th>
                  <th className="px-3 py-1.5 font-medium">Matched by</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 6).map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-1.5 font-mono">{r.order_ref}</td>
                    <td className="px-3 py-1.5">{[r.currency, r.amount].filter(Boolean).join(' ')}</td>
                    <td className="px-3 py-1.5">{r.occurred_at}</td>
                    <td className="px-3 py-1.5 font-mono">
                      {r.code ? `code ${r.code}` : r.click_id ? `click ${r.click_id.slice(0, 8)}`
                        : r.username ? `@${r.username}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button size="sm" disabled={busy === 'sale-import'} onClick={send}>
            {busy === 'sale-import' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Import {parsed.rows.length} sale{parsed.rows.length === 1 ? '' : 's'}
          </Button>
        </>
      ))}

      {result && (
        <p className="text-[13px]">
          {result.stored} stored
          {result.duplicates > 0 && ` | ${result.duplicates} already recorded, skipped`}
          {result.unattributed > 0 && ` | ${result.unattributed} not tied to a creator`}
        </p>
      )}
    </div>
  )
}

/* ══ Postback ════════════════════════════════════════════════════════════════════════════ */

function Postback({ url }: { url: string }) {
  const example = `${url}&order=12345&amount=250.00&currency=AED&click={subid}`
  return (
    <section>
      <SectionHead
        icon={Webhook} title="Postback for the retailer"
        note="Sales come in on their own once the retailer or their affiliate network calls this."
      />
      <div className={cn(CARD, 'space-y-3 bg-card p-4')}>
        <div className="flex items-center gap-2 rounded-ds-xl border bg-muted/30 px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-[12.5px]">{url}</code>
          <CopyButton text={url} label="Copy" />
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          They call it once per order, adding <code className="text-foreground">&amp;order=</code>,{' '}
          <code className="text-foreground">&amp;amount=</code> and{' '}
          <code className="text-foreground">&amp;currency=</code>, plus{' '}
          <code className="text-foreground">&amp;click=</code> with the sub-id we passed them, or{' '}
          <code className="text-foreground">&amp;code=</code> with the discount code used. An order
          sent twice is counted once. For example:
        </p>
        <code className="block break-all rounded-ds-xl border px-3 py-2 text-[12px] text-muted-foreground">
          {example}
        </code>
      </div>
    </section>
  )
}
