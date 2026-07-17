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
  cover_image_url?: string
  /** Up to 5 real creators for the avatar row. Empty on a parked proposal — the API
   *  withholds them rather than the card hiding them. */
  creators?: { username: string; full_name?: string | null; avatar_url?: string | null }[]
  work_in_progress?: boolean
  work_in_progress_note?: string | null
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

  const parked = !!proposal.work_in_progress

  const tags: string[] = []
  if (parked) {
    // Leads, so it is read before anything else on the card. The rest of the tags are
    // suppressed: creator counts and totals on a proposal we are telling them isn't
    // finished are exactly the half-made numbers parking exists to hide.
    tags.push("Check again shortly")
    if (proposal.campaign_name) tags.push(proposal.campaign_name)
  } else {
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
  }

  // Real creators, up to five, then "+N".
  //
  // These used to be the first letters of the PROPOSAL TITLE: "Lago Wafers Influencers"
  // rendered as L / W / I — three circles that look like three creators and are three
  // letters of a heading. The card carried no creator data at all.
  //
  // A parked proposal sends none (the API withholds them), so the row is simply absent —
  // showing five faces on a proposal we are telling the client isn't ready would undo the
  // point of parking it.
  const creators = proposal.creators ?? []
  const shown = creators.slice(0, 5)
  const extra = Math.max(0, (proposal.total_influencers ?? creators.length) - shown.length)

  const users = [
    ...shown.map((c) => ({
      src: c.avatar_url || "",
      // Falls back to the creator's own initial — never a proposal-title letter.
      fallback: (c.username || c.full_name || "?").replace(/[^a-zA-Z0-9]/g, "").charAt(0).toUpperCase() || "?",
    })),
    ...(extra > 0 ? [{ src: "", fallback: `+${extra}` }] : []),
  ]

  const description = parked
    ? (proposal.work_in_progress_note || "Our team is adding the finishing touches — check again shortly.")
    : (proposal.description || proposal.campaign_name)

  return (
    <div
      onClick={onClick}
      className={archived ? "opacity-60 hover:opacity-80 transition-opacity" : ""}
    >
      <WorkflowBuilderCard
        imageUrl={proposal.cover_image_url || getStockImage(proposal.id)}
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
