"use client"

import React, { useState } from 'react'
import { Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useCreatorSearch } from '@/hooks/useCreatorSearch'
import { ProfileCard } from './profile-card'
import type { ProfileSearchResponse } from '@/types/api'

export const CreatorSearch: React.FC = () => {
  const [username, setUsername] = useState('')
  const [searchResult, setSearchResult] = useState<ProfileSearchResponse | null>(null)

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
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>{searchResult.message}</span>
                <Badge variant="outline">
                  {searchResult.cached ? "Served from Database" : "New Profile Fetched"}
                </Badge>
              </AlertDescription>
            </Alert>
            
            <ProfileCard profile={searchResult.profile} showAI={true} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}