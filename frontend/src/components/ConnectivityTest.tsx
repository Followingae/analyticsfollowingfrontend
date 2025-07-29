'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { authService } from '@/services/authService'
import { API_CONFIG } from '@/config/api'
import { CheckCircle, XCircle, Clock, Wifi } from 'lucide-react'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'testing' | 'pending'
  message: string
  details?: any
}

export default function ConnectivityTest() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, ...update } : result
    ))
  }

  const runConnectivityTests = async () => {
    setIsRunning(true)
    
    const tests: TestResult[] = [
      { name: 'Environment Configuration', status: 'pending', message: 'Checking environment variables...' },
      { name: 'Backend Health Check', status: 'pending', message: 'Testing backend connectivity...' },
      { name: 'CORS Configuration', status: 'pending', message: 'Testing cross-origin requests...' },
      { name: 'Authentication Endpoint', status: 'pending', message: 'Testing auth endpoints...' },
      { name: 'Network Diagnostics', status: 'pending', message: 'Running network diagnostics...' }
    ]
    
    setResults(tests)

    try {
      // Test 1: Environment Configuration
      updateResult(0, { status: 'testing' })
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const baseUrl = API_CONFIG.BASE_URL
      const envVar = process.env.NEXT_PUBLIC_API_BASE_URL
      
      if (!baseUrl || baseUrl === 'http://localhost:8000') {
        updateResult(0, { 
          status: 'error', 
          message: 'Backend URL not configured for production',
          details: { baseUrl, envVar }
        })
      } else {
        updateResult(0, { 
          status: 'success', 
          message: `Backend URL: ${baseUrl}`,
          details: { baseUrl, envVar }
        })
      }

      // Test 2: Backend Health Check
      updateResult(1, { status: 'testing' })
      const healthResult = await authService.testConnection()
      
      if (healthResult.success) {
        updateResult(1, { 
          status: 'success', 
          message: healthResult.message,
          details: healthResult
        })
      } else {
        updateResult(1, { 
          status: 'error', 
          message: healthResult.message,
          details: healthResult
        })
      }

      // Test 3: CORS Configuration
      updateResult(2, { status: 'testing' })
      try {
        const corsResponse = await fetch(`${baseUrl}/health`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          }
        })
        
        if (corsResponse.ok) {
          updateResult(2, { 
            status: 'success', 
            message: 'CORS headers properly configured',
            details: { 
              origin: window.location.origin,
              status: corsResponse.status,
              headers: Object.fromEntries(corsResponse.headers)
            }
          })
        } else {
          updateResult(2, { 
            status: 'error', 
            message: `CORS test failed: ${corsResponse.status}`,
            details: { status: corsResponse.status }
          })
        }
      } catch (corsError) {
        updateResult(2, { 
          status: 'error', 
          message: `CORS error: ${corsError instanceof Error ? corsError.message : 'Unknown error'}`,
          details: corsError
        })
      }

      // Test 4: Authentication Endpoint
      updateResult(3, { status: 'testing' })
      try {
        const authResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@test.com', password: 'test' })
        })
        
        const authData = await authResponse.text()
        
        if (authResponse.status === 500) {
          updateResult(3, { 
            status: 'error', 
            message: 'Authentication service has internal server error',
            details: { status: authResponse.status, response: authData }
          })
        } else if (authResponse.status === 401 || authResponse.status === 403) {
          updateResult(3, { 
            status: 'success', 
            message: 'Authentication endpoint is responding (invalid credentials expected)',
            details: { status: authResponse.status, response: authData }
          })
        } else {
          updateResult(3, { 
            status: 'error', 
            message: `Unexpected auth response: ${authResponse.status}`,
            details: { status: authResponse.status, response: authData }
          })
        }
      } catch (authError) {
        updateResult(3, { 
          status: 'error', 
          message: `Auth endpoint error: ${authError instanceof Error ? authError.message : 'Unknown error'}`,
          details: authError
        })
      }

      // Test 5: Network Diagnostics
      updateResult(4, { status: 'testing' })
      const networkInfo = {
        userAgent: navigator.userAgent,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        timestamp: new Date().toISOString()
      }
      
      updateResult(4, { 
        status: 'success', 
        message: 'Network diagnostics completed',
        details: networkInfo
      })

    } catch (error) {
      console.error('Connectivity test error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'testing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wifi className="h-5 w-5" />
          <span>Backend Connectivity Test</span>
        </CardTitle>
        <CardDescription>
          Diagnose connection issues between the frontend and backend services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runConnectivityTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Tests...' : 'Run Connectivity Test'}
        </Button>
        
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                    {result.details && (
                      <details className="mt-1">
                        <summary className="text-xs cursor-pointer text-blue-600">Show Details</summary>
                        <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}