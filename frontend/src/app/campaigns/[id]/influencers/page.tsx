"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Campaign influencer selection sub-page — redirects to posts/analytics page.
 * Influencer selection happens via proposals, not this page.
 */
export default function CampaignInfluencersPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/campaigns/${params.id}/posts`);
  }, [params.id, router]);

  return null;
}
