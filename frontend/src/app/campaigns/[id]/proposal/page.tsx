"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Campaign proposal sub-page — redirects to posts/analytics page.
 * Proposal review happens at /proposals/[proposalId], not here.
 */
export default function CampaignProposalPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/campaigns/${params.id}/posts`);
  }, [params.id, router]);

  return null;
}
