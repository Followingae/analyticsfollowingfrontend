'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ComprehensiveCreatorAnalytics } from '@/components/analytics/ComprehensiveCreatorAnalytics'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function CreatorAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  // Debug logging removed for cleaner console output

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
            <ComprehensiveCreatorAnalytics username={username} />
          </div>
      </BrandUserInterface>
    </AuthGuard>
  )
}