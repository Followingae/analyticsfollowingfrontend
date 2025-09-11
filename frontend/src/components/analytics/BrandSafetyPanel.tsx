'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Star,
  TrendingUp,
  Users,
  Eye,
  Target,
  Info
} from 'lucide-react'

interface BrandSafety {
  safety_score: number
  risk_factors: string[]
  content_appropriateness: string
  brand_mention_frequency: string
}

interface AuthenticityMetrics {
  authenticity_score: number
  fake_follower_percentage: number
  engagement_authenticity: number
  growth_pattern: string
}

interface BrandSafetyPanelProps {
  brandSafety: BrandSafety
  authenticity: AuthenticityMetrics
}

export function BrandSafetyPanel({ brandSafety, authenticity }: BrandSafetyPanelProps) {
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getSafetyScoreColor = (score: number): string => {
    if (score >= 0.9) return 'text-green-600'
    if (score >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSafetyScoreLabel = (score: number): string => {
    if (score >= 0.9) return 'Excellent'
    if (score >= 0.8) return 'Good'
    if (score >= 0.7) return 'Moderate'
    return 'Poor'
  }

  const getAuthenticityColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAuthenticityLabel = (score: number): string => {
    if (score >= 0.8) return 'High'
    if (score >= 0.6) return 'Moderate'
    return 'Low'
  }

  const getContentAppropriatenessColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      default:
        return 'text-red-600'
    }
  }

  const getGrowthPatternColor = (pattern: string): string => {
    switch (pattern.toLowerCase()) {
      case 'organic':
        return 'text-green-600'
      case 'mixed':
        return 'text-yellow-600'
      default:
        return 'text-red-600'
    }
  }

  const getRiskLevelIcon = () => {
    if (brandSafety.risk_factors.length === 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (brandSafety.risk_factors.length <= 2) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Safety Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSafetyScoreColor(brandSafety.safety_score)}`}>
              {formatPercentage(brandSafety.safety_score)}
            </div>
            <Badge variant="secondary" className="mt-1">
              {getSafetyScoreLabel(brandSafety.safety_score)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authenticity</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getAuthenticityColor(authenticity.authenticity_score)}`}>
              {formatPercentage(authenticity.authenticity_score)}
            </div>
            <Badge variant="secondary" className="mt-1">
              {getAuthenticityLabel(authenticity.authenticity_score)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Quality</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${getContentAppropriatenessColor(brandSafety.content_appropriateness)}`}>
              {brandSafety.content_appropriateness}
            </div>
            <p className="text-xs text-muted-foreground">
              appropriateness
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Factors</CardTitle>
            {getRiskLevelIcon()}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brandSafety.risk_factors.length}
            </div>
            <p className="text-xs text-muted-foreground">
              identified risks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Brand Safety Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Brand Safety Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive safety assessment for brand partnerships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Safety Score Breakdown */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">Overall Safety Score</span>
                <span className={`font-bold ${getSafetyScoreColor(brandSafety.safety_score)}`}>
                  {formatPercentage(brandSafety.safety_score)}
                </span>
              </div>
              <Progress 
                value={brandSafety.safety_score * 100} 
                className="w-full mb-2"
              />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-center">
                <div className={brandSafety.safety_score >= 0.9 ? 'font-semibold text-green-600' : 'text-muted-foreground'}>
                  Excellent (90%+)
                </div>
                <div className={brandSafety.safety_score >= 0.8 && brandSafety.safety_score < 0.9 ? 'font-semibold text-green-600' : 'text-muted-foreground'}>
                  Good (80-89%)
                </div>
                <div className={brandSafety.safety_score >= 0.7 && brandSafety.safety_score < 0.8 ? 'font-semibold text-yellow-600' : 'text-muted-foreground'}>
                  Moderate (70-79%)
                </div>
                <div className={brandSafety.safety_score < 0.7 ? 'font-semibold text-red-600' : 'text-muted-foreground'}>
                  Poor (&lt;70%)
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {brandSafety.risk_factors.length > 0 ? (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Identified Risk Factors
                </h4>
                <div className="space-y-2">
                  {brandSafety.risk_factors.map((risk, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {risk}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">No Risk Factors Identified</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  This creator maintains high content standards with no significant brand safety concerns.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Authenticity Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Authenticity Assessment
          </CardTitle>
          <CardDescription>
            Audience quality and growth pattern analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Authenticity Score */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Authenticity Score</span>
                <span className={`font-bold ${getAuthenticityColor(authenticity.authenticity_score)}`}>
                  {formatPercentage(authenticity.authenticity_score)}
                </span>
              </div>
              <Progress 
                value={authenticity.authenticity_score * 100} 
                className="w-full"
              />
            </div>

            {/* Fake Followers */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Fake Followers</span>
                <span className={`font-bold ${authenticity.fake_follower_percentage > 0.2 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatPercentage(authenticity.fake_follower_percentage)}
                </span>
              </div>
              <Progress 
                value={authenticity.fake_follower_percentage * 100} 
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Industry average: 15-20%
              </p>
            </div>

            {/* Engagement Authenticity */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Engagement Authenticity</span>
                <span className={`font-bold ${getAuthenticityColor(authenticity.engagement_authenticity)}`}>
                  {formatPercentage(authenticity.engagement_authenticity)}
                </span>
              </div>
              <Progress 
                value={authenticity.engagement_authenticity * 100} 
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Growth Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Badge 
                variant="secondary"
                className={`text-lg px-4 py-2 ${getGrowthPatternColor(authenticity.growth_pattern)}`}
              >
                {authenticity.growth_pattern}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {authenticity.growth_pattern.toLowerCase() === 'organic' 
                  ? 'Natural audience growth indicates authentic engagement'
                  : authenticity.growth_pattern.toLowerCase() === 'mixed'
                  ? 'Mix of organic and potential paid growth'
                  : 'Growth pattern may indicate artificial inflation'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Brand Mentions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {brandSafety.brand_mention_frequency}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Frequency of brand mentions in content
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Partnership Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brandSafety.safety_score >= 0.8 && authenticity.authenticity_score >= 0.7 && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="text-green-800 font-medium">✓ Recommended for Partnership</div>
                <p className="text-sm text-green-700">
                  High safety scores and authentic audience make this creator suitable for brand collaborations.
                </p>
              </div>
            )}
            
            {(brandSafety.safety_score < 0.8 || authenticity.authenticity_score < 0.7) && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="text-yellow-800 font-medium">⚠ Proceed with Caution</div>
                <p className="text-sm text-yellow-700">
                  Consider additional due diligence before establishing partnership.
                </p>
              </div>
            )}

            {brandSafety.risk_factors.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="text-red-800 font-medium">⚠ High Risk</div>
                <p className="text-sm text-red-700">
                  Multiple risk factors identified. Detailed review recommended.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}