'use client'

import { use } from 'react'
import { UserProposalDetail } from '@/components/proposals/user/UserProposalDetail'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    proposalId: string
  }>
}

export default function ProposalDetailPage({ params }: Props) {
  const resolvedParams = use(params)
  return <UserProposalDetail proposalId={resolvedParams.proposalId} />
}