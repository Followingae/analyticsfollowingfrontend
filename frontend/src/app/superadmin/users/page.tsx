"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { AuthGuard } from "@/components/AuthGuard"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { superadminApiService, UserManagement } from "@/services/superadminApi"
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Ban,
  Unlock,
  Trash2,
  MoreHorizontal,
  Crown,
  CreditCard,
  Mail,
  Calendar,
  Activity,
} from "lucide-react"

import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = 'force-dynamic'

export default function SuperadminUsersPage() {
  const [users, setUsers] = useState<UserManagement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  
  // Dialogs
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null)
  
  // Create user form
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    user_type: 'regular',
    subscription_tier: 'free',
    credits_balance: 0,
    password: ''
  })

  const router = useRouter()

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: any = {}
      if (statusFilter !== "all") filters.account_status = statusFilter
      if (typeFilter !== "all") filters.user_type = typeFilter
      if (planFilter !== "all") filters.subscription_tier = planFilter
      if (searchQuery.trim()) filters.search_query = searchQuery.trim()
      
      const result = await superadminApiService.getUsers({ ...filters, limit: 100 })
      if (result.success && result.data) {
        setUsers(result.data.users || [])
      } else {
        throw new Error(result.error || 'Failed to load users')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load users")
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [searchQuery, statusFilter, typeFilter, planFilter])

  const handleCreateUser = async () => {
    if (!newUser.email.trim() || !newUser.full_name.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const result = await superadminApiService.createUser(newUser)
      if (result.success) {
        toast.success("User created successfully!")
        setIsCreateUserOpen(false)
        setNewUser({
          email: '',
          full_name: '',
          user_type: 'regular',
          subscription_tier: 'free',
          credits_balance: 0,
          password: ''
        })
        await loadUsers()
      } else {
        toast.error(result.error || 'Failed to create user')
      }
    } catch (error) {
      toast.error('Network error while creating user')
    }
  }

  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'deactivated', reason?: string) => {
    try {
      const result = await superadminApiService.updateUserStatus(userId, status, reason)
      if (result.success) {
        await loadUsers()
        toast.success(`User status updated to ${status}`)
        setIsUserDetailsOpen(false)
      } else {
        toast.error(result.error || 'Failed to update user status')
      }
    } catch (error) {
      toast.error('Network error while updating user status')
    }
  }

  const handleUpdateUserPlan = async (userId: string, plan: string) => {
    try {
      const result = await superadminApiService.updateUserPlan(userId, plan)
      if (result.success) {
        await loadUsers()
        toast.success(`User plan updated to ${plan}`)
        setIsEditUserOpen(false)
      } else {
        toast.error(result.error || 'Failed to update user plan')
      }
    } catch (error) {
      toast.error('Network error while updating user plan')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading && users.length === 0) {
    return (
      <AuthGuard requireAuth={true} requireSuperAdmin={true}>
        <SidebarProvider>
          <SuperadminSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true} requireSuperAdmin={true}>
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
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">User Management</h1>
                  <p className="text-muted-foreground">Create, manage, and monitor platform users</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={loadUsers}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                    <DialogTrigger asChild>
                      <Button style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} className="hover:opacity-90">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Create a new platform user with specified permissions
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input
                              type="email"
                              placeholder="user@example.com"
                              value={newUser.email}
                              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                              placeholder="Full name"
                              value={newUser.full_name}
                              onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">User Type</label>
                            <Select value={newUser.user_type} onValueChange={(value) => setNewUser(prev => ({ ...prev, user_type: value }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="regular">Regular User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="superadmin">Superadmin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Subscription Plan</label>
                            <Select value={newUser.subscription_tier} onValueChange={(value) => setNewUser(prev => ({ ...prev, subscription_tier: value }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Initial Credits</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newUser.credits_balance}
                            onChange={(e) => setNewUser(prev => ({ ...prev, credits_balance: parseInt(e.target.value) || 0 }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Temporary Password</label>
                          <Input
                            type="password"
                            placeholder="Temporary password"
                            value={newUser.password}
                            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateUser} style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }} className="hover:opacity-90">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create User
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[250px] pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
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

                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Users
                </Button>
              </div>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Users ({users.length})</CardTitle>
                  <CardDescription>Complete user management and administration</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Plan</TableHead>
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
                            <Badge variant="outline" className="capitalize">
                              {user.subscription_tier}
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
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user)
                                  setIsEditUserOpen(true)
                                }}>
                                  <Edit className="h-3 w-3 mr-2" />
                                  Edit User
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
                  
                  {users.length === 0 && !loading && (
                    <div className="py-12 flex justify-center">
                      <EmptyState
                        title="No users found"
                        description="Try adjusting your search or filter criteria\nto find the users you're looking for."
                        icons={[Users, Search, Filter]}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}