'use client'

/**
 * Your paperwork: every agreement, invoice and receipt we have issued you, as files.
 *
 * It used to show signed agreements and receipts only, so an account with an agreement
 * waiting for its signature and two invoices read "There is no signed paperwork on your
 * account yet". Every file now, from every module, grouped by what it is, each card saying
 * what it is waiting on. Billing adds the money up; this is where the documents are.
 */

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { DocumentShelf, usePaperwork } from '@/components/billing/PaperworkGrid'

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
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em]">Documents</h1>
        <Link href="/billing"
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2
                         text-[13px] font-medium transition hover:border-black/20 dark:border-white/[0.12] dark:bg-transparent">
          Billing<ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {!data.loading && !data.failed && !data.onATeam ? (
        <p className="text-[15px] text-muted-foreground">
          This login is not on a client account, so there is no paperwork to show.
        </p>
      ) : (
        <DocumentShelf
          data={data}
          empty="Nothing has been issued to you yet. Your first agreement appears here as soon as we send it."
        />
      )}
    </div>
  )
}
