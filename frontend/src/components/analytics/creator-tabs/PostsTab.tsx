'use client'

import React, { useState, useMemo } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Heart,
  MessageCircle,
  TrendingUp,
  ExternalLink,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Award,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostsTabProps {
  posts: any[]
  analyticsSum?: any
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = Number(value)
  return isNaN(num) ? '0' : num.toFixed(decimals)
}

function formatRelativeDate(isoDate: string | null): string {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

function formatNumber(value: any): string {
  const num = Number(value)
  if (isNaN(num)) return '0'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

type SortKey = 'date' | 'engagement' | 'likes' | 'comments' | 'sentiment'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date', label: 'Date (Newest)' },
  { value: 'engagement', label: 'Engagement Rate' },
  { value: 'likes', label: 'Most Likes' },
  { value: 'comments', label: 'Most Comments' },
  { value: 'sentiment', label: 'Sentiment Score' },
]

function sortPosts(posts: any[], key: SortKey): any[] {
  const sorted = [...posts]
  switch (key) {
    case 'date':
      return sorted.sort((a, b) => {
        const da = a.taken_at ? new Date(a.taken_at).getTime() : 0
        const db = b.taken_at ? new Date(b.taken_at).getTime() : 0
        return db - da
      })
    case 'engagement':
      return sorted.sort(
        (a, b) => (Number(b.engagement_rate) || 0) - (Number(a.engagement_rate) || 0)
      )
    case 'likes':
      return sorted.sort(
        (a, b) => (Number(b.likes_count) || 0) - (Number(a.likes_count) || 0)
      )
    case 'comments':
      return sorted.sort(
        (a, b) => (Number(b.comments_count) || 0) - (Number(a.comments_count) || 0)
      )
    case 'sentiment':
      return sorted.sort(
        (a, b) =>
          (Number(b.ai_analysis?.sentiment_score) || 0) -
          (Number(a.ai_analysis?.sentiment_score) || 0)
      )
    default:
      return sorted
  }
}

// ---------------------------------------------------------------------------
// Sub-components (matching AudienceTab MetricCard pattern)
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  suffix,
  sublabel,
  icon: Icon,
  colorClass,
}: {
  label: string
  value: string
  suffix?: string
  sublabel?: string
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
            {sublabel && (
              <p className="text-xs text-muted-foreground">{sublabel}</p>
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

function PostImage({
  cdnUrl,
  displayUrl,
  alt,
}: {
  cdnUrl: string | null
  displayUrl: string | null
  alt: string
}) {
  const [hasError, setHasError] = useState(false)
  const src = cdnUrl || displayUrl

  if (!src || hasError) {
    return (
      <div className="aspect-square w-full bg-muted flex items-center justify-center rounded-t-lg">
        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
      </div>
    )
  }

  return (
    <div className="aspect-square w-full overflow-hidden rounded-t-lg">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  )
}

function ExpandedAIDetails({ ai }: { ai: any }) {
  if (!ai) return null

  return (
    <div className="space-y-3 pt-2 border-t">
      {/* Classification Accuracy */}
      {ai.category_confidence != null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Classification Accuracy</span>
            <span className="font-medium">{safeToFixed(Number(ai.category_confidence) * 100, 1)}%</span>
          </div>
          <Progress value={Number(ai.category_confidence) * 100} className="h-1.5" />
        </div>
      )}

      {/* Visual analysis summary */}
      {ai.visual_analysis && typeof ai.visual_analysis === 'object' && Object.keys(ai.visual_analysis).length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Image Details</span>
          <div className="text-xs bg-muted/50 rounded-md p-2 space-y-1">
            {Object.entries(ai.visual_analysis).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium truncate max-w-[60%] text-right">
                  {typeof value === 'number' ? safeToFixed(value, 2) : String(value ?? '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entity extraction */}
      {ai.entity_extraction && typeof ai.entity_extraction === 'object' && Object.keys(ai.entity_extraction).length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Tags & Mentions</span>
          <div className="flex flex-wrap gap-1">
            {Object.entries(ai.entity_extraction).map(([key, values]) => {
              const items = Array.isArray(values) ? values : [values]
              return items.map((item, idx) => (
                <Badge key={`${key}-${idx}`} variant="outline" className="text-[10px]">
                  {String(item)}
                </Badge>
              ))
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Post Card
// ---------------------------------------------------------------------------

function PostCard({
  post,
  isExpanded,
  onToggle,
}: {
  post: any
  isExpanded: boolean
  onToggle: () => void
}) {
  const ai = post.ai_analysis
  const engagementRate = Number(post.engagement_rate) || 0

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Post image */}
      <PostImage
        cdnUrl={post.cdn_thumbnail_url}
        displayUrl={post.display_url}
        alt={post.caption ? post.caption.slice(0, 60) : 'Instagram post'}
      />

      <CardContent className="p-3 space-y-2.5">
        {/* Date */}
        {post.taken_at && (
          <span className="text-[11px] text-muted-foreground">
            {formatRelativeDate(post.taken_at)}
          </span>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans tracking-normal">
            {post.caption}
          </p>
        )}

        {/* Engagement metrics row */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-pink-500" />
            {formatNumber(post.likes_count)}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
            {formatNumber(post.comments_count)}
          </span>
          <span className="flex items-center gap-1 ml-auto font-medium text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            {safeToFixed(engagementRate, 2)}%
          </span>
        </div>

        {/* AI badges row */}
        {ai && (
          <div className="flex flex-wrap gap-1">
            {ai.content_category && (
              <Badge variant="secondary" className="text-[10px] capitalize">
                {ai.content_category}
              </Badge>
            )}
            {ai.sentiment && (
              <Badge variant="outline" className="text-[10px] capitalize">
                {ai.sentiment}
              </Badge>
            )}
            {ai.language_code && (
              <Badge variant="outline" className="text-[10px] uppercase">
                {ai.language_code}
              </Badge>
            )}
          </div>
        )}

        {/* View on Instagram */}
        {post.shortcode && (
          <a
            href={`https://www.instagram.com/p/${post.shortcode}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View on Instagram
          </a>
        )}

        {/* Expandable AI details toggle */}
        {ai && (
          <>
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full justify-center pt-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  More details
                </>
              )}
            </button>

            {isExpanded && <ExpandedAIDetails ai={ai} />}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main PostsTab Component
// ---------------------------------------------------------------------------

function PostsTab({ posts, analyticsSum }: PostsTabProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())

  const safePosts = Array.isArray(posts) ? posts : []

  const sortedPosts = useMemo(() => sortPosts(safePosts, sortKey), [safePosts, sortKey])

  const toggleExpanded = (postId: string) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      return next
    })
  }

  // Compute summary metrics
  const totalPosts = safePosts.length

  const avgEngagement = useMemo(() => {
    if (totalPosts === 0) return 0
    return (
      analyticsSum?.avg_engagement_rate ??
      safePosts.reduce((sum, p) => sum + (Number(p.engagement_rate) || 0), 0) / totalPosts
    )
  }, [safePosts, totalPosts, analyticsSum])

  const bestPost = useMemo(
    () =>
      safePosts.reduce(
        (best: any, p: any) =>
          (Number(p.engagement_rate) || 0) > (Number(best?.engagement_rate) || 0) ? p : best,
        safePosts[0] ?? null
      ),
    [safePosts]
  )

  // Empty state (matching AudienceTab pattern)
  if (safePosts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts available</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Post data has not been loaded yet. Posts will appear here once the
            creator profile has been fully analyzed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Section 1: Post Analytics ─── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Post Analytics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Total Posts"
            value={totalPosts.toString()}
            icon={BarChart3}
            colorClass="text-primary"
          />
          <MetricCard
            label="Avg Engagement"
            value={safeToFixed(avgEngagement, 2)}
            suffix="%"
            icon={TrendingUp}
            colorClass="text-primary"
          />
          <MetricCard
            label="Best Post"
            value={bestPost ? safeToFixed(bestPost.engagement_rate, 2) : '--'}
            suffix={bestPost ? '%' : ''}
            sublabel={
              bestPost?.likes_count
                ? `${formatNumber(bestPost.likes_count)} likes`
                : undefined
            }
            icon={Award}
            colorClass="text-primary"
          />
        </div>
      </div>

      {/* ─── Section 2: Posts Feed ─── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Posts Feed
        </h3>

        {/* Sort Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4" />
                  All Posts
                </CardTitle>
                <CardDescription>
                  Showing {sortedPosts.length} post{sortedPosts.length !== 1 ? 's' : ''} with AI analysis
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Sort by</span>
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger size="sm" className="w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedPosts.map((post) => {
                const postId = post.id || post.shortcode || String(Math.random())
                return (
                  <PostCard
                    key={postId}
                    post={post}
                    isExpanded={expandedPosts.has(postId)}
                    onToggle={() => toggleExpanded(postId)}
                  />
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { PostsTab }
