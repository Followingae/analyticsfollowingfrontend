'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, TrendingUp, Users, DollarSign, Clock } from 'lucide-react'

export function ProposalDashboard() {
  const proposalStats = {
    totalProposals: 156,
    pendingProposals: 23,
    acceptedProposals: 89,
    rejectedProposals: 44,
    averageResponseTime: 3.2,
    acceptanceRate: 57.1,
    totalRevenue: 127500
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proposal Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and track brand proposals
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Proposal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalStats.totalProposals}</div>
            <p className="text-xs text-muted-foreground">
              {proposalStats.pendingProposals} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{proposalStats.acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {proposalStats.acceptedProposals} accepted proposals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${proposalStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From accepted proposals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalStats.averageResponseTime} days</div>
            <p className="text-xs text-muted-foreground">
              Time to first response
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Proposals</CardTitle>
          <CardDescription>Latest proposal activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: 1, brand: 'TechCorp Ltd.', service: 'Influencer Campaign', status: 'pending', value: '$5,000', date: '2 hours ago' },
              { id: 2, brand: 'Fashion Brand', service: 'Content Creation', status: 'accepted', value: '$3,500', date: '1 day ago' },
              { id: 3, brand: 'Startup Inc.', service: 'Brand Partnership', status: 'under_review', value: '$2,000', date: '2 days ago' }
            ].map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{proposal.brand}</p>
                    <p className="text-sm text-muted-foreground">{proposal.service}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={
                    proposal.status === 'accepted' ? 'default' :
                    proposal.status === 'pending' ? 'secondary' : 'outline'
                  }>
                    {proposal.status.replace('_', ' ')}
                  </Badge>
                  <div className="text-right">
                    <p className="font-medium">{proposal.value}</p>
                    <p className="text-sm text-muted-foreground">{proposal.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}