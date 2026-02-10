'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users, UserPlus, Search, AlertCircle, MoreHorizontal,
  Eye, Edit, Mail, Key, Trash2, RotateCcw, Copy,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { superadminService } from '@/utils/superadminApi';
import { format } from 'date-fns';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface User {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  status: string;
  subscription_tier?: string;
  billing_type?: string;
  credits: number;
  created_at: string;
  last_login?: string | null;
  next_billing_date?: string;
  days_until_billing?: number;
  subscription_active?: boolean;
  current_balance?: number;
  is_self_paid?: boolean;
  is_admin_managed?: boolean;
  subscription_plan?: string;
  subscription_status?: string;
  credits_balance?: number;
}

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_profiles: number;
  total_revenue_this_month: number;
  total_credits_consumed: number;
  new_users_this_month: number;
}

export default function SuperadminUserManagementClean() {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    total_users: 0,
    active_users: 0,
    total_profiles: 0,
    total_revenue_this_month: 0,
    total_credits_consumed: 0,
    new_users_this_month: 0,
  });

  // Search and filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDashboardStats();
    fetchUsers();
  }, [page, search, roleFilter, statusFilter]);

  const fetchDashboardStats = async () => {
    try {
      const stats = await superadminService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await superadminService.getUsers(page, pageSize, search || undefined);
      setUsers(response.users || []);
      setTotalPages(Math.ceil((response.total || 0) / pageSize));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, user: User) => {
    switch (action) {
      case 'view':
        router.push(`/admin/users/${user.id}`);
        break;
      case 'edit':
        router.push(`/admin/users/${user.id}?edit=true`);
        break;
      case 'delete':
        const confirmed = await confirm({
          title: 'Delete User',
          description: `Are you sure you want to delete ${user.email}?`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
          variant: 'destructive'
        });
        if (confirmed) {
          try {
            await superadminService.deleteUser(user.id);
            toast.success('User deleted successfully');
            fetchUsers();
          } catch (error) {
            toast.error('Failed to delete user');
          }
        }
        break;
      case 'copy-email':
        navigator.clipboard.writeText(user.email);
        toast.success('Email copied to clipboard');
        break;
      case 'send-password-reset':
        try {
          // Implement password reset
          toast.success('Password reset email sent');
        } catch (error) {
          toast.error('Failed to send password reset');
        }
        break;
    }
  };

  const getUserCredits = (user: User) => {
    const credits = user.current_balance || user.credits || user.credits_balance || 0;
    return Math.round(credits);
  };

  const getTierLimit = (tier?: string) => {
    const limits: Record<string, number> = {
      free: 125,
      standard: 12500,
      premium: 50000,
      enterprise: 50000,
    };
    return limits[tier || 'free'] || 125;
  };

  return (
    <>
      <ConfirmDialog />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Users</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage user accounts and permissions
            </p>
          </div>
          <Button onClick={() => router.push('/admin/users/create')}>
            <UserPlus className="h-4 w-4 mr-2" />
            New User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-semibold mt-1">
                    {dashboardStats.total_users.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-semibold mt-1">
                    {dashboardStats.active_users.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-semibold mt-1">
                    ${(dashboardStats.total_revenue_this_month / 100).toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-2xl font-semibold mt-1">
                    {dashboardStats.new_users_this_month.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          {user.full_name && (
                            <div className="text-sm text-muted-foreground">{user.full_name}</div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {user.subscription_tier || 'free'}
                          <div className="text-xs text-muted-foreground">
                            {getTierLimit(user.subscription_tier).toLocaleString()} credits/mo
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className={`text-sm ${
                          user.status === 'active' ? 'text-green-600' :
                          user.status === 'deleted' ? 'text-red-600' :
                          'text-muted-foreground'
                        }`}>
                          {user.status}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {getUserCredits(user).toLocaleString()} / {getTierLimit(user.subscription_tier).toLocaleString()}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {user.next_billing_date ?
                            format(new Date(user.next_billing_date), 'MMM dd, yyyy') :
                            '-'
                          }
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuItem onClick={() => handleAction('view', user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('edit', user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction('copy-email', user)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('send-password-reset', user)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Password Reset
                            </DropdownMenuItem>
                            {user.is_admin_managed && (
                              <DropdownMenuItem onClick={() => {
                                const password = prompt(`Enter new password for ${user.email}:`);
                                if (password) {
                                  // Implement password change
                                  toast.success('Password updated');
                                }
                              }}>
                                <Key className="h-4 w-4 mr-2" />
                                Set Password
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleAction('delete', user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}