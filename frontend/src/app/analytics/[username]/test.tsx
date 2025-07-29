"use client"

import { useState, useEffect } from "react"
import { useParams } from 'next/navigation'
import { instagramApiService } from "@/services/instagramApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPage() {
  const params = useParams()
  const initialUsername = params?.username as string
  const [username, setUsername] = useState(initialUsername || 'cristiano')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('TestPage - params:', params, 'username:', initialUsername)

  const testAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('Testing API with username:', username)
      const response = await instagramApiService.getProfileAnalysis(username)
      console.log('API Response:', response)
      setResult(response)
    } catch (err) {
      console.error('Test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Auto-test on mount
  useEffect(() => {
    if (username) {
      testAPI()
    }
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Backend Integration Test for @{initialUsername}</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Instagram API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Instagram username"
            />
            <Button onClick={testAPI} disabled={loading}>
              {loading ? 'Testing...' : 'Test API'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="p-4">
            <div className="text-red-600">Error: {error}</div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              API Response {result.success ? '✅ SUCCESS' : '❌ FAILED'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success && result.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Username:</strong> {result.data.profile?.username}</div>
                  <div><strong>Full Name:</strong> {result.data.profile?.full_name}</div>
                  <div><strong>Followers:</strong> {result.data.profile?.followers?.toLocaleString()}</div>
                  <div><strong>Engagement Rate:</strong> {result.data.profile?.engagement_rate}%</div>
                  <div><strong>Influence Score:</strong> {result.data.profile?.influence_score}/10</div>
                  <div><strong>Content Quality:</strong> {result.data.profile?.content_quality_score}/10</div>
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium">Full Response Data</summary>
                  <pre className="text-xs overflow-auto bg-gray-50 p-4 rounded mt-2 max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <pre className="text-xs overflow-auto bg-gray-50 p-4 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}