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
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Camera,
  Sparkles,
  Brain,
  Hash,
  AtSign,
  BookOpen,
  FileText,
  MessageCircle,
  Building2,
  Tag,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContentTabProps {
  content: any
  aiAnalysis: any
  engagement: any
  posts: any[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = Number(value)
  return isNaN(num) ? '0' : num.toFixed(decimals)
}

const capitalize = (s: string): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

const truncateLabel = (label: string, max: number = 14): string =>
  label.length > max ? label.substring(0, max - 1) + '\u2026' : label

const BADGE_VARIANTS: Array<'default' | 'secondary' | 'outline'> = [
  'default',
  'secondary',
  'outline',
]

// ---------------------------------------------------------------------------
// Sub-component: MetricCard (matching AudienceTab)
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  suffix,
  subtitle,
  icon: Icon,
  colorClass,
}: {
  label: string
  value: string
  suffix?: string
  subtitle?: string
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

// ---------------------------------------------------------------------------
// Section: Visual Content Quality
// ---------------------------------------------------------------------------

function ContentQualityScores({ content }: { content: any }) {
  const visual = content?.visual_analysis
  if (!visual) return null

  const aestheticScore = Math.round((Number(visual.aesthetic_score) || 0) * 100)
  const professionalScore = Math.round(
    (Number(visual.professional_quality_score) || 0) * 100
  )

  if (!aestheticScore && !professionalScore) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {aestheticScore > 0 && (
        <MetricCard
          label="Aesthetic Score"
          value={String(aestheticScore)}
          suffix="/100"
          icon={Camera}
          colorClass="text-primary"
        />
      )}
      {professionalScore > 0 && (
        <MetricCard
          label="Professional Quality"
          value={String(professionalScore)}
          suffix="/100"
          icon={Sparkles}
          colorClass="text-primary"
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Brands & Organizations
// ---------------------------------------------------------------------------

function BrandDetection({ posts }: { posts: any[] }) {
  const { brands, organizations } = useMemo(() => {
    const brandCounts: Record<string, number> = {}
    const orgCounts: Record<string, number> = {}

    if (!Array.isArray(posts)) return { brands: [], organizations: [] }

    for (const post of posts) {
      const ai = post?.ai_analysis

      const logoDetected = ai?.visual_analysis?.brand_logo_detected
      if (Array.isArray(logoDetected)) {
        for (const item of logoDetected) {
          const name = typeof item === 'string' ? item : item?.brand
          if (name) {
            const normalized = name.trim()
            brandCounts[normalized] = (brandCounts[normalized] || 0) + 1
          }
        }
      }

      const brandMentions = ai?.entity_extraction?.brand_mentions
      if (Array.isArray(brandMentions)) {
        for (const item of brandMentions) {
          const name = typeof item === 'string' ? item : item?.mention
          if (name) {
            const normalized = name.trim()
            brandCounts[normalized] = (brandCounts[normalized] || 0) + 1
          }
        }
      }

      const brandEntities = ai?.entity_extraction?.entities?.BRAND
      if (Array.isArray(brandEntities)) {
        for (const item of brandEntities) {
          const name = typeof item === 'string' ? item : item?.text
          if (name) {
            const normalized = name.trim()
            brandCounts[normalized] = (brandCounts[normalized] || 0) + 1
          }
        }
      }

      const orgEntities = ai?.entity_extraction?.entities?.ORG
      if (Array.isArray(orgEntities)) {
        for (const item of orgEntities) {
          const name = typeof item === 'string' ? item : item?.text
          if (name) {
            const normalized = name.trim()
            orgCounts[normalized] = (orgCounts[normalized] || 0) + 1
          }
        }
      }

      const productEntities = ai?.entity_extraction?.entities?.PRODUCT
      if (Array.isArray(productEntities)) {
        for (const item of productEntities) {
          const name = typeof item === 'string' ? item : item?.text
          if (name) {
            const normalized = name.trim()
            brandCounts[normalized] = (brandCounts[normalized] || 0) + 1
          }
        }
      }
    }

    const brands = Object.entries(brandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)

    const organizations = Object.entries(orgCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)

    return { brands, organizations }
  }, [posts])

  if (brands.length === 0 && organizations.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          Brands & Organizations
        </CardTitle>
        <CardDescription>
          Brands and organizations detected across this creator's content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {brands.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Brand Mentions
            </h4>
            <div className="flex flex-wrap gap-2">
              {brands.map(([name, count]) => (
                <Badge
                  key={name}
                  variant="default"
                  className="text-sm px-3 py-1.5"
                >
                  {name}
                  {count > 1 && (
                    <span className="ml-1.5 text-xs opacity-70">
                      ({count})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {organizations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Organizations
            </h4>
            <div className="flex flex-wrap gap-2">
              {organizations.map(([name, count]) => (
                <Badge
                  key={name}
                  variant="secondary"
                  className="text-sm px-3 py-1.5"
                >
                  {name}
                  {count > 1 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({count})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Section: Caption Quality (NLP)
// ---------------------------------------------------------------------------

function NlpTextAnalysis({ content }: { content: any }) {
  const nlp = content?.nlp_insights
  if (!nlp) return null

  const vocabRichness = Number(nlp.vocabulary_richness) || 0
  const textComplexity = Number(nlp.text_complexity_score) || 0
  const themes: string[] = nlp.main_themes ?? []
  const keywords: string[] = nlp.top_keywords ?? []

  if (
    !vocabRichness &&
    !textComplexity &&
    themes.length === 0 &&
    keywords.length === 0
  ) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4" />
          Caption Quality
        </CardTitle>
        <CardDescription>
          Quality and readability of this creator's captions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Card className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Caption Diversity</p>
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(vocabRichness * 100)}%
                  </p>
                </div>
                <div className="rounded-lg p-2.5 bg-muted">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Writing Level</p>
                  <p className="text-2xl font-bold text-primary">
                    {safeToFixed(textComplexity, 1)}
                  </p>
                </div>
                <div className="rounded-lg p-2.5 bg-muted">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {themes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Content Themes</h4>
            <div className="flex flex-wrap gap-2">
              {themes.map((theme, idx) => (
                <Badge
                  key={theme}
                  variant={BADGE_VARIANTS[idx % BADGE_VARIANTS.length]}
                  className="text-sm px-3 py-1"
                >
                  {capitalize(theme)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {keywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Top Keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Section: Hashtags & Mentions
// ---------------------------------------------------------------------------

function EntityExtraction({ posts }: { posts: any[] }) {
  const { topHashtags, topMentions } = useMemo(() => {
    const hashtagCounts: Record<string, number> = {}
    const mentionCounts: Record<string, number> = {}

    if (!Array.isArray(posts)) {
      return { topHashtags: [], topMentions: [] }
    }

    for (const post of posts) {
      const entities = post?.ai_analysis?.entity_extraction

      const hashtags = Array.isArray(entities?.hashtags) ? entities.hashtags : []
      for (const tag of hashtags) {
        const normalised = String(tag).replace(/^#/, '').toLowerCase()
        if (normalised) {
          hashtagCounts[normalised] = (hashtagCounts[normalised] || 0) + 1
        }
      }

      const mentions = Array.isArray(entities?.mentions) ? entities.mentions : []
      for (const mention of mentions) {
        const normalised = String(mention).replace(/^@/, '').toLowerCase()
        if (normalised) {
          mentionCounts[normalised] = (mentionCounts[normalised] || 0) + 1
        }
      }
    }

    const topHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)

    const topMentions = Object.entries(mentionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    return { topHashtags, topMentions }
  }, [posts])

  if (topHashtags.length === 0 && topMentions.length === 0) return null

  const hashtagConfig = {
    count: {
      label: 'Appearances',
      color: 'var(--chart-3)',
    },
  } satisfies ChartConfig

  const hashtagChartData = topHashtags.map(([tag, count]) => ({
    tag: `#${tag}`,
    label: truncateLabel(`#${tag}`, 12),
    count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Hash className="h-4 w-4" />
          Hashtags & Mentions
        </CardTitle>
        <CardDescription>
          Most used hashtags and mentioned accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {hashtagChartData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">
              Popular Hashtags ({topHashtags.length})
            </h4>
            <ChartContainer
              config={hashtagConfig}
              className="h-[260px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={hashtagChartData}
                layout="vertical"
                margin={{ right: 40, left: 0, top: 0, bottom: 0 }}
                barGap={2}
                barCategoryGap={6}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                  width={80}
                  tick={{ fontSize: 11 }}
                />
                <XAxis dataKey="count" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={4}
                  barSize={18}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {topMentions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <AtSign className="h-4 w-4 text-muted-foreground" />
              Top Mentions
            </h4>
            <div className="flex flex-wrap gap-2">
              {topMentions.map(([mention, count]) => (
                <Badge
                  key={mention}
                  variant="secondary"
                  className="text-sm px-3 py-1.5"
                >
                  @{mention}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({count})
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Section: Sentiment Breakdown
// ---------------------------------------------------------------------------

function SentimentBreakdown({ posts }: { posts: any[] }) {
  const { counts, avgScore, total } = useMemo(() => {
    const counts: Record<string, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
    }
    let scoreSum = 0
    let scoreCount = 0

    if (!Array.isArray(posts)) {
      return { counts, avgScore: 0, total: 0 }
    }

    for (const post of posts) {
      const sentiment = post?.ai_analysis?.sentiment
      const score = Number(post?.ai_analysis?.sentiment_score)

      if (sentiment) {
        const normalised = sentiment.toLowerCase()
        if (normalised in counts) {
          counts[normalised] += 1
        } else {
          counts['neutral'] += 1
        }
      }

      if (!isNaN(score)) {
        scoreSum += score
        scoreCount += 1
      }
    }

    const total = counts.positive + counts.neutral + counts.negative
    const avgScore = scoreCount > 0 ? scoreSum / scoreCount : 0

    return { counts, avgScore, total }
  }, [posts])

  if (total === 0) return null

  const sentimentConfig = {
    positive: {
      label: 'Positive',
      color: 'var(--chart-1)',
    },
    neutral: {
      label: 'Neutral',
      color: 'var(--chart-4)',
    },
    negative: {
      label: 'Negative',
      color: 'var(--chart-5)',
    },
  } satisfies ChartConfig

  const stackedData = [
    {
      name: 'Sentiment',
      positive: counts.positive,
      neutral: counts.neutral,
      negative: counts.negative,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          Sentiment Breakdown
        </CardTitle>
        <CardDescription>
          Overall tone and mood across this creator's content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall tone + count boxes */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">
              {avgScore >= 0.6
                ? 'Very Positive'
                : avgScore >= 0.3
                  ? 'Positive'
                  : avgScore >= -0.1
                    ? 'Neutral'
                    : avgScore >= -0.5
                      ? 'Negative'
                      : 'Very Negative'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Overall Tone
            </p>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md border p-2">
              <p className="font-semibold">{counts.positive}</p>
              <p className="text-xs text-muted-foreground">Positive</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-semibold">{counts.neutral}</p>
              <p className="text-xs text-muted-foreground">Neutral</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-semibold">{counts.negative}</p>
              <p className="text-xs text-muted-foreground">Negative</p>
            </div>
          </div>
        </div>

        {/* Stacked horizontal bar */}
        <ChartContainer
          config={sentimentConfig}
          className="h-[60px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={stackedData}
            layout="vertical"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            stackOffset="expand"
          >
            <YAxis dataKey="name" type="category" hide />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar
              dataKey="positive"
              stackId="sentiment"
              fill="var(--color-positive)"
              radius={[4, 0, 0, 4]}
              barSize={28}
            />
            <Bar
              dataKey="neutral"
              stackId="sentiment"
              fill="var(--color-neutral)"
              radius={0}
              barSize={28}
            />
            <Bar
              dataKey="negative"
              stackId="sentiment"
              fill="var(--color-negative)"
              radius={[0, 4, 4, 0]}
              barSize={28}
            />
          </BarChart>
        </ChartContainer>

        {/* Percentage breakdown labels */}
        {total > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: 'var(--chart-1)' }}
              />
              Positive{' '}
              {safeToFixed((counts.positive / total) * 100, 1)}%
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: 'var(--chart-4)' }}
              />
              Neutral{' '}
              {safeToFixed((counts.neutral / total) * 100, 1)}%
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: 'var(--chart-5)' }}
              />
              Negative{' '}
              {safeToFixed((counts.negative / total) * 100, 1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function ContentTab({ content, aiAnalysis, engagement, posts }: ContentTabProps) {
  const safePosts = Array.isArray(posts) ? posts : []

  return (
    <div className="space-y-6">
      {/* ─── Section 1: Visual Quality ─── */}
      {content?.visual_analysis && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Visual Quality
          </h3>
          <ContentQualityScores content={content} />
        </div>
      )}

      {/* ─── Section 2: Brands & Caption Quality ─── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Content Analysis
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BrandDetection posts={safePosts} />
          <NlpTextAnalysis content={content} />
        </div>
      </div>

      {/* ─── Section 3: Hashtags & Sentiment ─── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Engagement Signals
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EntityExtraction posts={safePosts} />
          <SentimentBreakdown posts={safePosts} />
        </div>
      </div>

      {/* Fallback when no data at all */}
      {!content?.visual_analysis &&
        !content?.nlp_insights &&
        safePosts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Content data not available</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Content analysis data is not yet available for this creator.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  )
}

export { ContentTab }
