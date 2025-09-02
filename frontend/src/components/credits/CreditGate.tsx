"use client"

import { useState, useEffect } from "react"
import { Zap, Lock, AlertCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { creditsApiService } from "@/services/creditsApi"
import { PricingRule, CanPerformResult } from "@/types"
import { formatCredits, getActionDisplayName, getActionIcon } from "@/utils/creditUtils"
import { ApiErrorHandler } from "@/utils/apiErrorHandler"
import { InsufficientCreditsModal } from "./InsufficientCreditsModal"

interface CreditGateProps {
  actionType: string
  children: React.ReactNode
  onCreditsDeducted?: () => void
  disabled?: boolean
  className?: string
  showPricing?: boolean
}

export function CreditGate({
  actionType,
  children,
  onCreditsDeducted,
  disabled = false,
  className = "",
  showPricing = true
}: CreditGateProps) {
  const [loading, setLoading] = useState(true)
  const [canPerform, setCanPerform] = useState(false)
  const [pricing, setPricing] = useState<PricingRule | null>(null)
  const [permission, setPermission] = useState<CanPerformResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showInsufficientModal, setShowInsufficientModal] = useState(false)
  const [lastCreditError, setLastCreditError] = useState<any>(null)

  // Load permissions and pricing
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await creditsApiService.checkAndGetPricing(actionType)
        
        setCanPerform(result.canPerform)
        setPricing(result.pricing)
        setPermission({ 
          can_perform: result.canPerform,
          credits_required: result.pricing?.credits_per_action || 0,
          current_balance: result.balance?.current_balance || 0,
          free_allowance_remaining: 0 // This would come from allowances API
        })

        if (result.error && !result.canPerform) {
          setError(result.error)
        }
      } catch (err) {

        setError('Failed to check credit permissions')
        setCanPerform(false)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [actionType])

  const handleAction = async () => {
    if (!canPerform || !permission) {
      // Show insufficient credits modal
      const creditError = {
        creditsRequired: pricing?.credits_per_action || 0,
        creditsAvailable: permission?.current_balance || 0,
        creditsNeeded: Math.max(0, (pricing?.credits_per_action || 0) - (permission?.current_balance || 0))
      }
      
      setLastCreditError(creditError)
      setShowInsufficientModal(true)
      return
    }

    try {
      // Action would be performed by parent component
      // This component just gates access
      if (onCreditsDeducted) {
        onCreditsDeducted()
      }
    } catch (error) {
      const creditError = ApiErrorHandler.handleCreditError(error)
      
      if (creditError.isCreditsError) {
        setLastCreditError({
          creditsRequired: creditError.creditsRequired,
          creditsAvailable: creditError.creditsAvailable,
          creditsNeeded: creditError.creditsNeeded
        })
        setShowInsufficientModal(true)
      } else {
        setError(creditError.message)
      }
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking permissions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !pricing) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // If user can perform action, render children normally
  if (canPerform) {
    return (
      <div className={className}>
        {children}
        {showPricing && pricing && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>This action costs {formatCredits(pricing.credits_per_action)} credits</span>
            {pricing.free_allowance_per_month > 0 && (
              <Badge variant="outline" className="text-xs">
                {pricing.free_allowance_per_month} free/month
              </Badge>
            )}
          </div>
        )}
      </div>
    )
  }

  // If user cannot perform action, show locked state
  return (
    <>
      <Card className={`${className} border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <Lock className="h-4 w-4" />
            {getActionDisplayName(actionType)} Locked
          </CardTitle>
          <CardDescription className="text-orange-600 dark:text-orange-300">
            {pricing ? 
              `Requires ${formatCredits(pricing.credits_per_action)} credits` : 
              'Credit information unavailable'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pricing && (
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getActionIcon(actionType)}</span>
                <div>
                  <div className="font-medium text-sm">{getActionDisplayName(actionType)}</div>
                  <div className="text-xs text-muted-foreground">
                    Premium analytics feature
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">
                  {formatCredits(pricing.credits_per_action)} credits
                </div>
                {pricing.free_allowance_per_month > 0 && (
                  <div className="text-xs text-green-600">
                    {pricing.free_allowance_per_month} free/month
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Available Balance:</span>
            <Badge variant="outline" className={
              (permission?.current_balance || 0) === 0 
                ? "bg-red-50 text-red-700 border-red-200" 
                : "bg-gray-50 text-gray-700 border-gray-200"
            }>
              {formatCredits(permission?.current_balance || 0)} credits
            </Badge>
          </div>

          <Button 
            onClick={handleAction}
            disabled={disabled}
            className="w-full"
            variant="default"
          >
            <Zap className="h-4 w-4 mr-2" />
            Purchase Credits to Unlock
          </Button>

          {pricing && pricing.free_allowance_per_month > 0 && (
            <div className="text-center text-xs text-muted-foreground">
              You get {pricing.free_allowance_per_month} free uses per month
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        creditsRequired={lastCreditError?.creditsRequired}
        creditsAvailable={lastCreditError?.creditsAvailable}
        creditsNeeded={lastCreditError?.creditsNeeded}
        actionName={getActionDisplayName(actionType)}
      />
    </>
  )
}