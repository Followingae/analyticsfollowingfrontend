"use client"

import { Badge } from "@/components/ui/badge"
import { AnimateIcon } from "@/components/animate-ui/icons/icon"
import {
  getProposalStatusVariant,
  getProposalStatusLabel,
  getProposalStatusIcon,
} from "./proposal-utils"

interface ProposalStatusBadgeProps {
  status: string
  showIcon?: boolean
  className?: string
}

export function ProposalStatusBadge({
  status,
  showIcon = true,
  className,
}: ProposalStatusBadgeProps) {
  const Icon = getProposalStatusIcon(status)
  return (
    <Badge variant={getProposalStatusVariant(status)} className={className}>
      {showIcon && (
        <AnimateIcon animateOnView animation="path" asChild>
          <Icon className="h-3 w-3 mr-1" />
        </AnimateIcon>
      )}
      {getProposalStatusLabel(status)}
    </Badge>
  )
}
