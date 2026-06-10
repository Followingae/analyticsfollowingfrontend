"use client"

import SuperadminBilling from "@/components/admin/SuperadminBilling"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"

// Billing ops moved out of the orphaned /admin shell into the one operator
// console. RBAC: route is module-gated ("billing") via ModuleRouteGuard.
export default function SuperadminBillingPage() {
  return (
    <SuperadminLayout>
      <SuperadminBilling />
    </SuperadminLayout>
  )
}
