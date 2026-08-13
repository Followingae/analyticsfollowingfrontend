"use client"

import SuperadminBilling from "@/components/admin/SuperadminBilling"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { MoneyHubHeader } from "@/components/console/MoneyHubHeader"

// Billing ops moved out of the orphaned /admin shell into the one operator
// console. RBAC: route is module-gated ("billing") via ModuleRouteGuard.
// It is also the first tab of the money hub, so it wears the hub header — the
// screen below is unchanged.
export default function SuperadminBillingPage() {
  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <MoneyHubHeader />
        <SuperadminBilling />
      </div>
    </SuperadminLayout>
  )
}
