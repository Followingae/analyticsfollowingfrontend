'use client'

import React, { useMemo } from 'react'
import ReactCountryFlag from 'react-country-flag'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Users,
  Globe,
  BadgeCheck,
  Eye,
  Heart,
  TrendingUp,
  UserCheck,
} from 'lucide-react'

/**
 * FirstPartyAudienceAnalytics
 *
 * Renders a Creator-App member's OWNER-CONSENTED first-party Instagram audience
 * data (from the Instagram Graph API) in the same beautiful style as the main
 * creator-analytics AudienceTab. Unlike that view, this data is real (not
 * AI-estimated), so it is labelled "Verified via Instagram".
 *
 * Input shapes (proportions are in [0, 1]):
 *   demographics: { gender_distribution, age_distribution, location_distribution,
 *                   sample_size, confidence_score, analysis_method }
 *   insights:     { reach, impressions, profile_views, accounts_engaged,
 *                   total_interactions, period }
 */

interface Demographics {
  gender_distribution?: Record<string, number> | null
  age_distribution?: Record<string, number> | null
  location_distribution?: Record<string, number> | null
  sample_size?: number | null
  confidence_score?: number | null
  analysis_method?: string | null
}

interface Insights {
  reach?: number | null
  impressions?: number | null
  profile_views?: number | null
  accounts_engaged?: number | null
  total_interactions?: number | null
  period?: string | null
}

interface Props {
  demographics?: Demographics | null
  insights?: Insights | null
  fetchedAt?: string | null
  className?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Proportion (0..1) or already-percent (>1) → whole/one-decimal percent number. */
function toPercent(value: any): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return n > 1 ? n : n * 100
}

function fmtPercent(value: any, decimals = 1): string {
  return toPercent(value).toFixed(decimals)
}

function fmtCount(value: any): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

/** IG audience_country returns ISO 2-letter codes; tolerate a few full names too. */
const NAME_TO_CODE: Record<string, string> = {
  'united states': 'US', 'united kingdom': 'GB', 'united arab emirates': 'AE',
  'saudi arabia': 'SA', 'south korea': 'KR', india: 'IN', pakistan: 'PK',
  egypt: 'EG', qatar: 'QA', kuwait: 'KW', bahrain: 'BH', oman: 'OM',
  jordan: 'JO', lebanon: 'LB', france: 'FR', germany: 'DE', spain: 'ES',
  italy: 'IT', canada: 'CA', australia: 'AU', turkey: 'TR', brazil: 'BR',
  indonesia: 'ID', philippines: 'PH', nigeria: 'NG', morocco: 'MA',
}

function resolveCountryCode(nameOrCode: string): string | null {
  if (!nameOrCode) return null
  const t = nameOrCode.trim()
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase()
  return NAME_TO_CODE[t.toLowerCase()] || null
}

function prettyCountry(nameOrCode: string): string {
  const t = (nameOrCode || '').trim()
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase()
  return t.replace(/\b\w/g, (c) => c.toUpperCase())
}

const GENDER_COLORS: Record<string, string> = {
  male: 'var(--chart-1)', m: 'var(--chart-1)',
  female: 'var(--chart-2)', f: 'var(--chart-2)',
  other: 'var(--chart-4)',
  unknown: 'var(--chart-5)', u: 'var(--chart-5)',
}

function prettyGender(label: string): string {
  const l = label.toLowerCase()
  if (l === 'm' || l === 'male') return 'Men'
  if (l === 'f' || l === 'female') return 'Women'
  if (l === 'u' || l === 'unknown') return 'Unspecified'
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const AGE_GROUP_ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', '45+', '55+']

function sortAgeEntries(entries: { range: string; value: number }[]) {
  return [...entries].sort((a, b) => {
    const ia = AGE_GROUP_ORDER.indexOf(a.range)
    const ib = AGE_GROUP_ORDER.indexOf(b.range)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return (parseInt(a.range, 10) || 0) - (parseInt(b.range, 10) || 0)
  })
}

function nonEmptyDist(d?: Record<string, number> | null): boolean {
  return !!d && typeof d === 'object' && Object.values(d).some((v) => Number(v) > 0)
}

function formatPeriod(period?: string | null): string | undefined {
  if (!period) return undefined
  const m = period.match(/(\d+)/)
  if (m) return `Last ${m[1]} days`
  return period
}

// ── Insights stat card ───────────────────────────────────────────────────

function InsightStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number | null | undefined
}) {
  if (value == null || !Number.isFinite(Number(value))) return null
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="rounded-lg bg-muted p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold">{fmtCount(value)}</p>
      </CardContent>
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function FirstPartyAudienceAnalytics({
  demographics,
  insights,
  fetchedAt,
  className,
}: Props) {
  const hasGender = nonEmptyDist(demographics?.gender_distribution)
  const hasAge = nonEmptyDist(demographics?.age_distribution)
  const hasCountry = nonEmptyDist(demographics?.location_distribution)

  const insightValues = [
    insights?.reach,
    insights?.profile_views,
    insights?.accounts_engaged,
    insights?.total_interactions,
  ]
  const hasInsights =
    insightValues.some((v) => v != null && Number.isFinite(Number(v)) && Number(v) > 0)

  const genderChartData = useMemo(() => {
    if (!hasGender) return []
    return Object.entries(demographics!.gender_distribution!)
      .filter(([, v]) => Number(v) > 0)
      .map(([gender, v]) => ({
        gender: prettyGender(gender),
        key: gender.toLowerCase(),
        value: toPercent(v),
        fill: GENDER_COLORS[gender.toLowerCase()] || GENDER_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value)
  }, [demographics, hasGender])

  const genderChartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = { value: { label: 'Percentage' } }
    genderChartData.forEach((item) => {
      config[item.key] = { label: item.gender, color: item.fill }
    })
    return config
  }, [genderChartData])

  const dominantGender = genderChartData[0]

  const ageChartData = useMemo(() => {
    if (!hasAge) return []
    const entries = Object.entries(demographics!.age_distribution!).map(
      ([range, v]) => ({ range, value: toPercent(v) }),
    )
    return sortAgeEntries(entries)
  }, [demographics, hasAge])

  const ageChartConfig: ChartConfig = { value: { label: 'Percentage', color: 'var(--chart-2)' } }

  const countryChartData = useMemo(() => {
    if (!hasCountry) return []
    return Object.entries(demographics!.location_distribution!)
      .map(([name, v]) => ({
        country: prettyCountry(name),
        code: resolveCountryCode(name),
        value: toPercent(v),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [demographics, hasCountry])

  const countryChartConfig: ChartConfig = { value: { label: 'Percentage', color: 'var(--chart-1)' } }

  const hasAnything = hasGender || hasAge || hasCountry || hasInsights

  if (!hasAnything) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-base font-semibold">Audience data pending</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Real audience demographics will appear here once Instagram finishes syncing
            for this creator.
          </p>
        </CardContent>
      </Card>
    )
  }

  const sample = demographics?.sample_size
  const syncedDate = fetchedAt
    ? new Date(fetchedAt)
    : null
  const syncedLabel =
    syncedDate && !Number.isNaN(syncedDate.getTime())
      ? syncedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : null

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      {/* Header — real data, verified */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Audience Insights
          </h3>
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <BadgeCheck className="mr-1 h-3 w-3" />
            Verified via Instagram
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {typeof sample === 'number' && sample > 0 && <span>{fmtCount(sample)} followers</span>}
          {syncedLabel && <span>Synced {syncedLabel}</span>}
        </div>
      </div>

      {/* Account insights */}
      {hasInsights && (
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Account insights{formatPeriod(insights?.period) ? ` · ${formatPeriod(insights?.period)}` : ''}
          </p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <InsightStat icon={TrendingUp} label="Reach" value={insights?.reach} />
            <InsightStat icon={Eye} label="Profile Views" value={insights?.profile_views} />
            <InsightStat icon={UserCheck} label="Accounts Engaged" value={insights?.accounts_engaged} />
            <InsightStat icon={Heart} label="Interactions" value={insights?.total_interactions} />
          </div>
        </div>
      )}

      {/* Demographics: gender + age */}
      {(hasGender || hasAge) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {hasGender && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" /> Gender Split
                </CardTitle>
                <CardDescription>Audience breakdown by gender</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={genderChartConfig} className="mx-auto aspect-square max-h-[260px]">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value, name) => (
                            <span>
                              {name}: {fmtPercent(value)}%
                            </span>
                          )}
                        />
                      }
                    />
                    <Pie
                      data={genderChartData}
                      dataKey="value"
                      nameKey="gender"
                      innerRadius={60}
                      outerRadius={90}
                      strokeWidth={3}
                      stroke="var(--background)"
                    >
                      {genderChartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                  {dominantGender ? `${fmtPercent(dominantGender.value, 0)}%` : '--'}
                                </tspan>
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                                  {dominantGender?.gender || 'N/A'}
                                </tspan>
                              </text>
                            )
                          }
                          return null
                        }}
                      />
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="gender" />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {hasAge && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" /> Age Distribution
                </CardTitle>
                <CardDescription>Audience breakdown by age range</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={ageChartConfig} className="aspect-[4/3] max-h-[280px] w-full">
                  <BarChart accessibilityLayer data={ageChartData} layout="vertical" margin={{ left: 8, right: 40 }}>
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="range" type="category" tickLine={false} axisLine={false} width={50} />
                    <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel formatter={(value) => <span>{fmtPercent(value)}%</span>} />}
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--chart-2)"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                      label={{ position: 'right', formatter: (v: number) => `${fmtPercent(v, 1)}%`, className: 'fill-foreground text-xs' }}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Top locations */}
      {hasCountry && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" /> Top Locations
            </CardTitle>
            <CardDescription>Where the audience is located</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={countryChartConfig} className="aspect-[3/2] max-h-[340px] w-full">
              <BarChart accessibilityLayer data={countryChartData} layout="vertical" margin={{ left: 16, right: 40 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="country"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tick={({ x, y, payload }) => {
                    const code = resolveCountryCode(payload.value)
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <foreignObject x={-110} y={-10} width={110} height={20}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', fontSize: '12px', height: '20px', lineHeight: '20px' }}>
                            {code && <ReactCountryFlag countryCode={code} svg style={{ width: '16px', height: '12px', flexShrink: 0 }} />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="text-foreground">
                              {payload.value}
                            </span>
                          </div>
                        </foreignObject>
                      </g>
                    )
                  }}
                />
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={(value) => <span>{fmtPercent(value)}%</span>} />}
                />
                <Bar
                  dataKey="value"
                  fill="var(--chart-1)"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                  label={{ position: 'right', formatter: (v: number) => `${fmtPercent(v, 1)}%`, className: 'fill-foreground text-xs' }}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FirstPartyAudienceAnalytics
