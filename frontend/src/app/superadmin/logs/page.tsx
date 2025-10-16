"use client"

import { useState, useEffect } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService } from "@/services/superadminApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Activity, Search, Filter, User, Calendar } from "lucide-react"
import { toast } from "sonner"

interface AuditLogEntry {
  id: string
  user_id: string
  action: string
  details: any
  timestamp: string
  ip_address: string
}

export const dynamic = 'force-dynamic'

export default function SuperadminLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    user_id: '',
    action_type: 'all',
    severity: 'all',
    date_range: 'all'
  })

  const loadAuditLogs = async () => {
    try {
      setLoading(true)

      const apiFilters: any = {}
      if (filters.user_id.trim()) apiFilters.user_id = filters.user_id.trim()
      if (filters.action_type !== 'all') apiFilters.action_type = filters.action_type
      if (filters.severity !== 'all') apiFilters.severity = filters.severity
      if (filters.date_range !== 'all') {
        // Calculate date range
        const now = new Date()
        let fromDate = new Date()
        switch (filters.date_range) {
          case '24h':
            fromDate.setHours(now.getHours() - 24)
            break
          case '7d':
            fromDate.setDate(now.getDate() - 7)
            break
          case '30d':
            fromDate.setDate(now.getDate() - 30)
            break
        }
        apiFilters.date_range = `${fromDate.toISOString()},${now.toISOString()}`
      }

      const result = await superadminApiService.getAuditLog(apiFilters)
      if (result.success && result.data) {
        setAuditLogs(result.data.audit_logs || [])
      } else {
        console.warn('Audit logs API failed:', result.error)
        toast.error('Failed to load audit logs')
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      toast.error('Network error loading audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuditLogs()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadAuditLogs()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [filters])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'bg-green-100 text-green-800'
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-100 text-red-800'
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-800'
    if (action.includes('login') || action.includes('auth')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Activity Logs</h1>
            <p className="text-muted-foreground">Monitor system and user activity across the platform</p>
          </div>
          <Button variant="outline" onClick={loadAuditLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter audit logs by user, action type, or time period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-2 block">User ID</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by user ID..."
                    value={filters.user_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Action Type</label>
                <Select value={filters.action_type} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, action_type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="login">Authentication</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="admin">Admin Actions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Severity</label>
                <Select value={filters.severity} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, severity: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Time Period</label>
                <Select value={filters.date_range} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, date_range: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Audit Trail ({auditLogs.length})
            </CardTitle>
            <CardDescription>Chronological record of all system activities</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading audit logs...</p>
                </div>
              </div>
            ) : auditLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(log.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{log.user_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)} variant="secondary">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm">
                          {typeof log.details === 'object'
                            ? JSON.stringify(log.details)
                            : log.details || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip_address || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Audit Logs Found</h3>
                <p className="text-muted-foreground mb-4">
                  {Object.values(filters).some(f => f !== 'all' && f !== '')
                    ? 'No logs match your current filters. Try adjusting the filter criteria.'
                    : 'No audit logs are available at this time.'
                  }
                </p>
                <Button variant="outline" onClick={loadAuditLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Logs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperadminLayout>
  )
}