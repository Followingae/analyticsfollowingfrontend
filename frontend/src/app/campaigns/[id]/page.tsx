"use client";

import { useParams } from "next/navigation";

import { AuthGuard } from "@/components/AuthGuard";
import { BrandUserInterface } from "@/components/brand/BrandUserInterface";
import { CampaignJourney } from "@/components/campaigns/journey/CampaignJourney";

/**
 * A client opening their campaign lands here, on where it is — not on how it performed.
 *
 * This used to redirect straight to the analytics page, which answered the wrong question
 * for most of a campaign's life: for the weeks between confirming and the first post there
 * is nothing to measure yet, and a page of empty charts reads as a campaign that is not
 * happening. The analytics are still one click away, from the panel on the right.
 */
export default function CampaignOverviewPage() {
  const params = useParams();
  const campaignId = params.id as string;

  return (
    <AuthGuard>
      <BrandUserInterface>
        {campaignId ? <CampaignJourney campaignId={campaignId} /> : null}
      </BrandUserInterface>
    </AuthGuard>
  );
}
