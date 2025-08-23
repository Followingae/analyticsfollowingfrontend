"use client"

import { useState, useEffect } from "react"
import { Users, Lock, AlertCircle, Loader2, Crown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { teamApiService, TeamContext } from "@/services/teamApi"
import { Progress } from "@/components/ui/progress"

interface TeamUsageGateProps {
  usageType: 'profiles' | 'emails' | 'posts'
  children: React.ReactNode
  onUsageApproved?: () => void
  disabled?: boolean
  className?: string
  showUsageInfo?: boolean
}

export function TeamUsageGate({
  usageType,
  children,
  onUsageApproved,
  disabled = false,
  className = "",
  showUsageInfo = true
}: TeamUsageGateProps) {
  const [loading, setLoading] = useState(true)
  const [canPerform, setCanPerform] = useState(false)
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load team context and check permissions
  useEffect(() => {
    const loadTeamContext = async () => {
      try {
        setLoading(true)
        setError(null)

        // First check stored context
        const storedContext = teamApiService.getStoredTeamContext()
        if (storedContext) {
          setTeamContext(storedContext)
          setCanPerform(checkUsagePermission(storedContext))
          setLoading(false)
          return
        }

        // If no stored context, fetch from API
        const result = await teamApiService.getTeamContext()
        
        if (result.success && result.data) {
          setTeamContext(result.data)
          setCanPerform(checkUsagePermission(result.data))
          teamApiService.updateTeamContext(result.data)
        } else {
          setError(result.error || 'Failed to load team context')
          setCanPerform(false)
        }
      } catch (err) {
        console.error('Failed to load team context:', err)
        setError('Failed to check team permissions')
        setCanPerform(false)
      } finally {
        setLoading(false)
      }
    }

    loadTeamContext()

    // Listen for team context updates
    const handleTeamContextUpdate = (event: CustomEvent<TeamContext>) => {
      setTeamContext(event.detail)
      setCanPerform(checkUsagePermission(event.detail))
    }

    window.addEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    return () => {
      window.removeEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    }
  }, [usageType])

  const checkUsagePermission = (context: TeamContext): boolean => {
    // Check if user has permission for this action type
    const permissionKey = usageType === 'profiles' ? 'can_analyze_profiles' :
                         usageType === 'emails' ? 'can_unlock_emails' :
                         'can_analyze_posts'
    
    if (!context.user_permissions[permissionKey]) {
      return false
    }

    // Check if team has remaining capacity
    return context.remaining_capacity[usageType] > 0
  }

  const getUsageTypeLabel = (): string => {
    return usageType === 'profiles' ? 'Profile Analysis' :
           usageType === 'emails' ? 'Email Unlock' :
           'Posts Analysis'
  }

  const getUsageIcon = (): string => {
    return usageType === 'profiles' ? '👤' :
           usageType === 'emails' ? '📧' :
           '📊'
  }

  const getUpgradeMessage = (): string => {
    if (!teamContext) return 'Upgrade required'
    
    const isOwner = teamContext.user_role === 'owner'
    const tierName = teamContext.subscription_tier.charAt(0).toUpperCase() + teamContext.subscription_tier.slice(1)
    
    if (isOwner) {
      return `Your ${tierName} team plan limit has been reached. Upgrade to continue.`
    } else {
      return `Your team's ${tierName} plan limit has been reached. Ask your team owner to upgrade.`
    }
  }

  const getUsagePercentage = (): number => {
    if (!teamContext) return 0
    const used = teamContext.current_usage[usageType]
    const limit = teamContext.monthly_limits[usageType]
    return limit > 0 ? (used / limit) * 100 : 0
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking team permissions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !teamContext) {
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
  if (canPerform && teamContext) {
    return (
      <div className={className}>
        {children}
        {showUsageInfo && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>Team has {teamContext.remaining_capacity[usageType]} {usageType} remaining</span>
            <Badge variant="outline" className="text-xs">
              {teamContext.subscription_tier} plan
            </Badge>
          </div>
        )}
      </div>
    )
  }

  // If user cannot perform action, show locked state
  return (
    <Card className={`${className} border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <Lock className="h-4 w-4" />
          {getUsageTypeLabel()} Locked
        </CardTitle>
        <CardDescription className="text-orange-600 dark:text-orange-300">
          {getUpgradeMessage()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamContext && (
          <>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getUsageIcon()}</span>
                <div>
                  <div className="font-medium text-sm">{getUsageTypeLabel()}</div>
                  <div className="text-xs text-muted-foreground">
                    Team feature - {teamContext.subscription_tier} plan
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">
                  {teamContext.current_usage[usageType]}/{teamContext.monthly_limits[usageType]} used
                </div>
                <div className="text-xs text-muted-foreground">
                  {teamContext.remaining_capacity[usageType]} remaining
                </div>
              </div>
            </div>

            {/* Usage Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Team Usage This Month:</span>
                <span className="text-muted-foreground">
                  {getUsagePercentage().toFixed(0)}% used
                </span>
              </div>
              <Progress 
                value={getUsagePercentage()} 
                className="h-2"
              />
            </div>

            {/* Team Info */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Team: {teamContext.team_name}</span>
              <Badge variant="outline" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                {teamContext.subscription_tier.charAt(0).toUpperCase() + teamContext.subscription_tier.slice(1)}
              </Badge>
            </div>

            {/* Action Button */}
            {teamContext.user_role === 'owner' ? (
              <Button 
                onClick={() => window.location.href = '/subscription/upgrade'}
                disabled={disabled}
                className="w-full"
                variant="default"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Team Plan
              </Button>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Only team owners can upgrade the plan
                </p>
                <Button 
                  disabled
                  className="w-full"
                  variant="outline"
                >
                  Contact Team Owner
                </Button>
              </div>
            )}

            {/* Additional Info */}
            <div className="text-center text-xs text-muted-foreground">
              Usage resets monthly • Shared across all team members
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}