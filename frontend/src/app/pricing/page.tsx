'use client'

/**
 * Pricing, led by what we do rather than by three sizes of subscription.
 *
 * The page body is in ModuleCards so this file can hold the Suspense boundary that
 * useSearchParams needs: reading the visitor's chosen plan out of the URL is what stops the
 * marketing site's Premium click quietly becoming a Standard sale, and in Next 15 that hook
 * has to sit under a boundary or the whole route opts out of static rendering.
 */

import { Suspense } from 'react'
import { ModuleCards } from './ModuleCards'
import { PublicChrome } from './PublicChrome'

export default function PricingPage() {
  return (
    <PublicChrome>
      <Suspense fallback={null}>
        <ModuleCards />
      </Suspense>
    </PublicChrome>
  )
}
