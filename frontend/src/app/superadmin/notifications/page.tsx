"use client"

import { useState, useEffect } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService, SecurityAlert } from "@/services/superadminApi"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Bell,
  AlertTriangle,
  Shield,
  Info,
  CheckCircle,
  Send,
  Eye,
  Plus,
  Calendar,
  Users,
  Activity,
  MessageSquare
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default function SuperadminNotificationsPage() {
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [alertCounts, setAlertCounts] = useState<Record<string, number>>({})
  const [suspiciousActivities, setSuspiciousActivities] = useState<any[]>([])
  const [securityScore, setSecurityScore] = useState<number>(0)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)

  // Broadcast message state
  const [broadcastMessage, setBroadcastMessage] = useState({
    title: '',
    content: '',
    message_type: 'info' as 'info' | 'warning' | 'maintenance' | 'feature',
    require_acknowledgment: false
  })

  // Filters
  const [alertFilters, setAlertFilters] = useState({
    limit: 50,
    severity: 'all'
  })

  const [activityFilters, setActivityFilters] = useState({
    limit: 50,
    severity: 'all',
    user_id: ''
  })

  const loadNotificationsData = async () => {
    try {
      setLoading(true)
      const [alertsResult, activitiesResult] = await Promise.all([
        superadminApiService.getSecurityAlerts(alertFilters.severity !== 'all' ? {
          limit: alertFilters.limit,
          severity: alertFilters.severity
        } : { limit: alertFilters.limit }),
        superadminApiService.getSuspiciousActivities({
          limit: activityFilters.limit,
          ...(activityFilters.severity !== 'all' && { severity: activityFilters.severity }),
          ...(activityFilters.user_id.trim() && { user_id: activityFilters.user_id.trim() })
        })
      ])

      if (alertsResult.success && alertsResult.data) {
        setSecurityAlerts(alertsResult.data.alerts || [])
        setAlertCounts(alertsResult.data.alert_counts || {})
        setSuspiciousActivities(alertsResult.data.suspicious_activities || [])
        setSecurityScore(alertsResult.data.security_score || 0)
        setRecommendations(alertsResult.data.recommendations || [])
      }

      if (activitiesResult.success && activitiesResult.data) {
        setSuspiciousActivities(activitiesResult.data.activities || [])
      }
    } catch (error) {
      toast.error('Failed to load notifications data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleBroadcastMessage = async () => {
    if (!broadcastMessage.title.trim() || !broadcastMessage.content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const result = await superadminApiService.broadcastSystemMessage(broadcastMessage)
      if (result.success) {
        toast.success('System message broadcasted successfully')
        setIsBroadcastOpen(false)
        setBroadcastMessage({
          title: '',
          content: '',
          message_type: 'info',
          require_acknowledgment: false
        })
      } else {
        toast.error(result.error || 'Failed to broadcast message')
      }
    } catch (error) {
      toast.error('Network error while broadcasting message')
    }
  }

  useEffect(() => {
    loadNotificationsData()
  }, [alertFilters, activityFilters])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'maintenance': return <Activity className="h-4 w-4" />
      case 'feature': return <CheckCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">System Notifications</h1>
                  <p className="text-muted-foreground">Monitor security alerts and manage system notifications</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={loadNotificationsData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                    <DialogTrigger asChild>
                      <Button style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Broadcast Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Broadcast System Message</DialogTitle>
                        <DialogDescription>Send a system-wide notification to all users</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium">Message Title</label>
                          <Input
                            placeholder="Enter message title"
                            value={broadcastMessage.title}
                            onChange={(e) => setBroadcastMessage(prev => ({ ...prev, title: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Message Type</label>
                          <Select value={broadcastMessage.message_type} onValueChange={(value: any) =>
                            setBroadcastMessage(prev => ({ ...prev, message_type: value }))
                          }>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">
                                <div className="flex items-center gap-2">
                                  <Info className="h-4 w-4" />
                                  Information
                                </div>
                              </SelectItem>
                              <SelectItem value="warning">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  Warning
                                </div>
                              </SelectItem>
                              <SelectItem value="maintenance">
                                <div className="flex items-center gap-2">
                                  <Activity className="h-4 w-4" />
                                  Maintenance
                                </div>
                              </SelectItem>
                              <SelectItem value="feature">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  New Feature
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Message Content</label>
                          <Textarea
                            placeholder="Enter your message content..."
                            value={broadcastMessage.content}
                            onChange={(e) => setBroadcastMessage(prev => ({ ...prev, content: e.target.value }))}
                            className="mt-1"
                            rows={4}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="require_acknowledgment"
                            checked={broadcastMessage.require_acknowledgment}
                            onChange={(e) => setBroadcastMessage(prev => ({ ...prev, require_acknowledgment: e.target.checked }))}
                            className="rounded"
                          />
                          <label htmlFor="require_acknowledgment" className="text-sm">
                            Require user acknowledgment
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleBroadcastMessage} style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Security Overview */}
              {!loading && (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                      <Shield className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${securityScore >= 80 ? 'text-green-600' : securityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {securityScore}/100
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : 'Needs attention'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">High Alerts</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {alertCounts.high || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Critical issues</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Medium Alerts</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">
                        {alertCounts.medium || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Moderate issues</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
                      <Activity className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {suspiciousActivities.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Flagged activities</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Tabs defaultValue="alerts" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
                  <TabsTrigger value="activities">Suspicious Activities</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>

                {/* Security Alerts Tab */}
                <TabsContent value="alerts" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Security Alerts</CardTitle>
                          <CardDescription>System security alerts and warnings</CardDescription>
                        </div>
                        <Select value={alertFilters.severity} onValueChange={(value) =>
                          setAlertFilters(prev => ({ ...prev, severity: value }))
                        }>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Severities</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="p-4 border rounded-lg animate-pulse">
                              <div className="h-4 w-48 bg-muted rounded mb-2" />
                              <div className="h-3 w-full bg-muted rounded mb-2" />
                              <div className="h-3 w-24 bg-muted rounded" />
                            </div>
                          ))
                        ) : (
                          securityAlerts.map((alert) => (
                            <div key={alert.id} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{alert.title}</h4>
                                    <Badge className={getSeverityBadge(alert.severity)} variant="secondary">
                                      {alert.severity}
                                    </Badge>
                                    {alert.action_required && (
                                      <Badge variant="destructive" className="text-xs">
                                        Action Required
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {alert.message}
                                  </p>
                                  {alert.affected_user && (
                                    <p className="text-xs text-muted-foreground">
                                      Affected User: {alert.affected_user}
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(alert.timestamp)}
                                </span>
                              </div>

                              {alert.suggested_actions.length > 0 && (
                                <div className="mt-3">
                                  <h5 className="text-sm font-medium mb-1">Suggested Actions:</h5>
                                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                    {alert.suggested_actions.map((action, index) => (
                                      <li key={index}>{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))
                        )}

                        {!loading && securityAlerts.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No security alerts found
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Suspicious Activities Tab */}
                <TabsContent value="activities" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Suspicious Activities</CardTitle>
                          <CardDescription>Flagged user activities requiring attention</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="User ID..."
                            value={activityFilters.user_id}
                            onChange={(e) => setActivityFilters(prev => ({ ...prev, user_id: e.target.value }))}
                            className="w-[150px]"
                          />
                          <Select value={activityFilters.severity} onValueChange={(value) =>
                            setActivityFilters(prev => ({ ...prev, severity: value }))
                          }>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Risk Levels</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="p-4 border rounded-lg animate-pulse">
                              <div className="h-4 w-48 bg-muted rounded mb-2" />
                              <div className="h-3 w-full bg-muted rounded mb-2" />
                              <div className="h-3 w-24 bg-muted rounded" />
                            </div>
                          ))
                        ) : (
                          suspiciousActivities.map((activity, index) => (
                            <div key={activity.id || index} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{activity.activity_type || activity.action}</h4>
                                    <Badge className={getSeverityBadge(activity.risk_level || activity.severity)} variant="secondary">
                                      {activity.risk_level || activity.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {activity.description}
                                  </p>
                                  <div className="grid gap-1 md:grid-cols-2 text-xs text-muted-foreground">
                                    {activity.user_id && (
                                      <div>User ID: {activity.user_id}</div>
                                    )}
                                    {activity.ip_address && (
                                      <div>IP: {activity.ip_address}</div>
                                    )}
                                    {activity.user && (
                                      <div>User: {activity.user}</div>
                                    )}
                                    {activity.target && (
                                      <div>Target: {activity.target}</div>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(activity.detected_at || activity.timestamp)}
                                </span>
                              </div>

                              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                  <span className="font-medium">Metadata:</span>
                                  <pre className="text-muted-foreground mt-1">
                                    {JSON.stringify(activity.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))
                        )}

                        {!loading && suspiciousActivities.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No suspicious activities found
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Recommendations</CardTitle>
                      <CardDescription>AI-powered security improvement suggestions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {loading ? (
                          Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="p-3 bg-muted/50 rounded-lg animate-pulse">
                              <div className="h-4 w-full bg-muted rounded" />
                            </div>
                          ))
                        ) : (
                          recommendations.map((recommendation, index) => (
                            <div key={index} className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5 flex-shrink-0" />
                                <p className="text-sm">{recommendation}</p>
                              </div>
                            </div>
                          ))
                        )}

                        {!loading && recommendations.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                            <p>No security recommendations at this time.</p>
                            <p className="text-xs">Your system appears to be secure!</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
      </div>
    </SuperadminLayout>
  )
}