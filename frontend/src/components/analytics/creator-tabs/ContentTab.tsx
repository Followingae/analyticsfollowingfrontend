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
  Eye,
  Layers,
  CheckCircle,
  Image as ImageIcon,
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
// Label maps for CLIP scene/content keys
// ---------------------------------------------------------------------------

const SCENE_LABELS: Record<string, string> = {
  outdoor_nature: 'Outdoor / Nature',
  beach: 'Beach',
  city_urban: 'City / Urban',
  gym_fitness: 'Gym / Fitness',
  restaurant_food: 'Restaurant / Food',
  home_indoor: 'Home / Indoor',
  studio: 'Studio',
  office: 'Office',
  travel: 'Travel',
  event_party: 'Event / Party',
  shopping: 'Shopping',
  pool_resort: 'Pool / Resort',
  sports: 'Sports',
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  selfie: 'Selfie',
  group_photo: 'Group Photo',
  product: 'Product / Flat Lay',
  food: 'Food & Drink',
  fashion: 'Fashion / OOTD',
  fitness: 'Fitness',
  landscape: 'Landscape',
  pet: 'Pet / Animal',
  lifestyle: 'Lifestyle',
  art: 'Art / Creative',
  car: 'Automotive',
  tech: 'Tech / Gadgets',
}

// ---------------------------------------------------------------------------
// Section: Visual Analysis (CLIP-based)
// ---------------------------------------------------------------------------

function VisualAnalysis({ content }: { content: any }) {
  const visual = content?.visual_analysis
  if (!visual) return null

  const isClip = visual.analysis_method === 'clip'
  const brands: Array<{ brand: string; confidence: number; post_count: number }> =
    visual.brands_detected ?? []
  const scenes: Record<string, number> = visual.scene_distribution ?? {}
  const contentTypes: Record<string, number> = visual.content_types ?? {}
  const consistency = visual.visual_consistency
  const quality = visual.production_quality as string | null
  const professionalScore = Number(visual.professional_score) || 0

  const hasClipData =
    brands.length > 0 ||
    Object.keys(scenes).length > 0 ||
    Object.keys(contentTypes).length > 0

  // Nothing to show if no CLIP data and no old scores
  if (!hasClipData && !visual.aesthetic_score) return null

  // If old data without CLIP, don't show fake scores
  if (!isClip && !hasClipData) return null

  const qualityColor =
    quality === 'professional'
      ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
      : quality === 'mixed'
        ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
        : 'border-muted-foreground/30'

  const sortedScenes = Object.entries(scenes).sort(([, a], [, b]) => b - a)
  const sortedTypes = Object.entries(contentTypes).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-4">
      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quality && (
          <Card className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Production Quality
                  </p>
                  <Badge variant="outline" className={qualityColor}>
                    {capitalize(quality)}
                  </Badge>
                  {professionalScore > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {safeToFixed(professionalScore, 0)}% professional
                    </p>
                  )}
                </div>
                <div className="rounded-lg p-2.5 bg-muted">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {consistency != null && (
          <MetricCard
            label="Visual Consistency"
            value={safeToFixed(Number(consistency) * 100, 0)}
            suffix="%"
            subtitle="Similarity across posts"
            icon={Layers}
            colorClass="text-primary"
          />
        )}

        {brands.length > 0 && (
          <MetricCard
            label="Brands Detected"
            value={String(brands.length)}
            subtitle="From post images"
            icon={Eye}
            colorClass="text-primary"
          />
        )}
      </div>

      {/* Brands detected from images */}
      {brands.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Brands Detected in Images
            </CardTitle>
            <CardDescription>
              Brand logos and products identified by visual AI across post images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <Badge
                  key={b.brand}
                  variant="default"
                  className="text-sm px-3 py-1.5"
                >
                  {b.brand}
                  {b.post_count > 1 && (
                    <span className="ml-1.5 text-xs opacity-70">
                      ({b.post_count})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scene distribution + Content types side by side */}
      {(sortedScenes.length > 0 || sortedTypes.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedScenes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4" />
                  Scene Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {sortedScenes.map(([key, pct]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{SCENE_LABELS[key] ?? capitalize(key.replace(/_/g, ' '))}</span>
                      <span className="font-medium">{safeToFixed(pct, 0)}%</span>
                    </div>
                    <Progress value={Number(pct)} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {sortedTypes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4" />
                  Content Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {sortedTypes.map(([key, pct]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{CONTENT_TYPE_LABELS[key] ?? capitalize(key.replace(/_/g, ' '))}</span>
                      <span className="font-medium">{safeToFixed(pct, 0)}%</span>
                    </div>
                    <Progress value={Number(pct)} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// BrandDetection removed — NLP entity extraction (spaCy NER) produced unreliable
// results (hashtags, random text classified as brands/orgs). Real brand detection
// is handled by the CLIP visual analyzer in the VisualAnalysis section above.

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
      // Extract hashtags and mentions directly from caption text
      // Backend entity_extraction stores counts (integers), not arrays
      const caption = post?.caption || ''
      if (typeof caption === 'string') {
        const hashtags = caption.match(/#\w+/g) || []
        for (const tag of hashtags) {
          const normalised = tag.replace(/^#/, '').toLowerCase()
          if (normalised && normalised.length > 1) {
            hashtagCounts[normalised] = (hashtagCounts[normalised] || 0) + 1
          }
        }

        const mentions = caption.match(/@[\w.]+/g) || []
        for (const mention of mentions) {
          const normalised = mention.replace(/^@/, '').toLowerCase()
          if (normalised && normalised.length > 1) {
            mentionCounts[normalised] = (mentionCounts[normalised] || 0) + 1
          }
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
// Main Component
// ---------------------------------------------------------------------------

function ContentTab({ content, aiAnalysis, engagement, posts }: ContentTabProps) {
  const safePosts = Array.isArray(posts) ? posts : []

  return (
    <div className="space-y-6">
      {/* ─── Section 1: Visual Analysis (CLIP-based) ─── */}
      {content?.visual_analysis && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Visual Analysis
          </h3>
          <VisualAnalysis content={content} />
        </div>
      )}

      {/* ─── Section 2: Caption & Text Analysis ─── */}
      {content?.nlp_insights && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Content Analysis
          </h3>
          <NlpTextAnalysis content={content} />
        </div>
      )}

      {/* ─── Section 3: Hashtags & Mentions ─── */}
      {safePosts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Engagement Signals
          </h3>
          <EntityExtraction posts={safePosts} />
        </div>
      )}

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
