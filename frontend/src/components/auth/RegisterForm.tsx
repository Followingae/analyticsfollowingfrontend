'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { toast } from 'sonner'
import { Instagram, BarChart3, Users, TrendingUp, CheckCircle2 } from 'lucide-react'

export default function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    
    try {
      const success = await register(email, password, fullName)
      if (success) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Registration error:', error)
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
              Start Your Analytics Journey
            </h2>
            <p className="text-muted-foreground">
              Join thousands of brands analyzing Instagram creators
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <span>Free account with 10 searches/month</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Instagram className="h-4 w-4 text-primary" />
              </div>
              <span>Comprehensive creator profiles</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <span>Advanced analytics dashboard</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span>Real-time engagement tracking</span>
            </div>
          </div>
          
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground text-center">
              "Analytics Following helped us discover high-performing creators and 
              increased our campaign ROI by 150%"
            </p>
            <p className="text-xs font-medium text-center mt-2">
              — Marketing Director, Fashion Brand
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex items-center justify-center px-8 lg:px-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to create your Analytics Following account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  required
                  className="transition-all"
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={6}
                  className="transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="transition-all"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Account
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
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
            
            <div className="mt-4 text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="hover:underline text-primary">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="hover:underline text-primary">Privacy Policy</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}