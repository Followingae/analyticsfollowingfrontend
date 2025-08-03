"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { authService } from "@/services/authService"
import { useAuth } from "@/contexts/AuthContext"

export default function AuthTestPage() {
  const [email, setEmail] = useState("testuser789@gmail.com")
  const [password, setPassword] = useState("TestPassword123")
  const [fullName, setFullName] = useState("Test User")
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const { user, isAuthenticated, login, register, logout } = useAuth()

  const addResult = (test: string, success: boolean, data: any, timing: number) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      data,
      timing: `${timing.toFixed(2)}s`,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testRegistration = async () => {
    setLoading(true)
    const startTime = Date.now()
    
    try {
      console.log("🧪 Testing registration with:", { email, password, fullName })
      const result = await authService.register({ email, password, full_name: fullName })
      const timing = (Date.now() - startTime) / 1000
      
      addResult("Registration", result.success, result, timing)
      
      if (result.success && result.data?.email_confirmation_required) {
        console.log("✅ Registration successful - email confirmation required")
      }
    } catch (error) {
      const timing = (Date.now() - startTime) / 1000
      addResult("Registration", false, { error: error instanceof Error ? error.message : 'Unknown error' }, timing)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    const startTime = Date.now()
    
    try {
      console.log("🧪 Testing login with:", { email, password })
      const result = await authService.login({ email, password })
      const timing = (Date.now() - startTime) / 1000
      
      addResult("Login", result.success, result, timing)
      
      if (!result.success && result.error?.includes('email')) {
        console.log("📧 Email confirmation required")
      }
    } catch (error) {
      const timing = (Date.now() - startTime) / 1000
      addResult("Login", false, { error: error instanceof Error ? error.message : 'Unknown error' }, timing)
    } finally {
      setLoading(false)
    }
  }

  const testContextRegister = async () => {
    setLoading(true)
    const startTime = Date.now()
    
    try {
      console.log("🧪 Testing context register with:", { email, password, fullName })
      const success = await register(email, password, fullName)
      const timing = (Date.now() - startTime) / 1000
      
      addResult("Context Register", success, { user }, timing)
    } catch (error) {
      const timing = (Date.now() - startTime) / 1000
      addResult("Context Register", false, { error: error instanceof Error ? error.message : 'Unknown error' }, timing)
    } finally {
      setLoading(false)
    }
  }

  const testContextLogin = async () => {
    setLoading(true)
    const startTime = Date.now()
    
    try {
      console.log("🧪 Testing context login with:", { email, password })
      const success = await login(email, password)
      const timing = (Date.now() - startTime) / 1000
      
      addResult("Context Login", success, { user, isAuthenticated }, timing)
    } catch (error) {
      const timing = (Date.now() - startTime) / 1000
      addResult("Context Login", false, { error: error instanceof Error ? error.message : 'Unknown error' }, timing)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧪 Authentication Flow Test</h1>
        <p className="text-muted-foreground">Test the new authentication system with email confirmation</p>
      </div>

      {/* Current Auth State */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Authentication State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Is Authenticated:</strong> 
              <Badge variant={isAuthenticated ? "default" : "secondary"} className="ml-2">
                {isAuthenticated ? "YES" : "NO"}
              </Badge>
            </div>
            <div>
              <strong>User:</strong> {user ? user.email : "None"}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id || "None"}
            </div>
            <div>
              <strong>Role:</strong> {user?.role || "None"}
            </div>
          </div>
          {isAuthenticated && (
            <Button onClick={logout} variant="outline" className="mt-4">
              Logout
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              type="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Direct API Tests</h3>
              <Button onClick={testRegistration} disabled={loading} className="w-full">
                Test Registration API
              </Button>
              <Button onClick={testLogin} disabled={loading} className="w-full">
                Test Login API
              </Button>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Context Tests</h3>
              <Button onClick={testContextRegister} disabled={loading} className="w-full">
                Test Context Register
              </Button>
              <Button onClick={testContextLogin} disabled={loading} className="w-full">
                Test Context Login
              </Button>
            </div>
          </div>
          <Button onClick={clearResults} variant="outline" className="w-full mt-4">
            Clear Results
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results ({testResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tests run yet</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "✅ PASS" : "❌ FAIL"}
                      </Badge>
                      <span className="font-medium">{result.test}</span>
                      <Badge variant="outline">{result.timing}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{result.timestamp}</span>
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground">View Details</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}