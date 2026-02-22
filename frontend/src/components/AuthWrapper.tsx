"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { Button } from '@/components/ui/button'
import { AlertCircle, LogOut } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface AuthWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { user, isLoading, logout } = useEnhancedAuth()
  const router = useRouter()
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    // Check if we have a token in localStorage (check both new and legacy keys)
    const authTokens = localStorage.getItem('auth_tokens')
    const legacyToken = localStorage.getItem('access_token')
    const hasToken = !!(authTokens && authTokens !== 'null') || !!(legacyToken && legacyToken !== 'null')

    if (!isLoading && !user && !hasToken) {
      setAuthError(true)
    } else {
      setAuthError(false)
    }
  }, [user, isLoading])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show authentication error with clear logout option
  if (authError || (!user && !localStorage.getItem('auth_tokens') && !localStorage.getItem('access_token'))) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Your session has expired or you are not logged in. Please log in to continue.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                // Clear any stale tokens (both new and legacy keys)
                localStorage.removeItem('auth_tokens')
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                localStorage.removeItem('user_data')
                router.push('/auth/login')
              }}
              className="w-full"
            >
              Go to Login
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                logout()
                router.push('/auth/login')
              }}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Clear Session & Login
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Having trouble? Try clearing your browser cache or contact support.
          </div>
        </div>
      </div>
    )
  }

  // User is authenticated, render children
  return <>{children}</>
}

// HOC for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthWrapper>
        <Component {...props} />
      </AuthWrapper>
    )
  }
}