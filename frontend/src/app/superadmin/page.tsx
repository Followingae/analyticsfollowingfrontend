"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { AuthGuard } from "@/components/AuthGuard"
import { superadminApiService, SystemStats, SystemHealth, PlatformAnalytics, UserManagement, SecurityAlert, SuspiciousActivity } from "@/services/superadminApi"
import {
  Users,
  Activity,
  Shield,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Database,
  Globe,
  Zap,
  Settings,
  BarChart3,
  DollarSign,
  Eye,
  MoreHorizontal,
  UserPlus,
  Ban,
  Search,
  Filter,
  Download,
  RefreshCw,
  Bell,
  Lock,
  Unlock,
  Mail,
  MessageSquare,
  FileText,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Progress,
} from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function SuperadminPage() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null)
  const [users, setUsers] = useState<UserManagement[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("overview")
  
  // User management filters
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userStatusFilter, setUserStatusFilter] = useState("all")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  
  // Dialogs
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null)
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState({
    title: '',
    content: '',
    message_type: 'info' as 'info' | 'warning' | 'maintenance' | 'feature',
    require_acknowledgment: false
  })

  const router = useRouter()

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsResult, healthResult, analyticsResult, dashboardResult] = await Promise.all([
        superadminApiService.getSystemStats(),
        superadminApiService.getSystemHealth(),
        superadminApiService.getPlatformAnalytics(),
        superadminApiService.getDashboard()
      ])

      if (statsResult.success && statsResult.data) {
        setSystemStats(statsResult.data)
      }

      if (healthResult.success && healthResult.data) {
        setSystemHealth(healthResult.data)
      }

      if (analyticsResult.success && analyticsResult.data) {
        setPlatformAnalytics(analyticsResult.data)
      }

      if (dashboardResult.success && dashboardResult.data) {
        setSecurityAlerts(dashboardResult.data.alerts || [])
      }
    } catch (error) {
      setError('Network error while loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Load users
  const loadUsers = async () => {
    try {
      const filters: any = {}
      if (userStatusFilter !== "all") filters.account_status = userStatusFilter
      if (userTypeFilter !== "all") filters.user_type = userTypeFilter
      if (userSearchQuery.trim()) filters.search_query = userSearchQuery.trim()
      
      const result = await superadminApiService.getUsers({ ...filters, limit: 50 })
      if (result.success && result.data) {
        setUsers(result.data.users || [])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  // Load security data
  const loadSecurityData = async () => {
    try {
      const [alertsResult, activitiesResult] = await Promise.all([
        superadminApiService.getSecurityAlerts({ limit: 10 }),
        superadminApiService.getSuspiciousActivities({ limit: 10 })
      ])

      if (alertsResult.success && alertsResult.data) {
        setSecurityAlerts(alertsResult.data.alerts || [])
      }

      if (activitiesResult.success && activitiesResult.data) {
        setSuspiciousActivities(activitiesResult.data.activities || [])
      }
    } catch (error) {
      console.error('Failed to load security data:', error)
    }
  }

  useEffect(() => {
    loadDashboardData()
    loadUsers()
    loadSecurityData()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [userSearchQuery, userStatusFilter, userTypeFilter])

  // Update user status
  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'deactivated', reason?: string) => {
    try {
      const result = await superadminApiService.updateUserStatus(userId, status, reason)
      if (result.success) {
        await loadUsers() // Refresh users
        toast.success(`User status updated to ${status}`)
        setIsUserDetailsOpen(false)
      } else {
        toast.error(result.error || 'Failed to update user status')
      }
    } catch (error) {
      toast.error('Network error while updating user status')
    }
  }

  // Broadcast system message
  const handleBroadcastMessage = async () => {
    if (!broadcastMessage.title.trim() || !broadcastMessage.content.trim()) {
      toast.error("Please fill in title and content")
      return
    }

    try {
      const result = await superadminApiService.broadcastSystemMessage(broadcastMessage)
      if (result.success) {
        toast.success("System message broadcasted successfully")
        setIsBroadcastOpen(false)
        setBroadcastMessage({
          title: '',
          content: '',
          message_type: 'info',
          require_acknowledgment: false
        })
      } else {
        toast.error(result.error || 'Failed to broadcast message')
      }
    } catch (error) {
      toast.error('Network error while broadcasting message')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'deactivated': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      case 'critical': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    const formattedAmount = new Intl.NumberFormat('ar-AE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return (
      <>
        <span className="aed-currency">AED</span> {formattedAmount}
      </>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading superadmin dashboard...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button variant="outline" onClick={() => loadDashboardData()}>
                  Try Again
                </Button>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Superadmin Dashboard</h1>
                  <p className="text-muted-foreground">System management and platform oversight</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => loadDashboardData()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                    <DialogTrigger asChild>
                      <Button style={{ backgroundColor: '#5100f3', color: 'white' }} className="hover:opacity-90">
                        <Bell className="h-4 w-4 mr-2" />
                        Broadcast Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Broadcast System Message</DialogTitle>
                        <DialogDescription>
                          Send a system-wide message to all users
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium">Message Type</label>
                          <Select value={broadcastMessage.message_type} onValueChange={(value: any) => setBroadcastMessage(prev => ({ ...prev, message_type: value }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">Information</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="feature">New Feature</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Title</label>
                          <Input
                            placeholder="Message title"
                            value={broadcastMessage.title}
                            onChange={(e) => setBroadcastMessage(prev => ({ ...prev, title: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Content</label>
                          <Textarea
                            placeholder="Message content"
                            value={broadcastMessage.content}
                            onChange={(e) => setBroadcastMessage(prev => ({ ...prev, content: e.target.value }))}
                            className="mt-1"
                            rows={4}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="require-ack"
                            checked={broadcastMessage.require_acknowledgment}
                            onChange={(e) => setBroadcastMessage(prev => ({ ...prev, require_acknowledgment: e.target.checked }))}
                          />
                          <label htmlFor="require-ack" className="text-sm">Require user acknowledgment</label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleBroadcastMessage} style={{ backgroundColor: '#5100f3', color: 'white' }} className="hover:opacity-90">
                          <Bell className="h-4 w-4 mr-2" />
                          Broadcast
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">User Management</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="system">System Health</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* System Stats Cards */}
                  {systemStats && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatNumber(systemStats.total_users)}</div>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(systemStats.active_users_24h)} active (24h)
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatNumber(systemStats.active_campaigns)}</div>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(systemStats.total_campaigns)} total
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Credits in Circulation</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatNumber(systemStats.total_credits_in_circulation)}</div>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(systemStats.credits_spent_today)} spent today
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">System Health</CardTitle>
                          <Server className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{systemStats.system_health_score}/100</div>
                          <Progress value={systemStats.system_health_score} className="mt-2" />
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* System Health Overview */}
                  {systemHealth && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${
                              systemHealth.overall_status === 'healthy' ? 'bg-green-500' : 
                              systemHealth.overall_status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            System Components
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {systemHealth.components.slice(0, 5).map((component, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm">{component.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {component.response_time_ms}ms
                                  </span>
                                  <div className={`h-2 w-2 rounded-full ${
                                    component.status === 'operational' ? 'bg-green-500' : 
                                    component.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Security Alerts
                            {securityAlerts.length > 0 && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                {securityAlerts.length}
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {securityAlerts.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">No active alerts</p>
                            ) : (
                              securityAlerts.slice(0, 3).map((alert, index) => (
                                <div key={index} className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">{alert.alert_type}</p>
                                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                                  </div>
                                  <Badge className={
                                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                    alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }>
                                    {alert.severity}
                                  </Badge>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Platform Activity</CardTitle>
                      <CardDescription>Latest system events and user activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {systemStats && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span>New users today</span>
                              <span className="font-medium">{systemStats.new_registrations_today}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Active campaigns</span>
                              <span className="font-medium">{systemStats.active_campaigns}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Credits spent today</span>
                              <span className="font-medium">{formatNumber(systemStats.credits_spent_today)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* User Management Tab */}
                <TabsContent value="users" className="space-y-6">
                  {/* User Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search users..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="w-[250px] pl-10"
                        />
                      </div>
                      
                      <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="deactivated">Deactivated</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Superadmin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Users Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Manage platform users and their access</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">{user.full_name || user.username}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {user.user_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(user.account_status)}>
                                  {user.account_status}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatNumber(user.credits_balance)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(user.last_login)}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedUser(user)
                                      setIsUserDetailsOpen(true)
                                    }}>
                                      <Eye className="h-3 w-3 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleUpdateUserStatus(user.id, 
                                        user.account_status === 'active' ? 'suspended' : 'active'
                                      )}
                                    >
                                      {user.account_status === 'active' ? (
                                        <>
                                          <Ban className="h-3 w-3 mr-2" />
                                          Suspend User
                                        </>
                                      ) : (
                                        <>
                                          <Unlock className="h-3 w-3 mr-2" />
                                          Activate User
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {users.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Users className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No users found</h3>
                          <p className="text-muted-foreground text-center">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Security Alerts */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Security Alerts</CardTitle>
                        <CardDescription>Active security alerts and threats</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {securityAlerts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No active security alerts</p>
                          ) : (
                            securityAlerts.map((alert, index) => (
                              <div key={index} className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium">{alert.alert_type}</h4>
                                  <Badge className={
                                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                    alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }>
                                    {alert.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(alert.created_at)}
                                  </span>
                                  <Button size="sm" variant="outline">
                                    Investigate
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Suspicious Activities */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Suspicious Activities</CardTitle>
                        <CardDescription>Recent suspicious user activities</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {suspiciousActivities.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No suspicious activities detected</p>
                          ) : (
                            suspiciousActivities.map((activity, index) => (
                              <div key={index} className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium">{activity.activity_type}</h4>
                                  <Badge className={
                                    activity.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                                    activity.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                                    activity.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }>
                                    {activity.risk_level}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(activity.detected_at)}
                                  </span>
                                  <Button size="sm" variant="outline">
                                    Review
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Platform Analytics</h3>
                    <p className="text-muted-foreground">
                      Detailed analytics and insights coming soon...
                    </p>
                  </div>
                </TabsContent>

                {/* System Health Tab */}
                <TabsContent value="system" className="space-y-6">
                  {systemHealth && (
                    <>
                      {/* System Overview */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardHeader>
                            <CardTitle>Overall Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className={`text-2xl font-bold ${getHealthStatusColor(systemHealth.overall_status)}`}>
                              {systemHealth.overall_status.toUpperCase()}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {systemHealth.uptime_percentage.toFixed(2)}% uptime
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Performance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Response Time</span>
                                <span>{systemHealth.performance_metrics.average_response_time}ms</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Peak Users</span>
                                <span>{formatNumber(systemHealth.performance_metrics.peak_concurrent_users)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Cache Hit Rate</span>
                                <span>{(systemHealth.performance_metrics.cache_hit_rate * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Resources</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>CPU Usage</span>
                                  <span>{systemHealth.resource_usage.cpu_usage_percentage}%</span>
                                </div>
                                <Progress value={systemHealth.resource_usage.cpu_usage_percentage} />
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Memory Usage</span>
                                  <span>{systemHealth.resource_usage.memory_usage_percentage}%</span>
                                </div>
                                <Progress value={systemHealth.resource_usage.memory_usage_percentage} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Component Status */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Component Status</CardTitle>
                          <CardDescription>Status of all system components</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {systemHealth.components.map((component, index) => (
                              <div key={index} className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{component.name}</h4>
                                  <div className={`h-2 w-2 rounded-full ${
                                    component.status === 'operational' ? 'bg-green-500' : 
                                    component.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>Response Time</span>
                                    <span>{component.response_time_ms}ms</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Error Rate</span>
                                    <span>{(component.error_rate * 100).toFixed(2)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Last Check</span>
                                    <span>{new Date(component.last_check).toLocaleTimeString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </Tabs>

              {/* User Details Dialog */}
              <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                    <DialogDescription>
                      {selectedUser?.full_name || selectedUser?.username} - {selectedUser?.email}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedUser && (
                    <div className="space-y-6 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Account Information</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">User Type:</span> {selectedUser.user_type}</div>
                            <div><span className="font-medium">Status:</span> 
                              <Badge className={`ml-2 ${getStatusColor(selectedUser.account_status)}`}>
                                {selectedUser.account_status}
                              </Badge>
                            </div>
                            <div><span className="font-medium">Subscription:</span> {selectedUser.subscription_tier}</div>
                            <div><span className="font-medium">Credits:</span> {formatNumber(selectedUser.credits_balance)}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Activity</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Registered:</span> {formatDate(selectedUser.registration_date)}</div>
                            <div><span className="font-medium">Last Login:</span> {formatDate(selectedUser.last_login)}</div>
                            <div><span className="font-medium">Campaigns:</span> {selectedUser.total_campaigns}</div>
                            <div><span className="font-medium">Lists:</span> {selectedUser.total_lists}</div>
                          </div>
                        </div>
                      </div>

                      {selectedUser.activity_metrics && (
                        <div>
                          <h4 className="font-medium mb-2">Usage Statistics</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-medium">{selectedUser.activity_metrics.campaigns_created}</div>
                              <div className="text-muted-foreground">Campaigns Created</div>
                            </div>
                            <div>
                              <div className="font-medium">{selectedUser.activity_metrics.lists_created}</div>
                              <div className="text-muted-foreground">Lists Created</div>
                            </div>
                            <div>
                              <div className="font-medium">{formatNumber(selectedUser.activity_metrics.credits_spent_this_month)}</div>
                              <div className="text-muted-foreground">Credits This Month</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedUser.flags && selectedUser.flags.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Flags</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedUser.flags.map((flag, index) => (
                              <Badge key={index} variant="outline">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedUser.notes && (
                        <div>
                          <h4 className="font-medium mb-2">Admin Notes</h4>
                          <div className="bg-muted/50 p-3 rounded-lg text-sm">
                            {selectedUser.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsUserDetailsOpen(false)}>
                      Close
                    </Button>
                    {selectedUser && (
                      <Button 
                        onClick={() => handleUpdateUserStatus(
                          selectedUser.id, 
                          selectedUser.account_status === 'active' ? 'suspended' : 'active',
                          'Updated via admin dashboard'
                        )}
                        variant={selectedUser.account_status === 'active' ? 'destructive' : 'default'}
                      >
                        {selectedUser.account_status === 'active' ? 'Suspend User' : 'Activate User'}
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}