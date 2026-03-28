"use client"

import { useState, useEffect } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService, SecurityAlert, SuspiciousActivity } from "@/services/superadminApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StandardMetricCard } from "@/components/ui/standard-metric-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Shield, RefreshCw, Eye, Ban, CheckCircle } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function SuperadminSecurityPage() {
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([])
  const [loading, setLoading] = useState(true)

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      const [alertsResult, activitiesResult] = await Promise.all([
        superadminApiService.getSecurityAlerts({ limit: 50 }),
        superadminApiService.getSuspiciousActivities({ limit: 50 })
      ])

      if (alertsResult.success && alertsResult.data) {
        setSecurityAlerts(alertsResult.data.alerts || [])
      }

      if (activitiesResult.success && activitiesResult.data) {
        setSuspiciousActivities(activitiesResult.data.activities || [])
      }
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSecurityData()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
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

  return (
    <SuperadminLayout>
      <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Security & System Health</h1>
                  <p className="text-muted-foreground">Monitor security alerts and suspicious activities</p>
                </div>
                <Button variant="outline" onClick={loadSecurityData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Security Overview Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StandardMetricCard icon={AlertTriangle} label="Total Alerts" value={securityAlerts.length} />
                <StandardMetricCard icon={Shield} label="Critical Alerts" value={securityAlerts.filter(alert => alert.severity === 'critical').length} />
                <StandardMetricCard icon={Eye} label="Suspicious Activities" value={suspiciousActivities.length} />
                <StandardMetricCard icon={Ban} label="High Risk" value={suspiciousActivities.filter(activity => activity.risk_level === 'high' || activity.risk_level === 'critical').length} />
              </div>

              {/* Security Alerts Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Alerts</CardTitle>
                  <CardDescription>Recent security alerts and threats</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alert Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityAlerts.map((alert, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{alert.alert_type}</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>{alert.description}</TableCell>
                          <TableCell>{formatDate(alert.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {alert.resolved ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                              {alert.resolved ? 'Resolved' : 'Active'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {securityAlerts.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No security alerts found
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Suspicious Activities Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Suspicious Activities</CardTitle>
                  <CardDescription>Recent suspicious user activities and behaviors</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activity Type</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suspiciousActivities.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{activity.activity_type}</TableCell>
                          <TableCell>
                            <Badge className={getRiskLevelColor(activity.risk_level)}>
                              {activity.risk_level}
                            </Badge>
                          </TableCell>
                          <TableCell>{activity.description}</TableCell>
                          <TableCell className="font-mono text-sm">{activity.user_id}</TableCell>
                          <TableCell>{formatDate(activity.detected_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {suspiciousActivities.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No suspicious activities detected
                    </div>
                  )}
                </CardContent>
              </Card>
      </div>
    </SuperadminLayout>
  )
}