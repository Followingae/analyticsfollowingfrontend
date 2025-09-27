'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { superadminApi } from '@/services/superadminApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, Line, LineChart, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Pie, PieChart, Cell } from 'recharts'
import {
  FileText,
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Calendar,
  Building,
  Target,
  ArrowUpRight,
  RefreshCw,
  Download,
  Workflow,
  MessageCircle,
  Activity
} from 'lucide-react'

export function ProposalDashboard() {
  const { formatAmount, currencyInfo } = useCurrency()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [proposalData, setProposalData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProposalData = async () => {
    try {
      setLoading(true)
      const [overviewResult, proposalsResult, dashboardResult] = await Promise.all([
        superadminApi.getProposalsOverview(),
        superadminApi.getProposals({ limit: 100 }),
        superadminApi.getProposalsDashboard()
      ])

      if (overviewResult.success && proposalsResult.success && dashboardResult.success) {
        setProposalData({
          overview: overviewResult.data,
          proposals: proposalsResult.data,
          dashboard: dashboardResult.data
        })
      } else {
        console.warn('Proposal API failed:', { overviewResult, proposalsResult, dashboardResult })
      }
      setError(null)
    } catch (err) {
      setError('Failed to load proposal data')
      console.error('Proposal data loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProposalData()
  }, [])


  const chartConfig = {
    proposals: {
      label: 'Total Proposals',
      color: 'hsl(var(--primary))'
    },
    accepted: {
      label: 'Accepted',
      color: 'hsl(var(--primary))'
    },
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--primary))'
    }
  }

  const filteredProposals = useMemo(() => {
    if (!proposalData?.proposals) return []
    return proposalData.proposals.filter((proposal: any) => {
      const matchesSearch = proposal.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           proposal.service?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter, proposalData])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted': return 'default'
      case 'pending': return 'secondary'
      case 'under_review': return 'outline'
      case 'negotiating': return 'secondary'
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-amber-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const formatCurrency = (amountCents: number) => {
    return formatAmount(amountCents)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposal Management</h1>
          <p className="text-muted-foreground">
            Manage brand partnerships, campaigns, and collaboration requests
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Proposal
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalData?.overview?.total_proposals ?? 0}</div>
            <div className="flex items-center space-x-2 mt-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              <span className="text-xs text-emerald-600">+{proposalData?.overview?.monthly_growth ?? 0}%</span>
              <span className="text-xs text-muted-foreground">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acceptance Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{proposalData?.overview?.acceptance_rate ?? 0}%</div>
            <div className="flex items-center space-x-2 mt-1">
              <Progress value={proposalData?.overview?.acceptance_rate ?? 0} className="flex-1 h-1" />
              <span className="text-xs text-muted-foreground">{proposalData?.overview?.accepted_proposals ?? 0} accepted</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalData?.overview?.total_revenue ? `$${proposalData.overview.total_revenue.toLocaleString()}` : '$0'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {proposalData?.overview?.accepted_proposals ?? 0} accepted proposals
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalData?.overview?.average_response_time ?? 0} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average time to respond
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Proposal Trends
            </CardTitle>
            <CardDescription>Monthly proposal submissions and acceptance rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={proposalData?.trends || []}>
                  <defs>
                    <linearGradient id="proposalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="proposals"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#proposalGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="accepted"
                    stroke="hsl(var(--primary))"
                    fillOpacity={0.5}
                    fill="hsl(var(--primary))"
                    strokeWidth={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Status Distribution
            </CardTitle>
            <CardDescription>Current proposal status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proposalData?.status_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {(proposalData?.status_distribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => [
                      `${value} proposals`,
                      props.payload.status
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => `${entry.payload.status} (${entry.payload.count})`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Proposal Management */}
      <Tabs defaultValue="proposals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proposals">All Proposals</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Proposal Directory
                  </CardTitle>
                  <CardDescription>
                    Manage and track {filteredProposals.length} active proposals
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search proposals by brand or service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="negotiating">Negotiating</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Proposals Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-64">Brand & Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Submitted</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals.map((proposal) => (
                      <TableRow key={proposal.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8 border">
                              <AvatarImage src={proposal.brandLogo || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5">
                                {proposal.brand.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm">{proposal.brand}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {proposal.service}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {proposal.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(proposal.value)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(proposal.status)} className="capitalize">
                            {proposal.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`text-xs font-medium ${getPriorityColor(proposal.priority)}`}>
                            {proposal.priority.toUpperCase()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(proposal.submittedDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setSelectedProposal(proposal)}>
                                <Eye className="mr-2 h-3 w-3" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-3 w-3" />
                                Edit Proposal
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageCircle className="mr-2 h-3 w-3" />
                                Add Comment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <CheckCircle2 className="mr-2 h-3 w-3" />
                                Accept
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <XCircle className="mr-2 h-3 w-3" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Pipeline</CardTitle>
              <CardDescription>Track proposals through each stage of the workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { status: 'pending', title: 'Pending Review', count: 23, color: 'bg-amber-100 border-amber-200' },
                  { status: 'under_review', title: 'Under Review', count: 15, color: 'bg-blue-100 border-blue-200' },
                  { status: 'negotiating', title: 'Negotiating', count: 8, color: 'bg-purple-100 border-purple-200' },
                  { status: 'accepted', title: 'Accepted', count: 89, color: 'bg-emerald-100 border-emerald-200' },
                  { status: 'rejected', title: 'Rejected', count: 21, color: 'bg-red-100 border-red-200' }
                ].map((stage) => (
                  <Card key={stage.status} className={`${stage.color}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{stage.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">{stage.count}</div>
                      <div className="space-y-2">
                        {filteredProposals
                          .filter(p => p.status === stage.status)
                          .slice(0, 3)
                          .map((proposal) => (
                            <div key={proposal.id} className="p-2 bg-white/50 rounded border text-xs">
                              <div className="font-medium">{proposal.brand}</div>
                              <div className="text-muted-foreground">{formatCurrency(proposal.value)}</div>
                            </div>
                          ))
                        }
                        {filteredProposals.filter(p => p.status === stage.status).length > 3 && (
                          <div className="text-xs text-muted-foreground text-center pt-1">
                            +{filteredProposals.filter(p => p.status === stage.status).length - 3} more
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trends
                </CardTitle>
                <CardDescription>Monthly revenue from accepted proposals</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={proposalData?.trends || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => {
                          const symbol = currencyInfo?.symbol || '$'
                          return `${symbol}${(value / 1000).toFixed(0)}k`
                        }}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Proposal Details Modal */}
      <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedProposal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={selectedProposal.brandLogo || undefined} />
                    <AvatarFallback>
                      {selectedProposal.brand.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="flex items-center gap-2">
                      {selectedProposal.brand}
                      <Badge variant={getStatusBadgeVariant(selectedProposal.status)} className="capitalize">
                        {selectedProposal.status.replace('_', ' ')}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription>{selectedProposal.service}</DialogDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCurrency(selectedProposal.value)}</div>
                    <div className={`text-xs ${getPriorityColor(selectedProposal.priority)}`}>
                      {selectedProposal.priority.toUpperCase()} PRIORITY
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Project Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Category:</span> {selectedProposal.category}</div>
                      <div><span className="font-medium">Timeline:</span> {selectedProposal.timeline}</div>
                      <div><span className="font-medium">Budget Range:</span> {selectedProposal.budget}</div>
                      <div><span className="font-medium">Submitted:</span> {formatDate(selectedProposal.submittedDate)}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      {selectedProposal.contacts.map((contact: any, index: number) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-muted-foreground">{contact.role}</div>
                          <div className="text-muted-foreground">{contact.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedProposal.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Requirements</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProposal.requirements.map((req: string, index: number) => (
                      <Badge key={index} variant="outline">{req}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Add Comment
                  </Button>
                  <Button variant="outline">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                  <Button>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Status
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