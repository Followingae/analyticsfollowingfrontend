"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import DiscoveryTab from "@/components/tabs/DiscoveryTab"

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
                <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                  Discover the perfect creators for your brand using our AI-powered matching system.
                </p>
              </div>
            </div>

            {/* Discovery Content */}
            <DiscoveryTab />
          </div>
        </div>
    </BrandUserInterface>
    </AuthGuard>
  )
}
