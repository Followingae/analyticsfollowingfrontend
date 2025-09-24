'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  BarChart3, 
  Users, 
  Heart,
  TrendingUp,
  Clock,
  Shield,
  Star,
  ExternalLink,
  CheckCircle,
  Info
} from 'lucide-react'
import { CreatorProfile } from './analytics/CreatorAnalyticsDashboard'
import { useCreatorAnalytics } from '@/hooks/useCreatorAnalytics'
import { toast } from 'sonner'

export function CreatorSearchWithAnalytics() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<CreatorProfile[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchTerm.trim()) {
      toast.error('Please enter a username')
      return
    }

    const username = searchTerm.replace('@', '').trim()
    
    // Navigate directly to analytics page
    router.push(`/creator-analytics/${username}`)
  }


  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Example creators for demonstration
  const exampleCreators = [
    {
      username: 'cristiano',
      full_name: 'Cristiano Ronaldo',
      followers_count: 643000000,
      category: 'Sports',
      verified: true
    },
    {
      username: 'leomessi',
      full_name: 'Leo Messi',
      followers_count: 502000000,
      category: 'Sports',
      verified: true
    },
    {
      username: 'kyliejenner',
      full_name: 'Kylie Jenner',
      followers_count: 400000000,
      category: 'Lifestyle',
      verified: true
    },
    {
      username: 'selenagomez',
      full_name: 'Selena Gomez',
      followers_count: 422000000,
      category: 'Entertainment',
      verified: true
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Creator Analytics</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover comprehensive insights about Instagram creators with our AI-powered analytics platform. 
          Get audience demographics, engagement metrics, brand safety scores, and more.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter Instagram username (e.g., cristiano, leomessi)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-lg h-12"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={searchLoading}
                className="px-8"
              >
                <Search className="h-4 w-4 mr-2" />
                {searchLoading ? 'Searching...' : 'Analyze'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-primary/10 w-fit mx-auto mb-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Audience Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Age groups, gender split, and geographic distribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-destructive/10 w-fit mx-auto mb-3">
              <Heart className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="font-medium mb-1">Engagement Metrics</h3>
            <p className="text-sm text-muted-foreground">
              Likes, comments, engagement rate, and optimal posting times
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-green-500/10 w-fit mx-auto mb-3">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-500" />
            </div>
            <h3 className="font-medium mb-1">Brand Safety</h3>
            <p className="text-sm text-muted-foreground">
              Safety scores, risk assessment, and authenticity metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-purple-100 w-fit mx-auto mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium mb-1">AI Insights</h3>
            <p className="text-sm text-muted-foreground">
              Content analysis, sentiment, and language distribution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Our Analytics Work
          </CardTitle>
          <CardDescription>
            Our two-stage analysis system provides immediate insights and comprehensive analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stage 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <h4 className="font-medium">Stage 1 - Immediate Data</h4>
                <Badge variant="secondary">~2 seconds</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                <li>• Basic profile information</li>
                <li>• Follower and engagement counts</li>
                <li>• Profile verification status</li>
                <li>• Account type and category</li>
              </ul>
            </div>

            {/* Stage 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <h4 className="font-medium">Stage 2 - AI Analytics</h4>
                <Badge variant="default">~2-5 minutes</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                <li>• AI-powered content analysis</li>
                <li>• Audience demographics</li>
                <li>• Engagement trends and patterns</li>
                <li>• Brand safety assessment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example Creators */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Creators to Analyze</CardTitle>
          <CardDescription>
            Click on any creator below to see their comprehensive analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleCreators.map((creator) => (
              <div
                key={creator.username}
                onClick={() => router.push(`/creator-analytics/${creator.username}`)}
                className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {creator.full_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{creator.full_name}</span>
                    {creator.verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    @{creator.username} • {formatNumber(creator.followers_count)} followers
                  </div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {creator.category}
                  </Badge>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Info */}
      <Alert>
        <Star className="h-4 w-4" />
        <AlertDescription>
          <strong>Credit System:</strong> Unlocking a creator profile costs 25 credits and provides permanent access 
          to their complete analytics including posts, audience insights, and AI analysis.
        </AlertDescription>
      </Alert>
    </div>
  )
}