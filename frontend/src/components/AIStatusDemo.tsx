/**
 * Demo component to showcase Professional AI Status Management
 * Shows how the system automatically handles different AI analysis states
 */

"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAIAnalysisTrigger } from '@/hooks/useAIStatus'
import { Bot, Play, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react'

export function AIStatusDemo() {
  const [testUsername, setTestUsername] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const { triggerAnalysis } = useAIAnalysisTrigger()

  const handleTest = async () => {
    if (!testUsername.trim()) return
    
    setIsRunning(true)
    try {
      await triggerAnalysis(testUsername.trim())
    } catch (error) {
      console.error('Demo test failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const statusExamples = [
    {
      status: 'completed',
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      message: 'No notification - insights display normally',
      color: 'bg-green-50 border-green-200'
    },
    {
      status: 'partial_data',
      icon: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />,
      message: '🔄 Updating AI insights for this profile...',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      status: 'not_started',
      icon: <Bot className="h-4 w-4 text-blue-600" />,
      message: '🤖 Generating AI insights for this profile...',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      status: 'running',
      icon: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />,
      message: '🔄 AI analysis in progress (67%)...',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      status: 'failed',
      icon: <AlertCircle className="h-4 w-4 text-blue-600" />,
      message: '🔄 Refreshing AI analysis...',
      color: 'bg-blue-50 border-blue-200'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Professional AI Status Management
        </CardTitle>
        <CardDescription>
          Automatic AI analysis status handling with user-friendly notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Test */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Test Live AI Status Management</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter username to test (e.g., example_user)"
              value={testUsername}
              onChange={(e) => setTestUsername(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleTest} 
              disabled={!testUsername.trim() || isRunning}
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Status Examples */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Automatic Status Handling</h4>
          <div className="grid gap-3">
            {statusExamples.map((example, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${example.color}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {example.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {example.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {example.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Key Features</h4>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <span>Automatic status detection on profile load</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <span>Silent background repairs for partial data</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <span>Automatic retry for failed analysis</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <span>Progress tracking with user-friendly updates</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <span>Professional messages - no technical errors exposed</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>All recovery happens automatically in the background</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}