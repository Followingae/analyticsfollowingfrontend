"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" 
import { settingsApiService } from "@/services/settingsApi"
import { useAuth } from "@/contexts/AuthContext"
import { AuthGuard } from "@/components/AuthGuard"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  timing?: string
  data?: any
}

export default function SettingsTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)
  const { user, isAuthenticated } = useAuth()

  const addResult = (test: string, status: TestResult['status'], message: string, timing?: string, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timing,
      data,
    }])
  }

  const runAllTests = async () => {
    if (!isAuthenticated) {
      addResult('Authentication Check', 'error', 'User not authenticated. Please log in first.')
      return
    }

    setTesting(true)
    setTestResults([])

    // Test 1: Settings Overview
    await testSettingsOverview()
    
    // Test 2: Profile Get
    await testProfileGet()
    
    // Test 3: Profile Update
    await testProfileUpdate()
    
    // Test 4: Notifications Get
    await testNotificationsGet()
    
    // Test 5: Notifications Update
    await testNotificationsUpdate()
    
    // Test 6: Preferences Get
    await testPreferencesGet()
    
    // Test 7: Password Validation
    await testPasswordValidation()
    
    // Test 8: File Validation
    await testFileValidation()

    setTesting(false)
  }

  const testSettingsOverview = async () => {
    const startTime = Date.now()
    try {
      console.log('🧪 Testing settings overview...')
      const result = await settingsApiService.getSettingsOverview()
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      
      if (result.success) {
        addResult('Settings Overview', 'success', 'Successfully loaded settings overview', timing, result.data)
      } else {
        addResult('Settings Overview', 'error', result.error || 'Failed to load settings', timing, result)
      }
    } catch (error) {
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      addResult('Settings Overview', 'error', error instanceof Error ? error.message : 'Unknown error', timing)
    }
  }

  const testProfileGet = async () => {
    const startTime = Date.now()
    try {
      console.log('🧪 Testing profile get...')
      const result = await settingsApiService.getProfile()
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      
      if (result.success) {
        addResult('Profile Get', 'success', 'Successfully retrieved profile', timing, result.data)
      } else {
        addResult('Profile Get', 'error', result.error || 'Failed to get profile', timing, result)
      }
    } catch (error) {
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      addResult('Profile Get', 'error', error instanceof Error ? error.message : 'Unknown error', timing)
    }
  }

  const testProfileUpdate = async () => {
    const startTime = Date.now()
    try {
      console.log('🧪 Testing profile update...')
      const updateData = {
        first_name: 'Test',
        last_name: 'User',
        company: 'Test Company',
        bio: 'This is a test bio for settings integration'
      }
      
      const result = await settingsApiService.updateProfile(updateData)
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      
      if (result.success) {
        addResult('Profile Update', 'success', 'Successfully updated profile', timing, result.data)
      } else {
        addResult('Profile Update', 'error', result.error || 'Failed to update profile', timing, result)
      }
    } catch (error) {
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      addResult('Profile Update', 'error', error instanceof Error ? error.message : 'Unknown error', timing)
    }
  }

  const testNotificationsGet = async () => {
    const startTime = Date.now()
    try {
      console.log('🧪 Testing notifications get...')
      const result = await settingsApiService.getNotificationSettings()
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      
      if (result.success) {
        addResult('Notifications Get', 'success', 'Successfully retrieved notifications', timing, result.data)
      } else {
        addResult('Notifications Get', 'error', result.error || 'Failed to get notifications', timing, result)
      }
    } catch (error) {
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      addResult('Notifications Get', 'error', error instanceof Error ? error.message : 'Unknown error', timing)
    }
  }

  const testNotificationsUpdate = async () => {
    const startTime = Date.now()
    try {
      console.log('🧪 Testing notifications update...')
      const updateData = {
        email_notifications: true,
        push_notifications: false,
        marketing_emails: false
      }
      
      const result = await settingsApiService.updateNotificationSettings(updateData)
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      
      if (result.success) {
        addResult('Notifications Update', 'success', 'Successfully updated notifications', timing, result.data)
      } else {
        addResult('Notifications Update', 'error', result.error || 'Failed to update notifications', timing, result)
      }
    } catch (error) {
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      addResult('Notifications Update', 'error', error instanceof Error ? error.message : 'Unknown error', timing)
    }
  }

  const testPreferencesGet = async () => {
    const startTime = Date.now()
    try {
      console.log('🧪 Testing preferences get...')
      const result = await settingsApiService.getPreferences()
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      
      if (result.success) {
        addResult('Preferences Get', 'success', 'Successfully retrieved preferences', timing, result.data)
      } else {
        addResult('Preferences Get', 'error', result.error || 'Failed to get preferences', timing, result)
      }
    } catch (error) {
      const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      addResult('Preferences Get', 'error', error instanceof Error ? error.message : 'Unknown error', timing)
    }
  }

  const testPasswordValidation = async () => {
    console.log('🧪 Testing password validation...')
    
    // Test weak passwords
    const weakPasswords = ['123', 'password', 'PASSWORD', 'Password']
    const strongPassword = 'StrongPass123!'
    
    for (const password of weakPasswords) {
      const validation = settingsApiService.validatePassword(password)
      if (validation.valid) {
        addResult('Password Validation', 'error', `Weak password "${password}" incorrectly validated as strong`)
        return
      }
    }
    
    const strongValidation = settingsApiService.validatePassword(strongPassword)
    if (strongValidation.valid) {
      addResult('Password Validation', 'success', 'Password validation working correctly')
    } else {
      addResult('Password Validation', 'error', `Strong password incorrectly rejected: ${strongValidation.errors.join(', ')}`)
    }
  }

  const testFileValidation = async () => {
    console.log('🧪 Testing file validation...')
    
    // Create mock files for testing
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const oversizedFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' }) // 3MB
    const invalidTypeFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    const validValidation = settingsApiService.validateImageFile(validFile)
    const oversizedValidation = settingsApiService.validateImageFile(oversizedFile)
    const invalidTypeValidation = settingsApiService.validateImageFile(invalidTypeFile)
    
    if (validValidation.valid && !oversizedValidation.valid && !invalidTypeValidation.valid) {
      addResult('File Validation', 'success', 'File validation working correctly')
    } else {
      addResult('File Validation', 'error', 'File validation not working as expected')
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🧪 Settings API Integration Test</h1>
          <p className="text-muted-foreground">
            Test the settings API integration with the production backend
          </p>
        </div>

        {/* Current Auth State */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Authenticated:</strong> 
                <Badge variant={isAuthenticated ? "default" : "secondary"} className="ml-2">
                  {isAuthenticated ? "YES" : "NO"}
                </Badge>
              </div>
              <div>
                <strong>User:</strong> {user?.email || "None"}
              </div>
              <div>
                <strong>Backend URL:</strong> 
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  https://analytics-following-backend-5qfwj.ondigitalocean.app
                </code>
              </div>
              <div>
                <strong>User ID:</strong> {user?.id || "None"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={runAllTests} 
                disabled={testing || !isAuthenticated}
                className="flex-1"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run All Settings Tests"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTestResults([])}
                disabled={testing}
              >
                Clear Results
              </Button>
            </div>
            {!isAuthenticated && (
              <p className="text-orange-600 text-sm mt-2">
                ⚠️ You need to be logged in to run these tests. Please log in first.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results ({testResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tests run yet. Click "Run All Settings Tests" to begin.
              </p>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {result.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                        {result.status === 'pending' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                        
                        <Badge variant={
                          result.status === 'success' ? 'default' : 
                          result.status === 'error' ? 'destructive' : 'secondary'
                        }>
                          {result.status.toUpperCase()}
                        </Badge>
                        
                        <span className="font-medium">{result.test}</span>
                        
                        {result.timing && (
                          <Badge variant="outline">{result.timing}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                    
                    {result.data && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground">View Response Data</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}