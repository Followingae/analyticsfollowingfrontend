"use client"

import { useEffect, useState } from "react"
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
  campaign_type_target?: string
}

interface ProposalOverviewCardProps {
  proposal: ProposalListItem
  archived?: boolean
  onClick: () => void
}

const LAST_VIEW_KEY_PREFIX = "proposal_last_viewed:"

export function ProposalOverviewCard({
  proposal,
  archived,
  onClick,
}: ProposalOverviewCardProps) {
  const isPending =
    proposal.status === "sent" ||
    proposal.status === "in_review" ||
    proposal.status === "more_requested"

  // "New batch" indicator: show if more_added_at > localStorage last-viewed timestamp.
  const [hasNewBatch, setHasNewBatch] = useState(false)
  useEffect(() => {
    if (!proposal.more_added_at) { setHasNewBatch(false); return }
    if (typeof window === "undefined") return
    const lastViewed = window.localStorage.getItem(LAST_VIEW_KEY_PREFIX + proposal.id)
    if (!lastViewed) { setHasNewBatch(true); return }
    setHasNewBatch(new Date(proposal.more_added_at).getTime() > new Date(lastViewed).getTime())
  }, [proposal.id, proposal.more_added_at])

  const tags: string[] = []
  if (proposal.campaign_name) {
    tags.push(proposal.campaign_name)
  }
  if (proposal.campaign_type_target && proposal.campaign_type_target !== "influencer") {
    tags.push(proposal.campaign_type_target.replace("_", " "))
  }
  if (proposal.total_influencers > 0) {
    tags.push(`${proposal.total_influencers} creators`)
  }
  if (proposal.total_sell_amount && proposal.total_sell_amount > 0) {
    tags.push(formatCurrency(proposal.total_sell_amount))
  }
  if (hasNewBatch) {
    tags.push("New batch")
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
