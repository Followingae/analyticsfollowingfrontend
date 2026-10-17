'use client'

/**
 * Your paperwork — the documents, not the figures.
 *
 * A client could reach exactly one piece of their own paperwork: a single signed agreement,
 * on the campaign journey, for whichever campaign they happened to be looking at. Everything
 * else lived in our filing cabinet and left the building as an email attachment, which is why
 * "can you send me the signed copy again" and "I need the receipt for my accounts" are
 * questions this company answers by hand every month.
 *
 * Deliberately NOT a second invoice list. /billing already shows what has been billed,
 * merged across Stripe and the invoices we raise ourselves, and a second list of the same
 * money with a slightly different total is how a client stops believing either. This screen
 * is the files: the agreement you signed, and the receipt against each payment you made.
 *
 * Nothing here is derived. Every figure shown is a figure printed on the document beside it.
 */

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, Download, FileCheck2, Receipt } from 'lucide-react'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { GroupLabel, ListRow, LoadFailed, Loading, Nothing, Page, PageHead }
  from '@/components/brand/primitives'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { API_CONFIG, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

interface Agreement {
  id: string
  name: string
  url: string
  version: number | null
  countersigned: boolean
  signed_at: string | null
  campaign_id: string | null
  campaign_name: string | null
}

interface ReceiptFile {
  url: string
  name: string
  amount_aed: number | null
  received_at: string | null
}

interface Invoice {
  id: string
  label: string | null
  kind: string | null
  status: string | null
  amount_aed: number | null
  paid_at: string | null
  campaign_id: string | null
  campaign_name: string | null
  receipts: ReceiptFile[]
}

const day = (iso: string | null) =>
  !iso ? null : new Date(iso).toLocaleDateString('en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' })

const aed = (n: number | null) =>
  n == null ? null : `AED ${Number(n).toLocaleString('en-AE', { maximumFractionDigits: 2 })}`

export default function DocumentsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <Documents />
      </BrandUserInterface>
    </AuthGuard>
  )
}

function Documents() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [onATeam, setOnATeam] = useState(true)
  const [loading, setLoading] = useState(true)
  /* A refused read and an empty locker are different facts, and here the difference is
     between "we have nothing of yours" and "we never managed to ask". */
  const [failed, setFailed] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(null)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/client/documents`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`We could not load your documents (${res.status})`)
      const body = await res.json()
      setAgreements(body?.data?.agreements || [])
      setInvoices(body?.data?.invoices || [])
      setOnATeam(body?.data?.on_a_team !== false)
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'We could not load your documents')
      setAgreements([])
      setInvoices([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  /* Only invoices that actually carry a receipt. An invoice with none is on /billing with
     its status, and repeating it here with nothing to download would be a row that does
     nothing. */
  const withReceipts = invoices.filter(i => i.receipts.length > 0)

  if (loading) {
    return (
      <Page>
        <PageHead title="Your documents" sub="Agreements and receipts, ready to download." />
        <Loading rows={4} />
      </Page>
    )
  }

  if (failed) {
    return (
      <Page>
        <PageHead title="Your documents" sub="Agreements and receipts, ready to download." />
        <LoadFailed what="your documents" onRetry={load} />
      </Page>
    )
  }

  const nothingAtAll = agreements.length === 0 && withReceipts.length === 0

  return (
    <Page>
      <PageHead
        title="Your documents"
        sub="The agreement you signed, and the receipt against each payment. For what you have been billed, see billing."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/billing">
              Billing
              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      {nothingAtAll ? (
        <Nothing>
          {onATeam
            ? 'There is no signed paperwork on your account yet. Once an agreement is signed it appears here, and so does every receipt.'
            : 'This account is not linked to a company yet, so there is no paperwork against it. Your account manager can link it.'}
        </Nothing>
      ) : (
        <div className="space-y-ds-5">

          {agreements.length > 0 && (
            <section className="space-y-ds-2">
              <GroupLabel>Agreements</GroupLabel>
              <div className="flex flex-col">
                {agreements.map(a => (
                  <ListRow key={a.id}>
                    <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                      <span className="flex flex-wrap items-center gap-ds-2">
                        <span className="text-ds-body font-medium">{a.name}</span>
                        {/* The copy that came back signed by both sides, as opposed to the
                            one we signed and sent. Worth distinguishing: only one of them
                            is the executed document. */}
                        {a.countersigned && (
                          <Badge variant="secondary" className="font-normal">Countersigned</Badge>
                        )}
                        {a.version != null && (
                          <span className="text-ds-caption text-muted-foreground">
                            Version {a.version}
                          </span>
                        )}
                      </span>
                      <span className="text-ds-caption text-muted-foreground">
                        {a.campaign_name ? `${a.campaign_name} · ` : ''}
                        {day(a.signed_at) ? `Signed ${day(a.signed_at)}` : 'Signed'}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  </ListRow>
                ))}
              </div>
            </section>
          )}

          {withReceipts.length > 0 && (
            <section className="space-y-ds-2">
              <GroupLabel>Receipts</GroupLabel>
              <div className="flex flex-col">
                {withReceipts.flatMap(inv =>
                  inv.receipts.map((r, i) => (
                    <ListRow key={`${inv.id}-${i}`}>
                      <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                        <span className="text-ds-body font-medium">
                          {/* The payment it is a receipt for, in the client's own words
                              where we gave the instalment a label. */}
                          {inv.label || inv.campaign_name || 'Payment'}
                          {r.amount_aed != null && (
                            <span className="ml-2 font-normal tabular-nums text-muted-foreground">
                              {aed(r.amount_aed)}
                            </span>
                          )}
                        </span>
                        <span className="text-ds-caption text-muted-foreground">
                          {inv.campaign_name && inv.label ? `${inv.campaign_name} · ` : ''}
                          {day(r.received_at) ? `Received ${day(r.received_at)}` : r.name}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={r.url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Download
                        </a>
                      </Button>
                    </ListRow>
                  )),
                )}
              </div>
            </section>
          )}

        </div>
      )}
    </Page>
  )
}
