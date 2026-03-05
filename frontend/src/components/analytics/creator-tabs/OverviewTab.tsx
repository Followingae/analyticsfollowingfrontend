'use client'

import React, { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
} from 'recharts'
import {
  Globe,
  BarChart3,
  Target,
  Sparkles,
  TrendingUp,
  Quote,
} from 'lucide-react'
import { normalizeFancyUnicode } from '@/utils/formatUtils'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OverviewTabProps {
  profile: any
  aiAnalysis: any
  engagement: any
  audience: any
  content: any
  analyticsSum: any
}

// ---------------------------------------------------------------------------
// Safe formatting helpers
// ---------------------------------------------------------------------------

const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = Number(value)
  return isNaN(num) ? '0' : num.toFixed(decimals)
}

const safePercentage = (value: any, decimals: number = 1): string => {
  const num = Number(value)
  if (isNaN(num)) return '0'
  if (num > 1) return num.toFixed(decimals)
  return (num * 100).toFixed(decimals)
}

const CHART_COLOR_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

// Map language codes to readable names
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ru: 'Russian',
  hi: 'Hindi',
  tr: 'Turkish',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  da: 'Danish',
  fi: 'Finnish',
  no: 'Norwegian',
  th: 'Thai',
  id: 'Indonesian',
  vi: 'Vietnamese',
  ur: 'Urdu',
  fa: 'Persian',
  he: 'Hebrew',
}

const getLanguageName = (code: string): string =>
  LANGUAGE_NAMES[code.toLowerCase()] || code.toUpperCase()

// ---------------------------------------------------------------------------
// Sub-components (matching AudienceTab MetricCard pattern)
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  suffix,
  icon: Icon,
  colorClass,
}: {
  label: string
  value: string
  suffix?: string
  icon: React.ElementType
  colorClass: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${colorClass}`}>
              {value}{suffix}
            </p>
          </div>
          <div className="rounded-lg p-2.5 bg-muted">
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function OverviewTab({
  profile,
  aiAnalysis,
  engagement,
  audience,
  content,
  analyticsSum,
}: OverviewTabProps) {
  // --- Content Distribution chart data ---
  const contentDistData = useMemo(() => {
    if (!aiAnalysis?.content_distribution) return null
    const entries = Object.entries(aiAnalysis.content_distribution)
      .filter(([, v]) => v != null && Number(v) > 0)
      .sort(([, a]: [string, any], [, b]: [string, any]) => Number(b) - Number(a))
    if (entries.length === 0) return null

    const data = entries.map(([category, percentage], i) => ({
      category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
      percentage: Number(percentage),
      fill: `var(--color-${category.toLowerCase().replace(/\s+/g, '_')})`,
    }))

    const config: ChartConfig = {
      percentage: { label: 'Percentage' },
    }
    entries.forEach(([category], i) => {
      const key = category.toLowerCase().replace(/\s+/g, '_')
      config[key] = {
        label: category.charAt(0).toUpperCase() + category.slice(1),
        color: CHART_COLOR_VARS[i % CHART_COLOR_VARS.length],
      }
    })

    return { data, config }
  }, [aiAnalysis?.content_distribution])

  // --- Language Distribution chart data ---
  const langDistData = useMemo(() => {
    if (!aiAnalysis?.language_distribution) return null
    const entries = Object.entries(aiAnalysis.language_distribution)
      .filter(([, v]) => v != null && Number(v) > 0)
      .sort(([, a]: [string, any], [, b]: [string, any]) => Number(b) - Number(a))
    if (entries.length === 0) return null

    const primaryLang = entries[0][0]
    const primaryValue = Number(entries[0][1])

    const data = entries.map(([lang, val], i) => ({
      language: getLanguageName(lang),
      value: Number(val),
      fill: CHART_COLOR_VARS[i % CHART_COLOR_VARS.length],
    }))

    const config: ChartConfig = { value: { label: 'Percentage' } }
    entries.forEach(([lang], i) => {
      config[getLanguageName(lang)] = {
        label: getLanguageName(lang),
        color: CHART_COLOR_VARS[i % CHART_COLOR_VARS.length],
      }
    })

    return { data, config, primaryLang, primaryValue }
  }, [aiAnalysis?.language_distribution])

  const hasCharts = contentDistData || langDistData
  const hasSummary = aiAnalysis && Object.keys(aiAnalysis).length > 0

  // Empty state
  if (!hasCharts && !hasSummary) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Overview data not available</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Content distribution, language analysis, and profile summary will appear here
            once enough data has been collected and analyzed for this creator.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Section 1: Creator Profile Summary ─── */}
      {hasSummary && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Profile Summary
          </h3>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Creator Profile Summary
              </CardTitle>
              <CardDescription>
                AI-powered overview of this creator's content and style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Bio */}
              {profile.biography && (
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-0.5 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    bio
                  </span>
                  <p className="text-sm text-muted-foreground font-sans tracking-normal leading-relaxed capitalize">
                    {normalizeFancyUnicode(profile.biography).toLowerCase()}
                  </p>
                </div>
              )}

              {/* Metric cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {aiAnalysis.primary_content_type && (
                  <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-1">
                    <span className="text-sm text-muted-foreground">Primary Content</span>
                    <Badge variant="default" className="capitalize text-sm">
                      {aiAnalysis.primary_content_type}
                    </Badge>
                  </div>
                )}

                {aiAnalysis.content_quality_score != null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Content Quality</span>
                      <span className="text-sm font-semibold">
                        {safeToFixed(aiAnalysis.content_quality_score, 1)}/100
                      </span>
                    </div>
                    <Progress
                      value={Math.min(Number(aiAnalysis.content_quality_score), 100)}
                      className="h-2"
                    />
                  </div>
                )}

                {aiAnalysis.avg_sentiment_score != null && (
                  <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-1">
                    <span className="text-sm text-muted-foreground">Content Tone</span>
                    <Badge variant="secondary" className="text-xs">
                      {Number(aiAnalysis.avg_sentiment_score) >= 0.3
                        ? 'Positive'
                        : Number(aiAnalysis.avg_sentiment_score) >= -0.1
                          ? 'Neutral'
                          : 'Mixed'}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Section 2: Content & Language Distribution ─── */}
      {hasCharts && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Content & Language
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Distribution - Horizontal Bar Chart */}
            {contentDistData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4" />
                    Content Distribution
                  </CardTitle>
                  <CardDescription>AI-classified content categories across posts</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={contentDistData.config}
                    className="h-[250px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={contentDistData.data}
                      layout="vertical"
                      margin={{ left: 4, right: 24 }}
                    >
                      <YAxis
                        dataKey="category"
                        type="category"
                        tickLine={false}
                        tickMargin={8}
                        axisLine={false}
                        width={100}
                        tickFormatter={(value) => {
                          const item = contentDistData.config[
                            value.toLowerCase().replace(/\s+/g, '_')
                          ]
                          return (item?.label as string) || value
                        }}
                      />
                      <XAxis
                        dataKey="percentage"
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <CartesianGrid horizontal={false} />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value) => `${safeToFixed(value, 1)}%`}
                          />
                        }
                      />
                      <Bar
                        dataKey="percentage"
                        layout="vertical"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Language Distribution - Donut Pie Chart */}
            {langDistData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4" />
                    Language Distribution
                  </CardTitle>
                  <CardDescription>Languages detected across analyzed posts</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={langDistData.config}
                    className="mx-auto aspect-square max-h-[260px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value, name) => (
                              <span>
                                {name}: {safeToFixed(value)}%
                              </span>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={langDistData.data}
                        dataKey="value"
                        nameKey="language"
                        innerRadius={60}
                        outerRadius={90}
                        strokeWidth={3}
                        stroke="var(--background)"
                      >
                        {langDistData.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-2xl font-bold"
                                  >
                                    {safeToFixed(langDistData.primaryValue, 0)}%
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 20}
                                    className="fill-muted-foreground text-xs"
                                  >
                                    {getLanguageName(langDistData.primaryLang)}
                                  </tspan>
                                </text>
                              )
                            }
                          }}
                        />
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="language" />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { OverviewTab }
