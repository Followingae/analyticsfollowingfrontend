'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Shield,
  Key,
  Users,
  Crown,
  Lock,
  Unlock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Copy,
  Download,
  Upload,
  FileText,
  Database,
  Server,
  Globe,
  Zap,
  UserCheck,
  Building,
  Briefcase,
  Target,
  Award
} from 'lucide-react';
import { superadminApi } from '@/services/superadminApi';

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: Record<string, any>;
  user_count: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface PermissionCategory {
  category: string;
  permissions: Array<{
    key: string;
    name: string;
    description: string;
    level: 'basic' | 'advanced' | 'admin' | 'system';
  }>;
}

interface FeatureAccessGrant {
  id: string;
  user_id: string;
  user_email: string;
  feature: string;
  access_level: string;
  granted_at: string;
  expires_at?: string;
  granted_by: string;
  status: string;
  usage_count: number;
}

interface RoleUsageStats {
  role_name: string;
  user_count: number;
  active_users: number;
  permissions_count: number;
  last_updated: string;
}

interface RolePermissionDashboardProps {}

const RolePermissionDashboard: React.FC<RolePermissionDashboardProps> = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, PermissionCategory>>({});
  const [featureGrants, setFeatureGrants] = useState<FeatureAccessGrant[]>([]);
  const [roleUsageStats, setRoleUsageStats] = useState<RoleUsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [newRole, setNewRole] = useState({
    role_name: '',
    description: '',
    role_level: 1,
    permissions: {} as Record<string, any>
  });
  const [newFeatureGrant, setNewFeatureGrant] = useState({
    feature: 'proposals',
    users: [] as string[],
    teams: [] as string[],
    access_level: 'full',
    expires_at: ''
  });

  useEffect(() => {
    loadRoleManagementData();
  }, []);

  const loadRoleManagementData = async () => {
    try {
      setLoading(true);
      const [
        rolesResponse,
        matrixResponse,
        grantsResponse
      ] = await Promise.all([
        superadminApi.getRoles(),
        superadminApi.getPermissionMatrix(),
        superadminApi.getFeatureAccessGrants()
      ]);

      if (rolesResponse.success && rolesResponse.data) {
        setRoles(rolesResponse.data.roles || []);
        setRoleUsageStats(rolesResponse.data.usage_stats || []);
      }

      if (matrixResponse.success && matrixResponse.data) {
        setPermissionMatrix(matrixResponse.data);
      }

      if (grantsResponse.success && grantsResponse.data) {
        setFeatureGrants(grantsResponse.data.grants || []);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load role management data');
      console.error('Role management dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      await superadminApi.createRole(newRole);
      setShowRoleDialog(false);
      setNewRole({
        role_name: '',
        description: '',
        role_level: 1,
        permissions: {}
      });
      loadRoleManagementData();
    } catch (err) {
      console.error('Failed to create role:', err);
    }
  };

  const handleUpdateRolePermissions = async (roleId: string, permissions: Record<string, any>) => {
    try {
      await superadminApi.updateRolePermissions(roleId, permissions, true);
      loadRoleManagementData();
    } catch (err) {
      console.error('Failed to update role permissions:', err);
    }
  };

  const handleBulkFeatureGrant = async () => {
    try {
      await superadminApi.bulkFeatureGrant(newFeatureGrant);
      setShowGrantDialog(false);
      setNewFeatureGrant({
        feature: 'proposals',
        users: [],
        teams: [],
        access_level: 'full',
        expires_at: ''
      });
      loadRoleManagementData();
    } catch (err) {
      console.error('Failed to grant feature access:', err);
    }
  };

  const getRoleLevelBadge = (level: number) => {
    if (level >= 9) return { color: 'bg-red-500', text: 'System' };
    if (level >= 7) return { color: 'bg-yellow-500', text: 'Super Admin' };
    if (level >= 5) return { color: 'bg-blue-500', text: 'Admin' };
    if (level >= 3) return { color: 'bg-purple-500', text: 'Manager' };
    return { color: 'bg-gray-500', text: 'User' };
  };

  const getRoleIcon = (roleName: string, level: number) => {
    if (level >= 9) return <Crown className="h-5 w-5 text-red-500" />;
    if (level >= 7) return <Shield className="h-5 w-5 text-yellow-500" />;
    if (level >= 5) return <Key className="h-5 w-5 text-blue-500" />;
    if (level >= 3) return <Building className="h-5 w-5 text-purple-500" />;
    return <Users className="h-5 w-5 text-gray-500" />;
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'proposals':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'analytics':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'exports':
        return <Download className="h-4 w-4 text-purple-500" />;
      case 'api_access':
        return <Globe className="h-4 w-4 text-orange-500" />;
      default:
        return <Award className="h-4 w-4 text-gray-500" />;
    }
  };

  const permissionCategories = useMemo(() => {
    return Object.entries(permissionMatrix).map(([category, data]) => ({
      name: category,
      permissions: data.permissions || []
    }));
  }, [permissionMatrix]);

  const roleDistribution = useMemo(() => {
    return roleUsageStats.map(stat => ({
      role: stat.role_name,
      users: stat.user_count,
      active: stat.active_users,
      color: getRoleLevelBadge(
        roles.find(r => r.name === stat.role_name)?.level || 1
      ).color.replace('bg-', '#')
    }));
  }, [roleUsageStats, roles]);

  const featureAccessStats = useMemo(() => {
    const stats = featureGrants.reduce((acc, grant) => {
      if (!acc[grant.feature]) {
        acc[grant.feature] = { active: 0, expired: 0, total: 0 };
      }
      acc[grant.feature].total++;
      if (grant.status === 'active') {
        acc[grant.feature].active++;
      } else {
        acc[grant.feature].expired++;
      }
      return acc;
    }, {} as Record<string, { active: number; expired: number; total: number }>);

    return Object.entries(stats).map(([feature, data]) => ({
      feature: feature.charAt(0).toUpperCase() + feature.slice(1),
      ...data
    }));
  }, [featureGrants]);

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading role management dashboard...</span>
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
            <h3 className="text-lg font-semibold mb-2">Failed to Load Role Management</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadRoleManagementData}>
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
          <h2 className="text-3xl font-bold tracking-tight">Role & Permission Management</h2>
          <p className="text-muted-foreground">Advanced role-based access control and feature management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadRoleManagementData} size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create Custom Role</DialogTitle>
                <DialogDescription>Define a new role with specific permissions and access levels</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="role_name">Role Name</Label>
                  <Input
                    id="role_name"
                    value={newRole.role_name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, role_name: e.target.value }))}
                    placeholder="Custom Analyst"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Role description and responsibilities"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role_level">Authority Level (1-10)</Label>
                  <Input
                    id="role_level"
                    type="number"
                    min="1"
                    max="10"
                    value={newRole.role_level}
                    onChange={(e) => setNewRole(prev => ({ ...prev, role_level: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateRole}>Create Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Award className="h-4 w-4 mr-2" />
                Grant Access
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Bulk Feature Access Grant</DialogTitle>
                <DialogDescription>Grant feature access to multiple users or teams</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="feature">Feature</Label>
                    <Select
                      value={newFeatureGrant.feature}
                      onValueChange={(value) => setNewFeatureGrant(prev => ({ ...prev, feature: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proposals">Proposals</SelectItem>
                        <SelectItem value="analytics">Advanced Analytics</SelectItem>
                        <SelectItem value="exports">Data Exports</SelectItem>
                        <SelectItem value="api_access">API Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="access_level">Access Level</Label>
                    <Select
                      value={newFeatureGrant.access_level}
                      onValueChange={(value) => setNewFeatureGrant(prev => ({ ...prev, access_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read_only">Read Only</SelectItem>
                        <SelectItem value="full">Full Access</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={newFeatureGrant.expires_at}
                    onChange={(e) => setNewFeatureGrant(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGrantDialog(false)}>Cancel</Button>
                <Button onClick={handleBulkFeatureGrant}>Grant Access</Button>
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
                <p className="text-sm font-medium text-muted-foreground">Total Roles</p>
                <p className="text-2xl font-bold mt-2">{roles.length}</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custom Roles</p>
                <p className="text-2xl font-bold mt-2">{roles.filter(r => !r.is_system).length}</p>
              </div>
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Feature Grants</p>
                <p className="text-2xl font-bold mt-2">{featureGrants.filter(g => g.status === 'active').length}</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Permission Categories</p>
                <p className="text-2xl font-bold mt-2">{permissionCategories.length}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          <TabsTrigger value="features">Feature Access</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Role Management Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                System Roles
              </CardTitle>
              <CardDescription>Manage user roles and their associated permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => {
                    const levelBadge = getRoleLevelBadge(role.level);
                    return (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getRoleIcon(role.name, role.level)}
                            <div>
                              <div className="font-medium">{role.name}</div>
                              <div className="text-sm text-muted-foreground">{role.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${levelBadge.color} text-white`}>
                            Level {role.level} - {levelBadge.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">{role.user_count}</div>
                            <div className="text-xs text-muted-foreground">users</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">{Object.keys(role.permissions).length}</div>
                            <div className="text-xs text-muted-foreground">permissions</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.is_system ? 'default' : 'outline'}>
                            {role.is_system ? 'System' : 'Custom'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(role.updated_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRole(role);
                                setShowPermissionDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!role.is_system && (
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Role Permission Editor Dialog */}
          {selectedRole && (
            <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Edit Permissions: {selectedRole.name}</DialogTitle>
                  <DialogDescription>Modify role permissions and access levels</DialogDescription>
                </DialogHeader>
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="space-y-6">
                    {permissionCategories.map((category) => (
                      <div key={category.name} className="space-y-3">
                        <h4 className="font-medium capitalize flex items-center">
                          <Key className="h-4 w-4 mr-2" />
                          {category.name.replace('_', ' ')} Permissions
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {category.permissions.map((permission) => (
                            <div key={permission.key} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-sm text-muted-foreground">{permission.description}</div>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {permission.level}
                                </Badge>
                              </div>
                              <Switch
                                checked={selectedRole.permissions[permission.key] || false}
                                onCheckedChange={(checked) => {
                                  const updatedPermissions = {
                                    ...selectedRole.permissions,
                                    [permission.key]: checked
                                  };
                                  setSelectedRole({
                                    ...selectedRole,
                                    permissions: updatedPermissions
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowPermissionDialog(false);
                    setSelectedRole(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    handleUpdateRolePermissions(selectedRole.id, selectedRole.permissions);
                    setShowPermissionDialog(false);
                    setSelectedRole(null);
                  }}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* Permission Matrix Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Permission Matrix Overview
              </CardTitle>
              <CardDescription>Complete overview of all available permissions and access levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {permissionCategories.map((category) => (
                  <div key={category.name} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold capitalize">
                        {category.name.replace('_', ' ')} Permissions
                      </h3>
                      <Badge variant="outline">
                        {category.permissions.length} permissions
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {category.permissions.map((permission) => (
                        <Card key={permission.key} className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{permission.name}</h4>
                              <Badge
                                variant={permission.level === 'system' ? 'destructive' :
                                        permission.level === 'admin' ? 'default' : 'outline'}
                              >
                                {permission.level}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{permission.description}</p>
                            <div className="text-xs font-mono text-muted-foreground">{permission.key}</div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Access Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Feature Access Grants
              </CardTitle>
              <CardDescription>Manage special feature access for users and teams</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Granted</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureGrants.map((grant) => (
                    <TableRow key={grant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{grant.user_email}</div>
                          <div className="text-xs text-muted-foreground">{grant.user_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getFeatureIcon(grant.feature)}
                          <Badge variant="outline" className="capitalize">
                            {grant.feature.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={grant.access_level === 'admin' ? 'default' :
                                  grant.access_level === 'full' ? 'secondary' : 'outline'}
                          className="capitalize"
                        >
                          {grant.access_level.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{grant.usage_count}</div>
                          <div className="text-xs text-muted-foreground">times used</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(grant.granted_at).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">by {grant.granted_by}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {grant.expires_at ? (
                          <div className="text-sm">
                            {new Date(grant.expires_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            grant.status === 'active' ? 'bg-green-500' :
                            grant.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <span className="capitalize">{grant.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                <CardDescription>User count by role level</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    users: {
                      label: "Users",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="role" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="users" fill="var(--color-users)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Feature Access Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Access Overview</CardTitle>
                <CardDescription>Active feature grants by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    active: {
                      label: "Active Grants",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={featureAccessStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="active"
                        label={(entry) => entry.feature}
                      >
                        {featureAccessStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Role Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Role Usage Statistics</CardTitle>
              <CardDescription>Detailed role usage and activity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Total Users</TableHead>
                    <TableHead>Active Users</TableHead>
                    <TableHead>Activity Rate</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleUsageStats.map((stat) => {
                    const activityRate = stat.user_count > 0 ? (stat.active_users / stat.user_count) * 100 : 0;
                    return (
                      <TableRow key={stat.role_name}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(stat.role_name, roles.find(r => r.name === stat.role_name)?.level || 1)}
                            <span className="font-medium">{stat.role_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{stat.user_count}</TableCell>
                        <TableCell>{stat.active_users}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 max-w-[100px]">
                              <Progress value={activityRate} className="h-2" />
                            </div>
                            <span className="text-sm">{activityRate.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{stat.permissions_count}</TableCell>
                        <TableCell>{new Date(stat.last_updated).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RolePermissionDashboard;