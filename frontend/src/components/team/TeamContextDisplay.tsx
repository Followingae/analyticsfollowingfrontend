"use client"

import { useState, useEffect } from 'react'
import { Crown, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { teamApiService, TeamContext } from '@/services/teamApi'

interface TeamContextDisplayProps {
  teamContext?: TeamContext | null
  className?: string
  showTitle?: boolean
}

interface UsageBarProps {
  label: string
  used: number
  limit: number
  remaining: number
  className?: string
}

function UsageBar({ label, used, limit, remaining, className = "" }: UsageBarProps) {
  const percentage = limit > 0 ? (used / limit) * 100 : 0
  const isNearLimit = percentage > 80
  const isCritical = percentage > 90

  const getUsageColor = () => {
    if (isCritical) return "bg-red-500"
    if (isNearLimit) return "bg-orange-500"
    return "bg-green-500"
  }

  const getStatusIcon = () => {
    if (isCritical) return <AlertTriangle className="h-3 w-3 text-red-500" />
    if (isNearLimit) return <AlertTriangle className="h-3 w-3 text-orange-500" />
    return <CheckCircle className="h-3 w-3 text-green-500" />
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-muted-foreground">
          {remaining} remaining
        </span>
      </div>
      
      <div className="space-y-1">
        <Progress 
          value={percentage} 
          className="h-2"
          // @ts-ignore
          style={{
            '--progress-foreground': percentage > 90 ? '#ef4444' : percentage > 80 ? '#f97316' : '#22c55e'
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{used} used</span>
          <span>{limit} total</span>
        </div>
      </div>
      
      {isNearLimit && (
        <div className={`text-xs p-2 rounded-md ${
          isCritical 
            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
            : 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800'
        }`}>
          {isCritical 
            ? 'Critical: Almost at monthly limit'
            : 'Warning: Approaching monthly limit'
          }
        </div>
      )}
    </div>
  )
}

export function TeamContextDisplay({ 
  teamContext: propTeamContext, 
  className = "",
  showTitle = true 
}: TeamContextDisplayProps) {
  const [teamContext, setTeamContext] = useState<TeamContext | null>(propTeamContext || null)
  const [loading, setLoading] = useState(!propTeamContext)

  useEffect(() => {
    if (propTeamContext) {
      setTeamContext(propTeamContext)
      setLoading(false)
      return
    }

    // If no team context provided, try to load it
    const loadTeamContext = async () => {
      try {
        // First check stored context
        const storedContext = teamApiService.getStoredTeamContext()
        if (storedContext) {
          setTeamContext(storedContext)
          setLoading(false)
          return
        }

        // If no stored context, fetch from API
        const result = await teamApiService.getTeamContext()
        if (result.success && result.data) {
          setTeamContext(result.data)
          teamApiService.updateTeamContext(result.data)
        }
      } catch (error) {

      } finally {
        setLoading(false)
      }
    }

    loadTeamContext()

    // Listen for team context updates
    const handleTeamContextUpdate = (event: CustomEvent<TeamContext>) => {
      setTeamContext(event.detail)
    }

    window.addEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    return () => {
      window.removeEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    }
  }, [propTeamContext])

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading team information...</div>
        </CardContent>
      </Card>
    )
  }

  if (!teamContext) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="text-center text-sm text-muted-foreground">
            No team context available
          </div>
        </CardContent>
      </Card>
    )
  }

  const isOwner = teamContext.user_role === 'owner'
  const tierDisplayName = teamContext.subscription_tier.charAt(0).toUpperCase() + teamContext.subscription_tier.slice(1)

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Team Overview</span>
            </div>
            <Badge variant="outline" className="text-xs">
              <Crown className="h-3 w-3 mr-1" />
              {tierDisplayName}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        {/* Team Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{teamContext.team_name}</h3>
            <Badge variant={isOwner ? "default" : "secondary"} className="text-xs">
              {isOwner ? '👑 Team Owner' : '👤 Team Member'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Subscription Status:</span>
            <Badge 
              variant={teamContext.subscription_status === 'active' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {teamContext.subscription_status.charAt(0).toUpperCase() + teamContext.subscription_status.slice(1)}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Usage Overview */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Monthly Usage
          </h4>
          
          <div className="grid gap-6">
            <UsageBar
              label="Profile Analyses"
              used={teamContext.current_usage.profiles}
              limit={teamContext.monthly_limits.profiles}
              remaining={teamContext.remaining_capacity.profiles}
            />
            
            {teamContext.monthly_limits.emails > 0 && (
              <UsageBar
                label="Email Unlocks"
                used={teamContext.current_usage.emails}
                limit={teamContext.monthly_limits.emails}
                remaining={teamContext.remaining_capacity.emails}
              />
            )}
            
            {teamContext.monthly_limits.posts > 0 && (
              <UsageBar
                label="Post Analyses"
                used={teamContext.current_usage.posts}
                limit={teamContext.monthly_limits.posts}
                remaining={teamContext.remaining_capacity.posts}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Permissions Summary */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Your Permissions
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center gap-2 p-2 rounded-md ${
              teamContext.user_permissions.can_analyze_profiles 
                ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                : 'bg-muted/50 text-muted-foreground dark:bg-gray-900 dark:text-gray-400'
            }`}>
              <CheckCircle className="h-3 w-3" />
              <span>Analyze Profiles</span>
            </div>
            
            <div className={`flex items-center gap-2 p-2 rounded-md ${
              teamContext.user_permissions.can_unlock_emails 
                ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                : 'bg-muted/50 text-muted-foreground dark:bg-gray-900 dark:text-gray-400'
            }`}>
              <CheckCircle className="h-3 w-3" />
              <span>Unlock Emails</span>
            </div>
            
            <div className={`flex items-center gap-2 p-2 rounded-md ${
              teamContext.user_permissions.can_analyze_posts 
                ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                : 'bg-muted/50 text-muted-foreground dark:bg-gray-900 dark:text-gray-400'
            }`}>
              <CheckCircle className="h-3 w-3" />
              <span>Analyze Posts</span>
            </div>
            
            <div className={`flex items-center gap-2 p-2 rounded-md ${
              teamContext.user_permissions.can_manage_team 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-muted/50 text-muted-foreground dark:bg-gray-900 dark:text-gray-400'
            }`}>
              <Crown className="h-3 w-3" />
              <span>Manage Team</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TeamContextDisplay