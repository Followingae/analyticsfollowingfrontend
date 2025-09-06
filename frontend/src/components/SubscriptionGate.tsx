'use client'

import { ReactNode } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { UserRole } from '@/types/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Lock, Check, Zap, Star } from 'lucide-react'

interface SubscriptionGateProps {
  requiredTier: UserRole
  feature?: string
  fallback?: ReactNode
  showUpgrade?: boolean
  children: ReactNode
}

export function SubscriptionGate({ 
  requiredTier, 
  feature,
  fallback, 
  showUpgrade = true,
  children 
}: SubscriptionGateProps) {
  const { checkSubscriptionGate, user } = useEnhancedAuth()

  const hasAccess = checkSubscriptionGate(requiredTier)

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgrade) {
    return (
      <SubscriptionUpgradePrompt 
        requiredTier={requiredTier}
        currentTier={user?.role || 'brand_free'}
        feature={feature}
      />
    )
  }

  return null
}

interface SubscriptionUpgradePromptProps {
  requiredTier: UserRole
  currentTier: UserRole
  feature?: string
}

function SubscriptionUpgradePrompt({ requiredTier, currentTier, feature }: SubscriptionUpgradePromptProps) {
  const getTierInfo = (tier: UserRole) => {
    switch (tier) {
      case 'brand_free':
        return {
          name: 'Free',
          color: 'bg-muted/500',
          description: 'Basic features for getting started',
          price: '$0/month'
        }
      case 'brand_standard':
        return {
          name: 'Standard',
          color: 'bg-blue-500',
          description: 'Enhanced features for growing brands',
          price: '$29/month'
        }
      case 'brand_premium':
        return {
          name: 'Premium',
          color: 'bg-gradient-to-r from-orange-500 to-pink-600',
          description: 'Advanced features for professional teams',
          price: '$99/month'
        }
      case 'brand_enterprise':
        return {
          name: 'Enterprise',
          color: 'bg-gradient-to-r from-purple-600 to-blue-600',
          description: 'Custom solutions for large organizations',
          price: 'Custom pricing'
        }
      default:
        return {
          name: 'Unknown',
          color: 'bg-muted/500',
          description: '',
          price: ''
        }
    }
  }

  const getFeatureInfo = (feature?: string) => {
    switch (feature) {
      case 'unlimited_exports':
        return {
          title: 'Unlimited Exports',
          description: 'Export unlimited profiles and analytics data in various formats.',
          benefits: ['Unlimited CSV/Excel exports', 'Bulk export capabilities', 'Custom report formats', 'Scheduled exports']
        }
      case 'api_access':
        return {
          title: 'API Access',
          description: 'Integrate with our powerful API for custom workflows.',
          benefits: ['REST API access', 'Webhook support', 'Rate limits: 10,000/hour', 'Developer documentation']
        }
      case 'advanced_analytics':
        return {
          title: 'Advanced Analytics',
          description: 'Get deeper insights with advanced analytics and reporting.',
          benefits: ['Competitor benchmarking', 'Trend analysis', 'Audience overlap', 'Performance forecasting']
        }
      case 'priority_support':
        return {
          title: 'Priority Support',
          description: 'Get faster support with priority assistance.',
          benefits: ['24/7 email support', 'Live chat access', 'Dedicated account manager', 'Phone support']
        }
      default:
        return {
          title: 'Premium Feature',
          description: 'This feature requires a higher subscription tier.',
          benefits: ['Enhanced capabilities', 'Priority support', 'Advanced features', 'Better limits']
        }
    }
  }

  const currentTierInfo = getTierInfo(currentTier)
  const requiredTierInfo = getTierInfo(requiredTier)
  const featureInfo = getFeatureInfo(feature)

  const getTierFeatures = (tier: UserRole) => {
    switch (tier) {
      case 'brand_standard':
        return [
          'Up to 50 searches/month',
          'Basic analytics',
          'Email support',
          'Up to 5 exports/month',
          'Campaign management'
        ]
      case 'brand_premium':
        return [
          'Unlimited searches',
          'Advanced analytics',
          'Priority support',
          'Unlimited exports',
          'API access (1,000 calls/month)',
          'Competitor analysis',
          'White-label reports'
        ]
      case 'brand_enterprise':
        return [
          'Everything in Premium',
          'Custom integrations',
          'Dedicated account manager',
          'API access (10,000+ calls/month)',
          'Custom reporting',
          'SSO integration',
          'Advanced security features'
        ]
      default:
        return []
    }
  }

  return (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardHeader className="text-center">
        <div className={`mx-auto w-12 h-12 rounded-full ${requiredTierInfo.color} flex items-center justify-center mb-4`}>
          <Crown className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          {featureInfo.title}
        </CardTitle>
        <CardDescription>{featureInfo.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Feature Benefits */}
        <div className="space-y-3">
          <p className="text-sm font-medium">What you'll get:</p>
          <div className="grid grid-cols-1 gap-2">
            {featureInfo.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Comparison */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Subscription comparison:</p>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Current Tier */}
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{currentTierInfo.name}</Badge>
                  <span className="text-sm text-muted-foreground">Current</span>
                </div>
                <span className="text-sm font-medium">{currentTierInfo.price}</span>
              </div>
              <p className="text-xs text-muted-foreground">{currentTierInfo.description}</p>
            </div>

            {/* Required Tier */}
            <div className="p-3 rounded-lg border-2 border-orange-200 bg-orange-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={requiredTierInfo.color}>
                    {requiredTierInfo.name}
                  </Badge>
                  <span className="text-sm text-orange-600 font-medium">Required</span>
                  <Star className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium">{requiredTierInfo.price}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{requiredTierInfo.description}</p>
              
              {/* Tier Features */}
              <div className="space-y-1">
                {getTierFeatures(requiredTier).slice(0, 3).map((tierFeature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <Zap className="w-3 h-3 text-orange-500 flex-shrink-0" />
                    <span>{tierFeature}</span>
                  </div>
                ))}
                {getTierFeatures(requiredTier).length > 3 && (
                  <p className="text-xs text-muted-foreground pl-5">
                    +{getTierFeatures(requiredTier).length - 3} more features
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button className={`w-full text-white ${requiredTierInfo.color}`}>
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to {requiredTierInfo.name}
          </Button>
          
          <Button variant="outline" className="w-full">
            Compare All Plans
          </Button>
        </div>

        {/* Guarantee Badge */}
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            30-day money-back guarantee
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}