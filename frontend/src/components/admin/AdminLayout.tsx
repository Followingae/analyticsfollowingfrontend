'use client'

import { ReactNode } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { AdminView } from './SuperAdminInterface'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BarChart3,
  Users,
  DollarSign,
  FileText,
  Monitor,
  Database,
  TrendingUp,
  Settings,
  LogOut,
  Shield,
  ChevronDown,
  Activity
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
  currentView: AdminView
  onViewChange: (view: AdminView) => void
  limitedAccess?: boolean
}

export function AdminLayout({ 
  children, 
  currentView, 
  onViewChange, 
  limitedAccess = false 
}: AdminLayoutProps) {
  const { user, logout, isSuperAdmin, hasPermission } = useEnhancedAuth()

  const navigationItems = [
    {
      id: 'dashboard' as AdminView,
      label: 'Dashboard',
      icon: BarChart3,
      available: true
    },
    {
      id: 'users' as AdminView,
      label: 'User Management',
      icon: Users,
      available: hasPermission('can_view_all_users')
    },
    {
      id: 'finance' as AdminView,
      label: 'Financial Management',
      icon: DollarSign,
      available: isSuperAdmin && hasPermission('can_view_all_transactions')
    },
    {
      id: 'proposals' as AdminView,
      label: 'Proposal Management',
      icon: FileText,
      available: hasPermission('can_view_all_proposals')
    },
    {
      id: 'system' as AdminView,
      label: 'System Monitoring',
      icon: Monitor,
      available: isSuperAdmin && hasPermission('can_view_system_logs')
    },
    {
      id: 'influencers' as AdminView,
      label: 'Influencer Database',
      icon: Database,
      available: isSuperAdmin && hasPermission('can_view_all_profiles')
    },
    {
      id: 'analytics' as AdminView,
      label: 'Platform Analytics',
      icon: TrendingUp,
      available: isSuperAdmin
    },
    {
      id: 'settings' as AdminView,
      label: 'System Settings',
      icon: Settings,
      available: isSuperAdmin && hasPermission('can_configure_system')
    }
  ]

  const availableItems = navigationItems.filter(item => item.available)

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Analytics Following</span>
              <Badge variant="destructive" className="text-xs">
                {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
              </Badge>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            {/* System Status */}
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">System Online</span>
            </div>

            {/* Admin User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile_picture_url} />
                    <AvatarFallback>
                      {user?.full_name?.split(' ').map(n => n[0]).join('') || 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{user?.full_name || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                  Switch to Brand View
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {availableItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
          </nav>

          {limitedAccess && (
            <>
              <Separator className="mx-4" />
              <div className="p-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Limited Access</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Some features are restricted for your admin role. Contact a super admin for full access.
                  </p>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}