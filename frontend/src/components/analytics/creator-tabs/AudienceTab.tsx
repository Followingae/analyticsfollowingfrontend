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
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Globe,
  Bot,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  MapPin,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────

const safeToFixed = (value: any, decimals: number = 1): string => {
  const num = Number(value)
  return isNaN(num) ? '0' : num.toFixed(decimals)
}

const safePercentage = (value: any, decimals: number = 1): string => {
  const num = Number(value)
  if (isNaN(num)) return '0'
  // If value is already 0-100 range, treat as percentage directly
  if (num > 1) return num.toFixed(decimals)
  // If 0-1 range, multiply by 100
  return (num * 100).toFixed(decimals)
}

/** Map of common country names to ISO 3166-1 alpha-2 codes for ReactCountryFlag */
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'united states': 'US',
  'united kingdom': 'GB',
  'united arab emirates': 'AE',
  'saudi arabia': 'SA',
  'south korea': 'KR',
  'south africa': 'ZA',
  'new zealand': 'NZ',
  'czech republic': 'CZ',
  'dominican republic': 'DO',
  'costa rica': 'CR',
  'puerto rico': 'PR',
  'sri lanka': 'LK',
  'hong kong': 'HK',
  'north macedonia': 'MK',
  'bosnia and herzegovina': 'BA',
  'trinidad and tobago': 'TT',
  afghanistan: 'AF', albania: 'AL', algeria: 'DZ', argentina: 'AR',
  armenia: 'AM', australia: 'AU', austria: 'AT', azerbaijan: 'AZ',
  bahrain: 'BH', bangladesh: 'BD', belarus: 'BY', belgium: 'BE',
  bolivia: 'BO', brazil: 'BR', brunei: 'BN', bulgaria: 'BG',
  cambodia: 'KH', cameroon: 'CM', canada: 'CA', chile: 'CL',
  china: 'CN', colombia: 'CO', croatia: 'HR', cuba: 'CU',
  cyprus: 'CY', denmark: 'DK', ecuador: 'EC', egypt: 'EG',
  estonia: 'EE', ethiopia: 'ET', finland: 'FI', france: 'FR',
  georgia: 'GE', germany: 'DE', ghana: 'GH', greece: 'GR',
  guatemala: 'GT', honduras: 'HN', hungary: 'HU', iceland: 'IS',
  india: 'IN', indonesia: 'ID', iran: 'IR', iraq: 'IQ',
  ireland: 'IE', israel: 'IL', italy: 'IT', jamaica: 'JM',
  japan: 'JP', jordan: 'JO', kazakhstan: 'KZ', kenya: 'KE',
  kuwait: 'KW', latvia: 'LV', lebanon: 'LB', libya: 'LY',
  lithuania: 'LT', luxembourg: 'LU', malaysia: 'MY', malta: 'MT',
  mexico: 'MX', mongolia: 'MN', morocco: 'MA', myanmar: 'MM',
  nepal: 'NP', netherlands: 'NL', nigeria: 'NG', norway: 'NO',
  oman: 'OM', pakistan: 'PK', panama: 'PA', paraguay: 'PY',
  peru: 'PE', philippines: 'PH', poland: 'PL', portugal: 'PT',
  qatar: 'QA', romania: 'RO', russia: 'RU', rwanda: 'RW',
  senegal: 'SN', serbia: 'RS', singapore: 'SG', slovakia: 'SK',
  slovenia: 'SI', somalia: 'SO', spain: 'ES', sudan: 'SD',
  sweden: 'SE', switzerland: 'CH', syria: 'SY', taiwan: 'TW',
  tanzania: 'TZ', thailand: 'TH', tunisia: 'TN', turkey: 'TR',
  uganda: 'UG', ukraine: 'UA', uruguay: 'UY', uzbekistan: 'UZ',
  venezuela: 'VE', vietnam: 'VN', yemen: 'YE', zambia: 'ZM',
  zimbabwe: 'ZW',
}

/**
 * Resolve a country name or ISO code to a 2-letter ISO code.
 * Accepts "United States", "US", "united states", etc.
 */
function resolveCountryCode(nameOrCode: string): string | null {
  if (!nameOrCode) return null
  const trimmed = nameOrCode.trim()
  // Already a 2-letter code
  if (/^[A-Z]{2}$/.test(trimmed)) return trimmed
  if (/^[a-z]{2}$/.test(trimmed)) return trimmed.toUpperCase()
  // Look up by name
  return COUNTRY_NAME_TO_CODE[trimmed.toLowerCase()] ?? null
}

/** Natural sort order for age group strings like "13-17", "18-24", etc. */
const AGE_GROUP_ORDER = [
  '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', '45+', '55+',
]

function sortAgeGroups(groups: [string, number][]): [string, number][] {
  return [...groups].sort(([a], [b]) => {
    const idxA = AGE_GROUP_ORDER.indexOf(a)
    const idxB = AGE_GROUP_ORDER.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    // fallback: numeric sort on first number in the string
    const numA = parseInt(a, 10) || 0
    const numB = parseInt(b, 10) || 0
    return numA - numB
  })
}

// ── Chart color constants ────────────────────────────────────────────────

const GENDER_COLORS: Record<string, string> = {
  male: 'var(--chart-1)',
  female: 'var(--chart-2)',
  other: 'var(--chart-4)',
  unknown: 'var(--chart-5)',
}

const COUNTRY_BAR_COLOR = 'var(--chart-1)'
const AGE_BAR_COLOR = 'var(--chart-2)'

// ── Types ────────────────────────────────────────────────────────────────

interface AudienceTabProps {
  audience: any
  security: any
}

// ── Sub-components ───────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  invertedGood = false,
}: {
  label: string
  value: number | null | undefined
  subtitle?: string
  icon: React.ElementType
  colorClass: string
  invertedGood?: boolean
}) {
  if (value == null) return null
  const displayValue = safePercentage(value)
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${colorClass}`}>
              {displayValue}%
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="rounded-lg p-2.5 bg-muted">
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FraudGauge({ score }: { score: number }) {
  const normalizedScore = Math.min(100, Math.max(0, Number(score) || 0))

  const getLabel = (s: number) => {
    if (s <= 25) return 'Low Risk'
    if (s <= 50) return 'Moderate'
    if (s <= 75) return 'Elevated'
    return 'High Risk'
  }

  const getLabelColor = (s: number) => {
    if (s <= 25) return 'text-green-600 dark:text-green-400'
    if (s <= 50) return 'text-yellow-600 dark:text-yellow-400'
    if (s <= 75) return 'text-orange-600 dark:text-orange-400'
    return 'text-destructive'
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="text-center">
        <p className={`text-4xl font-bold ${getLabelColor(normalizedScore)}`}>
          {safeToFixed(normalizedScore, 0)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">/100</p>
      </div>
      <Progress value={normalizedScore} className="h-2.5 w-32" />
      <p className={`text-sm font-semibold ${getLabelColor(normalizedScore)}`}>
        {getLabel(normalizedScore)}
      </p>
    </div>
  )
}

function RiskLevelBadge({ level }: { level: string | null | undefined }) {
  if (!level) return null
  const normalized = level.toLowerCase()
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline'
  let className = ''
  if (normalized === 'low') {
    className = 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
  } else if (normalized === 'medium') {
    className = 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
  } else if (normalized === 'high') {
    className = 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
  }
  return (
    <Badge variant={variant} className={className}>
      {normalized === 'low' && <CheckCircle className="mr-1 h-3 w-3" />}
      {normalized === 'medium' && <AlertTriangle className="mr-1 h-3 w-3" />}
      {normalized === 'high' && <ShieldAlert className="mr-1 h-3 w-3" />}
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </Badge>
  )
}

// ── Main Component ───────────────────────────────────────────────────────

function AudienceTab({ audience, security }: AudienceTabProps) {
  // ---- Safe data access ----
  const demographics = audience?.demographics
  const quality = audience?.quality
  const geoInsights = audience?.geographic_insights
  const cultural = audience?.cultural_analysis
  const fraud = security?.fraud_detection

  const hasQualityData =
    quality?.authenticity_score != null ||
    quality?.engagement_authenticity != null ||
    quality?.bot_detection_score != null ||
    quality?.fake_follower_percentage != null

  const hasGenderData =
    demographics?.gender_split &&
    typeof demographics.gender_split === 'object' &&
    Object.keys(demographics.gender_split).length > 0

  const hasAgeData =
    demographics?.age_groups &&
    typeof demographics.age_groups === 'object' &&
    Object.keys(demographics.age_groups).length > 0

  const hasCountryData =
    demographics?.countries &&
    typeof demographics.countries === 'object' &&
    Object.keys(demographics.countries).length > 0

  const hasGeoInsights =
    geoInsights &&
    (
      (Array.isArray(geoInsights.primary_regions) && geoInsights.primary_regions.length > 0) ||
      geoInsights.geographic_diversity_score != null ||
      geoInsights.international_reach != null
    )

  const hasFraudData =
    fraud &&
    (
      fraud.overall_fraud_score != null ||
      fraud.trust_score != null ||
      fraud.risk_level != null ||
      fraud.bot_likelihood_percentage != null
    )

  const hasDemographics = hasGenderData || hasAgeData || hasCountryData
  const hasAnyData = hasDemographics || hasQualityData || hasGeoInsights || hasFraudData

  // ---- Gender donut chart data ----
  const genderChartData = useMemo(() => {
    if (!hasGenderData) return []
    return Object.entries(demographics.gender_split)
      .filter(([, val]) => Number(val) > 0)
      .map(([gender, val]) => ({
        gender: gender.charAt(0).toUpperCase() + gender.slice(1),
        value: Number(val),
        fill: GENDER_COLORS[gender.toLowerCase()] || GENDER_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value)
  }, [demographics?.gender_split, hasGenderData])

  const genderChartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = { value: { label: 'Percentage' } }
    genderChartData.forEach((item) => {
      config[item.gender.toLowerCase()] = {
        label: item.gender,
        color: item.fill,
      }
    })
    return config
  }, [genderChartData])

  const dominantGender = genderChartData[0]

  // ---- Age bar chart data ----
  const ageChartData = useMemo(() => {
    if (!hasAgeData) return []
    const entries = Object.entries(demographics.age_groups).map(
      ([range, val]) => ({ range, value: Number(val) })
    )
    return sortAgeGroups(
      entries.map((e) => [e.range, e.value] as [string, number])
    ).map(([range, value]) => ({ range, value }))
  }, [demographics?.age_groups, hasAgeData])

  const ageChartConfig: ChartConfig = {
    value: { label: 'Percentage', color: AGE_BAR_COLOR },
  }

  // ---- Country bar chart data ----
  const countryChartData = useMemo(() => {
    if (!hasCountryData) return []
    return Object.entries(demographics.countries)
      .map(([name, val]) => ({
        country: name,
        code: resolveCountryCode(name),
        value: Number(val),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [demographics?.countries, hasCountryData])

  const countryChartConfig: ChartConfig = {
    value: { label: 'Percentage', color: COUNTRY_BAR_COLOR },
  }

  // ---- Empty state ----
  if (!hasAnyData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Demographics data not available</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Audience demographics, quality metrics, and trust analysis will appear here
            once enough data has been collected and analyzed for this creator.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Section 1: Audience Quality Overview ─── */}
      {hasQualityData && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Audience Quality
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Audience Authenticity"
              value={quality?.authenticity_score}
              icon={ShieldCheck}
              colorClass="text-primary"
            />
            <MetricCard
              label="Real Engagement"
              value={quality?.engagement_authenticity}
              icon={UserCheck}
              colorClass="text-primary"
            />
            <MetricCard
              label="Estimated Bot Followers"
              value={quality?.bot_detection_score}
              icon={Bot}
              colorClass="text-muted-foreground"
              invertedGood
            />
            <MetricCard
              label="Suspected Fake Accounts"
              value={quality?.fake_follower_percentage}
              icon={AlertTriangle}
              colorClass="text-muted-foreground"
              invertedGood
            />
          </div>
        </div>
      )}

      {/* ─── Section 2: Demographics ─── */}
      {(hasGenderData || hasAgeData) && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Demographics
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Split - Donut */}
            {hasGenderData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Gender Split
                  </CardTitle>
                  <CardDescription>Audience breakdown by gender</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={genderChartConfig}
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
                                    {dominantGender
                                      ? `${safeToFixed(dominantGender.value, 0)}%`
                                      : '--'}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 20}
                                    className="fill-muted-foreground text-xs"
                                  >
                                    {dominantGender?.gender || 'N/A'}
                                  </tspan>
                                </text>
                              )
                            }
                          }}
                        />
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="gender" />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Age Distribution - Horizontal Bar */}
            {hasAgeData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Age Distribution
                  </CardTitle>
                  <CardDescription>
                    Audience breakdown by age range
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={ageChartConfig}
                    className="aspect-[4/3] max-h-[280px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={ageChartData}
                      layout="vertical"
                      margin={{ left: 8, right: 40 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <YAxis
                        dataKey="range"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        tickFormatter={(val) => val}
                      />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value) => (
                              <span>{safeToFixed(value)}%</span>
                            )}
                          />
                        }
                      />
                      <Bar
                        dataKey="value"
                        fill={AGE_BAR_COLOR}
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                        label={{
                          position: 'right',
                          formatter: (val: number) => `${safeToFixed(val, 1)}%`,
                          className: 'fill-foreground text-xs',
                        }}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ─── Section 3: Geographic Distribution ─── */}
      {(hasCountryData || hasGeoInsights) && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Geographic Distribution
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Country bar chart */}
            {hasCountryData && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4" />
                    Top Countries
                  </CardTitle>
                  <CardDescription>
                    Where the audience is located
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={countryChartConfig}
                    className="aspect-[3/2] max-h-[340px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={countryChartData}
                      layout="vertical"
                      margin={{ left: 16, right: 40 }}
                    >
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
                              <foreignObject
                                x={-110}
                                y={-10}
                                width={110}
                                height={20}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    justifyContent: 'flex-end',
                                    fontSize: '12px',
                                    height: '20px',
                                    lineHeight: '20px',
                                  }}
                                >
                                  {code && (
                                    <ReactCountryFlag
                                      countryCode={code}
                                      svg
                                      style={{ width: '16px', height: '12px', flexShrink: 0 }}
                                    />
                                  )}
                                  <span
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                    className="fill-foreground text-foreground"
                                  >
                                    {payload.value}
                                  </span>
                                </div>
                              </foreignObject>
                            </g>
                          )
                        }}
                      />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value) => (
                              <span>{safeToFixed(value)}%</span>
                            )}
                          />
                        }
                      />
                      <Bar
                        dataKey="value"
                        fill={COUNTRY_BAR_COLOR}
                        radius={[0, 4, 4, 0]}
                        barSize={18}
                        label={{
                          position: 'right',
                          formatter: (val: number) => `${safeToFixed(val, 1)}%`,
                          className: 'fill-foreground text-xs',
                        }}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Geographic insights sidebar */}
            <Card className={hasCountryData ? '' : 'lg:col-span-3'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Geographic Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Geographic Diversity Score */}
                {geoInsights?.geographic_diversity_score != null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Geographic Diversity
                      </span>
                      <span className="text-sm font-semibold">
                        {safePercentage(geoInsights.geographic_diversity_score)}%
                      </span>
                    </div>
                    <Progress
                      value={
                        Number(geoInsights.geographic_diversity_score) > 1
                          ? Number(geoInsights.geographic_diversity_score)
                          : Number(geoInsights.geographic_diversity_score) * 100
                      }
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">Audience spread across regions</p>
                  </div>
                )}

                {/* International Reach */}
                {geoInsights?.international_reach != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      International Reach
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        geoInsights.international_reach
                          ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'border-muted-foreground/30'
                      }
                    >
                      <Globe className="mr-1 h-3 w-3" />
                      {geoInsights.international_reach ? 'Global' : 'Local'}
                    </Badge>
                  </div>
                )}

                {/* Primary Regions */}
                {Array.isArray(geoInsights?.primary_regions) &&
                  geoInsights.primary_regions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        Primary Regions
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {geoInsights.primary_regions.map(
                          (region: string, idx: number) => {
                            const code = resolveCountryCode(region)
                            return (
                              <Badge key={idx} variant="secondary" className="text-xs flex items-center gap-1.5">
                                {code && (
                                  <ReactCountryFlag
                                    countryCode={code}
                                    svg
                                    style={{ width: '14px', height: '10px' }}
                                  />
                                )}
                                {region}
                              </Badge>
                            )
                          }
                        )}
                      </div>
                    </div>
                  )}

                {/* Cultural social context */}
                {cultural?.social_context && (
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium">Social Context</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {cultural.social_context}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Section 4: Trust & Safety ─── */}
      {hasFraudData && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Trust & Safety
          </h3>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Account Trustworthiness
                </CardTitle>
                {fraud?.risk_level && (
                  <RiskLevelBadge level={fraud.risk_level} />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Fraud gauge */}
                {fraud?.overall_fraud_score != null && (
                  <div className="flex items-center justify-center">
                    <FraudGauge score={Number(fraud.overall_fraud_score)} />
                  </div>
                )}

                {/* Trust & bot metrics */}
                <div className="md:col-span-2 space-y-5">
                  {/* Trust Score */}
                  {fraud?.trust_score != null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Trust Score</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {safePercentage(fraud.trust_score)}%
                        </span>
                      </div>
                      <Progress
                        value={
                          Number(fraud.trust_score) > 1
                            ? Number(fraud.trust_score)
                            : Number(fraud.trust_score) * 100
                        }
                        className="h-2.5"
                      />
                    </div>
                  )}

                  {/* Authenticity Score */}
                  {fraud?.authenticity_score != null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Authenticity</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {safePercentage(fraud.authenticity_score)}%
                        </span>
                      </div>
                      <Progress
                        value={
                          Number(fraud.authenticity_score) > 1
                            ? Number(fraud.authenticity_score)
                            : Number(fraud.authenticity_score) * 100
                        }
                        className="h-2.5"
                      />
                    </div>
                  )}

                  {/* Bot Likelihood */}
                  {fraud?.bot_likelihood_percentage != null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Bot Activity</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {safePercentage(fraud.bot_likelihood_percentage)}%
                        </span>
                      </div>
                      <Progress
                        value={
                          Number(fraud.bot_likelihood_percentage) > 1
                            ? Number(fraud.bot_likelihood_percentage)
                            : Number(fraud.bot_likelihood_percentage) * 100
                        }
                        className="h-2.5"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export { AudienceTab }
