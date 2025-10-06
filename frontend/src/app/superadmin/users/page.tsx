"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
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
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null)

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

  const formatNumber = (num: any) => {
    // Handle all possible falsy/invalid values
    if (num === undefined || num === null || num === '' || typeof num !== 'number' || isNaN(num)) {
      return '0'
    }
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading && users.length === 0) {
    return (
      <SuperadminLayout>
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
              
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
                  <Button
                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
                    className="hover:opacity-90"
                    onClick={() => router.push('/superadmin/users/create')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Brand Account
                  </Button>
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
                                  router.push(`/superadmin/users/${user.id}`)
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
    </SuperadminLayout>
  )
}