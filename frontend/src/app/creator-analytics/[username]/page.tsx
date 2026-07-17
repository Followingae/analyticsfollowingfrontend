'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CreatorAnalyticsV2 } from '@/components/analytics/v2/CreatorAnalyticsV2'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

/**
 * The rebuilt pipeline (/api/v2/creator-analytics) is the only creator analytics.
 *
 * There is no flag any more, and v1 is deleted. The flag was a build-time
 * NEXT_PUBLIC_ var, which meant "is the new analytics live?" was answered by an
 * env string in a dashboard — and it got stored with a UTF-8 BOM and a trailing
 * CRLF, so `=== 'true'` was false and the old page shipped while every check said
 * otherwise. One import is a fact; a flag is a claim.
 */

export default function CreatorAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            {/* Back Navigation */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">@{username}</h1>
                <p className="text-muted-foreground text-sm">Creator Analytics</p>
              </div>
            </div>
            <CreatorAnalyticsV2 username={username} />
          </div>
      </BrandUserInterface>
    </AuthGuard>
  )
}