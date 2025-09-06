'use client'

import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Activity,
  AlertCircle,
  Plus,
  CreditCard,
  Eye
} from 'lucide-react'

export function AdminDashboard() {
  const { user, isSuperAdmin } = useEnhancedAuth()

  // Mock data - replace with real API calls
  const dashboardStats = {
    totalUsers: 1247,
    activeUsers: 892,
    monthlyRevenue: 45230,
    totalProposals: 156,
    pendingProposals: 23,
    systemHealth: 'Healthy',
    errorRate: 0.02
  }

  const recentActivities = [
    {
      id: 1,
      action: 'User Registration',
      user: 'john.doe@example.com',
      timestamp: '2 minutes ago',
      type: 'user'
    },
    {
      id: 2,
      action: 'Credit Purchase',
      user: 'brand@company.com',
      amount: '$99.00',
      timestamp: '15 minutes ago',
      type: 'financial'
    },
    {
      id: 3,
      action: 'Proposal Created',
      user: 'Admin User',
      target: 'TechCorp Ltd.',
      timestamp: '1 hour ago',
      type: 'proposal'
    },
    {
      id: 4,
      action: 'System Alert',
      message: 'High API usage detected',
      timestamp: '2 hours ago',
      type: 'system'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4" />
      case 'financial': return <DollarSign className="h-4 w-4" />
      case 'proposal': return <FileText className="h-4 w-4" />
      case 'system': return <AlertCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user': return 'text-blue-500'
      case 'financial': return 'text-green-500'
      case 'proposal': return 'text-purple-500'
      case 'system': return 'text-orange-500'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.full_name || 'Admin'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isSuperAdmin ? 'destructive' : 'secondary'}>
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.activeUsers} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardStats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalProposals}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.pendingProposals} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardStats.systemHealth}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.errorRate}% error rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create New User
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Adjust User Credits
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Create Proposal
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              View System Logs
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest platform activities and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`${getActivityColor(activity.type)} mt-1`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.action}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      {activity.user && <span>by {activity.user}</span>}
                      {activity.target && <span>for {activity.target}</span>}
                      {activity.amount && <span>{activity.amount}</span>}
                      {activity.message && <span>{activity.message}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts (if any) */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <span>System Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No active system alerts. All systems operating normally.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}