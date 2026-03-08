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
  Sparkles,
  Zap,
  Activity,
  Lightbulb,
  Flame,
  Palette,
  Shirt,
  Utensils,
  Dumbbell,
  Plane,
  Music,
  Gamepad2,
  GraduationCap,
  Heart,
  Camera,
  Briefcase,
  Home,
  Car,
  Baby,
  Dog,
  Laptop,
} from 'lucide-react'

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

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  beauty: Palette,
  fashion: Shirt,
  food: Utensils,
  fitness: Dumbbell,
  travel: Plane,
  music: Music,
  gaming: Gamepad2,
  education: GraduationCap,
  health: Heart,
  photography: Camera,
  lifestyle: Home,
  business: Briefcase,
  automotive: Car,
  parenting: Baby,
  pets: Dog,
  technology: Laptop,
  entertainment: Sparkles,
  sports: Dumbbell,
  art: Palette,
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  create_more_content: 'Post more frequently to build momentum',
  increase_posting_frequency: 'Increase posting frequency for better reach',
  consider_reducing_posting_frequency: 'Reduce posting frequency to maintain quality',
  maintain_current_strategy: 'Current strategy is working — keep it up',
  revise_content_strategy: 'Consider refreshing your content approach',
  focus_on_consistent_quality: 'Focus on more consistent content quality',
  increase_hashtag_usage: 'Use more hashtags to improve discoverability',
  optimize_hashtag_selection: 'Use fewer, more targeted hashtags',
  diversify_content_types: 'Try mixing up content formats',
  install_trend_dependencies: 'Trend analysis data is limited',
  insufficient_data_for_trend_analysis: 'Not enough data for trend analysis yet',
}

const humanizeRecommendation = (raw: string): string => {
  if (RECOMMENDATION_LABELS[raw]) return RECOMMENDATION_LABELS[raw]
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

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

  // --- Engagement patterns data ---
  const behavioral = engagement?.behavioral_patterns
  const trendAnalysis = engagement?.trend_analysis

  const hasEngagementData =
    (behavioral?.posting_consistency != null ||
      behavioral?.engagement_optimization != null ||
      behavioral?.content_strategy_maturity != null ||
      behavioral?.current_stage) ||
    (trendAnalysis?.viral_potential != null ||
      (Array.isArray(trendAnalysis?.optimization_recommendations) &&
        trendAnalysis.optimization_recommendations.length > 0))

  const hasCharts = contentDistData || langDistData
  const hasSummary = aiAnalysis && Object.keys(aiAnalysis).length > 0

  // Empty state
  if (!hasCharts && !hasSummary && !hasEngagementData) {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Content Category */}
            {aiAnalysis.primary_content_type && (() => {
              const category = (aiAnalysis.primary_content_type as string).toLowerCase()
              const CategoryIcon = CATEGORY_ICONS[category] || Sparkles
              return (
                <Card className="relative overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Content Category</p>
                        <p className="text-xl font-bold capitalize">{category}</p>
                        {aiAnalysis.top_3_categories && aiAnalysis.top_3_categories.length > 1 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {aiAnalysis.top_3_categories.slice(1).map((cat: string) => (
                              <Badge key={cat} variant="secondary" className="text-[10px] capitalize">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="rounded-lg p-2.5 bg-muted">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Content Quality */}
            {aiAnalysis.content_quality_score != null && (() => {
              const score = Number(aiAnalysis.content_quality_score)
              const grade = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Low'
              return (
                <Card className="relative overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Content Quality</p>
                        <p className="text-xl font-bold">{safeToFixed(score, 0)}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                        <Progress
                          value={Math.min(score, 100)}
                          className="h-1.5"
                        />
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 ml-3">{grade}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

          </div>
        </div>
      )}

      {/* ─── Section 2: Engagement Patterns ─── */}
      {hasEngagementData && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Engagement Patterns
          </h3>

          {/* Metric cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {behavioral?.current_stage && (
              <Card className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Lifecycle Stage</p>
                      <p className="text-xl font-bold capitalize">{behavioral.current_stage}</p>
                    </div>
                    <div className="rounded-lg p-2.5 bg-muted">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {trendAnalysis?.viral_potential != null && (() => {
              const pct = Number(trendAnalysis.viral_potential) > 1
                ? Number(trendAnalysis.viral_potential)
                : Number(trendAnalysis.viral_potential) * 100
              const grade = pct >= 70 ? 'High' : pct >= 40 ? 'Medium' : 'Low'
              const gradeColor = pct >= 70
                ? 'text-green-600 dark:text-green-400'
                : pct >= 40
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-muted-foreground'
              return (
                <Card className="relative overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Viral Potential</p>
                        <p className={`text-xl font-bold ${gradeColor}`}>{grade}</p>
                        <p className="text-xs text-muted-foreground">{safePercentage(trendAnalysis.viral_potential)}% score</p>
                      </div>
                      <div className="rounded-lg p-2.5 bg-muted">
                        <Flame className={`h-5 w-5 ${gradeColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {behavioral?.posting_consistency != null && (
              <Card className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Posting Consistency</p>
                    <p className="text-xl font-bold">{safePercentage(behavioral.posting_consistency)}%</p>
                    <Progress
                      value={Number(behavioral.posting_consistency) > 1
                        ? Number(behavioral.posting_consistency)
                        : Number(behavioral.posting_consistency) * 100}
                      className="h-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {behavioral?.content_strategy_maturity != null && (
              <Card className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Strategy Maturity</p>
                    <p className="text-xl font-bold">{safePercentage(behavioral.content_strategy_maturity)}%</p>
                    <Progress
                      value={Number(behavioral.content_strategy_maturity) > 1
                        ? Number(behavioral.content_strategy_maturity)
                        : Number(behavioral.content_strategy_maturity) * 100}
                      className="h-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Recommendations */}
          {Array.isArray(trendAnalysis?.optimization_recommendations) &&
            trendAnalysis.optimization_recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {trendAnalysis.optimization_recommendations.map(
                      (rec: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5"
                        >
                          <Zap className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <p className="text-sm text-muted-foreground">
                            {humanizeRecommendation(rec)}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* ─── Section 3: Content & Language Distribution ─── */}
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
