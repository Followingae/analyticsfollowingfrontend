"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Check, Zap } from "lucide-react"
import Link from "next/link"
import { brandPoolApi } from "@/services/faAdminApi"
import { toast } from "sonner"

interface TopupPackage {
  id: string
  name: string
  amount_aed: number
  stripe_price_id: string
}

export default function TopupPage() {
  const [packages, setPackages] = useState<TopupPackage[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await brandPoolApi.topupPackages()
        if (res.success) setPackages(res.data || [])
      } catch {
        // Fallback packages
        setPackages([
          { id: "starter", name: "Starter", amount_aed: 5000, stripe_price_id: "" },
          { id: "growth", name: "Growth", amount_aed: 10000, stripe_price_id: "" },
          { id: "scale", name: "Scale", amount_aed: 25000, stripe_price_id: "" },
          { id: "enterprise", name: "Enterprise", amount_aed: 50000, stripe_price_id: "" },
        ])
      }
    }
    load()
  }, [])

  const handleTopup = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await brandPoolApi.createTopupSession({
        package_id: selected,
        success_url: `${window.location.origin}/cashback-pool?topup=success`,
        cancel_url: `${window.location.origin}/cashback-pool?topup=cancelled`,
      })
      if (res.success && res.data?.session_url) {
        window.location.href = res.data.session_url
      } else {
        toast.error("Failed to create checkout session")
      }
    } catch {
      toast.error("Payment initiation failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <Link href="/cashback-pool" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" />Back to Pool
            </Link>
            <h1 className="text-2xl font-bold">Top Up Cashback Pool</h1>
            <p className="text-muted-foreground text-sm">Select a package to fund your pool via Stripe (AED)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all ${selected === pkg.id ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"}`}
                onClick={() => setSelected(pkg.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={selected === pkg.id ? "default" : "secondary"}>{pkg.name}</Badge>
                    {selected === pkg.id && <Check className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="text-3xl font-bold">AED {pkg.amount_aed.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">One-time pool topup</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selected && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Package</p>
                    <p className="text-lg font-semibold">
                      {packages.find((p) => p.id === selected)?.name} — AED{" "}
                      {packages.find((p) => p.id === selected)?.amount_aed.toLocaleString()}
                    </p>
                  </div>
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <Button onClick={handleTopup} disabled={loading} className="w-full" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {loading ? "Redirecting to Stripe..." : "Pay with Stripe"}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  You&apos;ll be redirected to Stripe for secure payment. Pool is credited instantly.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </BrandUserInterface>
    </AuthGuard>
  )
}
