"use client"

import { ProposalsRouter } from '@/components/proposals/ProposalsRouter'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function ProposalsPage() {
  return <ProposalsRouter />
}