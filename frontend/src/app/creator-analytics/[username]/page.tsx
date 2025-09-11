'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CreatorAnalyticsDashboard } from '@/components/analytics/CreatorAnalyticsDashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useCreatorAnalytics, useProfileUnlock } from '@/hooks/useCreatorAnalytics'
import { toast } from 'sonner'

export default function CreatorAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const { profile, loading, error, refetch } = useCreatorAnalytics({
    username,
    autoFetch: true
  })

  const { unlockProfile, unlocking, unlockError } = useProfileUnlock()

  const handleUnlock = async () => {
    try {
      const result = await unlockProfile(username)
      
      toast.success('Profile unlocked successfully!', {
        description: `${result.credits_spent} credits used. ${result.credits_remaining} remaining.`
      })
      
      // Refetch profile data after unlock
      setTimeout(() => {
        refetch()
      }, 1000)
      
    } catch (error) {
      toast.error('Failed to unlock profile', {
        description: unlockError || 'An error occurred while unlocking the profile.'
      })
    }
  }

  const handleBackToSearch = () => {
    router.push('/creators')
  }

  const openInstagramProfile = () => {
    window.open(`https://www.instagram.com/${username}/`, '_blank')
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToSearch}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold">Creator Analytics</h1>
              <p className="text-muted-foreground">@{username}</p>
            </div>
          </div>

          {/* Error State */}
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Profile</CardTitle>
              <CardDescription>
                We encountered an issue while loading the creator profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{error}</p>
              
              <div className="flex gap-2">
                <Button onClick={refetch} variant="outline">
                  Try Again
                </Button>
                <Button onClick={handleBackToSearch} variant="secondary">
                  Back to Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToSearch}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold">Creator Analytics</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground">@{username}</p>
                
                {/* AI Analysis Status Badge */}
                {profile?.ai_analysis?.available && (
                  <Badge variant="default">AI Insights Available</Badge>
                )}
                {profile && !profile.ai_analysis?.available && (
                  <Badge variant="secondary">Basic Data Only</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openInstagramProfile}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on Instagram
            </Button>
            
            {profile && !profile.is_unlocked && (
              <Button
                onClick={handleUnlock}
                disabled={unlocking}
                className="flex items-center gap-2"
              >
                {unlocking ? 'Unlocking...' : `Unlock (${profile.unlock_cost} credits)`}
              </Button>
            )}
          </div>
        </div>

        {/* Analytics Dashboard */}
        <CreatorAnalyticsDashboard 
          username={username}
          onUnlock={handleUnlock}
        />

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>AI Analysis Available:</strong> {profile?.ai_analysis?.available ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Profile Analyzed At:</strong> {profile?.ai_analysis?.profile_analyzed_at || 'N/A'}
                </div>
                <div>
                  <strong>Content Type:</strong> {profile?.ai_analysis?.primary_content_type || 'N/A'}
                </div>
                <div>
                  <strong>Sentiment Score:</strong> {profile?.ai_analysis?.avg_sentiment_score || 'N/A'}
                </div>
                <div>
                  <strong>Quality Score:</strong> {profile?.ai_analysis?.content_quality_score || 'N/A'}
                </div>
                <div>
                  <strong>Is Unlocked:</strong> {profile?.is_unlocked ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Unlock Cost:</strong> {profile?.unlock_cost || 'N/A'} credits
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}