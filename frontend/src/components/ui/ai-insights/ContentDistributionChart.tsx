'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AIContentDistribution, AIContentCategory } from '@/services/instagramApi'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface ContentDistributionChartProps {
  distribution: AIContentDistribution
  primaryContentType?: AIContentCategory | null
  className?: string
}

// Color mapping for different content categories
const CATEGORY_COLORS: Record<string, string> = {
  'Fashion & Beauty': '#E91E63',
  'Food & Dining': '#FF9800', 
  'Travel & Adventure': '#2196F3',
  'Technology & Gadgets': '#9C27B0',
  'Fitness & Health': '#4CAF50',
  'Home & Lifestyle': '#795548',
  'Business & Professional': '#607D8B',
  'Art & Creativity': '#FF5722',
  'Entertainment': '#F44336',
  'Education & Learning': '#3F51B5',
  'Sports & Recreation': '#009688',
  'Family & Personal': '#FFEB3B',
  'Photography': '#000000',
  'Music & Audio': '#8BC34A',
  'Automotive': '#FFC107',
  'Gaming': '#673AB7',
  'Nature & Outdoors': '#4CAF50',
  'Shopping & Reviews': '#FF4081',
  'News & Politics': '#424242',
  'General': '#9E9E9E'
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white p-3 rounded-lg border shadow-lg">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          {(data.value * 100).toFixed(1)}% of content
        </p>
        <p className="text-xs text-gray-500">
          {data.payload.postCount} posts analyzed
        </p>
      </div>
    )
  }
  return null
}

// Custom legend component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {payload.map((entry: any, index: number) => (
        <Badge
          key={index}
          variant="outline"
          className="text-xs"
          style={{ 
            borderColor: entry.color,
            color: entry.color
          }}
        >
          {entry.value}: {(entry.payload.percentage * 100).toFixed(1)}%
        </Badge>
      ))}
    </div>
  )
}

export function ContentDistributionChart({ 
  distribution, 
  primaryContentType, 
  className 
}: ContentDistributionChartProps) {
  // Convert distribution data to chart format
  const chartData = React.useMemo(() => {
    return Object.entries(distribution)
      .filter(([_, percentage]) => percentage > 0)
      .map(([category, percentage]) => ({
        name: category,
        value: percentage,
        percentage: percentage,
        postCount: Math.round(percentage * 100), // Approximate post count
        color: CATEGORY_COLORS[category] || '#9E9E9E'
      }))
      .sort((a, b) => b.value - a.value)
  }, [distribution])

  // Calculate total categories and primary percentage
  const totalCategories = chartData.length
  const primaryPercentage = primaryContentType ? 
    (distribution[primaryContentType] || 0) * 100 : 0

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Content Distribution
          </CardTitle>
          <CardDescription>
            AI-powered content category analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No content analysis available yet</p>
            <p className="text-sm">AI analysis will appear here once processing is complete</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Content Distribution
        </CardTitle>
        <CardDescription>
          AI analysis of {totalCategories} content categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Primary content type highlight */}
          {primaryContentType && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border">
              <div>
                <p className="font-semibold text-sm">Primary Content Type</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {primaryContentType}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {primaryPercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">of content</p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={entry.color}
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <CustomLegend payload={chartData} />

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{totalCategories}</p>
              <p className="text-sm text-muted-foreground">Categories Detected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {primaryPercentage > 0 ? `${primaryPercentage.toFixed(0)}%` : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Primary Focus</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}