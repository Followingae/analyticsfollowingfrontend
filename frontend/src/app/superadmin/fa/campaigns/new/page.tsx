"use client"

/**
 * FA campaign creation - step 1: pick the campaign type.
 * Consolidates the three separate create entry points (cashback / paid deal /
 * barter) into one wizard flow; each type proceeds to its dedicated form.
 */

import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { CARD, PageHead } from "@/components/console/primitives"
import { FaPage } from "../../_ui"
import { ArrowLeft, ArrowRight, QrCode, Coins, Gift } from "lucide-react"

const TYPES = [
  {
    key: "cashback",
    href: "/superadmin/fa/campaigns/create",
    icon: QrCode,
    title: "Cashback",
    badge: "Driven by a QR receipt",
    description:
      "Creators drive purchases at the client's venue. Buyers scan the QR on the receipt and the pool pays the creator's commission on its own.",
  },
  {
    key: "paid_deal",
    href: "/superadmin/fa/campaigns/create-paid-deal",
    icon: Coins,
    title: "Paid deal",
    badge: "One fixed fee",
    description:
      "Creators do the agreed deliverables for a fixed AED fee each, paid out of the client's funded pool.",
  },
  {
    key: "barter",
    href: "/superadmin/fa/campaigns/create-barter",
    icon: Gift,
    title: "Barter",
    badge: "Product, not money",
    description:
      "Creators get products or a service in exchange for the content. No cash changes hands.",
  },
]

export default function FaCampaignTypePickerPage() {
  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <FaPage className="max-w-5xl">
          <div>
            <Link
              href="/superadmin/fa/campaigns"
              className="mb-ds-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to campaigns
            </Link>
            <PageHead
              title="Create a campaign"
              sub="Step 1 of 2. Pick what kind of deal this is; the details come next. The type decides how the creator gets paid, so it cannot be changed afterwards."
            />
          </div>

          <div className="grid grid-cols-1 gap-ds-3 md:grid-cols-3">
            {TYPES.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={`${CARD} group flex flex-col gap-ds-3 bg-[var(--tone-neutral-wash)] p-ds-3 transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-white/[0.04]`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-ds-md bg-black/[0.04] dark:bg-white/[0.07]">
                    <t.icon className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <span className="text-ds-caption text-muted-foreground">{t.badge}</span>
                </div>
                <div className="space-y-ds-1">
                  <h2 className="text-ds-subheading">{t.title}</h2>
                  <p className="text-ds-body-sm text-muted-foreground">{t.description}</p>
                </div>
                <span className="mt-auto inline-flex items-center text-sm font-medium">
                  Set this one up
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </FaPage>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
