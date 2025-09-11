'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Activity, BarChart3, Users, Heart, PieChart, Shield } from 'lucide-react'

export function AnalyticsLoadingState() {
  return (
    <div className="w-full space-y-6">
      {/* Profile Header Loading */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Loading creator analytics...</p>
              <p className="text-sm text-muted-foreground">
                Fetching profile data and metrics
              </p>
            </div>
            <div className="w-24">
              <Progress value={33} className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Loading */}
      <div className="space-y-4">
        <div className="flex space-x-1 rounded-md bg-muted p-1">
          {[
            { icon: BarChart3, label: 'Overview' },
            { icon: Users, label: 'Audience' },
            { icon: Heart, label: 'Engagement' },
            { icon: PieChart, label: 'Content' },
            { icon: Shield, label: 'Safety' }
          ].map((tab, index) => (
            <div 
              key={index}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm ${
                index === 0 ? 'bg-background shadow-sm' : ''
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </div>
          ))}
        </div>

        {/* Metrics Cards Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-48 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 mb-3" />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-4 w-52 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>

              <div>
                <Skeleton className="h-4 w-36 mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Loading Cards */}
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-4 w-56 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="text-center p-4 rounded-lg border">
                        <Skeleton className="h-6 w-12 mx-auto mb-1" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}