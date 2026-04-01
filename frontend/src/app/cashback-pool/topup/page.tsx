"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CreditCard, Check, Zap, Edit3 } from "lucide-react"
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
  const [customAmount, setCustomAmount] = useState("")
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await brandPoolApi.topupPackages()
        const pkgs = res?.data?.packages || res?.data || []
        if (Array.isArray(pkgs) && pkgs.length > 0) setPackages(pkgs)
        else throw new Error("empty")
      } catch {
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
    setLoading(true)
    try {
      const urls = {
        success_url: `${window.location.origin}/cashback-pool?topup=success`,
        cancel_url: `${window.location.origin}/cashback-pool?topup=cancelled`,
      }

      let res: any
      if (useCustom) {
        const amount = parseFloat(customAmount)
        if (!amount || amount < 100) {
          toast.error("Minimum custom amount is AED 100")
          setLoading(false)
          return
        }
        if (amount > 100000) {
          toast.error("Maximum custom amount is AED 100,000")
          setLoading(false)
          return
        }
        res = await brandPoolApi.createCustomTopupSession({ amount_aed: amount, ...urls })
      } else {
        if (!selected) { setLoading(false); return }
        res = await brandPoolApi.createTopupSession({ package_id: selected, ...urls })
      }

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

  const displayAmount = useCustom
    ? (parseFloat(customAmount) || 0)
    : (packages.find((p) => p.id === selected)?.amount_aed || 0)

  const canPay = useCustom ? (parseFloat(customAmount) >= 100) : !!selected

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <Link href="/cashback-pool" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" />Back to Pool
            </Link>
            <h1 className="text-2xl font-bold">Top Up Cashback Pool</h1>
            <p className="text-muted-foreground text-sm">Select a package or enter a custom amount to fund your pool via Stripe (AED)</p>
          </div>

          {/* Packages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all ${!useCustom && selected === pkg.id ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"} ${useCustom ? "opacity-50" : ""}`}
                onClick={() => { setSelected(pkg.id); setUseCustom(false) }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={!useCustom && selected === pkg.id ? "default" : "secondary"}>{pkg.name}</Badge>
                    {!useCustom && selected === pkg.id && <Check className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="text-3xl font-bold">AED {pkg.amount_aed.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">One-time pool topup</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Amount */}
          <Card className={`transition-all ${useCustom ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md cursor-pointer"}`}
            onClick={() => { if (!useCustom) { setUseCustom(true); setSelected(null) } }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant={useCustom ? "default" : "secondary"} className="flex items-center gap-1">
                  <Edit3 className="h-3 w-3" />Custom Amount
                </Badge>
                {useCustom && <Check className="h-5 w-5 text-primary" />}
              </div>
              {useCustom ? (
                <div className="space-y-2">
                  <Label>Amount (AED)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-muted-foreground">AED</span>
                    <Input
                      type="number"
                      min={100}
                      max={100000}
                      step={100}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="e.g. 7500"
                      className="text-2xl font-bold h-12"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Min AED 100 — Max AED 100,000</p>
                </div>
              ) : (
                <>
                  <p className="text-lg font-semibold">Enter your own amount</p>
                  <p className="text-sm text-muted-foreground mt-1">AED 100 – 100,000</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pay Button */}
          {canPay && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {useCustom ? "Custom Amount" : "Selected Package"}
                    </p>
                    <p className="text-lg font-semibold">
                      {!useCustom && packages.find((p) => p.id === selected)?.name}
                      {useCustom ? "Custom" : ""} — AED {displayAmount.toLocaleString()}
                    </p>
                  </div>
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <Button onClick={handleTopup} disabled={loading} className="w-full" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {loading ? "Redirecting to Stripe..." : `Pay AED ${displayAmount.toLocaleString()} with Stripe`}
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
