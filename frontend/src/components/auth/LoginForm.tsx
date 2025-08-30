'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { toast } from 'sonner'
import { Instagram, BarChart3, Users, TrendingUp, Settings } from 'lucide-react'
import ConnectivityTest from '@/components/ConnectivityTest'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showConnectivityTest, setShowConnectivityTest] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { login } = useEnhancedAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setErrorMessage('') // Clear any previous errors
    
    try {
      const success = await login(email, password)
      console.log('🔐 LoginForm: Login attempt result:', success)
      if (success) {
        console.log('🔐 LoginForm: Login successful, redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        console.log('🔐 LoginForm: Login failed')
        setErrorMessage('Login failed. Please check your credentials and try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container grid min-h-screen w-full lg:grid-cols-2">
      {/* Left side - Hero section */}
      <div className="flex flex-col justify-center px-8 lg:px-12 bg-muted/50">
        <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <BarChart3 className="h-8 w-8" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Analytics Following
              </h1>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              Instagram Analytics Platform
            </h2>
            <p className="text-muted-foreground">
              Professional creator analytics with AI-powered insights
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Instagram className="h-4 w-4 text-primary" />
              </div>
              <span>Real-time Instagram analytics</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <span>Creator discovery & management</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span>Advanced engagement tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex items-center justify-center px-8 lg:px-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="transition-all"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="transition-all"
                />
              </div>
              
              {/* Error Message Display */}
              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign In
              </Button>
            </form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full" disabled>
              <Instagram className="mr-2 h-4 w-4" />
              Instagram (Coming Soon)
            </Button>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
            
            <div className="mt-4 text-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowConnectivityTest(!showConnectivityTest)}
                className="text-xs"
              >
                <Settings className="mr-2 h-3 w-3" />
                {showConnectivityTest ? 'Hide' : 'Show'} Connection Diagnostics
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {showConnectivityTest && (
          <div className="mt-6">
            <ConnectivityTest />
          </div>
        )}
      </div>
    </div>
  )
}