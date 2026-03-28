'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Receipt,
} from 'lucide-react'
import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { AuthGuard } from '@/components/AuthGuard'

interface Invoice {
  id: string
  number: string | null
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  amount_due: number
  amount_paid: number
  currency: string
  created: number
  period_start: number
  period_end: number
  invoice_pdf: string | null
  hosted_invoice_url: string | null
  description: string | null
  lines_description: string | null
  subscription: string | null
}

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
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    if (user) {
      fetchInvoices()
    }
  }, [user])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const headers = getAuthHeaders()

      if (!headers.Authorization) {
        setInvoices([])
        return
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.billing.invoices}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }

      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      toast.error('Failed to load invoice history')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amountCents: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountCents / 100)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatPeriod = (start: number, end: number) => {
    const startDate = new Date(start * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const endDate = new Date(end * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `${startDate} - ${endDate}`
  }

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-0">
            Paid
          </Badge>
        )
      case 'open':
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0">
            Open
          </Badge>
        )
      case 'draft':
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border-0">
            Draft
          </Badge>
        )
      case 'void':
        return (
          <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400 border-0">
            Void
          </Badge>
        )
      case 'uncollectible':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-0">
            Uncollectible
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDescription = (invoice: Invoice) => {
    return invoice.lines_description || invoice.description || 'Subscription'
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-8 w-56" />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-48 flex-1" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/billing"
            className="flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invoice history</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              View and download your past invoices
            </p>
          </div>
        </div>

        {/* Invoice table or empty state */}
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-base font-medium">No invoices yet</h3>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
                Your billing history will appear here once you have an active subscription.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/billing">Back to billing</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(invoice.created)}
                      </TableCell>
                      <TableCell className="text-sm max-w-[240px] truncate">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{getDescription(invoice)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatPeriod(invoice.period_start, invoice.period_end)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium whitespace-nowrap">
                        {formatCurrency(
                          invoice.status === 'paid' ? invoice.amount_paid : invoice.amount_due,
                          invoice.currency
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {invoice.invoice_pdf && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-150"
                            >
                              <a
                                href={invoice.invoice_pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {invoice.hosted_invoice_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-150"
                            >
                              <a
                                href={invoice.hosted_invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View online"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
