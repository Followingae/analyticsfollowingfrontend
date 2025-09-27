"use client"

import { useState, useEffect } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService } from "@/services/superadminApi"
import { toast } from "sonner"
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
  Settings,
  Shield,
  Flag,
  Database,
  Bell,
  Key,
  Globe,
  Server,
  AlertTriangle,
  CheckCircle,
  Save
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default function SuperadminSettingsPage() {
  const [systemConfigurations, setSystemConfigurations] = useState<any>(null)
  const [featureFlags, setFeatureFlags] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<any>("")

  const loadSettingsData = async () => {
    try {
      setLoading(true)
      const [configResult, flagsResult] = await Promise.all([
        superadminApiService.getSystemConfigurations(),
        superadminApiService.getFeatureFlags()
      ])

      if (configResult.success && configResult.data) {
        setSystemConfigurations(configResult.data)
      }

      if (flagsResult.success && flagsResult.data) {
        setFeatureFlags(flagsResult.data)
      }
    } catch (error) {
      toast.error('Failed to load settings data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateConfiguration = async (configKey: string, newValue: any, description?: string) => {
    try {
      setSaving(true)
      const result = await superadminApiService.updateSystemConfiguration(
        configKey,
        newValue,
        description,
        false // requires_restart - could be made configurable
      )

      if (result.success) {
        toast.success(`Configuration "${configKey}" updated successfully`)
        setEditingConfig(null)
        setEditingValue("")
        loadSettingsData() // Refresh data
      } else {
        toast.error(result.error || 'Failed to update configuration')
      }
    } catch (error) {
      toast.error('Network error while updating configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleFeatureFlag = async (flagId: string, enabled: boolean) => {
    try {
      const result = await superadminApiService.toggleFeatureFlag(
        flagId,
        enabled,
        100, // rollout percentage
        [] // target segments
      )

      if (result.success) {
        toast.success(`Feature flag "${flagId}" ${enabled ? 'enabled' : 'disabled'}`)
        loadSettingsData() // Refresh data
      } else {
        toast.error(result.error || 'Failed to toggle feature flag')
      }
    } catch (error) {
      toast.error('Network error while toggling feature flag')
    }
  }

  useEffect(() => {
    loadSettingsData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Platform Settings</h1>
                  <p className="text-muted-foreground">Configure system settings and feature flags</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={loadSettingsData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="configurations" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="configurations">System Configurations</TabsTrigger>
                  <TabsTrigger value="features">Feature Flags</TabsTrigger>
                </TabsList>

                {/* System Configurations Tab */}
                <TabsContent value="configurations" className="space-y-6">
                  {loading ? (
                    <Card>
                      <CardContent className="py-12">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ) : systemConfigurations ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          System Configurations
                        </CardTitle>
                        <CardDescription>
                          Core platform settings and runtime configurations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(systemConfigurations.configurations || {}).map(([key, config]: [string, any]) => (
                            <div key={key} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{key}</h4>
                                    {config.requires_restart && (
                                      <Badge variant="destructive" className="text-xs">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Restart Required
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {config.description || 'No description available'}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingConfig(key)
                                    setEditingValue(config.value)
                                  }}
                                  disabled={saving}
                                >
                                  Edit
                                </Button>
                              </div>

                              <div className="grid gap-2 md:grid-cols-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Current Value: </span>
                                  <span className="font-medium">
                                    {editingConfig === key ? (
                                      <Input
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="mt-1"
                                        autoFocus
                                      />
                                    ) : (
                                      typeof config.value === 'boolean' ? (
                                        config.value ? 'Enabled' : 'Disabled'
                                      ) : (
                                        JSON.stringify(config.value)
                                      )
                                    )}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Last Updated: </span>
                                  <span className="font-medium">
                                    {config.last_updated ? formatDate(config.last_updated) : 'Never'}
                                  </span>
                                </div>
                              </div>

                              {editingConfig === key && (
                                <div className="flex items-center gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateConfiguration(key, editingValue, config.description)}
                                    disabled={saving}
                                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingConfig(null)
                                      setEditingValue("")
                                    }}
                                    disabled={saving}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}

                          {Object.keys(systemConfigurations.configurations || {}).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              No system configurations found
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Failed to load system configurations
                    </div>
                  )}
                </TabsContent>

                {/* Feature Flags Tab */}
                <TabsContent value="features" className="space-y-6">
                  {loading ? (
                    <Card>
                      <CardContent className="py-12">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ) : featureFlags ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Flag className="h-5 w-5" />
                          Feature Flags
                        </CardTitle>
                        <CardDescription>
                          Control feature availability and rollout across the platform
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(featureFlags || {}).map(([flagId, flag]: [string, any]) => (
                            <div key={flagId} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {flag.enabled ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                    )}
                                    <h4 className="font-medium">{flagId}</h4>
                                  </div>
                                  <Badge variant={flag.enabled ? "default" : "secondary"}>
                                    {flag.enabled ? 'Enabled' : 'Disabled'}
                                  </Badge>
                                </div>
                                <Switch
                                  checked={flag.enabled}
                                  onCheckedChange={(checked) => handleToggleFeatureFlag(flagId, checked)}
                                />
                              </div>

                              <div className="grid gap-2 md:grid-cols-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Rollout: </span>
                                  <span className="font-medium">{flag.rollout_percentage}%</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Target Segments: </span>
                                  <span className="font-medium">
                                    {flag.target_segments?.length ? flag.target_segments.join(', ') : 'All users'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Created: </span>
                                  <span className="font-medium">
                                    {flag.created_at ? formatDate(flag.created_at) : 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}

                          {Object.keys(featureFlags || {}).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              No feature flags configured
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Failed to load feature flags
                    </div>
                  )}
                </TabsContent>
              </Tabs>
      </div>
    </SuperadminLayout>
  )
}