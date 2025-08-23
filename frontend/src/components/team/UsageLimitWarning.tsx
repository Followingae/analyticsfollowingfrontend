"use client"

import { useState, useEffect } from 'react'
import { AlertTriangle, Zap, Crown, TrendingUp } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { teamApiService, TeamContext } from '@/services/teamApi'

interface UsageLimitWarningProps {
  teamContext?: TeamContext | null
  className?: string
  warningThreshold?: number // Percentage threshold for warnings (default: 75)
  criticalThreshold?: number // Percentage threshold for critical alerts (default: 90)
}

interface UsageWarning {
  type: 'profiles' | 'emails' | 'posts'
  remaining: number
  used: number
  limit: number
  percentage: number
  severity: 'warning' | 'critical'
}

export function UsageLimitWarning({ 
  teamContext: propTeamContext, 
  className = "",
  warningThreshold = 75,
  criticalThreshold = 90
}: UsageLimitWarningProps) {
  const [teamContext, setTeamContext] = useState<TeamContext | null>(propTeamContext || null)
  const [warnings, setWarnings] = useState<UsageWarning[]>([])

  useEffect(() => {
    if (propTeamContext) {
      setTeamContext(propTeamContext)
      checkUsageWarnings(propTeamContext)
    } else {
      // Load team context if not provided
      const storedContext = teamApiService.getStoredTeamContext()
      if (storedContext) {
        setTeamContext(storedContext)
        checkUsageWarnings(storedContext)
      }
    }

    // Listen for team context updates
    const handleTeamContextUpdate = (event: CustomEvent<TeamContext>) => {
      setTeamContext(event.detail)
      checkUsageWarnings(event.detail)
    }

    window.addEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    return () => {
      window.removeEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    }
  }, [propTeamContext, warningThreshold, criticalThreshold])

  const checkUsageWarnings = (context: TeamContext) => {
    const warningsFound: UsageWarning[] = []

    // Check each usage type
    Object.entries(context.remaining_capacity).forEach(([type, remaining]) => {
      const usageType = type as 'profiles' | 'emails' | 'posts'
      const limit = context.monthly_limits[usageType]
      const used = context.current_usage[usageType]
      const percentage = limit > 0 ? (used / limit) * 100 : 0

      if (percentage >= criticalThreshold) {
        warningsFound.push({
          type: usageType,
          remaining,
          used,
          limit,
          percentage,
          severity: 'critical'
        })
      } else if (percentage >= warningThreshold) {
        warningsFound.push({
          type: usageType,
          remaining,
          used,
          limit,
          percentage,
          severity: 'warning'
        })
      }
    })

    setWarnings(warningsFound)
  }

  const getUsageTypeLabel = (type: string): string => {
    return type === 'profiles' ? 'Profile analyses' :
           type === 'emails' ? 'Email unlocks' :
           'Post analyses'
  }

  const getUsageTypeIcon = (type: string): string => {
    return type === 'profiles' ? '👤' :
           type === 'emails' ? '📧' :
           '📊'
  }

  const handleUpgrade = () => {
    // Navigate to subscription upgrade page
    window.location.href = '/subscription/upgrade'
  }

  if (!teamContext || warnings.length === 0) {
    return null
  }

  const isOwner = teamContext.user_role === 'owner'
  const criticalWarnings = warnings.filter(w => w.severity === 'critical')
  const regularWarnings = warnings.filter(w => w.severity === 'warning')

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Critical Warnings */}
      {criticalWarnings.map((warning) => (
        <Alert key={`critical-${warning.type}`} className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getUsageTypeIcon(warning.type)}</span>
                  <span className="font-semibold text-red-800 dark:text-red-200">
                    Critical: {warning.remaining} {warning.type} remaining
                  </span>
                </div>
                <p className="text-red-700 dark:text-red-300">
                  You've used {warning.used}/{warning.limit} {getUsageTypeLabel(warning.type)} this month 
                  ({warning.percentage.toFixed(0)}% of your limit). 
                  Your team will be blocked when you reach 100%.
                </p>
              </div>

              <div className="space-y-2">
                <Progress 
                  value={warning.percentage} 
                  className="h-2"
                  // @ts-ignore
                  style={{ '--progress-foreground': '#dc2626' }}
                />
                <div className="flex justify-between text-xs text-red-600 dark:text-red-400">
                  <span>{warning.used} used</span>
                  <span>{warning.limit} total</span>
                </div>
              </div>

              {isOwner && (
                <Button 
                  onClick={handleUpgrade}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Plan Now
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ))}

      {/* Regular Warnings */}
      {regularWarnings.map((warning) => (
        <Alert key={`warning-${warning.type}`} className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getUsageTypeIcon(warning.type)}</span>
                  <span className="font-semibold text-orange-800 dark:text-orange-200">
                    Warning: {warning.remaining} {warning.type} remaining
                  </span>
                </div>
                <p className="text-orange-700 dark:text-orange-300">
                  You've used {warning.used}/{warning.limit} {getUsageTypeLabel(warning.type)} this month 
                  ({warning.percentage.toFixed(0)}% of your limit). 
                  Consider upgrading your plan to avoid interruptions.
                </p>
              </div>

              <div className="space-y-2">
                <Progress 
                  value={warning.percentage} 
                  className="h-2"
                  // @ts-ignore
                  style={{ '--progress-foreground': '#ea580c' }}
                />
                <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400">
                  <span>{warning.used} used</span>
                  <span>{warning.limit} total</span>
                </div>
              </div>

              {isOwner && (
                <Button 
                  onClick={handleUpgrade}
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  View Upgrade Options
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ))}

      {/* Summary Card for Multiple Warnings */}
      {warnings.length > 1 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 dark:border-orange-800 dark:from-orange-950 dark:to-red-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Zap className="h-5 w-5" />
              Multiple Usage Limits Approaching
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-orange-700 dark:text-orange-300">
              Your team is approaching limits on {warnings.length} different features. 
              {isOwner ? (
                <span> As the team owner, you can upgrade the plan to increase these limits.</span>
              ) : (
                <span> Contact your team owner to upgrade the plan.</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  {teamContext.subscription_tier.charAt(0).toUpperCase() + teamContext.subscription_tier.slice(1)} Plan
                </Badge>
                <Badge variant="outline" className="text-xs text-orange-600">
                  {warnings.length} warnings
                </Badge>
              </div>
              
              {isOwner && (
                <Button 
                  onClick={handleUpgrade}
                  size="sm"
                  className="gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Team Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-owner message */}
      {!isOwner && warnings.some(w => w.severity === 'critical') && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="py-4">
            <div className="text-center space-y-2">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                🚨 Your team needs immediate attention from the team owner
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Only team owners can upgrade plans to resolve usage limits
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default UsageLimitWarning