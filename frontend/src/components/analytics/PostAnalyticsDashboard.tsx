'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Play,
  Image as ImageIcon,
  Grid3x3,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Languages,
  Star,
  Calendar,
  Filter,
  Search,
  BarChart3,
  RefreshCw,
  Download
} from 'lucide-react'
import { PostAnalyticsResponse } from '@/types/comprehensiveAnalytics'

interface PostAnalyticsDashboardProps {
  username: string
  posts: PostAnalyticsResponse['posts']
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
  onLoadMore?: () => void
  hasMore?: boolean
}

interface PostCardProps {
  post: PostAnalyticsResponse['posts'][0]
  isExpanded: boolean
  onToggleExpand: () => void
}

function PostCard({ post, isExpanded, onToggleExpand }: PostCardProps) {
  const getSentimentColor = (score: number | null) => {
    if (!score) return 'bg-gray-400'
    if (score > 0.3) return 'bg-green-500'
    if (score < -0.3) return 'bg-red-500'
    return 'bg-yellow-500'
  }

  const getSentimentText = (score: number | null) => {
    if (!score) return 'Neutral'
    if (score > 0.3) return 'Positive'
    if (score < -0.3) return 'Negative'
    return 'Neutral'
  }

  const getTrendIcon = (likes: number, comments: number) => {
    const engagement = likes + comments * 5 // Weight comments more
    if (engagement > 1000) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (engagement < 100) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {post.media_type === 'video' && <Play className="h-4 w-4 text-blue-600" />}
            {post.media_type === 'photo' && <ImageIcon className="h-4 w-4 text-green-600" />}
            {post.media_type === 'carousel' && <Grid3x3 className="h-4 w-4 text-purple-600" />}
            <Badge variant="outline" className="text-xs">
              {post.media_type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {new Date(post.timestamp).toLocaleDateString()}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            {getTrendIcon(post.like_count, post.comment_count)}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="text-xs"
            >
              {isExpanded ? 'Less' : 'Details'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Engagement Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">{post.like_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">{post.comment_count.toLocaleString()}</span>
          </div>
        </div>

        {/* AI Analysis Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">AI Analysis</span>
            </div>
            <Badge 
              variant={post.ai_analyzed_at ? 'default' : 'secondary'}
              className="text-xs"
            >
              {post.ai_analyzed_at ? 'Analyzed' : 'Pending'}
            </Badge>
          </div>
          
          {post.ai_analyzed_at && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">Category:</span>
                  <Badge variant="outline" className="text-xs">
                    {post.ai_content_category || 'Unknown'}
                  </Badge>
                </div>
                {post.ai_category_confidence && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <Progress value={post.ai_category_confidence * 100} className="w-12 h-1" />
                    <span className="text-xs">{Math.round(post.ai_category_confidence * 100)}%</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">Sentiment:</span>
                  <div className={`w-3 h-3 rounded-full ${getSentimentColor(post.ai_sentiment_score)}`} />
                  <span className="text-xs">{getSentimentText(post.ai_sentiment_score)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Languages className="h-3 w-3 text-indigo-600" />
                  <span className="text-xs">{post.ai_language_code?.toUpperCase() || 'N/A'}</span>
                  {post.ai_language_confidence && (
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(post.ai_language_confidence * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Caption Preview */}
        {post.caption && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Caption:</span>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.caption}
            </p>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && post.ai_analyzed_at && (
          <div className="pt-3 border-t space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium">Analysis Timestamp:</span>
                <p className="text-muted-foreground mt-1">
                  {new Date(post.ai_analyzed_at).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium">Content ID:</span>
                <p className="text-muted-foreground mt-1 font-mono">{post.id}</p>
              </div>
            </div>
            
            {post.ai_sentiment_score !== null && (
              <div>
                <span className="text-xs font-medium">Sentiment Analysis:</span>
                <div className="mt-1 space-y-1">
                  <Progress 
                    value={((post.ai_sentiment_score + 1) / 2) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Negative</span>
                    <span>Score: {post.ai_sentiment_score?.toFixed(3)}</span>
                    <span>Positive</span>
                  </div>
                </div>
              </div>
            )}

            {post.ai_analysis_raw && (
              <div className="space-y-1">
                <span className="text-xs font-medium">Raw AI Data Available</span>
                <Badge variant="outline" className="text-xs">
                  {Object.keys(post.ai_analysis_raw).length} models analyzed
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PostAnalyticsDashboard({
  username,
  posts,
  isLoading = false,
  error = null,
  onRefresh,
  onLoadMore,
  hasMore = false
}: PostAnalyticsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())

  // Filter posts based on search and filters
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.ai_content_category?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || 
      post.ai_content_category === categoryFilter
    
    const matchesSentiment = sentimentFilter === 'all' || 
      (sentimentFilter === 'positive' && (post.ai_sentiment_score || 0) > 0.3) ||
      (sentimentFilter === 'negative' && (post.ai_sentiment_score || 0) < -0.3) ||
      (sentimentFilter === 'neutral' && Math.abs(post.ai_sentiment_score || 0) <= 0.3)

    return matchesSearch && matchesCategory && matchesSentiment
  })

  const togglePostExpansion = (postId: string) => {
    const newExpanded = new Set(expandedPosts)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedPosts(newExpanded)
  }

  // Get unique categories for filter
  const categories = Array.from(new Set(
    posts
      .map(post => post.ai_content_category)
      .filter(Boolean)
  ))

  // Analytics summary
  const analyzedPosts = posts.filter(post => post.ai_analyzed_at).length
  const averageSentiment = posts.reduce((sum, post) => 
    sum + (post.ai_sentiment_score || 0), 0
  ) / Math.max(posts.length, 1)
  
  const topCategory = categories.reduce((top, category) => {
    const count = posts.filter(post => post.ai_content_category === category).length
    const topCount = posts.filter(post => post.ai_content_category === top).length
    return count > topCount ? category : top
  }, categories[0])

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Post Analytics Dashboard</CardTitle>
            <CardDescription>Loading individual post analysis...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Post Analytics Dashboard</span>
              </CardTitle>
              <CardDescription>
                AI-powered analysis of individual posts for @{username}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analyzedPosts}</div>
              <p className="text-sm text-muted-foreground">AI Analyzed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {averageSentiment > 0 ? '+' : ''}{averageSentiment.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Avg Sentiment</p>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-600 truncate">
                {topCategory || 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">Top Category</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts by caption or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || categoryFilter !== 'all' || sentimentFilter !== 'all') && (
            <div className="flex items-center space-x-2 mt-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Showing {filteredPosts.length} of {posts.length} posts
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                  setSentimentFilter('all')
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Posts Found</h3>
            <p className="text-muted-foreground">
              {posts.length === 0 
                ? 'No posts available for analysis.' 
                : 'No posts match your current filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isExpanded={expandedPosts.has(post.id)}
              onToggleExpand={() => togglePostExpansion(post.id)}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="text-center">
          <Button onClick={onLoadMore} variant="outline" disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  )
}