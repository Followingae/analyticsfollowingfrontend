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
  MoreHorizontal,
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
      if (statusFilter !== "all") filters.status_filter = statusFilter
      if (typeFilter !== "all") filters.role_filter = typeFilter
      if (searchQuery.trim()) filters.search = searchQuery.trim()
      
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
      const result = await superadminApiService.editUser(userId, { status })
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
      const result = await superadminApiService.editUser(userId, { subscription_tier: plan })
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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default'
      case 'suspended': return 'destructive'
      case 'pending': return 'secondary'
      case 'deactivated': return 'outline'
      default: return 'outline'
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-7 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 bg-muted animate-pulse rounded" />
              <div className="h-9 w-44 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-[250px] bg-muted animate-pulse rounded" />
            <div className="h-9 w-[140px] bg-muted animate-pulse rounded" />
            <div className="h-9 w-[140px] bg-muted animate-pulse rounded" />
          </div>
          <Card>
            <CardHeader>
              <div className="h-5 w-36 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded mt-1" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                  <h1 className="text-2xl font-semibold">User Management</h1>
                  <p className="text-sm text-muted-foreground mt-1">Create, manage, and monitor platform users</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
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
                
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Platform Users</CardTitle>
                      <CardDescription>{users.length} total users</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <div className="overflow-x-auto">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Credits</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="group transition-colors duration-150 hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{user.full_name || 'Unnamed'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {user.teams?.[0]?.name || 'Individual'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(user.status)} className="capitalize text-xs">
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-sm">
                            {formatNumber(user.credits?.balance || 0)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.updated_at ? formatDate(user.updated_at) : '--'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-150 data-[state=open]:opacity-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user)
                                  setIsUserDetailsOpen(true)
                                }}>
                                  <Eye className="h-3.5 w-3.5 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  router.push(`/superadmin/users/${user.id}`)
                                }}>
                                  <Edit className="h-3.5 w-3.5 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className={user.status === 'active' ? 'text-destructive focus:text-destructive' : ''}
                                  onClick={() => handleUpdateUserStatus(user.id,
                                    user.status === 'active' ? 'suspended' : 'active'
                                  )}
                                >
                                  {user.status === 'active' ? (
                                    <>
                                      <Ban className="h-3.5 w-3.5 mr-2" />
                                      Suspend User
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="h-3.5 w-3.5 mr-2" />
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
                  
                  </div>
                  {users.length === 0 && !loading && (
                    <div className="py-16 flex justify-center border-t">
                      <EmptyState
                        title="No users found"
                        description="Try adjusting your search or filter criteria to find the users you're looking for."
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