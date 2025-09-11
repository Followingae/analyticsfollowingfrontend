'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Flag,
  Skull,
  Heart,
  MessageSquare,
  Image,
  Volume2,
  Lock,
  Unlock,
  Ban,
  CheckCheck,
  AlertCircle,
  Info,
  Zap,
  Star,
  Award,
  Scale,
  BookOpen,
  Users,
  Globe,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { SafetyAnalysisResponse } from '@/types/comprehensiveAnalytics'

interface SafetyRiskAssessmentProps {
  username: string
  safety: SafetyAnalysisResponse['safety'] | null
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
}

interface RiskIndicatorCardProps {
  risk: {
    type: string
    severity: 'low' | 'medium' | 'high'
    description: string
    affected_posts: string[]
  }
}

function RiskIndicatorCard({ risk }: RiskIndicatorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800'
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'low': return 'bg-green-50 border-green-200 text-green-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'low': return <Info className="h-4 w-4 text-green-600" />
      default: return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card className={`${getSeverityColor(risk.severity)} hover:shadow-md transition-shadow`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-black/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getSeverityIcon(risk.severity)}
                <div>
                  <CardTitle className="text-sm font-medium">{risk.type}</CardTitle>
                  <Badge variant="outline" className="text-xs mt-1 capitalize">
                    {risk.severity} severity
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {risk.affected_posts.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {risk.affected_posts.length} posts
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="text-sm mb-3">{risk.description}</p>
            {risk.affected_posts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Affected Posts ({risk.affected_posts.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {risk.affected_posts.slice(0, 5).map((postId, index) => (
                    <Badge key={index} variant="outline" className="text-xs font-mono">
                      {postId.substring(0, 8)}...
                    </Badge>
                  ))}
                  {risk.affected_posts.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{risk.affected_posts.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function SafetyScoreGauge({ score, label }: { score: number, label: string }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  return (
    <div className="text-center space-y-2">
      <div className="relative w-24 h-24 mx-auto">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
            className={getScoreColor(score)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-lg font-bold ${getScoreColor(score)}`}>
              {getScoreGrade(score)}
            </div>
            <div className="text-xs text-muted-foreground">{score}/100</div>
          </div>
        </div>
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function SafetyRiskAssessment({
  username,
  safety,
  isLoading = false,
  error = null,
  onRefresh
}: SafetyRiskAssessmentProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600 animate-pulse" />
            <span>Safety & Risk Assessment</span>
          </CardTitle>
          <CardDescription>Analyzing content safety and brand risk factors...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-20 w-20 bg-muted rounded-full animate-pulse mx-auto" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="h-32 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Safety Analysis Error</AlertTitle>
        <AlertDescription>
          {error}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Analysis
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (!safety) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Safety Analysis Not Available</h3>
          <p className="text-muted-foreground">
            Brand safety and risk assessment data is not yet available for this profile.
          </p>
          {onRefresh && (
            <Button onClick={onRefresh} className="mt-4">
              <Shield className="h-4 w-4 mr-2" />
              Run Safety Analysis
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-xl">
                <Shield className="h-6 w-6 text-green-600" />
                <span>Safety & Risk Assessment</span>
              </CardTitle>
              <CardDescription>
                Comprehensive brand safety and content compliance analysis for @{username}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Safety Scores Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-purple-600" />
            <span>Safety Scores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SafetyScoreGauge 
              score={safety.brand_safety_score * 100} 
              label="Brand Safety Score"
            />
            <SafetyScoreGauge 
              score={safety.compliance_analysis.platform_guideline_score * 100} 
              label="Platform Compliance"
            />
            <div className="text-center space-y-2">
              <div className="relative w-24 h-24 mx-auto">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Badge 
                    variant={
                      safety.compliance_analysis.compliance_grade === 'A' || 
                      safety.compliance_analysis.compliance_grade === 'B' 
                        ? 'default' 
                        : safety.compliance_analysis.compliance_grade === 'C' 
                        ? 'secondary' 
                        : 'destructive'
                    }
                    className="text-2xl px-3 py-1"
                  >
                    {safety.compliance_analysis.compliance_grade}
                  </Badge>
                </div>
              </div>
              <p className="text-sm font-medium">Compliance Grade</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Assessment Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="risks">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Risk Factors
          </TabsTrigger>
          <TabsTrigger value="content">
            <Flag className="w-4 h-4 mr-2" />
            Content Review
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <Scale className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Safety Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Brand Safety Score:</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={safety.brand_safety_score * 100} className="w-20 h-2" />
                    <span className="text-sm font-bold text-green-600">
                      {(safety.brand_safety_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Indicators:</span>
                  <Badge variant={safety.risk_indicators.length === 0 ? 'default' : 'secondary'}>
                    {safety.risk_indicators.length} detected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Content Violations:</span>
                  <Badge 
                    variant={safety.content_moderation.inappropriate_content_detected ? 'destructive' : 'default'}
                  >
                    {safety.content_moderation.inappropriate_content_detected ? 'Detected' : 'None Found'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Compliance Grade:</span>
                  <Badge 
                    variant={
                      ['A', 'B'].includes(safety.compliance_analysis.compliance_grade) 
                        ? 'default' 
                        : safety.compliance_analysis.compliance_grade === 'C' 
                        ? 'secondary' 
                        : 'destructive'
                    }
                  >
                    {safety.compliance_analysis.compliance_grade}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span>Brand Partnership Suitability</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {safety.brand_safety_score >= 0.8 ? 'Excellent' :
                     safety.brand_safety_score >= 0.6 ? 'Good' :
                     safety.brand_safety_score >= 0.4 ? 'Fair' :
                     'Needs Improvement'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on content analysis, this profile is{' '}
                    <span className="font-medium">
                      {safety.brand_safety_score >= 0.8 ? 'highly suitable' :
                       safety.brand_safety_score >= 0.6 ? 'suitable' :
                       safety.brand_safety_score >= 0.4 ? 'moderately suitable' :
                       'not recommended'}
                    </span>
                    {' '}for brand partnerships.
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    {safety.brand_safety_score >= 0.8 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : safety.brand_safety_score >= 0.4 ? (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {(safety.brand_safety_score * 100).toFixed(0)}% Safety Score
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Factors Tab */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Risk Indicators</span>
                </div>
                <Badge variant="secondary">
                  {safety.risk_indicators.length} total
                </Badge>
              </CardTitle>
              <CardDescription>
                Identified risk factors that may affect brand safety
              </CardDescription>
            </CardHeader>
          </Card>

          {safety.risk_indicators.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-green-800">No Risk Indicators Found</h3>
                <p className="text-muted-foreground">
                  This profile shows no significant risk factors for brand partnerships.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {safety.risk_indicators.map((risk, index) => (
                <RiskIndicatorCard key={index} risk={risk} />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {safety.risk_indicators.filter(r => r.severity === 'high').length}
                </div>
                <p className="text-sm text-muted-foreground">High Severity</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-2">
                  {safety.risk_indicators.filter(r => r.severity === 'medium').length}
                </div>
                <p className="text-sm text-muted-foreground">Medium Severity</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {safety.risk_indicators.filter(r => r.severity === 'low').length}
                </div>
                <p className="text-sm text-muted-foreground">Low Severity</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Review Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flag className="h-5 w-5 text-red-600" />
                <span>Content Moderation Review</span>
              </CardTitle>
              <CardDescription>
                Automated content scanning results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    {safety.content_moderation.inappropriate_content_detected ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">Inappropriate Content Detection</p>
                      <p className="text-xs text-muted-foreground">
                        Automated scanning for policy violations
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={safety.content_moderation.inappropriate_content_detected ? 'destructive' : 'default'}
                  >
                    {safety.content_moderation.inappropriate_content_detected ? 'Violations Found' : 'Clean'}
                  </Badge>
                </div>

                {safety.content_moderation.flagged_posts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Flagged Content</h4>
                    <div className="space-y-2">
                      {safety.content_moderation.flagged_posts.map((flagged, index) => (
                        <Alert key={index} className="py-3">
                          <AlertTriangle className="h-4 w-4" />
                          <div className="flex items-center justify-between">
                            <div>
                              <AlertTitle className="text-sm">
                                {flagged.violation_type}
                              </AlertTitle>
                              <AlertDescription className="text-xs">
                                Post ID: {flagged.post_id}
                              </AlertDescription>
                            </div>
                            <Badge 
                              variant={
                                flagged.severity === 'high' ? 'destructive' : 
                                flagged.severity === 'medium' ? 'secondary' : 
                                'outline'
                              }
                              className="text-xs"
                            >
                              {flagged.severity}
                            </Badge>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scale className="h-5 w-5 text-purple-600" />
                <span>Platform Compliance Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Overall Compliance Score</h4>
                    <p className="text-sm text-muted-foreground">
                      Adherence to platform guidelines and policies
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {(safety.compliance_analysis.platform_guideline_score * 100).toFixed(0)}%
                    </div>
                    <Badge 
                      variant={
                        ['A', 'B'].includes(safety.compliance_analysis.compliance_grade) 
                          ? 'default' 
                          : safety.compliance_analysis.compliance_grade === 'C' 
                          ? 'secondary' 
                          : 'destructive'
                      }
                    >
                      Grade {safety.compliance_analysis.compliance_grade}
                    </Badge>
                  </div>
                </div>

                <Progress 
                  value={safety.compliance_analysis.platform_guideline_score * 100} 
                  className="h-3"
                />

                {safety.compliance_analysis.violations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span>Compliance Violations</span>
                    </h4>
                    <div className="space-y-2">
                      {safety.compliance_analysis.violations.map((violation, index) => (
                        <Alert key={index}>
                          <AlertDescription className="text-sm">
                            {violation}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {safety.compliance_analysis.violations.length === 0 && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">
                        No compliance violations detected
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        This profile maintains high standards of platform compliance
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Compliance Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Content Guidelines</span>
                  <Badge variant="outline">
                    {safety.compliance_analysis.violations.filter(v => 
                      v.toLowerCase().includes('content')
                    ).length === 0 ? 'Compliant' : 'Violations'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Community Standards</span>
                  <Badge variant="outline">
                    {safety.compliance_analysis.violations.filter(v => 
                      v.toLowerCase().includes('community')
                    ).length === 0 ? 'Compliant' : 'Violations'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Advertising Policies</span>
                  <Badge variant="outline">
                    {safety.compliance_analysis.violations.filter(v => 
                      v.toLowerCase().includes('advertising') || v.toLowerCase().includes('promotion')
                    ).length === 0 ? 'Compliant' : 'Violations'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {safety.compliance_analysis.compliance_grade === 'A' && (
                    <div className="text-center">
                      <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">Excellent Compliance</p>
                      <p className="text-xs text-muted-foreground">
                        This profile exceeds platform standards and is ideal for partnerships.
                      </p>
                    </div>
                  )}
                  {safety.compliance_analysis.compliance_grade === 'B' && (
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">Good Compliance</p>
                      <p className="text-xs text-muted-foreground">
                        Strong adherence to guidelines with minimal risk factors.
                      </p>
                    </div>
                  )}
                  {['C', 'D', 'F'].includes(safety.compliance_analysis.compliance_grade) && (
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-yellow-800">Needs Attention</p>
                      <p className="text-xs text-muted-foreground">
                        Consider addressing compliance issues before brand partnerships.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}