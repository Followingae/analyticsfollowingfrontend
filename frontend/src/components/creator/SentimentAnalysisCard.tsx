import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Smile, Meh, Frown, Heart, TrendingUp } from "lucide-react"
import type { SentimentAnalysis } from "@/types/creatorTypes"

interface SentimentAnalysisCardProps {
  sentimentAnalysis: SentimentAnalysis
}

export function SentimentAnalysisCard({ sentimentAnalysis }: SentimentAnalysisCardProps) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return <Smile className="h-5 w-5 text-green-500" />
      case 'Negative':
        return <Frown className="h-5 w-5 text-red-500" />
      default:
        return <Meh className="h-5 w-5 text-yellow-500" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'Negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
    }
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(0)
  }

  const getBrandFriendlinessLevel = (score: number) => {
    if (score >= 85) return { text: 'Excellent', color: 'text-green-600' }
    if (score >= 70) return { text: 'Good', color: 'text-blue-600' }
    if (score >= 50) return { text: 'Moderate', color: 'text-yellow-600' }
    return { text: 'Needs Review', color: 'text-red-600' }
  }

  const brandLevel = getBrandFriendlinessLevel(sentimentAnalysis.brand_friendliness)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {getSentimentIcon(sentimentAnalysis.overall_sentiment)}
          Sentiment & Engagement Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Sentiment */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium">Overall Sentiment</span>
            <div className="flex items-center gap-2">
              <Badge className={getSentimentColor(sentimentAnalysis.overall_sentiment)}>
                {getSentimentIcon(sentimentAnalysis.overall_sentiment)}
                {sentimentAnalysis.overall_sentiment}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Score: {formatScore(sentimentAnalysis.sentiment_score)}%
              </span>
            </div>
          </div>
        </div>

        {/* Sentiment Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">Sentiment Distribution</h4>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Smile className="h-4 w-4 text-green-500" />
                  <span>Positive</span>
                </div>
                <span className="font-medium text-green-600">
                  {sentimentAnalysis.sentiment_breakdown.positive}%
                </span>
              </div>
              <Progress 
                value={sentimentAnalysis.sentiment_breakdown.positive} 
                className="h-2"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Meh className="h-4 w-4 text-yellow-500" />
                  <span>Neutral</span>
                </div>
                <span className="font-medium text-yellow-600">
                  {sentimentAnalysis.sentiment_breakdown.neutral}%
                </span>
              </div>
              <Progress 
                value={sentimentAnalysis.sentiment_breakdown.neutral} 
                className="h-2"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Frown className="h-4 w-4 text-red-500" />
                  <span>Negative</span>
                </div>
                <span className="font-medium text-red-600">
                  {sentimentAnalysis.sentiment_breakdown.negative}%
                </span>
              </div>
              <Progress 
                value={sentimentAnalysis.sentiment_breakdown.negative} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* Brand Friendliness */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-medium">Brand Friendliness</span>
            </div>
            <Badge variant="outline" className={brandLevel.color}>
              {brandLevel.text}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Score</span>
              <span className={`font-bold ${brandLevel.color}`}>
                {sentimentAnalysis.brand_friendliness}/100
              </span>
            </div>
            <Progress 
              value={sentimentAnalysis.brand_friendliness} 
              className="h-3"
            />
          </div>
        </div>

        {/* Insights Summary */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Engagement Quality:</strong> {sentimentAnalysis.sentiment_breakdown.positive >= 70 ? 'Highly positive' : sentimentAnalysis.sentiment_breakdown.positive >= 50 ? 'Mostly positive' : 'Mixed'} audience sentiment
            </p>
            <p>
              <strong>Brand Safety:</strong> {sentimentAnalysis.brand_friendliness >= 85 ? 'Excellent' : sentimentAnalysis.brand_friendliness >= 70 ? 'Good' : 'Moderate'} brand alignment potential
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}