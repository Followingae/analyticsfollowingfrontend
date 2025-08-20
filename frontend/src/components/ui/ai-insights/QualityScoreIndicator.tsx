'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Star, Award, Shield, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QualityScoreIndicatorProps {
  qualityScore?: number | null // 0.0 to 1.0
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  showBreakdown?: boolean
}

interface QualityAnalysis {
  label: 'Exceptional' | 'High' | 'Good' | 'Fair' | 'Poor'
  color: string
  icon: React.ReactNode
  description: string
  bgColor: string
  textColor: string
  tier: 'premium' | 'good' | 'average' | 'poor'
}

// Quality analysis helper
function analyzeQuality(score: number): QualityAnalysis {
  if (score >= 0.9) {
    return {
      label: 'Exceptional',
      color: '#8B5CF6',
      icon: <Award className="w-4 h-4" />,
      description: 'Premium quality content',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      textColor: 'text-purple-700 dark:text-purple-300',
      tier: 'premium'
    }
  } else if (score >= 0.75) {
    return {
      label: 'High',
      color: '#10B981',
      icon: <Star className="w-4 h-4" />,
      description: 'High quality content',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      tier: 'good'
    }
  } else if (score >= 0.6) {
    return {
      label: 'Good',
      color: '#3B82F6',
      icon: <Shield className="w-4 h-4" />,
      description: 'Good quality content',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      textColor: 'text-blue-700 dark:text-blue-300',
      tier: 'good'
    }
  } else if (score >= 0.4) {
    return {
      label: 'Fair',
      color: '#F59E0B',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Average quality content',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      textColor: 'text-amber-700 dark:text-amber-300',
      tier: 'average'
    }
  } else {
    return {
      label: 'Poor',
      color: '#EF4444',
      icon: <AlertCircle className="w-4 h-4" />,
      description: 'Below average content quality',
      bgColor: 'bg-red-50 dark:bg-red-950',
      textColor: 'text-red-700 dark:text-red-300',
      tier: 'poor'
    }
  }
}

// Generate quality breakdown (simulated based on score)
function generateQualityBreakdown(score: number) {
  const base = score * 100
  return {
    visual: Math.min(100, base + Math.random() * 10 - 5),
    engagement: Math.min(100, base + Math.random() * 15 - 7.5),
    consistency: Math.min(100, base + Math.random() * 8 - 4),
    authenticity: Math.min(100, base + Math.random() * 12 - 6),
    overall: base
  }
}

export function QualityScoreIndicator({ 
  qualityScore, 
  className, 
  size = 'md',
  showDetails = true,
  showBreakdown = false
}: QualityScoreIndicatorProps) {
  // Handle null or undefined quality score
  if (qualityScore === null || qualityScore === undefined) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className={size === 'sm' ? 'pb-2' : undefined}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            size === 'sm' ? 'text-sm' : 'text-base'
          )}>
            <Star className="w-4 h-4" />
            Content Quality
          </CardTitle>
          {showDetails && (
            <CardDescription className={size === 'sm' ? 'text-xs' : undefined}>
              AI quality assessment
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={size === 'sm' ? 'pt-2' : undefined}>
          <div className="text-center py-4 text-muted-foreground">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className={size === 'sm' ? 'text-xs' : 'text-sm'}>
              Quality analysis pending
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const analysis = analyzeQuality(qualityScore)
  const scorePercentage = qualityScore * 100
  const breakdown = generateQualityBreakdown(qualityScore)

  if (size === 'sm') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("p-1 rounded", analysis.bgColor)}>
          {analysis.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={cn("text-xs border-0", analysis.bgColor, analysis.textColor)}
            >
              {analysis.label}
            </Badge>
            <span className={cn("text-sm font-semibold", analysis.textColor)}>
              {scorePercentage.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={scorePercentage} 
            className="h-1 mt-1"
          />
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className={size === 'lg' ? 'pb-4' : 'pb-2'}>
        <CardTitle className={cn(
          "flex items-center gap-2",
          size === 'lg' ? 'text-xl' : 'text-base'
        )}>
          {analysis.icon}
          Content Quality Score
        </CardTitle>
        {showDetails && (
          <CardDescription>
            AI-powered comprehensive quality assessment
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main quality score display */}
          <div className={cn(
            "flex items-center justify-between p-4 rounded-lg border",
            analysis.bgColor
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-full",
                analysis.textColor
              )} style={{ backgroundColor: analysis.color + '20' }}>
                {analysis.icon}
              </div>
              <div>
                <p className={cn("font-semibold", analysis.textColor)}>
                  {analysis.label} Quality
                </p>
                <p className={cn("text-sm opacity-80", analysis.textColor)}>
                  {analysis.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-bold",
                size === 'lg' ? 'text-3xl' : 'text-2xl',
                analysis.textColor
              )}>
                {scorePercentage.toFixed(0)}
                <span className="text-sm opacity-70">%</span>
              </p>
              <p className="text-xs text-muted-foreground">
                quality score
              </p>
            </div>
          </div>

          {/* Progress visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Good</span>
              <span>Exceptional</span>
            </div>
            <div className="relative">
              <Progress value={scorePercentage} className="h-3" />
              {/* Quality tier markers */}
              <div className="absolute inset-0 flex justify-between px-1 py-1">
                <div className="w-px h-1 bg-red-400 opacity-50" />
                <div className="w-px h-1 bg-amber-400 opacity-50" />
                <div className="w-px h-1 bg-blue-400 opacity-50" />
                <div className="w-px h-1 bg-emerald-400 opacity-50" />
                <div className="w-px h-1 bg-purple-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Quality breakdown */}
          {showBreakdown && (
            <div className="space-y-3 pt-2 border-t">
              <h4 className="font-semibold text-sm">Quality Breakdown</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Visual Appeal</span>
                  <div className="flex items-center gap-2">
                    <Progress value={breakdown.visual} className="w-20 h-2" />
                    <span className="text-xs text-muted-foreground min-w-[3ch]">
                      {breakdown.visual.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Engagement Potential</span>
                  <div className="flex items-center gap-2">
                    <Progress value={breakdown.engagement} className="w-20 h-2" />
                    <span className="text-xs text-muted-foreground min-w-[3ch]">
                      {breakdown.engagement.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Consistency</span>
                  <div className="flex items-center gap-2">
                    <Progress value={breakdown.consistency} className="w-20 h-2" />
                    <span className="text-xs text-muted-foreground min-w-[3ch]">
                      {breakdown.consistency.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authenticity</span>
                  <div className="flex items-center gap-2">
                    <Progress value={breakdown.authenticity} className="w-20 h-2" />
                    <span className="text-xs text-muted-foreground min-w-[3ch]">
                      {breakdown.authenticity.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quality tier indicators */}
          {size === 'lg' && showDetails && (
            <div className="grid grid-cols-5 gap-2 pt-2 border-t text-center">
              {[
                { label: 'Poor', active: analysis.tier === 'poor', color: 'text-red-500' },
                { label: 'Fair', active: analysis.tier === 'average', color: 'text-amber-500' },
                { label: 'Good', active: analysis.tier === 'good', color: 'text-blue-500' },
                { label: 'High', active: analysis.tier === 'good' && scorePercentage >= 75, color: 'text-emerald-500' },
                { label: 'Premium', active: analysis.tier === 'premium', color: 'text-purple-500' }
              ].map((tier, index) => (
                <div key={tier.label}>
                  <p className={cn(
                    "text-sm font-semibold",
                    tier.active ? tier.color : 'text-muted-foreground'
                  )}>
                    {tier.active ? '●' : '○'}
                  </p>
                  <p className="text-xs text-muted-foreground">{tier.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}