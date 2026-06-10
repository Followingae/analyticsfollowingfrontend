import { redirect } from "next/navigation"

// Cashback Pool now lives inside Billing (single commercial home).
// Preserve query params (e.g. ?topup=success from Stripe returns) on the way.
export default async function CashbackPoolRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const qs = new URLSearchParams({ tab: "cashback-pool" })
  for (const [k, v] of Object.entries(sp)) {
    if (k !== "tab" && typeof v === "string") qs.set(k, v)
  }
  redirect(`/billing?${qs.toString()}`)
}
