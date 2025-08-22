'use client'

import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Home, LogOut, Shield } from 'lucide-react'

export function UnauthorizedAccess() {
  const { user, logout } = useEnhancedAuth()

  const handleGoHome = () => {
    if (user?.role?.startsWith('brand_')) {
      window.location.href = '/dashboard'
    } else {
      window.location.href = '/auth/login'
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-destructive">
            <Shield className="w-5 h-5" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {user && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Logged in as:</p>
                <p className="font-medium">{user.email}</p>
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge variant="outline">
                  {user.role?.replace('_', ' ').replace('brand ', '') || 'Unknown'}
                </Badge>
              </div>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              The page you're trying to access requires different permissions.
            </p>
            <p className="text-xs text-muted-foreground">
              If you believe this is an error, please contact your administrator.
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleGoHome} 
              className="w-full"
              variant="default"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}