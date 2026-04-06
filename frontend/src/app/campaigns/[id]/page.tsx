"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Campaign overview page — redirects to the posts/analytics page
 * which is the real, API-connected campaign detail view.
 */
export default function CampaignOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  useEffect(() => {
    if (campaignId) {
      router.replace(`/campaigns/${campaignId}/posts`);
    }
  }, [campaignId, router]);

  return null;
}
