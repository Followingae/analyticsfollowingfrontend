"use client"

import { Sparkles, UserSearch, Zap } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { EmptyState } from "@/components/ui/empty-state"

export default function DiscoverPage() {

  return (
    <AuthGuard requireAuth={true}>
    <BrandUserInterface>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Discover Creators</h1>
              </div>
            </div>

            {/* Discovery is not live yet — full-page "Coming Soon" empty state.
                Copy is intentionally future-tense so we don't imply the feature is usable. */}
            <div className="flex items-center justify-center min-h-[70vh] px-4">
              <EmptyState
                title="Discovery Powered by AI"
                description={`Coming soon.

A smarter way to find the right creators for your brand — surfacing authentic voices and the best engagement fit. We're putting the finishing touches on it.`}
                icons={[Sparkles, UserSearch, Zap]}
                className="max-w-4xl p-20 text-lg"
              />
            </div>
          </div>
        </div>
    </BrandUserInterface>
    </AuthGuard>
  )
}
