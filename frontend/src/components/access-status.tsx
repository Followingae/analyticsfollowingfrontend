/**
 * 30-Day Access System UI Components
 * Implementation according to FRONTEND_HANDOVER.md
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Lock, 
  Unlock, 
  Clock, 
  Star, 
  Eye, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Zap,
  Loader2
} from "lucide-react"
import { creditsApiService } from "@/services/creditsApi"
import { PricingRule } from "@/types"
import { formatCredits } from "@/utils/creditUtils"

interface AccessStatusProps {
  hasAccess: boolean
  expiresAt?: string | number
  accessMethod?: string
  username: string
  onUnlock?: () => void
  isUnlocking?: boolean
}

export function AccessStatus({ 
  hasAccess, 
  expiresAt, 
  accessMethod, 
  username,
  onUnlock,
  isUnlocking 
}: AccessStatusProps) {
  const [pricing, setPricing] = useState<PricingRule | null>(null)
  const [pricingLoading, setPricingLoading] = useState(true)

  // Load pricing for influencer unlock
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const result = await creditsApiService.getActionPricing('influencer_unlock')
        if (result.success && result.data) {
          setPricing(result.data)
        }
      } catch (error) {

      } finally {
        setPricingLoading(false)
      }
    }

    loadPricing()
  }, [])
  const getTimeRemaining = () => {
    if (!expiresAt) return null
    
    const now = new Date()
    const expires = new Date(expiresAt)
    const diffMs = expires.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const daysRemaining = getTimeRemaining()
  const progressValue = daysRemaining ? Math.max(0, (daysRemaining / 30) * 100) : 0

  if (hasAccess) {
    return null
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800 dark:text-orange-200">Limited Preview</CardTitle>
          </div>
          <Badge variant="outline" className="border-orange-300 text-orange-700">
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Badge>
        </div>
        <CardDescription className="text-orange-700 dark:text-orange-300">
          Unlock full analytics and 30-day access to @{username}'s complete profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-100/50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You're seeing limited data. Unlock to access all 80+ data points, demographics, and analytics.
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={onUnlock}
          disabled={isUnlocking || pricingLoading}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          size="lg"
        >
          {isUnlocking ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Unlocking Profile...
            </>
          ) : pricingLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Unlock 30-Day Access
              {pricing && (
                <Badge variant="secondary" className="ml-2 bg-background/20 text-white border-white/30">
                  {formatCredits(pricing.credits_per_action)} credits
                </Badge>
              )}
            </>
          )}
        </Button>
        
        <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>Full demographic analytics</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>Complete post history & engagement</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>AI-powered insights & recommendations</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for smaller spaces
export function AccessBadge({ hasAccess, expiresAt }: { hasAccess: boolean, expiresAt?: string }) {
  if (hasAccess) {
    const daysRemaining = expiresAt ? Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
    
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Full Access
        {daysRemaining && <span className="ml-1">({daysRemaining}d)</span>}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-orange-300 text-orange-700">
      <Lock className="h-3 w-3 mr-1" />
      Preview Only
    </Badge>
  )
}

// Access upgrade prompt for limited views
export function AccessUpgradePrompt({ username, onUnlock, isUnlocking }: { 
  username: string
  onUnlock?: () => void
  isUnlocking?: boolean 
}) {
  const [pricing, setPricing] = useState<PricingRule | null>(null)
  const [pricingLoading, setPricingLoading] = useState(true)

  // Load pricing for influencer unlock
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const result = await creditsApiService.getActionPricing('influencer_unlock')
        if (result.success && result.data) {
          setPricing(result.data)
        }
      } catch (error) {

      } finally {
        setPricingLoading(false)
      }
    }

    loadPricing()
  }, [])

  return (
    <div className="text-center py-8 px-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200">
      <Lock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
        Unlock Complete Analytics
      </h3>
      <p className="text-orange-600 dark:text-orange-400 mb-4 max-w-md mx-auto">
        Get full access to @{username}'s analytics, demographics, and AI insights for 30 days.
      </p>
      <Button 
        onClick={onUnlock}
        disabled={isUnlocking || pricingLoading}
        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
      >
        {isUnlocking ? (
          <>
            <Clock className="h-4 w-4 mr-2 animate-spin" />
            Unlocking...
          </>
        ) : pricingLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Unlock 30-Day Access
            {pricing && (
              <span className="ml-2 text-sm opacity-90">
                ({formatCredits(pricing.credits_per_action)} credits)
              </span>
            )}
          </>
        )}
      </Button>
      
      {pricing && pricing.free_allowance_per_month > 0 && (
        <div className="mt-3 text-xs text-green-600 dark:text-green-400">
          ✨ {pricing.free_allowance_per_month} free unlocks per month included
        </div>
      )}
    </div>
  )
}