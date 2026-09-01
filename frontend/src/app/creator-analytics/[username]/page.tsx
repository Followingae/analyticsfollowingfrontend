'use client'

import React, { Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { CreatorAnalyticsV2 } from '@/components/analytics/v2/CreatorAnalyticsV2'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Page, PageHead } from '@/components/brand/primitives'

/**
 * The rebuilt pipeline (/api/v2/creator-analytics) is the only creator analytics.
 *
 * There is no flag any more, and v1 is deleted. The flag was a build-time
 * NEXT_PUBLIC_ var, which meant "is the new analytics live?" was answered by an
 * env string in a dashboard — and it got stored with a UTF-8 BOM and a trailing
 * CRLF, so `=== 'true'` was false and the old page shipped while every check said
 * otherwise. One import is a fact; a flag is a claim.
 */

function CreatorAnalyticsInner() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  // ?embed=1 — rendered inside an iframe (the proposal page's analytics drawer).
  // The proposal drawer has always requested this; nothing ever read it, so the iframe
  // loaded the WHOLE app — sidebar, header, nav — nested inside a narrow sheet. That is
  // what "full analytics doesn't work" was: it worked, it just rendered a second copy of
  // the app in a 3rem-wide column.
  const embed = useSearchParams().get('embed') === '1'

  if (embed) {
    // No AuthGuard: a same-origin iframe carries the parent's session, and an AuthGuard
    // redirect inside an iframe navigates the FRAME, not the tab — it would blank the
    // drawer rather than send anyone to a login page.
    return (
      <div className="p-4 md:p-6">
        <CreatorAnalyticsV2 username={username} />
      </div>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        {/* Density tier: READING. This is the longest single screen a brand looks at, so
            the head gets the room the rest of the page borrows its rhythm from. The back
            link sits ABOVE the name rather than beside it: the name is the subject of the
            page and used to share a row with a button, which made it look like a caption. */}
        <Page tier="reading">
          <PageHead
            back={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="-ml-2 h-7 w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            }
            title={<span className="truncate">@{username}</span>}
            sub="Everything we have measured for this creator."
          />
          <CreatorAnalyticsV2 username={username} />
        </Page>
      </BrandUserInterface>
    </AuthGuard>
  )
}

export default function CreatorAnalyticsPage() {
  // useSearchParams() needs a Suspense boundary above it or the build fails prerendering.
  return (
    <Suspense fallback={null}>
      <CreatorAnalyticsInner />
    </Suspense>
  )
}
