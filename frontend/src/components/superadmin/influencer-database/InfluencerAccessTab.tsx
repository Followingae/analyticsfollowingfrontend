"use client"

/**
 * Sharing, honestly.
 *
 * This tab printed "Not currently shared with any users" over an illustration, having never
 * asked. It is a placeholder: nothing here reads the share list, so it cannot say whether
 * this creator is in one. Saying so is the only honest thing it can do, and it is a sentence
 * rather than a card because there is no object here to put in one.
 */
import type { MasterInfluencer } from "@/types/influencerDatabase"

interface InfluencerAccessTabProps {
  influencer: MasterInfluencer
}

export function InfluencerAccessTab({ influencer }: InfluencerAccessTabProps) {
  return (
    <p className="max-w-[65ch] text-ds-body text-muted-foreground">
      This panel does not read who @{influencer.username} has been shared with, so it cannot
      tell you. Share links and who holds them live on the Sharing screen.
    </p>
  )
}
