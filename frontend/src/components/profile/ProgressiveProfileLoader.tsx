'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { useProgressiveProfileLoading } from '@/hooks/useProgressiveProfileLoading'
import type { InstagramProfile } from '@/services/instagramApi'
import { ProfileAvatar } from '@/components/ui/cdn-image'

interface ProgressiveProfileLoaderProps {
  username: string
  onBasicDataLoaded?: (profile: InstagramProfile) => void
  onDetailedDataLoaded?: (profile: InstagramProfile) => void
  onError?: (error: string) => void
}

export function ProgressiveProfileLoader({ 
  username, 
  onBasicDataLoaded, 
  onDetailedDataLoaded, 
  onError 
}: ProgressiveProfileLoaderProps) {
  const [state, { loadProfile, stopPolling, reset }] = useProgressiveProfileLoading()

  React.useEffect(() => {
    if (username) {
      loadProfile(username)
    }
    
    return () => {
      stopPolling()
    }
  }, [username, loadProfile, stopPolling])

  React.useEffect(() => {
    if (state.basicData?.profile && onBasicDataLoaded) {
      onBasicDataLoaded(state.basicData.profile)
    }
  }, [state.basicData, onBasicDataLoaded])

  React.useEffect(() => {
    if (state.detailedData?.profile && onDetailedDataLoaded) {
      onDetailedDataLoaded(state.detailedData.profile)
    }
  }, [state.detailedData, onDetailedDataLoaded])

  React.useEffect(() => {
    if (state.error && onError) {
      onError(state.error)
    }
  }, [state.error, onError])

  const getStatusIcon = () => {
    switch (state.aiStatus) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (state.aiStatus) {
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Profile Analysis for @{username}
          {getStatusIcon()}
        </CardTitle>
        <CardDescription>
          Progressive loading with AI-powered insights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Steps */}
        <div className="space-y-3">
          {/* Step 1: Basic Data */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
              state.dataStage === 'none' ? 'bg-gray-200 text-gray-500' :
              state.isLoadingBasic ? 'bg-blue-100 text-blue-600' :
              'bg-green-100 text-green-600'
            }`}>
              {state.isLoadingBasic ? <Loader2 className="h-3 w-3 animate-spin" /> : 
               state.dataStage !== 'none' ? '✓' : '1'}
            </div>
            <div className="flex-1">
              <div className="font-medium">Basic Profile Data</div>
              <div className="text-sm text-gray-500">
                {state.isLoadingBasic ? 'Loading...' :
                 state.dataStage !== 'none' ? 'Loaded (1-3 seconds)' :
                 'Pending'}
              </div>
            </div>
          </div>

          {/* Step 2: AI Analysis */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
              state.aiStatus === null ? 'bg-gray-200 text-gray-500' :
              state.aiStatus === 'processing' ? 'bg-blue-100 text-blue-600' :
              state.aiStatus === 'completed' ? 'bg-green-100 text-green-600' :
              'bg-red-100 text-red-600'
            }`}>
              {state.aiStatus === 'processing' ? <Loader2 className="h-3 w-3 animate-spin" /> : 
               state.aiStatus === 'completed' ? '✓' : '2'}
            </div>
            <div className="flex-1">
              <div className="font-medium">AI Content Analysis</div>
              <div className="text-sm text-gray-500">
                {state.aiStatus === 'processing' ? 'Analyzing content...' :
                 state.aiStatus === 'completed' ? 'Analysis complete' :
                 state.aiStatus === 'error' ? 'Analysis failed' :
                 'Pending'}
              </div>
              {state.aiProgress && (
                <Progress 
                  value={state.aiProgress.percentage} 
                  className="w-full mt-1 h-2"
                />
              )}
            </div>
          </div>

          {/* Step 3: Detailed Data */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
              state.dataStage !== 'detailed' ? 'bg-gray-200 text-gray-500' :
              state.isLoadingDetailed ? 'bg-blue-100 text-blue-600' :
              'bg-green-100 text-green-600'
            }`}>
              {state.isLoadingDetailed ? <Loader2 className="h-3 w-3 animate-spin" /> : 
               state.dataStage === 'detailed' ? '✓' : '3'}
            </div>
            <div className="flex-1">
              <div className="font-medium">Detailed Insights</div>
              <div className="text-sm text-gray-500">
                {state.isLoadingDetailed ? 'Loading detailed data...' :
                 state.dataStage === 'detailed' ? 'Complete with AI insights' :
                 'Waiting for AI analysis'}
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {state.message && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">{state.message}</div>
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-red-800">{state.error}</div>
          </div>
        )}

        {/* Data Stage Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={getStatusColor()}>
            {state.dataStage === 'basic' ? 'Basic Data Available' :
             state.dataStage === 'detailed' ? 'Detailed Data Available' :
             'Loading...'}
          </Badge>
          
          {state.aiStatus && (
            <Badge variant="outline">
              AI Status: {state.aiStatus.charAt(0).toUpperCase() + state.aiStatus.slice(1)}
            </Badge>
          )}
        </div>

        {/* Profile Data Preview */}
        {state.basicData?.profile && (
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  profile={{
                    id: state.basicData.profile.id,
                    username: state.basicData.profile.username,
                    full_name: state.basicData.profile.full_name,
                    profile_pic_url: state.basicData.profile.profile_pic_url,
                    profile_pic_url_hd: state.basicData.profile.profile_pic_url_hd
                  }}
                  size="small"
                  className="w-12 h-12"
                />
                <div>
                  <div className="font-semibold">@{state.basicData.profile.username}</div>
                  <div className="text-sm text-gray-600">{state.basicData.profile.full_name}</div>
                  <div className="text-sm text-gray-500">
                    {state.basicData.profile.followers_count.toLocaleString()} followers
                  </div>
                </div>
              </div>
              
              {state.detailedData?.profile?.ai_insights && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm font-medium text-green-600">
                    ✓ AI Insights Available
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Content category: {state.detailedData.profile.ai_primary_content_type || 'Analyzing...'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}