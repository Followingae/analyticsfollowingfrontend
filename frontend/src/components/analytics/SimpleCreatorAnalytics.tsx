'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { comprehensiveAnalyticsApi } from '@/services/comprehensiveAnalyticsApi'
import { Users, Heart, MessageCircle, ImageIcon, BarChart3 } from 'lucide-react'

interface SimpleCreatorAnalyticsProps {
  username: string
}

function SimpleCreatorAnalyticsComponent({ username }: SimpleCreatorAnalyticsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Fetching data for username:', username)
        const result = await comprehensiveAnalyticsApi.getCreatorAnalytics(username)
        console.log('Received data:', result)
        setData(result)
        setError(null)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchData()
    }
  }, [username])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No data available for @{username}
          </div>
        </CardContent>
      </Card>
    )
  }

  const profile = data.profile || {}
  const ai = data.ai_analysis || {}

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.profile_picture_url} alt={profile.full_name} />
              <AvatarFallback>
                {(profile.full_name || profile.username || '').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{profile.full_name || profile.username}</CardTitle>
              <p className="text-muted-foreground">@{profile.username}</p>
              {profile.biography && (
                <p className="text-sm mt-2 line-clamp-2">{profile.biography}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold">{(profile.followers_count || 0).toLocaleString()}</span>
              <span className="text-muted-foreground">followers</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold">{(profile.following_count || 0).toLocaleString()}</span>
              <span className="text-muted-foreground">following</span>
            </div>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{(profile.posts_count || 0).toLocaleString()}</span>
              <span className="text-muted-foreground">posts</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="font-semibold">{(((profile.engagement_rate || 0) * 100) || 0).toFixed(2)}%</span>
              <span className="text-muted-foreground">engagement</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Score */}
      {ai?.content_quality_score && (
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Content Quality Score</span>
              <Badge variant="secondary">
                {((ai.content_quality_score || 0) || 0).toFixed(1)}/100
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Stats</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Followers</span>
                      <p className="font-semibold">{(profile.followers_count || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Posts</span>
                      <p className="font-semibold">{(profile.posts_count || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience">
          <Card>
            <CardHeader>
              <CardTitle>Audience Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Audience insights would go here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Content insights would go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { SimpleCreatorAnalyticsComponent as SimpleCreatorAnalytics }