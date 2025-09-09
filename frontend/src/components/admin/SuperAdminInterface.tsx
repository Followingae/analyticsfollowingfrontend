'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { 
  superadminApiService, 
  DashboardOverview,
  UserManagement,
  CreditOverview,
  Transaction,
  Influencer,
  Proposal,
  SecurityAlert,
  RealtimeAnalytics,
  SystemHealth
} from "@/services/superadminApi"

import {
  Users,
  Activity,
  Shield,
  UserX,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
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
  CreditCard,
  Wallet,
  Calendar,
  Clock,
  Star,
  Verified,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Edit3,
  Trash2,
  AlertCircle,
  Info,
  CheckCheck
} from "lucide-react"

import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function SuperAdminInterface() {
  // State Management
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeAnalytics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [users, setUsers] = useState<UserManagement[]>([])
  const [creditOverview, setCreditOverview] = useState<CreditOverview | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("overview")
  
  // Filters and Search
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userStatusFilter, setUserStatusFilter] = useState("all")
  const [userRoleFilter, setUserRoleFilter] = useState("all")
  const [transactionSearch, setTransactionSearch] = useState("")
  const [influencerSearch, setInfluencerSearch] = useState("")
  const [proposalStatusFilter, setProposalStatusFilter] = useState("all")
  
  // Dialogs and Modals
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null)
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isCreditAdjustOpen, setIsCreditAdjustOpen] = useState(false)
  const [isInfluencerDetailsOpen, setIsInfluencerDetailsOpen] = useState(false)
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  
  // Form States
  const [broadcastMessage, setBroadcastMessage] = useState({
    title: '',
    content: '',
    message_type: 'info' as 'info' | 'warning' | 'maintenance' | 'feature',
    require_acknowledgment: false
  })
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'user',
    status: 'active',
    initial_credits: 100
  })
  const [creditAdjustment, setCreditAdjustment] = useState({
    operation: 'add' as 'add' | 'deduct',
    amount: 0,
    reason: '',
    transaction_type: 'admin_adjustment'
  })

  const router = useRouter()

  // Load dashboard data
  const loadDashboardData = async () => {
    console.log('🔧 SUPERADMIN: Loading dashboard data...')
    setLoading(true)
    setError(null)
    try {
      const [dashboardResult, realtimeResult, healthResult] = await Promise.all([
        superadminApiService.getDashboard().catch(() => ({ success: false, error: 'Dashboard API unavailable' })),
        superadminApiService.getRealtimeAnalytics().catch(() => ({ success: false, error: 'Realtime API unavailable' })),
        superadminApiService.getSystemHealth().catch(() => ({ success: false, error: 'Health API unavailable' }))
      ])

      if (dashboardResult.success && dashboardResult.data) {
        setDashboardData(dashboardResult.data)
      } else {
        console.warn('Dashboard API not available:', dashboardResult.error)
      }
      
      if (realtimeResult.success && realtimeResult.data) {
        setRealtimeData(realtimeResult.data)
      } else {
        console.warn('Realtime API not available:', realtimeResult.error)
      }
      
      if (healthResult.success && healthResult.data) {
        setSystemHealth(healthResult.data)
      } else {
        console.warn('Health API not available:', healthResult.error)
      }
    } catch (error) {
      console.warn('SuperAdmin APIs not available - this is expected if backend is not running superadmin endpoints')
    } finally {
      setLoading(false)
    }
  }

  // Load users with filters
  const loadUsers = async () => {
    try {
      const filters: any = {}
      if (userStatusFilter !== "all") filters.status_filter = userStatusFilter
      if (userRoleFilter !== "all") filters.role_filter = userRoleFilter
      if (userSearchQuery.trim()) filters.search = userSearchQuery.trim()
      filters.limit = 50
      
      const result = await superadminApiService.getUsers(filters)
      if (result.success && result.data) {
        setUsers(result.data.users || [])
      } else {
        console.warn('Users API not available - superadmin endpoints not implemented')
        setUsers([])
      }
    } catch (error) {
      console.warn('Users API not available - superadmin endpoints not implemented')
      setUsers([])
    }
  }

  // Load credit overview
  const loadCreditData = async () => {
    try {
      const [creditResult, transactionResult] = await Promise.all([
        superadminApiService.getCreditOverview(),
        superadminApiService.getTransactions({ limit: 100 })
      ])
      
      if (creditResult.success && creditResult.data) {
        setCreditOverview(creditResult.data)
      }
      if (transactionResult.success && transactionResult.data) {
        setTransactions(transactionResult.data.transactions || [])
      }
    } catch (error) {
      console.error('Error loading credit data:', error)
    }
  }

  // Load influencer data
  const loadInfluencers = async () => {
    try {
      const filters: any = { limit: 50, sort_by: 'followers_count', sort_order: 'desc' }
      if (influencerSearch.trim()) filters.search = influencerSearch.trim()
      
      const result = await superadminApiService.getInfluencers(filters)
      if (result.success && result.data) {
        setInfluencers(result.data.influencers || [])
      }
    } catch (error) {
      console.error('Error loading influencers:', error)
    }
  }

  // Load proposals
  const loadProposals = async () => {
    try {
      const filters: any = { limit: 50 }
      if (proposalStatusFilter !== "all") filters.status_filter = proposalStatusFilter
      
      const result = await superadminApiService.getProposals(filters)
      if (result.success && result.data) {
        setProposals(result.data.proposals || [])
      }
    } catch (error) {
      console.error('Error loading proposals:', error)
    }
  }

  // Load security alerts
  const loadSecurityData = async () => {
    try {
      const result = await superadminApiService.getSecurityAlerts({ limit: 20 })
      if (result.success && result.data) {
        setSecurityAlerts(result.data.alerts || [])
      }
    } catch (error) {
      console.error('Error loading security data:', error)
    }
  }

  useEffect(() => {
    loadDashboardData()
    if (currentTab === 'users') {
      loadUsers()
    } else if (currentTab === 'credits') {
      loadCreditData()
    } else if (currentTab === 'influencers') {
      loadInfluencers()
    } else if (currentTab === 'proposals') {
      loadProposals()
    } else if (currentTab === 'security') {
      loadSecurityData()
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [userSearchQuery, userStatusFilter, userRoleFilter])

  useEffect(() => {
    loadInfluencers()
  }, [influencerSearch])

  useEffect(() => {
    loadProposals()
  }, [proposalStatusFilter])

  // Load data when switching tabs
  useEffect(() => {
    if (currentTab === 'users') {
      loadUsers()
    } else if (currentTab === 'credits') {
      loadCreditData()
    } else if (currentTab === 'influencers') {
      loadInfluencers()
    } else if (currentTab === 'proposals') {
      loadProposals()
    } else if (currentTab === 'security') {
      loadSecurityData()
    }
  }, [currentTab])

  // Utility functions
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  // Action handlers
  const handleCreateUser = async () => {
    try {
      const result = await superadminApiService.createUser(newUser)
      if (result.success) {
        toast.success("User created successfully")
        setIsCreateUserOpen(false)
        setNewUser({ email: '', full_name: '', role: 'user', status: 'active', initial_credits: 100 })
        loadUsers()
      } else {
        toast.error(result.error || 'Failed to create user')
      }
    } catch (error) {
      toast.error('Network error while creating user')
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    
    try {
      const result = await superadminApiService.editUser(selectedUser.id, {
        email: selectedUser.email,
        full_name: selectedUser.full_name,
        role: selectedUser.role,
        status: selectedUser.status
      })
      if (result.success) {
        toast.success("User updated successfully")
        setIsEditUserOpen(false)
        loadUsers()
      } else {
        toast.error(result.error || 'Failed to update user')
      }
    } catch (error) {
      toast.error('Network error while updating user')
    }
  }

  const handleDeleteUser = async (userId: string, permanent = false) => {
    try {
      const result = await superadminApiService.deleteUser(userId, permanent)
      if (result.success) {
        toast.success(permanent ? "User permanently deleted" : "User deactivated")
        loadUsers()
      } else {
        toast.error(result.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('Network error while deleting user')
    }
  }

  const handleCreditAdjustment = async () => {
    if (!selectedUser) return
    
    try {
      const result = await superadminApiService.adjustUserCredits(selectedUser.id, creditAdjustment)
      if (result.success) {
        toast.success(`Successfully ${creditAdjustment.operation === 'add' ? 'added' : 'deducted'} ${creditAdjustment.amount} credits`)
        setIsCreditAdjustOpen(false)
        setCreditAdjustment({ operation: 'add', amount: 0, reason: '', transaction_type: 'admin_adjustment' })
        loadUsers()
        loadCreditData()
      } else {
        toast.error(result.error || 'Failed to adjust credits')
      }
    } catch (error) {
      toast.error('Network error while adjusting credits')
    }
  }

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

  const handleUpdateProposalStatus = async (proposalId: string, newStatus: string) => {
    try {
      const result = await superadminApiService.updateProposalStatus(proposalId, newStatus, `Status updated by admin`)
      if (result.success) {
        toast.success(`Proposal status updated to ${newStatus}`)
        loadProposals()
      } else {
        toast.error(result.error || 'Failed to update proposal status')
      }
    } catch (error) {
      toast.error('Network error while updating proposal')
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <SuperadminSidebar variant="inset" />
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
    )
  }

  if (error) {
    return (
      <SidebarProvider>
        <SuperadminSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button className="mt-4" variant="outline" onClick={() => loadDashboardData()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 66)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SuperadminSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
                <p className="text-muted-foreground">Comprehensive platform management and oversight</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => loadDashboardData()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
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
                        <Switch 
                          id="require-ack"
                          checked={broadcastMessage.require_acknowledgment}
                          onCheckedChange={(checked) => setBroadcastMessage(prev => ({ ...prev, require_acknowledgment: checked }))}
                        />
                        <label htmlFor="require-ack" className="text-sm">Require user acknowledgment</label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBroadcastMessage} className="bg-primary hover:bg-primary/90">
                        <Bell className="h-4 w-4 mr-2" />
                        Broadcast
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="credits">Credits</TabsTrigger>
                <TabsTrigger value="influencers">Influencers</TabsTrigger>
                <TabsTrigger value="proposals">Proposals</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Key Metrics Cards */}
                {dashboardData && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(dashboardData.user_metrics.total_users)}</div>
                        <p className="text-xs text-muted-foreground">
                          +{dashboardData.user_metrics.new_today} today
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(dashboardData.revenue_metrics.total_revenue)}</div>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(dashboardData.revenue_metrics.monthly_revenue)} this month
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profile Accesses</CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(dashboardData.activity_metrics.total_accesses)}</div>
                        <p className="text-xs text-muted-foreground">
                          +{dashboardData.activity_metrics.accesses_today} today
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Server className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          <Badge className={dashboardData.system_health.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {dashboardData.system_health.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardData.system_health.uptime_hours.toFixed(1)}h uptime
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Real-time Analytics */}
                {realtimeData && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Live Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Online Users</span>
                            <Badge variant="secondary">{realtimeData.online_users}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Active Sessions</span>
                            <Badge variant="secondary">{realtimeData.active_sessions}</Badge>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>CPU Usage</span>
                              <span>{realtimeData.system_load.cpu_percent}%</span>
                            </div>
                            <Progress value={realtimeData.system_load.cpu_percent} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Credit Flows
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-red-600 flex items-center gap-1">
                              <ArrowDownRight className="h-3 w-3" />
                              Spent (1h)
                            </span>
                            <span className="font-medium">{formatNumber(realtimeData.credit_flows.spent_last_hour)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <ArrowUpRight className="h-3 w-3" />
                              Earned (1h)
                            </span>
                            <span className="font-medium">{formatNumber(realtimeData.credit_flows.earned_last_hour)}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Net Flow</span>
                            <Badge className={realtimeData.credit_flows.net_flow >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {realtimeData.credit_flows.net_flow >= 0 ? '+' : ''}{formatNumber(realtimeData.credit_flows.net_flow)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Security Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {securityAlerts.length === 0 ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">All systems secure</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {securityAlerts.slice(0, 3).map((alert, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span className="text-sm">{alert.title}</span>
                                  <Badge className={getPriorityColor(alert.severity)}>
                                    {alert.severity}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Recent Activity */}
                {dashboardData && dashboardData.recent_activities && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Platform Activity</CardTitle>
                      <CardDescription>Latest user activities and system events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.recent_activities.slice(0, 5).map((activity, index) => (
                          <div key={index} className="flex items-center justify-between border-b border-border/50 pb-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{activity.user.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{activity.user}</p>
                                <p className="text-xs text-muted-foreground">{activity.action} {activity.target && `• ${activity.target}`}</p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(activity.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* User Management Tab */}
              <TabsContent value="users" className="space-y-6">
                {/* User Management Controls */}
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
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="team_member">Team Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>Add a new user to the platform</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            placeholder="user@email.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Full Name</label>
                          <Input
                            placeholder="Full Name"
                            value={newUser.full_name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Role</label>
                          <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="team_member">Team Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Initial Credits</label>
                          <Input
                            type="number"
                            placeholder="100"
                            value={newUser.initial_credits}
                            onChange={(e) => setNewUser(prev => ({ ...prev, initial_credits: parseInt(e.target.value) || 0 }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateUser} className="bg-primary hover:bg-primary/90">
                          Create User
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Users Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage platform users and their access permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Activity</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.full_name || user.email}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {user.role.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(user.status)}>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{formatNumber(user.credits.balance)}</span>
                                <span className="text-xs text-muted-foreground">
                                  Spent: {formatNumber(user.credits.spent)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{user.recent_activity}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(user.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user)
                                    setIsUserDetailsOpen(true)
                                  }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user)
                                    setIsEditUserOpen(true)
                                  }}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user)
                                    setIsCreditAdjustOpen(true)
                                  }}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Adjust Credits
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteUser(user.id, false)}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {users.length === 0 && (
                      <div className="py-12 text-center">
                        <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No users found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search or filter criteria to find users.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Credits Tab */}
              <TabsContent value="credits" className="space-y-6">
                {/* Credit Overview Cards */}
                {creditOverview && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(creditOverview.overview.total_credits_in_system)}</div>
                        <p className="text-xs text-muted-foreground">
                          System circulation
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(creditOverview.overview.total_spent_all_time)}</div>
                        <p className="text-xs text-muted-foreground">
                          All-time spending
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(creditOverview.overview.total_earned_all_time)}</div>
                        <p className="text-xs text-muted-foreground">
                          All-time earnings
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(creditOverview.overview.active_wallets)}</div>
                        <p className="text-xs text-muted-foreground">
                          Users with credits
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Top Spenders & System Health */}
                {creditOverview && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Spenders</CardTitle>
                        <CardDescription>Users with highest credit spending</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {creditOverview.top_spenders.slice(0, 5).map((spender, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{spender.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm">{spender.full_name}</div>
                                  <div className="text-xs text-muted-foreground">{spender.email}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-sm">{formatNumber(spender.total_spent)} spent</div>
                                <div className="text-xs text-muted-foreground">{formatNumber(spender.current_balance)} balance</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Credit System Health</CardTitle>
                        <CardDescription>Overall system credit flow metrics</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Credit Flow Ratio</span>
                            <Badge variant="secondary">{creditOverview.system_health.credit_flow_ratio.toFixed(1)}%</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Average Wallet Balance</span>
                            <span className="font-medium">{formatNumber(creditOverview.system_health.average_wallet_balance)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Recent Transactions (24h)</span>
                            <Badge variant="secondary">{creditOverview.overview.recent_transactions_24h}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest credit transactions across the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 10).map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">{transaction.user.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm">{transaction.user.full_name}</div>
                                  <div className="text-xs text-muted-foreground">{transaction.user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {transaction.type.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                {transaction.amount > 0 ? '+' : ''}{formatNumber(transaction.amount)}
                              </span>
                            </TableCell>
                            <TableCell>{formatNumber(transaction.current_balance)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(transaction.timestamp)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Influencers Tab */}
              <TabsContent value="influencers" className="space-y-6">
                {/* Influencer Search */}
                <div className="flex items-center justify-between">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search influencers..."
                      value={influencerSearch}
                      onChange={(e) => setInfluencerSearch(e.target.value)}
                      className="w-[300px] pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Advanced Filters
                    </Button>
                  </div>
                </div>

                {/* Influencers Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {influencers.map((influencer) => (
                    <Card key={influencer.id} className="hover:shadow-md transition-shadow cursor-pointer" 
                          onClick={() => {
                            setSelectedInfluencer(influencer)
                            setIsInfluencerDetailsOpen(true)
                          }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={influencer.profile_image_url} />
                            <AvatarFallback>{influencer.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <h3 className="font-semibold text-sm truncate">{influencer.full_name}</h3>
                              {influencer.is_verified && <Verified className="h-4 w-4 text-blue-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground">@{influencer.username}</p>
                          </div>
                          <Badge className={influencer.is_private ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            {influencer.is_private ? 'Private' : 'Public'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Followers</span>
                            <span className="font-medium">{formatNumber(influencer.followers_count)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Posts</span>
                            <span className="font-medium">{formatNumber(influencer.posts_count)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Engagement</span>
                            <Badge variant="secondary">{influencer.analytics.engagement_rate.toFixed(1)}%</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Category</span>
                            <Badge variant="outline" className="text-xs">
                              {influencer.analytics.ai_analysis.primary_content_type}
                            </Badge>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Revenue Generated</span>
                            <span className="font-medium text-green-600">{formatCurrency(influencer.platform_metrics.revenue_generated)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Proposals Tab */}
              <TabsContent value="proposals" className="space-y-6">
                {/* Proposal Filters */}
                <div className="flex items-center justify-between">
                  <Select value={proposalStatusFilter} onValueChange={setProposalStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Proposals</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Proposals Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Proposal Management</CardTitle>
                    <CardDescription>Review and manage campaign proposals from brands</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Timeline</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proposals.map((proposal) => (
                          <TableRow key={proposal.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{proposal.title}</div>
                                <div className="text-sm text-muted-foreground capitalize">{proposal.campaign_type.replace('_', ' ')}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{proposal.brand_name}</div>
                                <div className="text-sm text-muted-foreground">{proposal.brand_contact_email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(proposal.budget)}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(proposal.status)}>
                                {proposal.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(proposal.priority)}>
                                {proposal.priority}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>{formatDate(proposal.timeline.start_date)}</div>
                              <div className="text-muted-foreground">to {formatDate(proposal.timeline.end_date)}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleUpdateProposalStatus(proposal.id, 'approved')}>
                                    <CheckCheck className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateProposalStatus(proposal.id, 'rejected')}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {proposals.length === 0 && (
                      <div className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
                        <p className="text-muted-foreground">
                          No proposals match the current filter criteria.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <div className="grid gap-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Security Status</AlertTitle>
                    <AlertDescription>
                      System security monitoring is active. {securityAlerts.length} active alerts require attention.
                    </AlertDescription>
                  </Alert>

                  {/* Security Alerts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Alerts</CardTitle>
                      <CardDescription>Active security alerts and system notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {securityAlerts.length === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">All Clear</h3>
                            <p className="text-muted-foreground">No active security alerts detected.</p>
                          </div>
                        ) : (
                          securityAlerts.map((alert, index) => (
                            <div key={index} className="border border-border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className={`h-4 w-4 ${
                                    alert.severity === 'high' ? 'text-red-500' : 
                                    alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                                  }`} />
                                  <h4 className="font-medium">{alert.title}</h4>
                                </div>
                                <Badge className={getPriorityColor(alert.severity)}>
                                  {alert.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(alert.timestamp)}
                                  {alert.affected_user && ` • User: ${alert.affected_user}`}
                                </span>
                                <div className="flex gap-2">
                                  {alert.suggested_actions.map((action, actionIndex) => (
                                    <Button key={actionIndex} size="sm" variant="outline" className="h-7 text-xs">
                                      {action}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Health */}
                  {systemHealth && (
                    <Card>
                      <CardHeader>
                        <CardTitle>System Health</CardTitle>
                        <CardDescription>Current system status and performance metrics</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>CPU Usage</span>
                              <span>{systemHealth.checks.cpu?.value || 0}%</span>
                            </div>
                            <Progress value={systemHealth.checks.cpu?.value || 0} />
                            <Badge className={systemHealth.checks.cpu?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {systemHealth.checks.cpu?.status || 'unknown'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Memory Usage</span>
                              <span>{systemHealth.checks.memory?.value || 0}%</span>
                            </div>
                            <Progress value={systemHealth.checks.memory?.value || 0} />
                            <Badge className={systemHealth.checks.memory?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {systemHealth.checks.memory?.status || 'unknown'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Disk Usage</span>
                              <span>{systemHealth.checks.disk?.value || 0}%</span>
                            </div>
                            <Progress value={systemHealth.checks.disk?.value || 0} />
                            <Badge className={systemHealth.checks.disk?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {systemHealth.checks.disk?.status || 'unknown'}
                            </Badge>
                          </div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="flex justify-between text-sm">
                          <span>System Status</span>
                          <Badge className={systemHealth.overall_status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {systemHealth.overall_status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span>Uptime</span>
                          <span>{(systemHealth.uptime_seconds / 3600).toFixed(1)} hours</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Comprehensive analytics dashboard with detailed insights, charts, and performance metrics coming soon.
                  </p>
                  <Button className="mt-6" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Current Data
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Modals and Dialogs */}
            
            {/* User Details Dialog */}
            <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>User Details</DialogTitle>
                  <DialogDescription>
                    {selectedUser?.full_name || selectedUser?.email} - Comprehensive user information
                  </DialogDescription>
                </DialogHeader>
                {selectedUser && (
                  <div className="space-y-6 py-4">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="basic-info">
                        <AccordionTrigger>Basic Information</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Account Details</h4>
                              <div className="space-y-2 text-sm">
                                <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                                <div><span className="font-medium">Full Name:</span> {selectedUser.full_name}</div>
                                <div><span className="font-medium">Role:</span> 
                                  <Badge className="ml-2" variant="outline">{selectedUser.role.replace('_', ' ')}</Badge>
                                </div>
                                <div><span className="font-medium">Status:</span> 
                                  <Badge className={`ml-2 ${getStatusColor(selectedUser.status)}`}>
                                    {selectedUser.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Activity Metrics</h4>
                              <div className="space-y-2 text-sm">
                                <div><span className="font-medium">Credits Balance:</span> {formatNumber(selectedUser.credits.balance)}</div>
                                <div><span className="font-medium">Credits Spent:</span> {formatNumber(selectedUser.credits.spent)}</div>
                                <div><span className="font-medium">Recent Activity:</span> {selectedUser.recent_activity}</div>
                                <div><span className="font-medium">Joined:</span> {formatDate(selectedUser.created_at)}</div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      {selectedUser.teams.length > 0 && (
                        <AccordionItem value="teams">
                          <AccordionTrigger>Team Memberships</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {selectedUser.teams.map((team, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <span className="font-medium">{team.name}</span>
                                  <Badge variant="outline">{team.role}</Badge>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUserDetailsOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setIsUserDetailsOpen(false)
                    setIsEditUserOpen(true)
                  }}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>Update user information and permissions</DialogDescription>
                </DialogHeader>
                {selectedUser && (
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={selectedUser.email}
                        onChange={(e) => setSelectedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Full Name</label>
                      <Input
                        value={selectedUser.full_name}
                        onChange={(e) => setSelectedUser(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <Select value={selectedUser.role} onValueChange={(value: any) => setSelectedUser(prev => prev ? { ...prev, role: value } : null)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="team_member">Team Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={selectedUser.status} onValueChange={(value: any) => setSelectedUser(prev => prev ? { ...prev, status: value } : null)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditUser}>
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Credit Adjustment Dialog */}
            <Dialog open={isCreditAdjustOpen} onOpenChange={setIsCreditAdjustOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Adjust User Credits</DialogTitle>
                  <DialogDescription>
                    {selectedUser && `Current balance: ${formatNumber(selectedUser.credits.balance)} credits`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Operation</label>
                    <Select value={creditAdjustment.operation} onValueChange={(value: any) => setCreditAdjustment(prev => ({ ...prev, operation: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Add Credits</SelectItem>
                        <SelectItem value="deduct">Deduct Credits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={creditAdjustment.amount}
                      onChange={(e) => setCreditAdjustment(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reason</label>
                    <Textarea
                      placeholder="Reason for credit adjustment..."
                      value={creditAdjustment.reason}
                      onChange={(e) => setCreditAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreditAdjustOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreditAdjustment}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Adjust Credits
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Influencer Details Dialog */}
            <Dialog open={isInfluencerDetailsOpen} onOpenChange={setIsInfluencerDetailsOpen}>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Influencer Details</DialogTitle>
                  <DialogDescription>
                    {selectedInfluencer && `@${selectedInfluencer.username} - Comprehensive analytics and insights`}
                  </DialogDescription>
                </DialogHeader>
                {selectedInfluencer && (
                  <div className="space-y-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedInfluencer.profile_image_url} />
                        <AvatarFallback className="text-lg">{selectedInfluencer.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold">{selectedInfluencer.full_name}</h3>
                          {selectedInfluencer.is_verified && <Verified className="h-5 w-5 text-blue-500" />}
                        </div>
                        <p className="text-muted-foreground">@{selectedInfluencer.username}</p>
                        <p className="text-sm mt-1">{selectedInfluencer.biography}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{formatNumber(selectedInfluencer.followers_count)}</div>
                        <div className="text-sm text-muted-foreground">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{formatNumber(selectedInfluencer.posts_count)}</div>
                        <div className="text-sm text-muted-foreground">Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedInfluencer.analytics.engagement_rate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Engagement</div>
                      </div>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="analytics">
                        <AccordionTrigger>Analytics & Insights</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Platform Metrics</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Views</span>
                                  <span>{formatNumber(selectedInfluencer.analytics.total_views)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Unique Viewers</span>
                                  <span>{formatNumber(selectedInfluencer.analytics.unique_viewers)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Unlock Count</span>
                                  <span>{formatNumber(selectedInfluencer.analytics.unlock_count)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Revenue Generated</span>
                                  <span className="font-medium text-green-600">{formatCurrency(selectedInfluencer.platform_metrics.revenue_generated)}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">AI Analysis</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Primary Content</span>
                                  <Badge variant="outline">{selectedInfluencer.analytics.ai_analysis.primary_content_type}</Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Sentiment Score</span>
                                  <span>{(selectedInfluencer.analytics.ai_analysis.avg_sentiment_score * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Content Quality</span>
                                  <span>{(selectedInfluencer.analytics.ai_analysis.content_quality_score * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsInfluencerDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}