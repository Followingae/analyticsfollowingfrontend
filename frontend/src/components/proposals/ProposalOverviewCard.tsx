"use client"

import {
  formatCurrency,
  relativeTime,
  getStockImage,
} from "./proposal-utils"
import { WorkflowBuilderCard } from "@/components/ui/workflow-builder-card"

interface ProposalListItem {
  id: string
  title: string
  campaign_name: string
  description?: string
  status: string
  total_influencers: number
  selected_count: number
  total_sell_amount?: number
  deadline_at?: string
  created_at: string
  sent_at?: string
  more_added_at?: string
}

interface ProposalOverviewCardProps {
  proposal: ProposalListItem
  archived?: boolean
  onClick: () => void
}

export function ProposalOverviewCard({
  proposal,
  archived,
  onClick,
}: ProposalOverviewCardProps) {
  const isPending =
    proposal.status === "sent" ||
    proposal.status === "in_review" ||
    proposal.status === "more_requested"

  const tags: string[] = []
  if (proposal.campaign_name) {
    tags.push(proposal.campaign_name)
  }
  if (proposal.total_influencers > 0) {
    tags.push(`${proposal.total_influencers} creators`)
  }
  if (proposal.total_sell_amount && proposal.total_sell_amount > 0) {
    tags.push(formatCurrency(proposal.total_sell_amount))
  }

  const initials = proposal.title
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase())
    .filter(Boolean)

  const users = initials.map((letter) => ({
    src: "",
    fallback: letter,
  }))

  const description = proposal.description || proposal.campaign_name

  return (
    <div
      onClick={onClick}
      className={archived ? "opacity-60 hover:opacity-80 transition-opacity" : ""}
    >
      <WorkflowBuilderCard
        imageUrl={getStockImage(proposal.id)}
        status={isPending ? "Active" : "Inactive"}
        lastUpdated={relativeTime(proposal.sent_at || proposal.created_at)}
        title={proposal.title}
        description={description}
        tags={tags}
        users={users}
        actions={[]}
        className="max-w-none"
      />
    </div>
  )
}
