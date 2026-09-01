"use client"

/**
 * Funding the cashback pool. Density tier: READING, because it is one decision and a price.
 *
 * Three things were wrong here beyond the styling.
 *
 * Every amount on the screen was a bare U+20C3 pasted into a string. No shipped system font
 * carries that codepoint, so a page whose entire job is to state a number was printing an
 * empty rectangle in front of each one, including inside the confirmation the client reads
 * before being sent to Stripe. Money now goes through `Money`, which spells AED in the face
 * that has the mark.
 *
 * When the package list failed to load, four invented packages were rendered in its place.
 * They were disabled and labelled unavailable, so nobody could buy one, but four fabricated
 * prices on a payment screen is not a loading state, it is a fiction. A failed read now says
 * so, and the custom amount stays available, so the client can still fund the pool.
 *
 * And the packages were four bordered boxes plus a fifth for the custom amount plus a sixth
 * for the pay button. They are one set of choices, so they are one hairline-separated group
 * with the selected one carrying a tint, and the action sits under it with room around it
 * rather than in a box of its own.
 */

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, CreditCard, Check } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { brandPoolApi } from "@/services/faAdminApi"
import { toast } from "sonner"
import {
  Failed,
  Money,
  moneyText,
  Page,
  PageHead,
  SectionHead,
  Sections,
  Waiting,
} from "@/components/campaigns/surface"

interface TopupPackage {
  id: string
  name: string
  amount_aed: number
  stripe_price_id: string
}

const MIN_AED = 100
const MAX_AED = 100000

export default function TopupPage() {
  const [packages, setPackages] = useState<TopupPackage[]>([])
  const [packagesState, setPackagesState] = useState<"loading" | "ready" | "failed">("loading")
  const [selected, setSelected] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function loadPackages() {
    setPackagesState("loading")
    try {
      const res = await brandPoolApi.topupPackages()
      const pkgs = res?.data?.packages || res?.data || []
      if (Array.isArray(pkgs) && pkgs.length > 0) {
        setPackages(pkgs)
        setPackagesState("ready")
      } else {
        // An empty list is not a failure: there are simply no packages configured, and the
        // custom amount is then the only way in. Say nothing rather than invent four.
        setPackages([])
        setPackagesState("ready")
      }
    } catch (error) {
      console.error('Failed to fetch topup packages:', error)
      setPackages([])
      setPackagesState("failed")
    }
  }

  useEffect(() => { loadPackages() }, [])

  const handleTopup = async () => {
    setLoading(true)
    try {
      const urls = {
        success_url: `${window.location.origin}/billing?tab=cashback-pool&topup=success`,
        cancel_url: `${window.location.origin}/billing?tab=cashback-pool&topup=cancelled`,
      }

      let res: any
      if (useCustom) {
        const amount = parseFloat(customAmount)
        if (!amount || amount < MIN_AED) {
          toast.error(`Minimum custom amount is ${moneyText(MIN_AED)}`)
          setLoading(false)
          return
        }
        if (amount > MAX_AED) {
          toast.error(`Maximum custom amount is ${moneyText(MAX_AED)}`)
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
    } catch (error) {
      console.error('Topup payment initiation failed:', error)
      toast.error("Payment initiation failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const displayAmount = useCustom
    ? (parseFloat(customAmount) || 0)
    : (packages.find((p) => p.id === selected)?.amount_aed || 0)

  const canPay = useCustom ? (parseFloat(customAmount) >= MIN_AED) : !!selected

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <Page width="form">
          <Sections>
            <PageHead
              title="Top up your cashback pool"
              sub="Pick an amount and pay by card. The pool is credited as soon as Stripe confirms, and it is what funds every cashback your creators earn."
              back={
                <Link
                  href="/billing?tab=cashback-pool"
                  className="inline-flex w-fit items-center gap-ds-2 text-ds-body-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to cashback pool
                </Link>
              }
            />

            <div className="flex flex-col gap-ds-5">
              <SectionHead title="How much" />

              {packagesState === "loading" ? (
                <Waiting lines={3} />
              ) : packagesState === "failed" ? (
                <Failed
                  what="We could not load the top up packages"
                  detail="You can still fund the pool with your own amount below."
                  onRetry={loadPackages}
                />
              ) : packages.length > 0 ? (
                /* One set of choices, so one list on hairlines. The selected row carries a
                   tint, which is the third rung of the ladder and the first that is really
                   needed here: a ring plus a shadow plus a badge was saying it three times. */
                <div
                  role="radiogroup"
                  aria-label="Top up package"
                  className="divide-y overflow-hidden rounded-ds-lg border"
                >
                  {packages.map((pkg) => {
                    const isSelected = !useCustom && selected === pkg.id
                    const isUnavailable = !pkg.stripe_price_id
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={isUnavailable}
                        onClick={() => { setSelected(pkg.id); setUseCustom(false) }}
                        className={cn(
                          "flex w-full items-center justify-between gap-ds-3 px-ds-4 py-ds-3 text-left transition-colors",
                          isSelected ? "bg-primary/[0.07]" : "hover:bg-muted/60",
                          isUnavailable && "cursor-not-allowed opacity-55 hover:bg-transparent",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-ds-label">{pkg.name}</span>
                          <span className="mt-1 block text-ds-caption text-muted-foreground">
                            {isUnavailable ? "Not available to buy right now" : "One off, credited to the pool"}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-ds-3">
                          <span className="text-ds-subheading">
                            <Money amount={pkg.amount_aed} />
                          </span>
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0 text-primary",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                            aria-hidden
                          />
                        </span>
                      </button>
                    )
                  })}

                  {/* The custom amount is one of the same choices, so it sits in the same
                      list rather than in a competing card. */}
                  <div className={cn("transition-colors", useCustom && "bg-primary/[0.07]")}>
                    {useCustom ? (
                      <div className="px-ds-4 py-ds-3">
                        <div className="flex items-center justify-between gap-ds-3">
                          <Label htmlFor="customAmount" className="text-ds-label">
                            Your own amount
                          </Label>
                          <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        </div>
                        <div className="mt-ds-2 flex items-center gap-ds-2">
                          <span className="aed-currency text-ds-label text-muted-foreground">AED</span>
                          <Input
                            id="customAmount"
                            type="number"
                            min={MIN_AED}
                            max={MAX_AED}
                            step={100}
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="7,500"
                            className="h-11 max-w-[220px] text-ds-heading tabular-nums"
                            autoFocus
                          />
                        </div>
                        <p className="mt-ds-2 text-ds-caption text-muted-foreground">
                          Anything from {moneyText(MIN_AED)} to {moneyText(MAX_AED)}.
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={false}
                        onClick={() => { setUseCustom(true); setSelected(null) }}
                        className="flex w-full items-center justify-between gap-ds-3 px-ds-4 py-ds-3 text-left transition-colors hover:bg-muted/60"
                      >
                        <span className="min-w-0">
                          <span className="block text-ds-label">Your own amount</span>
                          <span className="mt-1 block text-ds-caption text-muted-foreground">
                            Anything from {moneyText(MIN_AED)} to {moneyText(MAX_AED)}
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* No packages configured: the custom amount is the whole screen. */
                <div className="rounded-ds-lg border px-ds-4 py-ds-4">
                  <Label htmlFor="customAmountOnly" className="text-ds-label">
                    Amount to add
                  </Label>
                  <div className="mt-ds-2 flex items-center gap-ds-2">
                    <span className="aed-currency text-ds-label text-muted-foreground">AED</span>
                    <Input
                      id="customAmountOnly"
                      type="number"
                      min={MIN_AED}
                      max={MAX_AED}
                      step={100}
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setUseCustom(true) }}
                      placeholder="7,500"
                      className="h-11 max-w-[220px] text-ds-heading tabular-nums"
                    />
                  </div>
                  <p className="mt-ds-2 text-ds-caption text-muted-foreground">
                    Anything from {moneyText(MIN_AED)} to {moneyText(MAX_AED)}.
                  </p>
                </div>
              )}
            </div>

            {/* The action. One primary button, given room rather than a box, with the figure
                it is about restated directly above it. */}
            {canPay && (
              <div className="flex flex-col gap-ds-3 border-t pt-ds-5">
                <div className="flex items-baseline justify-between gap-ds-3">
                  <span className="text-ds-body text-muted-foreground">
                    {useCustom ? "Your own amount" : packages.find((p) => p.id === selected)?.name}
                  </span>
                  <span className="text-ds-heading">
                    <Money amount={displayAmount} />
                  </span>
                </div>
                <Button onClick={() => setConfirmOpen(true)} disabled={loading} size="lg">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {loading ? "Taking you to Stripe" : "Continue to payment"}
                </Button>
                <p className="text-ds-caption text-muted-foreground">
                  Stripe takes the payment, we never see your card. The pool is credited as
                  soon as it clears.
                </p>
              </div>
            )}

            {/* States the exact amount once more before the redirect. */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm your top up</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to fund your cashback pool with{" "}
                    <span className="font-semibold text-foreground">
                      {moneyText(displayAmount)}
                    </span>
                    . Stripe will take the payment.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleTopup} disabled={loading}>
                    Continue to Stripe
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Sections>
        </Page>
      </BrandUserInterface>
    </AuthGuard>
  )
}
