'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { instagramApiService, AIVerificationResponse, AIStatusMonitoringResponse } from '@/services/instagramApi'
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Activity, 
  Brain,
  Database,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface AIVerificationToolProps {
  className?: string
}

export function AIVerificationTool({ className }: AIVerificationToolProps) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationData, setVerificationData] = useState<AIVerificationResponse | null>(null)
  const [systemStatus, setSystemStatus] = useState<AIStatusMonitoringResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [triggeringAnalysis, setTriggeringAnalysis] = useState(false)

  const handleVerifyAnalysis = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username')
      return
    }

    const cleanUsername = username.trim().replace('@', '')
    setLoading(true)
    setError(null)
    setVerificationData(null)

    try {
      // Get both verification data and system status
      const [verifyResult, statusResult] = await Promise.all([
        instagramApiService.verifyAIAnalysis(cleanUsername),
        instagramApiService.getAISystemStatus()
      ])

      if (verifyResult.success && verifyResult.data) {
        setVerificationData(verifyResult.data)
        toast.success(`Verification complete for @${cleanUsername}`)
      } else {
        throw new Error(verifyResult.error || 'Verification failed')
      }

      if (statusResult.success && statusResult.data) {
        setSystemStatus(statusResult.data)
      }

    } catch (error: any) {
      console.error('Verification error:', error)
      setError(error.message || 'Failed to verify AI analysis')
      toast.error('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerAnalysis = async () => {
    if (!verificationData?.username) return

    setTriggeringAnalysis(true)
    try {
      const result = await instagramApiService.triggerProfileAnalysis(verificationData.username)
      
      if (result.success) {
        toast.success('AI analysis triggered successfully')
        // Refresh verification data after a delay
        setTimeout(() => {
          handleVerifyAnalysis()
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to trigger analysis')
      }
    } catch (error: any) {
      console.error('Analysis trigger error:', error)
      toast.error(error.message || 'Failed to trigger analysis')
    } finally {
      setTriggeringAnalysis(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'offline': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-4 h-4" />
      case 'degraded': return <AlertCircle className="w-4 h-4" />
      case 'offline': return <AlertCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Verification Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Analysis Verification Tool
          </CardTitle>
          <CardDescription>
            Verify AI analysis completion and view real AI data samples
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter username to verify AI analysis..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVerifyAnalysis()}
              className="flex-1"
            />
            <Button 
              onClick={handleVerifyAnalysis} 
              disabled={loading || !username.trim()}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Verify
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Verification Results */}
          {verificationData && (
            <div className="space-y-4">
              {/* Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Coverage</p>
                        <p className="text-2xl font-bold">{verificationData.analysis_coverage.toFixed(1)}%</p>
                      </div>
                      <Database className="w-8 h-8 text-blue-500" />
                    </div>
                    <Progress value={verificationData.analysis_coverage} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Posts Analyzed</p>
                        <p className="text-2xl font-bold">
                          {verificationData.posts_analyzed}/{verificationData.total_posts}
                        </p>
                      </div>
                      <Eye className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ready for Display</p>
                        <div className="flex items-center gap-2 mt-1">
                          {verificationData.ready_for_frontend_display ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                              <span className="text-lg font-semibold text-green-600">Yes</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-yellow-500" />
                              <span className="text-lg font-semibold text-yellow-600">No</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Zap className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!verificationData.ready_for_frontend_display && (
                  <Button 
                    onClick={handleTriggerAnalysis}
                    disabled={triggeringAnalysis}
                    className="flex-1"
                  >
                    {triggeringAnalysis ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Triggering Analysis...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Run AI Analysis
                      </>
                    )}
                  </Button>
                )}
                
                <Button variant="outline" onClick={handleVerifyAnalysis}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Sample AI Data */}
              {verificationData.sample_ai_data.sample_posts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Real AI Data Sample</CardTitle>
                    <CardDescription>
                      Sample of {verificationData.sample_ai_data.post_count} posts with AI analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {verificationData.sample_ai_data.sample_posts.slice(0, 3).map((post, index) => (
                        <div key={post.id} className="border rounded p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Post {index + 1}</span>
                            {post.is_real_ai_data && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Real AI Data
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <Badge variant="outline">
                              {post.ai_content_category}
                            </Badge>
                            <Badge variant="outline">
                              {post.ai_sentiment} ({post.ai_sentiment_score.toFixed(2)})
                            </Badge>
                            <Badge variant="outline">
                              {post.ai_language_code.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {(post.ai_category_confidence * 100).toFixed(0)}% confident
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Analyzed: {new Date(post.ai_analyzed_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* System Status */}
              {systemStatus && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI System Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`flex items-center justify-center gap-1 ${getStatusColor(systemStatus.system_health)}`}>
                          {getStatusIcon(systemStatus.system_health)}
                          <span className="font-semibold capitalize">{systemStatus.system_health}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">System Health</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold">{systemStatus.active_analyses}</p>
                        <p className="text-xs text-muted-foreground">Active Analyses</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold">{systemStatus.queue_depth}</p>
                        <p className="text-xs text-muted-foreground">Queue Depth</p>
                      </div>
                      
                      <div className="text-center">
                        <div className={`font-semibold ${systemStatus.models_loaded ? 'text-green-600' : 'text-red-600'}`}>
                          {systemStatus.models_loaded ? 'Loaded' : 'Not Loaded'}
                        </div>
                        <p className="text-xs text-muted-foreground">AI Models</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AIVerificationTool