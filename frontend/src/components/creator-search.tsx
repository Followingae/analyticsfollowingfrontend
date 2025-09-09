"use client"

import React, { useState } from 'react'
import { Search, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCreatorSearch } from '@/hooks/useCreatorSearch'
import { ProfileCard } from './profile-card'
import { EnhancedProfileDetail } from './enhanced-profile-detail'
import type { ProfileSearchResponse } from '@/types/api'

export const CreatorSearch: React.FC = () => {
  const [username, setUsername] = useState('')
  const [searchResult, setSearchResult] = useState<ProfileSearchResponse | null>(null)
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact')

  const creatorSearch = useCreatorSearch({
    onSuccess: (data) => {
      setSearchResult(data)
    },
    onError: (error) => {
      console.error('Search failed:', error)
    }
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      creatorSearch.mutate(username.trim())
    }
  }

  const getDataSourceBadge = () => {
    if (!searchResult) return null
    
    return (
      <Badge variant={searchResult.cached ? "secondary" : "default"}>
        {searchResult.cached ? "Database" : "Fresh Data"}
      </Badge>
    )
  }

  const getStatusIcon = () => {
    if (creatorSearch.isPending) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (creatorSearch.isError) {
      return <AlertCircle className="h-4 w-4 text-destructive" />
    }
    if (creatorSearch.isSuccess) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    }
    return <Search className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Creator Search
          {getDataSourceBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter Instagram username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={creatorSearch.isPending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!username.trim() || creatorSearch.isPending}
          >
            {getStatusIcon()}
            {creatorSearch.isPending ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {creatorSearch.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {creatorSearch.error?.message || 'Search failed'}
            </AlertDescription>
          </Alert>
        )}

        {searchResult && (
          <div className="space-y-6">
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>{searchResult.message}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {searchResult.cached ? "Database" : "Fresh Data"}
                  </Badge>
                  {searchResult.profile.ai_analysis && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Enhanced AI
                    </Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">@{searchResult.profile.username}</h3>
                <p className="text-sm text-muted-foreground">
                  {searchResult.profile.followers_count.toLocaleString()} followers
                </p>
              </div>
              
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'compact' | 'detailed')}>
                <TabsList>
                  <TabsTrigger value="compact">Compact</TabsTrigger>
                  <TabsTrigger value="detailed">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Detailed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Results Display */}
            {viewMode === 'compact' ? (
              <ProfileCard profile={searchResult.profile} showAI={true} />
            ) : (
              <EnhancedProfileDetail 
                profile={searchResult.profile}
                showAdvancedAI={true}
                isUnlocked={!!searchResult.profile.access_granted_at}
                onUnlock={(username) => {
                  console.log('Unlock requested for:', username)
                  // TODO: Implement unlock functionality
                }}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}