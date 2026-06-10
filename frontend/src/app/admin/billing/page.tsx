import { redirect } from "next/navigation"

// Billing ops lives in the operator console now.
export default function LegacyAdminBillingRedirect() {
  redirect("/superadmin/billing")
}
