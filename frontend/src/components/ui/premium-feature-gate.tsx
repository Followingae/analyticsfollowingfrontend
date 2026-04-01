"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import {
  Crown,
  Sparkles,
  ArrowRight,
  Check,
  LucideIcon,
} from "lucide-react"

interface FeatureHighlight {
  icon: LucideIcon
  title: string
  description: string
}

interface PremiumFeatureGateProps {
  featureName: string
  headline: string
  description: string
  highlights: FeatureHighlight[]
  requiredTier?: string
  className?: string
}

export function PremiumFeatureGate({
  featureName,
  headline,
  description,
  highlights,
  requiredTier = "Standard",
  className,
}: PremiumFeatureGateProps) {
  const router = useRouter()

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      {/* Main card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-background to-muted/30">
        {/* Subtle gradient accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="px-8 pt-10 pb-8 text-center">
          {/* Badge */}
          <Badge
            variant="outline"
            className="mb-5 gap-1.5 px-3 py-1 text-xs font-medium border-primary/30 text-primary bg-primary/5"
          >
            <Crown className="h-3 w-3" />
            {requiredTier}+ Feature
          </Badge>

          {/* Headline */}
          <h2 className="text-2xl font-bold tracking-tight">{headline}</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            {description}
          </p>

          {/* Feature highlights */}
          <div className="grid gap-4 mt-8 text-left max-w-lg mx-auto">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="flex items-start gap-3.5 p-3 rounded-lg bg-muted/40 border border-border/40"
              >
                <div className="shrink-0 mt-0.5 size-8 rounded-md bg-primary/10 grid place-items-center">
                  <h.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {h.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* What you get with upgrade */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-8 text-xs text-muted-foreground">
            {[
              "Curated influencer lists",
              "Pricing & deliverables",
              "One-click approvals",
              "Campaign tracking",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-primary" />
                {item}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              onClick={() => router.push("/billing")}
              className="gap-2 px-6"
              size="lg"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to {requiredTier}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground/60 mt-3">
            Plans start at د.إ199/month with full agency features
          </p>
        </div>
      </div>
    </div>
  )
}
