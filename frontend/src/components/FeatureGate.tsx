'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { FeatureAccess } from '@/types/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Crown, Lock, Zap } from 'lucide-react'

interface FeatureGateProps {
  feature: string
  requiredTier?: string
  fallback?: ReactNode
  loadingState?: ReactNode
  showUpgrade?: boolean
  children: ReactNode
}

export function FeatureGate({ 
  feature, 
  requiredTier,
  fallback, 
  loadingState, 
  showUpgrade = true,
  children 
}: FeatureGateProps) {
  const { checkFeatureAccess, checkSubscriptionGate, user } = useEnhancedAuth()
  const [access, setAccess] = useState<FeatureAccess | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true)
      
      try {
        // Check subscription tier first if specified
        if (requiredTier && !checkSubscriptionGate(requiredTier)) {
          setAccess({
            allowed: false,
            upgrade_required: requiredTier,
            reason: `Requires ${requiredTier} tier or higher`
          })
          return
        }

        // Check feature access
        const featureAccess = await checkFeatureAccess(feature)
        setAccess(featureAccess)
      } catch (error) {
        setAccess({
          allowed: false,
          reason: 'Error checking feature access'
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [feature, requiredTier, checkFeatureAccess, checkSubscriptionGate])

  if (isLoading) {
    return loadingState || <FeatureGateSkeleton />
  }

  if (!access || !access.allowed) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showUpgrade) {
      return <UpgradePrompt access={access} feature={feature} userTier={user?.subscription_tier} />
    }

    return null
  }

  return <>{children}</>
}

function FeatureGateSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-32" />
    </div>
  )
}

interface UpgradePromptProps {
  access: FeatureAccess | null
  feature: string
  userTier?: string
}

function UpgradePrompt({ access, feature, userTier }: UpgradePromptProps) {
  const getUpgradeMessage = () => {
    switch (feature) {
      case 'advanced_analytics':
        return {
          title: 'Advanced Analytics',
          description: 'Get deeper insights with advanced analytics, competitor analysis, and trend tracking.',
          benefits: ['Detailed audience insights', 'Competitor benchmarking', 'Growth trend analysis', 'Export capabilities']
        }
      case 'unlimited_searches':
        return {
          title: 'Unlimited Searches',
          description: 'Search for unlimited influencer profiles and discover new opportunities.',
          benefits: ['Unlimited profile searches', 'Advanced filters', 'Bulk operations', 'API access']
        }
      case 'api_access':
        return {
          title: 'API Access',
          description: 'Integrate with our powerful API for automated workflows and custom integrations.',
          benefits: ['REST API access', 'Webhook support', 'Custom integrations', 'Developer resources']
        }
      default:
        return {
          title: 'Premium Feature',
          description: 'This feature requires a premium subscription.',
          benefits: ['Enhanced capabilities', 'Priority support', 'Advanced features']
        }
    }
  }

  const { title, description, benefits } = getUpgradeMessage()
  const requiredTier = access?.upgrade_required || 'premium'

  return (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center mb-4">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">What you'll get:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-orange-500" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current:</span>
            <Badge variant="outline">
              {userTier?.replace('brand_', '') || 'Free'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Required:</span>
            <Badge className="bg-gradient-to-r from-orange-500 to-pink-600">
              {requiredTier.replace('brand_', '')}
            </Badge>
          </div>
        </div>

        <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700">
          Upgrade to {requiredTier.replace('brand_', '')}
        </Button>
      </CardContent>
    </Card>
  )
}