import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Handshake, DollarSign, Star, TrendingUp, Shield, Target, Clock, Users } from "lucide-react"
import type { PartnershipPotential } from "@/types/creatorTypes"

interface PartnershipAssessmentCardProps {
  partnershipPotential: PartnershipPotential
}

export function PartnershipAssessmentCard({ partnershipPotential }: PartnershipAssessmentCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-600'
    if (score >= 7.0) return 'text-blue-600'
    if (score >= 5.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 8.5) return { text: 'Excellent', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' }
    if (score >= 7.0) return { text: 'Good', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' }
    if (score >= 5.5) return { text: 'Fair', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' }
    return { text: 'Poor', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' }
  }

  const overallBadge = getScoreBadge(partnershipPotential.overall_score)

  const scoringItems = [
    { key: 'engagement_quality', label: 'Engagement Quality', icon: Users, color: 'text-blue-500' },
    { key: 'audience_alignment', label: 'Audience Alignment', icon: Target, color: 'text-purple-500' },
    { key: 'content_consistency', label: 'Content Consistency', icon: TrendingUp, color: 'text-green-500' },
    { key: 'brand_safety', label: 'Brand Safety', icon: Shield, color: 'text-red-500' },
    { key: 'posting_regularity', label: 'Posting Regularity', icon: Clock, color: 'text-orange-500' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Handshake className="h-5 w-5 text-emerald-500" />
          Brand Partnership Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-3">
          <div className="space-y-2">
            <div className={`text-4xl font-bold ${getScoreColor(partnershipPotential.overall_score)}`}>
              {partnershipPotential.overall_score.toFixed(1)}
            </div>
            <Badge className={`${overallBadge.color} text-sm px-3 py-1`}>
              <Star className="h-3 w-3 mr-1" />
              {overallBadge.text} Partnership Potential
            </Badge>
          </div>
          <Progress 
            value={partnershipPotential.overall_score * 10} 
            className="h-4"
          />
        </div>

        {/* Scoring Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-4">Detailed Scoring</h4>
          <div className="space-y-4">
            {scoringItems.map(({ key, label, icon: Icon, color }) => {
              const score = partnershipPotential.scoring_breakdown[key as keyof typeof partnershipPotential.scoring_breakdown]
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className={`text-sm font-bold ${getScoreColor(score)}`}>
                      {score.toFixed(1)}/10
                    </div>
                  </div>
                  <Progress value={score * 10} className="h-2" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommended Budget */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Recommended Budget</span>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-sm px-3 py-1">
              {partnershipPotential.recommended_budget}
            </Badge>
          </div>
        </div>

        {/* Best Collaboration Types */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            Best Collaboration Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {partnershipPotential.best_collaboration_types.map((type, index) => (
              <Badge 
                key={type} 
                variant={index === 0 ? "default" : "outline"}
                className="capitalize"
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Partnership Recommendations */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-2">Partnership Recommendations</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Campaign Type:</strong> {partnershipPotential.overall_score >= 8 ? 'Long-term brand ambassador' : 
                                              partnershipPotential.overall_score >= 7 ? 'Multi-post campaign' : 
                                              'Single sponsored post'}
            </p>
            <p>
              <strong>Content Focus:</strong> {partnershipPotential.best_collaboration_types.slice(0, 2).join(' and ')} content
            </p>
            <p>
              <strong>Investment Level:</strong> {partnershipPotential.overall_score >= 8 ? 'Premium investment recommended' : 
                                                 partnershipPotential.overall_score >= 6.5 ? 'Standard budget appropriate' : 
                                                 'Conservative approach suggested'}
            </p>
            <p>
              <strong>Risk Level:</strong> {partnershipPotential.scoring_breakdown.brand_safety >= 8 ? 'Low risk' : 
                                          partnershipPotential.scoring_breakdown.brand_safety >= 6 ? 'Moderate risk' : 
                                          'Higher risk - review required'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}