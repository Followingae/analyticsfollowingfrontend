import React from 'react'
import { cn } from '@/lib/utils'

interface CurrencyDisplayProps {
  amount: number
  className?: string
}

export function CurrencyDisplay({ amount, className }: CurrencyDisplayProps) {
  const formattedAmount = new Intl.NumberFormat('ar-AE', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="aed-currency">AED</span>
      <span>{formattedAmount}</span>
    </span>
  )
}

export function formatCurrencyAED(amount: number): string {
  return new Intl.NumberFormat('ar-AE', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Component for inline currency display in JSX
export function AEDAmount({ amount, className }: { amount: number, className?: string }) {
  const formattedAmount = formatCurrencyAED(amount)
  return (
    <>
      <span className="aed-currency">AED</span> {formattedAmount}
    </>
  )
}