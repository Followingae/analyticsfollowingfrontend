'use client'

import { useState, useEffect } from "react"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  Users,
  Search,
  UserPlus,
  Ban,
  Eye,
  MoreHorizontal,
  Edit3,
  CreditCard,
  UserX,
  RefreshCw
} from "lucide-react"

import { 
  superadminApiService, 
  UserManagement
} from "@/services/superadminApi"

export default function UsersPage() {
  // State Management
  const [users, setUsers] = useState<UserManagement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and Search
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userStatusFilter, setUserStatusFilter] = useState("all")
  const [userRoleFilter, setUserRoleFilter] = useState("all")
  
  // Dialogs and Modals
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isCreditAdjustOpen, setIsCreditAdjustOpen] = useState(false)
  
  // Form States
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [userSearchQuery, userStatusFilter, userRoleFilter])

  // Utility functions
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
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
      } else {
        toast.error(result.error || 'Failed to adjust credits')
      }
    } catch (error) {
      toast.error('Network error while adjusting credits')
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
              <p className="text-muted-foreground">Loading users...</p>
            </div>
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
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">Manage platform users and their access permissions</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => loadUsers()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

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
                <CardTitle>Platform Users</CardTitle>
                <CardDescription>Complete user management with advanced controls</CardDescription>
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
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}