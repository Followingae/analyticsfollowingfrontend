'use client'

/**
 * /billing/invoices — the same list as the Invoices tab on /billing.
 *
 * This route used to hold its own copy of a Stripe-only invoice table: a third
 * implementation of the same screen, which meant a client following an old link
 * saw a different, shorter truth than a client who clicked the tab. It now
 * renders the one merged panel, so there is exactly one answer to "what have I
 * been billed".
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { AuthGuard } from '@/components/AuthGuard'
import { InvoicesPanel } from '@/components/billing/InvoicesPanel'
import { useAccountInvoices } from '@/components/billing/useAccountInvoices'

export default function InvoicesPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <InvoicesContent />
      </BrandUserInterface>
    </AuthGuard>
  )
}

function InvoicesContent() {
  const { user } = useEnhancedAuth()
  const data = useAccountInvoices(!!user)

  return (
    <div className="flex-1 max-w-6xl mx-auto p-6">
      <div className="space-y-ds-4">
        <div className="space-y-ds-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 h-8 text-muted-foreground">
            <Link href="/billing">
              <ArrowLeft className="mr-ds-1 h-4 w-4" />
              Billing
            </Link>
          </Button>
          <h1 className="text-ds-title">Invoices</h1>
          <p className="text-ds-body text-muted-foreground">
            Everything we have billed you for, however it was raised.
          </p>
        </div>
        <InvoicesPanel data={data} />
      </div>
    </div>
  )
}
