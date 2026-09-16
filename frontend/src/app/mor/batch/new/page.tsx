'use client'

/**
 * Paying several creators at once.
 *
 * The single-creator form is one column and one question at a time, which is right when there
 * is one creator. It is wrong for six: the brand has a list, usually already written down
 * somewhere, and asking them to walk a six-step form six times is asking them to do our data
 * entry. So this is a table, and the table behaves like the spreadsheet the list came from.
 *
 * WHAT MAKES IT WORTH USING
 *   * Paste. Copy a column out of Excel, or a block of "Name, 5000" lines, drop it on any
 *     name field and it becomes rows. This is the actual reason somebody chooses this screen
 *     over the single form, so it is the first thing that works rather than a nicety.
 *   * Enter adds a row. Tab moves across, Enter moves down and makes a new line. Nobody
 *     reaches for the mouse between creators.
 *   * The total is live and always visible, pinned under the table, so the number never
 *     scrolls out of sight while they are typing the one that changes it.
 *
 * THE PRICE IS NEVER COMPUTED HERE. Every figure on this screen came from the server, which
 * also decides which creators the fee waiver covers. A total assembled in the browser and a
 * total assembled on the invoice would eventually disagree, and the client would be right.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  ArrowLeft, ClipboardPaste, CreditCard, Landmark, Plus, ShieldCheck, Trash2,
} from 'lucide-react'
import {
  morPaymentsApi, aed,
  type MorBatchQuote, type MorBatchLine, type MorBatchCreatorInput,
} from '@/services/morPaymentsApi'
import { cn } from '@/lib/utils'

const TOKENS = `
  .mor-scope {
    --mor-lime: oklch(0.9354 0.2254 121.4851);
    --mor-lime-ink: oklch(0.2046 0 0);
    --mor-rule: color-mix(in oklch, var(--border) 70%, transparent);
  }
  .mor-choice { transition: border-color 160ms cubic-bezier(0.22,1,0.36,1), background-color 160ms cubic-bezier(0.22,1,0.36,1); }
  /* The cells are inputs, but the table should read as a table until you are in one. Borders
     appear on focus rather than sitting there drawing nine boxes per row. */
  .mor-cell input {
    height: 34px; border-color: transparent; background: transparent;
    box-shadow: none; padding-left: 8px; padding-right: 8px;
  }
  .mor-cell input:hover { background: color-mix(in oklch, var(--muted) 45%, transparent); }
  .mor-cell input:focus-visible {
    background: var(--background); border-color: var(--ring);
  }
  .mor-total-in { animation: morTotal 320ms cubic-bezier(0.22, 1, 0.36, 1) both; }
  @keyframes morTotal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .mor-total-in { animation: none; } }
`

type Row = {
  key: string
  name: string
  handle: string
  /* How we reach them. WE send the enrolment link, never the brand, so without this we
     cannot contract or pay this creator at all. It is as load bearing as the fee. */
  contact: string
  work: string
  fee: string
}

let seq = 0
const blank = (): Row => ({ key: `r${++seq}`, name: '', handle: '', contact: '', work: '', fee: '' })

/** "1,500" and "AED 1 500.50" both mean the same number to a person, so they do here. */
function feeOf(raw: string): number {
  const n = Number(String(raw).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/**
 * Turn pasted text into rows.
 *
 * Handles what people actually paste: two columns out of a spreadsheet (tab separated), a
 * CSV, or a typed list of "Sara, 4000". A line with no number becomes a name with no fee
 * rather than being dropped, because a name on the screen with an empty fee is something the
 * brand can see and fix, and a silently discarded line is somebody who does not get paid.
 */
function parsePaste(text: string): Row[] {
  return text
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\t|,|;|\s{2,}/).map((p) => p.trim()).filter(Boolean)
      const row = blank()
      if (parts.length === 1) {
        // Either a bare name, or "Sara 4000" with a single space. Only treat a trailing
        // number as a fee when the line has something before it.
        const m = parts[0].match(/^(.+?)[\s]+([\d.,]+)$/)
        if (m && feeOf(m[2]) > 0) { row.name = m[1].trim(); row.fee = m[2] }
        else row.name = parts[0]
        return row
      }
      row.name = parts[0]
      const money = parts.slice(1).find((p) => feeOf(p) > 0)
      if (money) row.fee = money
      // Email is tested BEFORE the handle, and the handle rule is tightened to "starts with
      // @ and has no dot". Otherwise sara@gmail.com is read as an Instagram handle, which is
      // the kind of quiet mistake that means somebody never gets contacted.
      const email = parts.slice(1).find((p) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p))
      if (email) row.contact = email
      const handle = parts.slice(1).find((p) => p.startsWith('@') && !p.includes('.'))
      if (handle) row.handle = handle.replace(/^@/, '')
      return row
    })
}

export default function BatchPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <BatchForm />
      </BrandUserInterface>
    </AuthGuard>
  )
}

function BatchForm() {
  const router = useRouter()

  const [rows, setRows] = useState<Row[]>(() => [blank(), blank(), blank()])
  const [label, setLabel] = useState('')
  const [quote, setQuote] = useState<MorBatchQuote | null>(null)
  const [quoting, setQuoting] = useState(false)
  // Card is coming soon and unselectable, so transfer is chosen from the start
  // rather than making somebody pick from a list of one.
  const [method, setMethod] = useState<'card' | 'transfer' | null>('transfer')
  const [saving, setSaving] = useState(false)

  const nameRefs = useRef<Record<string, HTMLInputElement | null>>({})

  /** The rows that are actually somebody: a name and a fee. The rest are still being typed. */
  const filled = useMemo(
    () => rows.filter((r) => r.name.trim() && feeOf(r.fee) > 0 && r.contact.trim()),
    [rows],
  )

  /* Named, priced, and unreachable. Called out for exactly the same reason a missing fee is:
     silently dropping them means a creator who is never contacted and never paid. */
  const missingContact = useMemo(
    () => rows.filter((r) => r.name.trim() && feeOf(r.fee) > 0 && !r.contact.trim()),
    [rows],
  )

  /* Named rows missing a fee. Called out rather than ignored, because this is the one way a
     creator disappears off an instruction to pay people without anybody noticing. */
  const missingFee = useMemo(
    () => rows.filter((r) => r.name.trim() && feeOf(r.fee) <= 0),
    [rows],
  )

  const payload: MorBatchCreatorInput[] = useMemo(
    () => filled.map((r) => ({
      creator_name: r.name.trim(),
      creator_handle: r.handle.trim() || undefined,
      creator_email: r.contact.trim() || undefined,
      deliverables: r.work.trim() ? [r.work.trim()] : undefined,
      creator_fee_aed: feeOf(r.fee),
    })),
    [filled],
  )

  /* Quote on a pause, not per keystroke: a total that flickers mid-number reads as the price
     moving on them. The signature guards against a stale response landing after a newer one. */
  const signature = JSON.stringify(payload)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(0)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (payload.length === 0) { setQuote(null); setQuoting(false); return }
    setQuoting(true)
    const ticket = ++latest.current
    timer.current = setTimeout(async () => {
      try {
        const r = await morPaymentsApi.batches.quote(payload)
        if (ticket === latest.current) setQuote(r.data)
      } catch {
        if (ticket === latest.current) setQuote(null)
      } finally {
        if (ticket === latest.current) setQuoting(false)
      }
    }, 420)
    return () => { if (timer.current) clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const patch = useCallback((key: string, p: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...p } : r)))
  }, [])

  const addRow = useCallback(() => {
    const row = blank()
    setRows((prev) => [...prev, row])
    // Focus the new line so a list can be typed without ever reaching for the mouse.
    requestAnimationFrame(() => nameRefs.current[row.key]?.focus())
  }, [])

  const removeRow = useCallback((key: string) => {
    setRows((prev) => (prev.length <= 1 ? [blank()] : prev.filter((r) => r.key !== key)))
  }, [])

  const onPaste = useCallback((key: string, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text/plain')
    // A single value with no line break is an ordinary paste into one field. Only a list
    // takes over the table.
    if (!text || !/[\r\n\t,;]/.test(text)) return
    e.preventDefault()
    const parsed = parsePaste(text)
    if (!parsed.length) return
    setRows((prev) => {
      const at = prev.findIndex((r) => r.key === key)
      const before = prev.slice(0, at)
      const after = prev.slice(at + 1)
      // Drop the empty rows sitting after the paste point; they were placeholders, and
      // leaving them scattered between real creators looks like the table broke.
      return [...before, ...parsed, ...after.filter((r) => r.name.trim() || feeOf(r.fee) > 0)]
    })
    toast.success(`${parsed.length} ${parsed.length === 1 ? 'creator' : 'creators'} added`)
  }, [])

  /** Enter moves down the list and makes a new line at the bottom, like a spreadsheet. */
  const onKey = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const next = rows[index + 1]
    if (next) nameRefs.current[next.key]?.focus()
    else addRow()
  }, [rows, addRow])

  const waivedNames = useMemo(
    () => new Set((quote?.lines ?? []).filter((l) => l.fee_waived).map((l) => l.creator_name)),
    [quote],
  )
  const lineFor = useCallback(
    (row: Row): MorBatchLine | undefined =>
      quote?.lines.find((l) => l.creator_name === row.name.trim()),
    [quote],
  )

  const ready = filled.length > 0 && !!quote && !!method && !saving

  const submit = async () => {
    if (!ready || !method) return
    setSaving(true)
    try {
      const created = await morPaymentsApi.batches.create(payload, label.trim() || undefined)
      await morPaymentsApi.batches.submit(created.data.id, method)
      router.push(`/mor/batch/${created.data.id}`)
    } catch (e) {
      toast.error((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="mor-scope mx-auto w-full max-w-[1040px] px-5 py-12 sm:px-8 sm:py-16">
      <style>{TOKENS}</style>

      <Button variant="ghost" size="sm" className="-ml-2.5 gap-1.5 text-muted-foreground"
              onClick={() => router.push('/mor')}>
        <ArrowLeft className="size-4" />Merchant of Record
      </Button>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
            Pay several creators
          </h1>
          <p className="mt-3 max-w-[58ch] text-[14.5px] leading-relaxed text-muted-foreground">
            One list, one payment from you. We contract each creator separately and pay them
            each in full, on exactly the fee you put beside their name.
          </p>
        </div>
        {quote && quote.fee_free.remaining > 0 && (
          <div
            className="mt-1 inline-flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-[13px] font-medium"
            style={{ background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' }}
          >
            <ShieldCheck className="size-[15px]" aria-hidden />
            <span className="tabular-nums">
              {quote.fee_free.remaining} fee-free{' '}
              {quote.fee_free.remaining === 1 ? 'creator' : 'creators'}
            </span>
          </div>
        )}
      </header>

      {/* The list */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Who you are paying
            </h2>
            <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <ClipboardPaste className="size-[13px]" aria-hidden />
              Paste a list straight from a spreadsheet, or type and press Enter for the next
              one.
            </p>
          </div>
          <div className="text-[12.5px] tabular-nums text-muted-foreground">
            {filled.length > 0 && (
              <>{filled.length} {filled.length === 1 ? 'creator' : 'creators'}</>
            )}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-[14px] border border-[var(--mor-rule)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[26%] min-w-[180px] pl-4">Creator</TableHead>
                <TableHead className="w-[16%] min-w-[130px]">Instagram</TableHead>
                <TableHead className="w-[20%] min-w-[170px]">Their email</TableHead>
                <TableHead className="w-[24%] min-w-[160px]">What they are posting</TableHead>
                <TableHead className="w-[16%] min-w-[130px] text-right">Their fee</TableHead>
                <TableHead className="w-[16%] min-w-[130px] text-right">Costs you</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row, i) => {
                const line = lineFor(row)
                const waived = !!row.name.trim() && waivedNames.has(row.name.trim())
                const named = !!row.name.trim()
                const noFee = named && feeOf(row.fee) <= 0
                return (
                  <TableRow key={row.key} className="mor-cell">
                    <TableCell className="pl-2">
                      <Input
                        ref={(el) => { nameRefs.current[row.key] = el }}
                        value={row.name}
                        onChange={(e) => patch(row.key, { name: e.target.value })}
                        onPaste={(e) => onPaste(row.key, e)}
                        onKeyDown={(e) => onKey(i, e)}
                        placeholder={i === 0 ? 'Their name' : ''}
                        aria-label={`Creator ${i + 1} name`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.handle}
                        onChange={(e) => patch(row.key, { handle: e.target.value.replace(/^@/, '') })}
                        placeholder={i === 0 ? 'handle' : ''}
                        aria-label={`Creator ${i + 1} Instagram handle`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.contact}
                        onChange={(e) => patch(row.key, { contact: e.target.value })}
                        onKeyDown={(e) => onKey(i, e)}
                        placeholder={i === 0 ? 'them@email.com' : ''}
                        inputMode="email"
                        aria-label={`Creator ${i + 1} email`}
                        className={cn(named && !row.contact.trim()
                          && 'border-amber-500/60 bg-amber-500/5')}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.work}
                        onChange={(e) => patch(row.key, { work: e.target.value })}
                        placeholder={i === 0 ? '1 reel, 2 stories' : ''}
                        aria-label={`Creator ${i + 1} deliverables`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        value={row.fee}
                        onChange={(e) => patch(row.key, { fee: e.target.value })}
                        onKeyDown={(e) => onKey(i, e)}
                        inputMode="decimal"
                        placeholder={i === 0 ? '5,000' : ''}
                        aria-label={`Creator ${i + 1} fee in AED`}
                        className={cn('text-right tabular-nums',
                          noFee && 'border-amber-500/60 bg-amber-500/5')}
                      />
                    </TableCell>
                    <TableCell className="pr-2 text-right">
                      {line ? (
                        <div className="pr-2">
                          <div className="text-[13.5px] font-medium tabular-nums">
                            {aed(line.total_aed)}
                          </div>
                          {waived ? (
                            <span
                              className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                              style={{ background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' }}
                            >
                              <ShieldCheck className="size-[11px]" aria-hidden />Fee waived
                            </span>
                          ) : (
                            <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                              incl. {aed(line.our_fee_aed)} fee
                            </div>
                          )}
                        </div>
                      ) : noFee ? (
                        <span className="pr-2 text-[12px] text-amber-600 dark:text-amber-500">
                          Needs a fee
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="pr-2">
                      {(named || feeOf(row.fee) > 0) && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          aria-label={`Remove ${row.name.trim() || `creator ${i + 1}`}`}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
                        >
                          <Trash2 className="size-[15px]" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>

            {(quote || quoting) && (
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="pl-4 text-[13px] font-normal text-muted-foreground">
                    {quote
                      ? <>{quote.creators} {quote.creators === 1 ? 'creator' : 'creators'}
                          {quote.waived_count > 0 && (
                            <>, {quote.waived_count} fee-free</>
                          )}</>
                      : 'Working out the total…'}
                  </TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums">
                    {quote ? aed(quote.creator_fee_aed) : <Skeleton className="ml-auto h-4 w-20" />}
                  </TableCell>
                  <TableCell colSpan={2} className="pr-4 text-right text-[15px] font-semibold tabular-nums">
                    {quote ? aed(quote.total_aed) : <Skeleton className="ml-auto h-5 w-24" />}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="size-4" />Add another
          </Button>
          {missingContact.length > 0 && (
            <p className="text-[12.5px] text-amber-600 dark:text-amber-500">
              {missingContact.length === 1
                ? `We have no email for ${missingContact[0].name.trim()}, so we cannot send them their agreement.`
                : `${missingContact.length} creators have no email, so we cannot send them their agreement.`}
            </p>
          )}
          {missingFee.length > 0 && (
            <p className="text-[12.5px] text-amber-600 dark:text-amber-500">
              {missingFee.length === 1
                ? `${missingFee[0].name.trim()} has no fee yet, so they are not on this payment.`
                : `${missingFee.length} creators have no fee yet, so they are not on this payment.`}
            </p>
          )}
        </div>
      </section>

      {/* The money */}
      {quote && (
        <section className="mor-total-in mt-16 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              How you would like to pay
            </h2>
            <p className="mt-3 max-w-[52ch] text-[13.5px] leading-relaxed text-muted-foreground">
              One payment covers the whole list. We pay each creator once it has cleared, so
              the sooner it is settled the sooner we can lock their dates.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Choice
                icon={CreditCard} title="Pay by card"
                body="We are building this. Bank transfer for now."
                selected={false} onSelect={() => {}} soon
              />
              <Choice
                icon={Landmark} title="Send me an invoice"
                body="One invoice for the whole list. You transfer once."
                selected={method === 'transfer'} onSelect={() => setMethod('transfer')}
              />
            </div>

            <div className="mt-10 max-w-[420px]">
              <Label htmlFor="mor-batch-label" className="text-[13.5px] font-medium">
                Call this list something
              </Label>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                Only so you can tell it apart later. It is not on the agreement or the invoice.
              </p>
              <Input
                id="mor-batch-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="October creators"
                className="mt-2.5"
              />
            </div>
          </div>

          <Summary quote={quote} />
        </section>
      )}

      <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-[var(--mor-rule)] pt-8">
        <Button onClick={submit} disabled={!ready} className="min-w-[200px]">
          {saving ? 'Setting it up…'
            : method === 'card' ? `Confirm and pay ${quote ? aed(quote.total_aed) : ''}`
            : method === 'transfer' ? 'Confirm and invoice me'
            : 'Confirm'}
        </Button>
        {!ready && !saving && (
          <p className="text-[13px] text-muted-foreground">
            {filled.length === 0 ? 'Add a creator and the fee you agreed with them.'
              : !quote ? 'Working out the total…'
              : 'Choose how you would like to pay.'}
          </p>
        )}
      </div>
    </div>
  )
}

/* The invoice, in the order an invoice reads it. Sticky on a wide screen so the number they
   are committing to stays put while they scroll the list that produces it. */
function Summary({ quote }: { quote: MorBatchQuote }) {
  return (
    <aside className="lg:sticky lg:top-8 lg:self-start">
      <div className="rounded-[14px] border border-[var(--mor-rule)] px-6 py-5">
        <Line label={`Creators' fees`} value={aed(quote.creator_fee_aed)} />
        <Line
          label="Our Merchant of Record fee"
          value={
            quote.waived_count > 0 && quote.our_fee_aed === 0 ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                style={{ background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' }}
              >
                <ShieldCheck className="size-3" aria-hidden />Waived
              </span>
            ) : (
              `${aed(quote.our_fee_aed)}  ·  ${quote.standard_fee_pct}%`
            )
          }
        />
        <Line label={quote.vat_label} value={aed(quote.vat_aed)} />
        <div className="mt-4 flex items-baseline justify-between border-t border-[var(--mor-rule)] pt-4">
          <span className="text-[14px] font-medium">Total</span>
          <span className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]">
            {aed(quote.total_aed)}
          </span>
        </div>

        {quote.waived_count > 0 && (
          <div
            className="mt-5 rounded-[10px] px-4 py-3 text-[12.5px] leading-relaxed"
            style={{ background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' }}
          >
            <span className="font-semibold">
              {quote.waived_count} fee-free {quote.waived_count === 1 ? 'creator' : 'creators'} on
              this list, saving you {aed(quote.waived_saving_aed)}.
            </span>{' '}
            <span className="opacity-80">
              We put them on your largest fees, where they are worth the most. VAT still
              applies: the waiver takes off our fee, not the tax.
            </span>
          </div>
        )}

        {quote.waived_count > 0 && quote.fee_free_after > 0 && (
          <p className="mt-3 text-[12px] text-muted-foreground">
            You would have {quote.fee_free_after} left afterwards.
          </p>
        )}
      </div>
    </aside>
  )
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1.5 text-[14px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  )
}

function Choice({ icon: Icon, title, body, selected, onSelect, soon }: {
  icon: React.ComponentType<{ className?: string }>
  title: string; body: string; selected: boolean; onSelect: () => void; soon?: boolean
}) {
  /* `soon` shows the option and refuses it. Removing card altogether would say we do not take
     cards; showing it greyed says we are building it, and only one of those is true. */
  return (
    <button
      type="button"
      onClick={soon ? undefined : onSelect}
      disabled={soon}
      aria-pressed={selected}
      className={cn(
        'mor-choice relative rounded-[14px] border px-5 py-5 text-left',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
        soon
          ? 'cursor-default border-dashed border-[var(--mor-rule)] opacity-60'
          : selected
            ? 'border-foreground/45 bg-muted/50'
            : 'border-[var(--mor-rule)] hover:border-foreground/25 hover:bg-muted/30',
      )}
    >
      {soon && (
        <span className="absolute right-4 top-4 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Coming soon
        </span>
      )}
      <Icon className={cn('size-[18px]', selected && !soon ? 'text-foreground' : 'text-muted-foreground')} />
      <div className="mt-3 text-[14.5px] font-medium tracking-[-0.01em]">{title}</div>
      <div className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{body}</div>
    </button>
  )
}
