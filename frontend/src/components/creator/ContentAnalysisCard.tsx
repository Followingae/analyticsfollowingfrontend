import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Shield, Target, TrendingUp } from "lucide-react"
import type { ContentAnalysis } from "@/types/creatorTypes"

interface ContentAnalysisCardProps {
  contentAnalysis: ContentAnalysis
}

export function ContentAnalysisCard({ contentAnalysis }: ContentAnalysisCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Sort content distribution by percentage
  const sortedContent = Object.entries(contentAnalysis.content_distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) // Show top 5

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Content Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Content Type */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Primary Content Type</span>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              <Target className="h-3 w-3 mr-1" />
              {contentAnalysis.primary_content_type}
            </Badge>
          </div>
        </div>

        {/* Content Distribution */}
        <div>
          <h4 className="text-sm font-medium mb-3">Content Distribution</h4>
          <div className="space-y-3">
            {sortedContent.map(([category, percentage]) => (
              <div key={category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{category}</span>
                  <span className="text-muted-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Content Consistency Score */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Consistency</span>
            </div>
            <div className="space-y-1">
              <div className={`text-2xl font-bold ${getScoreColor(contentAnalysis.content_consistency_score)}`}>
                {contentAnalysis.content_consistency_score}
              </div>
              <Progress 
                value={contentAnalysis.content_consistency_score} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {contentAnalysis.content_consistency_score >= 80 ? 'Excellent' :
                 contentAnalysis.content_consistency_score >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          </div>

          {/* Brand Safety Score */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Brand Safety</span>
            </div>
            <div className="space-y-1">
              <div className={`text-2xl font-bold ${getScoreColor(contentAnalysis.brand_safety_score)}`}>
                {contentAnalysis.brand_safety_score}
              </div>
              <Progress 
                value={contentAnalysis.brand_safety_score} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {contentAnalysis.brand_safety_score >= 80 ? 'Very Safe' :
                 contentAnalysis.brand_safety_score >= 60 ? 'Safe' : 'Review Required'}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Insights */}
        <div className="pt-4 border-t bg-muted/30 rounded-lg p-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Content Focus:</strong> {contentAnalysis.content_consistency_score >= 70 ? 'Highly consistent' : 'Moderately consistent'} {contentAnalysis.primary_content_type.toLowerCase()} content
            </p>
            <p>
              <strong>Brand Partnership:</strong> {contentAnalysis.brand_safety_score >= 80 ? 'Excellent' : 'Good'} brand safety rating
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}