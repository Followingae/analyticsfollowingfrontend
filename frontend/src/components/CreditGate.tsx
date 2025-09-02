'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { FeatureAccess } from '@/types/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Coins, CreditCard, AlertCircle, Zap } from 'lucide-react'

interface CreditGateProps {
  action: string
  cost: number
  onSuccess?: () => void
  onInsufficient?: () => void
  fallback?: ReactNode
  loadingState?: ReactNode
  showTopUp?: boolean
  children: ReactNode
}

export function CreditGate({ 
  action, 
  cost,
  onSuccess,
  onInsufficient,
  fallback, 
  loadingState, 
  showTopUp = true,
  children 
}: CreditGateProps) {
  const { checkCreditGate, user } = useEnhancedAuth()
  const [access, setAccess] = useState<FeatureAccess | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentBalance, setCurrentBalance] = useState<number>(0)

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true)
      
      try {
        const creditAccess = await checkCreditGate(action, cost)
        setAccess(creditAccess)
        
        // TODO: Fetch actual credit balance from API
        // For now, simulate balance
        setCurrentBalance(150) // Mock balance
      } catch (error) {
        setAccess({
          allowed: false,
          reason: 'Error checking credit access'
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [action, cost, checkCreditGate])

  if (isLoading) {
    return loadingState || <CreditGateSkeleton />
  }

  const hasEnoughCredits = currentBalance >= cost
  const finalAccess = access && hasEnoughCredits

  if (!finalAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showTopUp) {
      return (
        <CreditTopUpPrompt 
          action={action}
          cost={cost}
          currentBalance={currentBalance}
          onTopUp={onInsufficient}
        />
      )
    }

    return null
  }

  // Wrap children with credit consumption handler
  return (
    <CreditConsumptionWrapper 
      action={action} 
      cost={cost} 
      onSuccess={onSuccess}
    >
      {children}
    </CreditConsumptionWrapper>
  )
}

function CreditGateSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-32" />
    </div>
  )
}

interface CreditConsumptionWrapperProps {
  action: string
  cost: number
  onSuccess?: () => void
  children: ReactNode
}

function CreditConsumptionWrapper({ 
  action, 
  cost, 
  onSuccess, 
  children 
}: CreditConsumptionWrapperProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCreditConsumption = async () => {
    try {
      // TODO: Implement actual credit consumption API call

      
      setShowConfirm(false)
      onSuccess?.()
    } catch (error) {

    }
  }

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'profile_unlock':
        return 'Unlock this influencer profile to view detailed analytics and contact information.'
      case 'profile_export':
        return 'Export this profile data including analytics, audience insights, and contact details.'
      case 'bulk_export':
        return 'Export multiple profiles with their complete analytics data.'
      case 'competitor_analysis':
        return 'Generate a detailed competitor analysis report with insights and recommendations.'
      default:
        return `Perform ${action} action.`
    }
  }

  return (
    <>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogTrigger asChild>
          <div onClick={() => setShowConfirm(true)}>
            {children}
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-orange-500" />
              Confirm Credit Usage
            </DialogTitle>
            <DialogDescription>
              {getActionDescription(action)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-medium">Cost:</span>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-orange-500" />
                <span className="font-bold">{cost} credits</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-orange-500 hover:bg-orange-600" 
                onClick={handleCreditConsumption}
              >
                <Coins className="w-4 h-4 mr-2" />
                Confirm & Use Credits
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface CreditTopUpPromptProps {
  action: string
  cost: number
  currentBalance: number
  onTopUp?: () => void
}

function CreditTopUpPrompt({ action, cost, currentBalance, onTopUp }: CreditTopUpPromptProps) {
  const shortfall = cost - currentBalance

  const getActionTitle = (action: string) => {
    switch (action) {
      case 'profile_unlock':
        return 'Unlock Profile'
      case 'profile_export':
        return 'Export Profile'
      case 'bulk_export':
        return 'Bulk Export'
      case 'competitor_analysis':
        return 'Competitor Analysis'
      default:
        return 'Premium Action'
    }
  }

  return (
    <Card className="border-dashed border-2 border-orange-200 bg-orange-50/50">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-4">
          <Coins className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          Insufficient Credits
        </CardTitle>
        <CardDescription>
          You need more credits to {getActionTitle(action).toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm text-muted-foreground">Required:</span>
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{cost} credits</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm text-muted-foreground">Current Balance:</span>
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{currentBalance} credits</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <span className="text-sm text-red-600">Shortfall:</span>
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-red-500" />
              <span className="font-medium text-red-600">{shortfall} credits</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Credit Packages:</p>
          <div className="grid grid-cols-1 gap-2">
            <CreditPackageOption credits={100} price={9.99} popular={false} />
            <CreditPackageOption credits={500} price={39.99} popular={true} />
            <CreditPackageOption credits={1000} price={69.99} popular={false} />
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          onClick={onTopUp}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Top Up Credits
        </Button>
      </CardContent>
    </Card>
  )
}

interface CreditPackageOptionProps {
  credits: number
  price: number
  popular?: boolean
}

function CreditPackageOption({ credits, price, popular }: CreditPackageOptionProps) {
  return (
    <div className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
      popular ? 'border-orange-500 bg-orange-50' : 'border-border'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-orange-500" />
          <span className="font-medium">{credits.toLocaleString()} credits</span>
          {popular && <Badge className="text-xs bg-orange-500">Popular</Badge>}
        </div>
        <span className="font-bold">${price}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        ${(price / credits * 100).toFixed(2)} per 100 credits
      </p>
    </div>
  )
}