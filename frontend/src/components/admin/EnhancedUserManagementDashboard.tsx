'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Settings,
  History,
  CreditCard,
  MapPin,
  Smartphone,
  Globe,
  Activity,
  Calendar,
  Mail,
  Phone,
  User,
  Crown,
  Building,
  Fingerprint
} from 'lucide-react';
import { superadminApi } from '@/services/superadminApi';

interface EnhancedUser {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'super_admin' | 'team_member';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  teams: Array<{ name: string; role: string }>;
  credits: { balance: number; spent: number };
  recent_activity: number;
  security: {
    mfa_enabled: boolean;
    last_login: string;
    login_attempts: number;
    sessions_active: number;
  };
  created_at: string;
  updated_at: string;
}

interface UserActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  ip_address: string;
  device_info: string;
  location: string;
}

interface LoginHistory {
  timestamp: string;
  ip_address: string;
  device: string;
  location: string;
  success: boolean;
  user_agent: string;
}

interface PermissionMatrix {
  feature_access: Record<string, boolean>;
  data_access: Record<string, boolean>;
  admin_permissions: Record<string, boolean>;
  special_features: Record<string, boolean>;
}

interface EnhancedUserManagementDashboardProps {}

const EnhancedUserManagementDashboard: React.FC<EnhancedUserManagementDashboardProps> = () => {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [showBulkDialog, setBulkOpDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'user',
    status: 'active',
    subscription_tier: 'free',
    initial_credits: 0
  });
  const [bulkOperation, setBulkOperation] = useState({
    operation: 'update_role',
    parameters: {}
  });

  useEffect(() => {
    loadUsersData();
    loadPermissionMatrix();
  }, [searchTerm, statusFilter, roleFilter]);

  const loadUsersData = async () => {
    try {
      setLoading(true);
      const response = await superadminApi.getUsers({
        limit: 100,
        search: searchTerm || undefined,
        status_filter: statusFilter !== 'all' ? statusFilter : undefined,
        role_filter: roleFilter !== 'all' ? roleFilter : undefined
      });

      if (response.success && response.data) {
        setUsers(response.data.users || []);
        setError(null);
      } else {
        setError(response.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users data');
      console.error('Enhanced user management error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissionMatrix = async () => {
    try {
      const response = await superadminApi.getPermissionMatrix();
      if (response.success && response.data) {
        setPermissionMatrix(response.data);
      }
    } catch (err) {
      console.error('Failed to load permission matrix:', err);
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      const [activitiesResponse, historyResponse] = await Promise.all([
        superadminApi.getUserActivities(userId, { limit: 50 }),
        superadminApi.getUserLoginHistory(userId, { limit: 20 })
      ]);

      if (activitiesResponse.success && activitiesResponse.data) {
        setUserActivities(activitiesResponse.data.activities || []);
      }

      if (historyResponse.success && historyResponse.data) {
        setLoginHistory(historyResponse.data.login_history || []);
      }
    } catch (err) {
      console.error('Failed to load user details:', err);
    }
  };

  const handleCreateUser = async () => {
    try {
      await superadminApi.createUser(newUser);
      setShowUserDialog(false);
      setNewUser({
        email: '',
        full_name: '',
        role: 'user',
        status: 'active',
        subscription_tier: 'free',
        initial_credits: 0
      });
      loadUsersData();
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleEditUser = async (userId: string, updates: any) => {
    try {
      await superadminApi.editUser(userId, updates);
      loadUsersData();
    } catch (err) {
      console.error('Failed to edit user:', err);
    }
  };

  const handleDeleteUser = async (userId: string, permanent = false) => {
    try {
      await superadminApi.deleteUser(userId, permanent);
      loadUsersData();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      await superadminApi.updateUserStatus(userId, status);
      loadUsersData();
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const handleSecurityAction = async (userId: string, action: string, data?: any) => {
    try {
      switch (action) {
        case 'mfa':
          await superadminApi.manageMFA(userId, data.action, data.method);
          break;
        case 'sessions':
          await superadminApi.manageUserSessions(userId, data.action, data.device_id);
          break;
        case 'password_reset':
          await superadminApi.resetUserPassword(userId, data);
          break;
        case 'emergency_lock':
          await superadminApi.emergencyUserLock(userId, data.action, data.reason);
          break;
      }
      loadUsersData();
    } catch (err) {
      console.error(`Failed to perform security action ${action}:`, err);
    }
  };

  const handleUpdatePermissions = async (userId: string, permissions: Record<string, boolean>) => {
    try {
      await superadminApi.updateUserPermissions(userId, permissions);
      loadUsersData();
    } catch (err) {
      console.error('Failed to update permissions:', err);
    }
  };

  const handleBulkOperation = async () => {
    try {
      await superadminApi.bulkUserOperations(
        bulkOperation.operation,
        selectedUsers,
        bulkOperation.parameters
      );
      setBulkOpDialog(false);
      setSelectedUsers([]);
      setBulkOperation({ operation: 'update_role', parameters: {} });
      loadUsersData();
    } catch (err) {
      console.error('Failed to perform bulk operation:', err);
    }
  };

  const handleImpersonateUser = async (userId: string, duration = 30) => {
    try {
      const response = await superadminApi.impersonateUser(userId, {
        duration_minutes: duration,
        reason: 'administrative_support',
        notify_user: false
      });

      if (response.success) {
        // Handle impersonation token or redirect
        console.log('Impersonation token:', response.data);
      }
    } catch (err) {
      console.error('Failed to impersonate user:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin':
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'team_member':
        return <Building className="h-4 w-4 text-purple-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const usersOverview = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const suspended = users.filter(u => u.status === 'suspended').length;
    const newToday = users.filter(u => {
      const today = new Date().toISOString().split('T')[0];
      return u.created_at.startsWith(today);
    }).length;

    return { total, active, suspended, newToday };
  }, [users]);

  const roleDistribution = useMemo(() => {
    const distribution = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([role, count]) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' '),
      count,
      color: role === 'superadmin' ? '#eab308' : role === 'admin' ? '#3b82f6' : role === 'team_member' ? '#8b5cf6' : '#6b7280'
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading enhanced user management...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load User Management</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadUsersData}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enhanced User Management</h2>
          <p className="text-muted-foreground">Advanced user administration with security controls and permission management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadUsersData} size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user account with initial configuration</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="team_member">Team Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subscription_tier">Subscription</Label>
                    <Select value={newUser.subscription_tier} onValueChange={(value) => setNewUser(prev => ({ ...prev, subscription_tier: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="initial_credits">Initial Credits</Label>
                  <Input
                    id="initial_credits"
                    type="number"
                    value={newUser.initial_credits}
                    onChange={(e) => setNewUser(prev => ({ ...prev, initial_credits: parseInt(e.target.value) || 0 }))}
                    placeholder="100"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUserDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateUser}>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-2">{usersOverview.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold mt-2 text-green-600">{usersOverview.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold mt-2 text-red-600">{usersOverview.suspended}</p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Today</p>
                <p className="text-2xl font-bold mt-2">{usersOverview.newToday}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="security">Security Controls</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Search & Filters
                </div>
                {selectedUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{selectedUsers.length} selected</Badge>
                    <Dialog open={showBulkDialog} onOpenChange={setBulkOpDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          Bulk Actions
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk User Operations</DialogTitle>
                          <DialogDescription>Apply changes to {selectedUsers.length} selected users</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label>Operation</Label>
                            <Select
                              value={bulkOperation.operation}
                              onValueChange={(value) => setBulkOperation(prev => ({ ...prev, operation: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="update_role">Update Role</SelectItem>
                                <SelectItem value="assign_team">Assign Team</SelectItem>
                                <SelectItem value="reset_passwords">Reset Passwords</SelectItem>
                                <SelectItem value="update_status">Update Status</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setBulkOpDialog(false)}>Cancel</Button>
                          <Button onClick={handleBulkOperation}>Apply Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers(filteredUsers.map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Security</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(prev => [...prev, user.id]);
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(user.role)}
                          <Badge variant="outline" className="capitalize">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status)}`} />
                          <span className="capitalize">{user.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{user.credits.balance}</div>
                          <div className="text-muted-foreground">Spent: {user.credits.spent}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{user.security?.last_login ? new Date(user.security?.last_login).toLocaleDateString() : 'Never'}</div>
                          <div className="text-muted-foreground">{user.recent_activity !== undefined ? `${user.recent_activity} recent actions` : 'No activity data'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {user.security?.mfa_enabled && <Shield className="h-4 w-4 text-green-500" />}
                          {user.security?.sessions_active && user.security.sessions_active > 0 && <Activity className="h-4 w-4 text-blue-500" />}
                          {user.security?.login_attempts && user.security.login_attempts > 5 && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              loadUserDetails(user.id);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleImpersonateUser(user.id)}>
                              <User className="h-4 w-4 mr-2" />
                              Impersonate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'suspended')}>
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* User Details Sidebar */}
          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    User Details: {selectedUser.full_name}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="activity">
                  <TabsList>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="activity" className="mt-6">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {userActivities.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Activity className="h-4 w-4 mt-1 text-blue-500" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{activity.description}</p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(activity.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {activity.location} • {activity.ip_address}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="security" className="mt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">MFA Status</p>
                                <p className={`text-sm ${selectedUser.security?.mfa_enabled ? 'text-green-600' : 'text-red-600'}`}>
                                  {selectedUser.security?.mfa_enabled ? 'Enabled' : 'Disabled'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSecurityAction(selectedUser.id, 'mfa', {
                                  action: selectedUser.security?.mfa_enabled ? 'disable' : 'enforce',
                                  method: 'authenticator'
                                })}
                              >
                                {selectedUser.security?.mfa_enabled ? 'Disable' : 'Enable'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">Active Sessions</p>
                                <p className="text-sm">{selectedUser.security?.sessions_active || 0}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSecurityAction(selectedUser.id, 'sessions', {
                                  action: 'terminate_all'
                                })}
                              >
                                Terminate All
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-2">
                        <Label>Login History</Label>
                        <ScrollArea className="h-[300px] border rounded-lg p-4">
                          <div className="space-y-2">
                            {loginHistory.map((login, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                                <div className="flex items-center space-x-2">
                                  {login.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">{login.location}</p>
                                    <p className="text-xs text-muted-foreground">{login.device}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-medium">{new Date(login.timestamp).toLocaleDateString()}</p>
                                  <p className="text-xs text-muted-foreground">{login.ip_address}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="permissions" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">User Permissions</h4>
                        <Button size="sm" onClick={() => setShowPermissionDialog(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Permissions
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedUser.permissions && Object.entries(selectedUser.permissions).map(([permission, enabled]) => (
                          <div key={permission} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm capitalize">{permission.replace('_', ' ')}</span>
                            {enabled ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Multi-Factor Authentication</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Users with MFA</span>
                      <span className="font-medium">
                        {users.filter(u => u.security?.mfa_enabled).length}/{users.length}
                      </span>
                    </div>
                    <Progress
                      value={(users.filter(u => u.security?.mfa_enabled).length / users.length) * 100}
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Login Security</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Failed Logins (24h)</span>
                      <span className="font-medium text-red-600">
                        {users.reduce((sum, u) => sum + (u.security?.login_attempts ?? 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Sessions</span>
                      <span className="font-medium">
                        {users.reduce((sum, u) => sum + (u.security?.sessions_active ?? 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Permission Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permissionMatrix && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Feature Access</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(permissionMatrix.feature_access).map(([feature, permissions]) => (
                        <Card key={feature} className="p-4">
                          <h5 className="font-medium capitalize mb-2">{feature.replace('_', ' ')}</h5>
                          <div className="space-y-2">
                            {typeof permissions === 'object' && Object.entries(permissions as Record<string, boolean>).map(([permission, enabled]) => (
                              <div key={permission} className="flex items-center justify-between">
                                <span className="text-sm">{permission.replace('_', ' ')}</span>
                                {enabled ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Users",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={(entry) => `${entry.role}: ${entry.count}`}
                      >
                        {roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* User Growth */}
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Profiles Viewed</span>
                    <span className="font-medium">
                      {users.reduce((sum, u) => sum + (u.activity?.profiles_viewed ?? 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Unlocks</span>
                    <span className="font-medium">
                      {users.reduce((sum, u) => sum + (u.activity?.total_unlocks ?? 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active This Week</span>
                    <span className="font-medium">
                      {users.filter(u => {
                        if (!u.security?.last_login) return false;
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(u.security?.last_login || '') > weekAgo;
                      }).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedUserManagementDashboard;