"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { BrandInfluencer } from "@/services/adminProposalMasterApi"
import { InfluencerSelectionCard } from "./InfluencerSelectionCard"

interface SortableInfluencerCardProps {
  influencer: BrandInfluencer
  isSelected: boolean
  onToggle: (id: string) => void
  onViewDetails: (influencer: BrandInfluencer) => void
  showPricing?: boolean
  isDragDisabled?: boolean
}

export function SortableInfluencerCard({
  influencer,
  isDragDisabled,
  ...rest
}: SortableInfluencerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: influencer.id, disabled: isDragDisabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <InfluencerSelectionCard
        influencer={influencer}
        dragListeners={listeners}
        {...rest}
      />
    </div>
  )
}
