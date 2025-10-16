"use client"

import { useState, useEffect } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService } from "@/services/superadminApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  RefreshCw,
  Shield,
  Plus,
  Edit,
  Users,
  Lock,
  Key,
  Crown,
  UserCheck,
  Settings
} from "lucide-react"
import { toast } from "sonner"

interface Role {
  id: string
  role_name: string
  permissions: Record<string, any>
  role_level: number
  description: string
  user_count?: number
}

interface PermissionMatrix {
  categories: Array<{
    name: string
    permissions: Array<{
      key: string
      name: string
      description: string
      default_roles: string[]
    }>
  }>
}

export const dynamic = 'force-dynamic'

export default function SuperadminAccessPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isEditPermissionsOpen, setIsEditPermissionsOpen] = useState(false)

  // New role form state
  const [newRole, setNewRole] = useState({
    role_name: '',
    description: '',
    role_level: 1,
    permissions: {} as Record<string, boolean>
  })

  // Permission editing state
  const [editingPermissions, setEditingPermissions] = useState<Record<string, boolean>>({})

  const loadAccessData = async () => {
    try {
      setLoading(true)

      const [rolesResult, matrixResult] = await Promise.all([
        superadminApiService.getRoles(),
        superadminApiService.getPermissionMatrix()
      ])

      if (rolesResult.success && rolesResult.data) {
        setRoles(rolesResult.data)
      } else {
        console.warn('Roles API failed:', rolesResult.error)
      }

      if (matrixResult.success && matrixResult.data) {
        setPermissionMatrix(matrixResult.data)
      } else {
        console.warn('Permission matrix API failed:', matrixResult.error)
      }

    } catch (error) {
      console.error('Failed to load access data:', error)
      toast.error('Failed to load access control data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccessData()
  }, [])

  const handleCreateRole = async () => {
    if (!newRole.role_name.trim() || !newRole.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const result = await superadminApiService.createRole({
        role_name: newRole.role_name,
        permissions: newRole.permissions,
        role_level: newRole.role_level,
        description: newRole.description
      })

      if (result.success) {
        toast.success('Role created successfully')
        setIsCreateRoleOpen(false)
        setNewRole({ role_name: '', description: '', role_level: 1, permissions: {} })
        loadAccessData()
      } else {
        toast.error(result.error || 'Failed to create role')
      }
    } catch (error) {
      toast.error('Network error while creating role')
    }
  }

  const handleUpdatePermissions = async () => {
    if (!selectedRole) return

    try {
      const result = await superadminApiService.updateRolePermissions(
        selectedRole.id,
        editingPermissions,
        true
      )

      if (result.success) {
        toast.success('Permissions updated successfully')
        setIsEditPermissionsOpen(false)
        setSelectedRole(null)
        loadAccessData()
      } else {
        toast.error(result.error || 'Failed to update permissions')
      }
    } catch (error) {
      toast.error('Network error while updating permissions')
    }
  }

  const getRoleLevelColor = (level: number) => {
    if (level >= 100) return 'bg-red-100 text-red-800' // Superadmin
    if (level >= 50) return 'bg-purple-100 text-purple-800' // Admin
    if (level >= 10) return 'bg-blue-100 text-blue-800' // Manager
    return 'bg-green-100 text-green-800' // User
  }

  const getRoleLevelIcon = (level: number) => {
    if (level >= 100) return <Crown className="h-4 w-4" />
    if (level >= 50) return <Shield className="h-4 w-4" />
    if (level >= 10) return <UserCheck className="h-4 w-4" />
    return <Users className="h-4 w-4" />
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Access Control</h1>
            <p className="text-muted-foreground">
              Manage user roles, permissions, and access levels across the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadAccessData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Define a new role with custom permissions and access level
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Role Name</label>
                    <Input
                      placeholder="e.g., Content Manager"
                      value={newRole.role_name}
                      onChange={(e) => setNewRole(prev => ({ ...prev, role_name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      placeholder="Brief description of role responsibilities"
                      value={newRole.description}
                      onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Access Level (1-100)</label>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={newRole.role_level}
                      onChange={(e) => setNewRole(prev => ({ ...prev, role_level: parseInt(e.target.value) || 1 }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher numbers = more privileges (100 = superadmin)
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRole}>
                    Create Role
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  System Roles ({roles.length})
                </CardTitle>
                <CardDescription>
                  Manage platform roles and their associated permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-muted-foreground">Loading roles...</p>
                    </div>
                  </div>
                ) : roles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRoleLevelIcon(role.role_level)}
                              <span className="font-medium">{role.role_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleLevelColor(role.role_level)} variant="secondary">
                              Level {role.role_level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {role.user_count || 0}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-sm text-muted-foreground">
                              {role.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRole(role)
                                setEditingPermissions(role.permissions || {})
                                setIsEditPermissionsOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Roles Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first role to start managing access control
                    </p>
                    <Button onClick={() => setIsCreateRoleOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Role
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Permission Matrix
                </CardTitle>
                <CardDescription>
                  Overview of available permissions and their default role assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {permissionMatrix ? (
                  <div className="space-y-6">
                    {permissionMatrix.categories.map((category, idx) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="text-lg font-semibold capitalize">{category.name}</h3>
                        <div className="grid gap-3">
                          {category.permissions.map((permission, permIdx) => (
                            <div key={permIdx} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-sm text-muted-foreground">{permission.description}</div>
                              </div>
                              <div className="flex gap-1">
                                {permission.default_roles.map((role, roleIdx) => (
                                  <Badge key={roleIdx} variant="outline" className="text-xs">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Permission Matrix Unavailable</h3>
                    <p className="text-muted-foreground">
                      Unable to load permission matrix at this time
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Permissions Dialog */}
        <Dialog open={isEditPermissionsOpen} onOpenChange={setIsEditPermissionsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Role Permissions</DialogTitle>
              <DialogDescription>
                {selectedRole ? `Configure permissions for ${selectedRole.role_name}` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              {permissionMatrix && Object.entries(editingPermissions).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    <div className="text-sm text-muted-foreground">
                      Allow access to {key.toLowerCase()} functionality
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      setEditingPermissions(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditPermissionsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePermissions}>
                Update Permissions
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperadminLayout>
  )
}