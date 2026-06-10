"use client"

/**
 * FA campaign creation — step 1: pick the campaign type.
 * Consolidates the three separate create entry points (cashback / paid deal /
 * barter) into one wizard flow; each type proceeds to its dedicated form.
 */

import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, QrCode, Coins, Gift } from "lucide-react"

const TYPES = [
  {
    key: "cashback",
    href: "/superadmin/fa/campaigns/create",
    icon: QrCode,
    title: "Cashback",
    badge: "QR-driven",
    description:
      "Creators drive purchases at the client's venue; buyers scan QR receipts and the pool pays creator commissions automatically.",
  },
  {
    key: "paid_deal",
    href: "/superadmin/fa/campaigns/create-paid-deal",
    icon: Coins,
    title: "Paid Deal",
    badge: "Fixed payout",
    description:
      "Creators complete agreed deliverables for a fixed AED payout per participant, funded from the client's pool.",
  },
  {
    key: "barter",
    href: "/superadmin/fa/campaigns/create-barter",
    icon: Gift,
    title: "Barter",
    badge: "Product exchange",
    description:
      "Creators receive products or services in exchange for deliverables — no cash payout involved.",
  },
]

export default function FaCampaignTypePickerPage() {
  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6 max-w-5xl">
          <div>
            <Link
              href="/superadmin/fa/campaigns"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to FA Campaigns
            </Link>
            <h1 className="text-2xl font-bold">Create FA Campaign</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Step 1 of 2 — choose the campaign type. You&apos;ll fill in the details next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TYPES.map((t) => (
              <Link key={t.key} href={t.href} className="group">
                <Card className="h-full transition-all duration-150 group-hover:border-primary/50 group-hover:shadow-md cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <t.icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline" className="text-xs">{t.badge}</Badge>
                    </div>
                    <CardTitle className="text-lg mt-3">{t.title}</CardTitle>
                    <CardDescription>{t.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="inline-flex items-center text-sm font-medium text-primary">
                      Continue
                      <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-150 group-hover:translate-x-0.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
