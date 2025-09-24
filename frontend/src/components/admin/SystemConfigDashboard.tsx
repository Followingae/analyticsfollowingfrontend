'use client'

import { useState, useEffect } from 'react'
import { superadminApiService, SystemConfiguration } from '@/services/superadminApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Settings,
  Flag,
  Toggle,
  Sliders,
  Code,
  Database,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Edit,
  Plus,
  Trash2,
  AlertCircle,
  Target,
  Activity,
  BarChart3
} from 'lucide-react'

export function SystemConfigDashboard() {
  const [configData, setConfigData] = useState<SystemConfiguration | null>(null)
  const [featureFlagsData, setFeatureFlagsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [newConfigKey, setNewConfigKey] = useState('')
  const [newConfigValue, setNewConfigValue] = useState('')
  const [newConfigDescription, setNewConfigDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const loadConfigData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [configResult, flagsResult] = await Promise.all([
        superadminApiService.getSystemConfigurations(),
        superadminApiService.getFeatureFlags()
      ])

      if (configResult.success) {
        setConfigData(configResult.data!)
      } else {
        console.warn('Config API failed:', configResult.error)
      }

      if (flagsResult.success) {
        setFeatureFlagsData(flagsResult.data)
      } else {
        console.warn('Feature flags API failed:', flagsResult.error)
      }
    } catch (error) {
      setError('Failed to load system configuration data')
      console.error('System config error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfigData()
  }, [])

  const handleUpdateConfig = async (key: string, value: any, description?: string, requiresRestart = false) => {
    setSaving(key)
    try {
      const result = await superadminApiService.updateSystemConfiguration(key, value, description, requiresRestart)
      if (result.success) {
        await loadConfigData() // Reload to get updated data
      } else {
        console.error('Failed to update config:', result.error)
      }
    } catch (error) {
      console.error('Config update error:', error)
    } finally {
      setSaving(null)
    }
  }

  const handleToggleFeatureFlag = async (flagId: string, enabled: boolean, rolloutPercentage = 100, targetSegments: string[] = []) => {
    setSaving(flagId)
    try {
      const result = await superadminApiService.toggleFeatureFlag(flagId, enabled, rolloutPercentage, targetSegments)
      if (result.success) {
        await loadConfigData() // Reload to get updated data
      } else {
        console.error('Failed to toggle feature flag:', result.error)
      }
    } catch (error) {
      console.error('Feature flag update error:', error)
    } finally {
      setSaving(null)
    }
  }

  const getConfigValueType = (value: any) => {
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'string') {
      if (value.includes('\n') || value.length > 100) return 'text'
      try {
        JSON.parse(value)
        return 'json'
      } catch {
        return 'string'
      }
    }
    if (typeof value === 'object') return 'json'
    return 'string'
  }

  const renderConfigValue = (key: string, config: any) => {
    const type = getConfigValueType(config.value)
    const isLoading = saving === key

    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.value}
              onCheckedChange={(checked) => handleUpdateConfig(key, checked, config.description, config.requires_restart)}
              disabled={isLoading}
            />
            <span className="text-sm">{config.value ? 'Enabled' : 'Disabled'}</span>
          </div>
        )
      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={config.value}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value)
                if (!isNaN(newValue)) {
                  handleUpdateConfig(key, newValue, config.description, config.requires_restart)
                }
              }}
              className="w-32"
              disabled={isLoading}
            />
            {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </div>
        )
      case 'text':
        return (
          <Button variant="outline" size="sm" onClick={() => setSelectedConfig({ key, ...config })}>
            <Edit className="mr-2 h-3 w-3" />
            Edit Text
          </Button>
        )
      case 'json':
        return (
          <Button variant="outline" size="sm" onClick={() => setSelectedConfig({ key, ...config })}>
            <Code className="mr-2 h-3 w-3" />
            Edit JSON
          </Button>
        )
      default:
        return (
          <div className="flex items-center space-x-2">
            <Input
              value={config.value}
              onChange={(e) => handleUpdateConfig(key, e.target.value, config.description, config.requires_restart)}
              className="min-w-48"
              disabled={isLoading}
            />
            {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </div>
        )
    }
  }

  const filteredConfigs = configData?.configurations
    ? Object.entries(configData.configurations).filter(([key, config]) =>
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (config as any).description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const filteredFlags = featureFlagsData?.feature_flags
    ? Object.entries(featureFlagsData.feature_flags).filter(([key]) =>
        key.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={loadConfigData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  const requiresRestartConfigs = filteredConfigs.filter(([, config]) => (config as any).requires_restart).length
  const totalFlags = filteredFlags.length
  const enabledFlags = filteredFlags.filter(([, flag]) => (flag as any).enabled).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
          <p className="text-muted-foreground">
            Manage system settings, feature flags, and platform configuration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadConfigData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {requiresRestartConfigs > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {requiresRestartConfigs} configuration change(s) require a system restart to take effect.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Configurations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredConfigs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              System configuration keys
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Feature Flags</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{enabledFlags}/{totalFlags}</div>
            <div className="flex items-center space-x-2 mt-1">
              <Progress value={totalFlags > 0 ? (enabledFlags / totalFlags) * 100 : 0} className="flex-1 h-1" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Restart Required</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{requiresRestartConfigs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Configuration changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Tabs */}
      <Tabs defaultValue="configurations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configurations">System Configurations</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    System Configurations
                  </CardTitle>
                  <CardDescription>
                    Manage {filteredConfigs.length} system configuration settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Input
                  placeholder="Search configurations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {/* Configurations Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-64">Configuration Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConfigs.map(([key, config]) => (
                      <TableRow key={key} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-sm font-medium">{key}</TableCell>
                        <TableCell className="min-w-48">
                          {renderConfigValue(key, config)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm text-muted-foreground">
                            {(config as any).description || 'No description'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date((config as any).last_updated).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {(config as any).requires_restart ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Restart Required
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Live
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5" />
                    Feature Flags
                  </CardTitle>
                  <CardDescription>
                    Control feature rollouts and A/B testing with {totalFlags} feature flags
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Feature Flags Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFlags.map(([flagId, flag]) => (
                  <Card key={flagId} className={`relative ${(flag as any).enabled ? 'border-green-200' : 'border-gray-200'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{flagId}</CardTitle>
                        <Switch
                          checked={(flag as any).enabled}
                          onCheckedChange={(enabled) => handleToggleFeatureFlag(flagId, enabled, (flag as any).rollout_percentage, (flag as any).target_segments)}
                          disabled={saving === flagId}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Rollout Percentage */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Rollout</span>
                            <span className="font-medium">{(flag as any).rollout_percentage}%</span>
                          </div>
                          <Progress value={(flag as any).rollout_percentage} className="h-1" />
                        </div>

                        {/* Target Segments */}
                        {(flag as any).target_segments && (flag as any).target_segments.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Target Segments:</div>
                            <div className="flex flex-wrap gap-1">
                              {(flag as any).target_segments.map((segment: string) => (
                                <Badge key={segment} variant="outline" className="text-xs">
                                  {segment}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center justify-between pt-1 border-t">
                          <span className="text-xs text-muted-foreground">
                            Created {new Date((flag as any).created_at).toLocaleDateString()}
                          </span>
                          <Badge variant={(flag as any).enabled ? 'default' : 'secondary'} className="text-xs">
                            {(flag as any).enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredFlags.length === 0 && (
                <div className="text-center py-12">
                  <Flag className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mt-4">No feature flags found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Edit Modal */}
      <Dialog open={!!selectedConfig} onOpenChange={() => setSelectedConfig(null)}>
        <DialogContent className="max-w-2xl">
          {selectedConfig && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Configuration
                </DialogTitle>
                <DialogDescription>
                  Update the configuration value for: {selectedConfig.key}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="config-description">Description</Label>
                  <Input
                    id="config-description"
                    value={selectedConfig.description}
                    onChange={(e) => setSelectedConfig({ ...selectedConfig, description: e.target.value })}
                    placeholder="Configuration description"
                  />
                </div>

                <div>
                  <Label htmlFor="config-value">Value</Label>
                  {getConfigValueType(selectedConfig.value) === 'text' ? (
                    <Textarea
                      id="config-value"
                      value={selectedConfig.value}
                      onChange={(e) => setSelectedConfig({ ...selectedConfig, value: e.target.value })}
                      rows={6}
                    />
                  ) : getConfigValueType(selectedConfig.value) === 'json' ? (
                    <Textarea
                      id="config-value"
                      value={JSON.stringify(selectedConfig.value, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          setSelectedConfig({ ...selectedConfig, value: parsed })
                        } catch {
                          // Keep the string value for now
                        }
                      }}
                      rows={8}
                      className="font-mono"
                    />
                  ) : (
                    <Input
                      id="config-value"
                      value={selectedConfig.value}
                      onChange={(e) => setSelectedConfig({ ...selectedConfig, value: e.target.value })}
                    />
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires-restart"
                    checked={selectedConfig.requires_restart}
                    onCheckedChange={(checked) => setSelectedConfig({ ...selectedConfig, requires_restart: checked })}
                  />
                  <Label htmlFor="requires-restart">Requires system restart</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedConfig(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      handleUpdateConfig(selectedConfig.key, selectedConfig.value, selectedConfig.description, selectedConfig.requires_restart)
                      setSelectedConfig(null)
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}