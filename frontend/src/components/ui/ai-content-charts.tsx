"use client"

import React from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  PieChart as PieIcon, 
  BarChart3, 
  TrendingUp, 
  Languages, 
  Sparkles, 
  Brain,
  Tag
} from "lucide-react"

interface AIContentDistribution {
  [category: string]: number // 0.0 to 1.0
}

interface AILanguageDistribution {
  [languageCode: string]: number // 0.0 to 1.0
}

interface AIContentChartsProps {
  contentDistribution?: AIContentDistribution | null
  languageDistribution?: AILanguageDistribution | null
  primaryContentType?: string | null
  sentimentScore?: number | null
  qualityScore?: number | null
  compact?: boolean
}

// Color palettes for charts
const CONTENT_COLORS = [
  "#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", 
  "#EF4444", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
]

const LANGUAGE_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B",
  "#10B981", "#06B6D4", "#84CC16", "#F97316", "#3B82F6"
]

export function AIContentCharts({ 
  contentDistribution, 
  languageDistribution, 
  primaryContentType,
  sentimentScore,
  qualityScore,
  compact = false 
}: AIContentChartsProps) {
  
  // Transform content distribution data for charts
  const contentData = contentDistribution ? 
    Object.entries(contentDistribution)
      .map(([category, percentage], index) => ({
        name: category,
        value: Number((percentage * 100).toFixed(1)),
        percentage: percentage,
        color: CONTENT_COLORS[index % CONTENT_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Top 8 categories
    : []

  // Transform language distribution data for charts
  const languageData = languageDistribution ?
    Object.entries(languageDistribution)
      .map(([lang, percentage], index) => ({
        name: lang.toUpperCase(),
        value: Number((percentage * 100).toFixed(1)),
        percentage: percentage,
        color: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6) // Top 6 languages
    : []

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{`${label}`}</p>
          <p className="text-sm text-muted-foreground">
            {`${payload[0].value}% of content`}
          </p>
        </div>
      )
    }
    return null
  }

  // Sentiment visualization data
  const sentimentData = sentimentScore !== null && sentimentScore !== undefined ? [
    { name: 'Positive', value: sentimentScore > 0 ? Math.abs(sentimentScore) * 100 : 0, color: '#10B981' },
    { name: 'Neutral', value: Math.abs(sentimentScore) < 0.1 ? 50 : 0, color: '#6B7280' },
    { name: 'Negative', value: sentimentScore < 0 ? Math.abs(sentimentScore) * 100 : 0, color: '#EF4444' }
  ].filter(item => item.value > 0) : []

  if (compact) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {/* Compact Content Distribution */}
        {contentData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600" />
                Content Mix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={contentData.slice(0, 4)}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {contentData.slice(0, 4).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Compact Language Distribution */}
        {languageData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Languages className="h-4 w-4 text-purple-600" />
                Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {languageData.slice(0, 3).map((lang, index) => (
                  <div key={lang.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{lang.name}</span>
                      <span>{lang.value}%</span>
                    </div>
                    <Progress value={lang.value} className="h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <PieIcon className="h-4 w-4" />
            Content Mix
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Languages
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* Content Distribution Charts */}
        <TabsContent value="content" className="space-y-4">
          {contentData.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-blue-600" />
                    Content Category Distribution
                  </CardTitle>
                  <CardDescription>
                    AI-analyzed content categories across all posts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={contentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {contentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Category Breakdown
                  </CardTitle>
                  <CardDescription>
                    Detailed breakdown by percentage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={contentData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                        {contentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No content distribution data available yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Language Distribution Charts */}
        <TabsContent value="language" className="space-y-4">
          {languageData.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Language Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-purple-600" />
                    Language Distribution
                  </CardTitle>
                  <CardDescription>
                    Languages detected in content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={languageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {languageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Language Progress Bars */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Language Breakdown
                  </CardTitle>
                  <CardDescription>
                    Percentage of content in each language
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {languageData.map((lang, index) => (
                    <div key={lang.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: lang.color }}
                          />
                          <span className="text-sm font-medium">{lang.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {lang.value}%
                        </Badge>
                      </div>
                      <Progress value={lang.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Languages className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No language distribution data available yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Insights Overview */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Primary Content Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-blue-600" />
                  Primary Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {primaryContentType || 'Mixed Content'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Main content category
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Score */}
            {sentimentScore !== null && sentimentScore !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-2 ${
                      sentimentScore > 0.1 ? 'text-green-600' : 
                      sentimentScore < -0.1 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {sentimentScore > 0.1 ? 'Positive' : 
                       sentimentScore < -0.1 ? 'Negative' : 'Neutral'}
                    </div>
                    <Progress 
                      value={Math.abs(sentimentScore) * 100} 
                      className="h-2 mb-2" 
                    />
                    <p className="text-xs text-muted-foreground">
                      Score: {sentimentScore.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quality Score */}
            {qualityScore !== null && qualityScore !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-600" />
                    Quality Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-2">
                      {Math.round(qualityScore * 100)}%
                    </div>
                    <Progress value={qualityScore * 100} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Content quality assessment
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sentiment Visualization */}
          {sentimentData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Sentiment Analysis
                </CardTitle>
                <CardDescription>
                  Overall emotional tone of content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={sentimentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}