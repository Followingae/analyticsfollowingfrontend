'use client'

import { useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import ProfileSearchTab from '@/components/tabs/ProfileSearchTab'
import DiscoveryTab from '@/components/tabs/DiscoveryTab'
import AnalyticsTab from '@/components/tabs/AnalyticsTab'
import HashtagsTab from '@/components/tabs/HashtagsTab'

export default function Home() {
  const [stats] = useState({
    totalProfiles: '2.5M+',
    activeUsers: '50K+',
    dataPoints: '1B+',
    accuracy: '99.9%'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                F
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Following
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  Instagram Analytics Platform
                </Badge>
              </div>
            </div>
            
            <CardDescription className="text-lg text-gray-600 mb-6">
              Professional Instagram Analytics Platform with AI-powered insights, SmartProxy integration, and comprehensive social media analytics.
            </CardDescription>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.totalProfiles}</div>
                <div className="text-sm text-gray-600">Profiles Analyzed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.activeUsers}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.dataPoints}</div>
                <div className="text-sm text-gray-600">Data Points</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.accuracy}</div>
                <div className="text-sm text-gray-600">Accuracy Rate</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="outline">AI-Powered</Badge>
              <Badge variant="outline">Real-time</Badge>
              <Badge variant="outline">Enterprise Grade</Badge>
              <Badge variant="outline">SmartProxy Integration</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-12">
            <TabsTrigger value="search" className="flex flex-col gap-1">
              <span>🔍</span>
              <span className="text-xs">Profile Search</span>
            </TabsTrigger>
            <TabsTrigger value="discovery" className="flex flex-col gap-1">
              <span>🚀</span>
              <span className="text-xs">Discovery</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col gap-1">
              <span>📊</span>
              <span className="text-xs">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="flex flex-col gap-1">
              <span>#️⃣</span>
              <span className="text-xs">Hashtags</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <ProfileSearchTab />
          </TabsContent>
          
          <TabsContent value="discovery">
            <DiscoveryTab />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
          
          <TabsContent value="hashtags">
            <HashtagsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}