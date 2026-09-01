'use client'

/**
 * The Invoices tab.
 *
 * One list. The client does not have to know whether Stripe or our finance team
 * raised a given line — they only have to know what it was for, what it costs,
 * and whether it is settled. Merging happens in `useAccountInvoices`; this file
 * is the rendering of it.
 *
 * Three states are kept apart because they mean different things:
 *   loading  — a skeleton, no numbers at all
 *   empty    — we asked, both sources answered, there is nothing
 *   failed   — we asked and did not get an answer, so we say that and offer a
 *              retry, rather than rendering an empty table that reads as "no
 *              invoices" when it means "no idea".
 */

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui2/empty'
import { ButtonGroup } from '@/components/ui2/button-group'
import {
  AlertCircle, Download, ExternalLink, FileText, Receipt, RefreshCw, Sheet,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  invoiceDate, invoicesToCsv, money, STATUS_COPY,
  type AccountInvoicesResult, type UnifiedInvoice,
} from './useAccountInvoices'

type Filter = 'all' | 'outstanding' | 'paid'

function AmountCell({ value, currency, muted }: { value: number | null; currency: string; muted?: boolean }) {
  return (
    <span className={muted ? 'text-muted-foreground' : undefined}>
      {money(value, currency)}
    </span>
  )
}

function InvoiceRow({ inv }: { inv: UnifiedInvoice }) {
  const status = STATUS_COPY[inv.status]
  const owes = inv.outstanding !== null && inv.outstanding > 0

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-mono text-ds-caption text-muted-foreground">
        {inv.reference || '—'}
      </TableCell>
      <TableCell className="max-w-[280px]">
        <div className="flex items-center gap-ds-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="truncate text-ds-body">{inv.what}</div>
            {inv.period && (
              <div className="truncate text-ds-caption text-muted-foreground">{inv.period}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-ds-body-sm">
        <div>{invoiceDate(inv.dateIso)}</div>
        {inv.dueDateIso && (
          <div className="text-ds-caption text-muted-foreground">
            Due {invoiceDate(inv.dueDateIso)}
          </div>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right text-ds-body-sm">
        <AmountCell value={inv.net} currency={inv.currency} muted />
      </TableCell>
      <TableCell className="whitespace-nowrap text-right text-ds-body-sm">
        <AmountCell value={inv.vat} currency={inv.currency} muted />
      </TableCell>
      <TableCell className="whitespace-nowrap text-right text-ds-body font-medium">
        <AmountCell value={inv.gross} currency={inv.currency} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge className={status.className}>{status.label}</Badge>
        {owes && (
          <div className="mt-ds-1 text-ds-caption text-muted-foreground">
            {money(inv.outstanding, inv.currency)} outstanding
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-ds-1">
          {inv.fileUrl ? (
            <Button variant="ghost" size="sm" asChild className="h-8 gap-ds-1 px-2 text-muted-foreground hover:text-foreground">
              <a href={inv.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:text-ds-caption">PDF</span>
              </a>
            </Button>
          ) : null}
          {inv.viewUrl ? (
            <Button variant="ghost" size="sm" asChild className="h-8 gap-ds-1 px-2 text-muted-foreground hover:text-foreground">
              <a href={inv.viewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:text-ds-caption">
                  {inv.source === 'stripe' ? 'View' : 'Pay'}
                </span>
              </a>
            </Button>
          ) : null}
          {/* No file and no link. Say so once, plainly, rather than offering a
              button that does nothing when it is pressed. */}
          {!inv.fileUrl && !inv.viewUrl && (
            <span className="text-ds-caption text-muted-foreground">
              {inv.status === 'paid' ? 'Settled' : 'Sent by email'}
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function InvoicesPanel({ data }: { data: AccountInvoicesResult }) {
  const { invoices, loading, failedSources, failed, reload } = data
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(() => {
    if (filter === 'outstanding') {
      return invoices.filter((i) => i.outstanding !== null && i.outstanding > 0)
    }
    if (filter === 'paid') return invoices.filter((i) => i.status === 'paid')
    return invoices
  }, [invoices, filter])

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.info('Nothing to export')
      return
    }
    const blob = new Blob([invoicesToCsv(rows)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-ds-3 px-4 py-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Failed is not empty. Nothing came back, so we claim nothing.
  if (failed) {
    return (
      <Card>
        <CardContent className="py-ds-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><AlertCircle /></EmptyMedia>
              <EmptyTitle>We could not load your invoices</EmptyTitle>
              <EmptyDescription>
                Nothing is wrong with your account. The request did not come back,
                so rather than show you a list that might be missing something,
                we are showing you none of it.
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" size="sm" className="mt-ds-3" onClick={reload}>
              <RefreshCw className="mr-ds-1 h-4 w-4" />
              Try again
            </Button>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  const partial = failedSources.length === 1

  return (
    <div className="space-y-ds-3">
      {partial && (
        <div className="flex items-start gap-ds-2 rounded-ds-surface border border-amber-200 bg-amber-50 p-ds-3 text-ds-body-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {failedSources[0] === 'stripe'
              ? 'Your subscription invoices did not load, so this list may be incomplete.'
              : 'Your campaign invoices did not load, so this list may be incomplete.'}{' '}
            <button type="button" onClick={reload} className="underline underline-offset-2">
              Try again
            </button>
          </p>
        </div>
      )}

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-ds-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Receipt /></EmptyMedia>
                <EmptyTitle>No invoices yet</EmptyTitle>
                <EmptyDescription>
                  Every invoice we raise against your account appears here, whether
                  it is settled by card or by transfer.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-ds-3">
            <div>
              <CardTitle className="flex items-center gap-ds-2 text-ds-subheading">
                <Receipt className="h-5 w-5" />
                Invoices
              </CardTitle>
              <CardDescription className="text-ds-body-sm">
                Subscription and campaign invoices, newest first.
              </CardDescription>
            </div>
            <div className="flex items-center gap-ds-2">
              <ButtonGroup>
                {(['all', 'outstanding', 'paid'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="capitalize"
                  >
                    {f}
                  </Button>
                ))}
              </ButtonGroup>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Sheet className="mr-ds-1 h-4 w-4" />
                CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-ds-overline">Number</TableHead>
                  <TableHead className="text-ds-overline">For</TableHead>
                  <TableHead className="text-ds-overline">Date</TableHead>
                  <TableHead className="text-right text-ds-overline">Net</TableHead>
                  <TableHead className="text-right text-ds-overline">VAT</TableHead>
                  <TableHead className="text-right text-ds-overline">Total</TableHead>
                  <TableHead className="text-ds-overline">Status</TableHead>
                  <TableHead className="text-right text-ds-overline">Get it</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-ds-5 text-center text-ds-body-sm text-muted-foreground">
                      {filter === 'outstanding'
                        ? 'Nothing outstanding. Everything we have raised is settled.'
                        : 'No paid invoices yet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((inv) => <InvoiceRow key={inv.key} inv={inv} />)
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
