'use client'

/**
 * Your paperwork: every agreement, invoice and receipt we have issued you, as files.
 *
 * It used to show signed agreements and receipts only. An account with an agreement waiting
 * for its signature and two invoices therefore read "There is no signed paperwork on your
 * account yet", which is true and useless: the client came here for the files, and the files
 * existed. Every file now, from every module, with what it is waiting on. Billing is where
 * the money is added up; this is where the documents are.
 */

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Page, PageHead } from '@/components/brand/primitives'
import { Button } from '@/components/ui/button'
import { PaperworkGrid, usePaperwork } from '@/components/billing/PaperworkGrid'

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
  const data = usePaperwork()
  return (
    <Page>
      <PageHead
        title="Your documents"
        sub="Every agreement, invoice and receipt we have issued you, ready to download."
        action={
          <Button variant="outline" size="sm" className="gap-1" asChild>
            <Link href="/billing">Billing<ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </Button>
        }
      />
      {!data.loading && !data.failed && !data.onATeam ? (
        <p className="text-ds-body-sm text-muted-foreground">
          This login is not on a client account, so there is no paperwork to show.
        </p>
      ) : (
        <PaperworkGrid
          data={data}
          kinds={['agreement', 'invoice', 'receipt']}
          filterBy="kind"
          empty="Nothing has been issued to you yet. Your first agreement appears here as soon as we send it."
        />
      )}
    </Page>
  )
}
