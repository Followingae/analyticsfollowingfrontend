"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Campaign content approval sub-page — redirects to posts/analytics page.
 * Content approval workflow will be built when backend workflow is complete.
 */
export default function CampaignContentPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/campaigns/${params.id}/posts`);
  }, [params.id, router]);

  return null;
}
