'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { instagramApiService, InstagramPost, PostsPagination } from '@/services/instagramApi'
import PostCard from './PostCard'
import { Loader2, Grid3x3, TrendingUp, Calendar, Hash } from 'lucide-react'

interface PostsGridProps {
  username: string
}

export default function PostsGrid({ username }: PostsGridProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [pagination, setPagination] = useState<PostsPagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (username) {
      loadPosts(0, true)
    }
  }, [username])

  const loadPosts = async (offset: number = 0, isInitial: boolean = false) => {
    if (isInitial) {
      setInitialLoading(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const result = await instagramApiService.getPosts(username, 20, offset)
      
      if (result.success && result.data) {
        if (offset === 0) {
          setPosts(result.data.posts)
        } else {
          setPosts(prev => [...prev, ...result.data!.posts])
        }
        setPagination(result.data.pagination || null)
      } else {
        setError(result.error || 'Failed to load posts')
      }
    } catch (err) {

      setError(err instanceof Error ? err.message : 'An error occurred while loading posts')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  const loadMorePosts = () => {
    if (pagination?.has_more && !loading) {
      loadPosts(pagination.next_offset)
    }
  }

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center">
          <div className="text-red-700">
            <strong>Error:</strong> {error}
          </div>
          <Button 
            onClick={() => loadPosts(0, true)} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!posts.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Grid3x3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Found</h3>
          <p className="text-muted-foreground">
            No posts are available for @{username} yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate analytics from posts
  const totalLikes = posts.reduce((sum, post) => sum + post.likes_count, 0)
  const totalComments = posts.reduce((sum, post) => sum + post.comments_count, 0)
  const avgEngagement = posts.length > 0 
    ? posts.reduce((sum, post) => sum + post.engagement_rate, 0) / posts.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Posts Analytics Header */}
      <Card className="border-0 bg-background/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5" />
            Posts Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {posts.length}
              </div>
              <div className="text-sm text-muted-foreground">Posts Loaded</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {totalLikes.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Likes</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {totalComments.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Comments</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {avgEngagement.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Engagement</div>
            </div>
          </div>

          {pagination && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {posts.length} of {pagination.total.toLocaleString()} posts
              </div>
              <Badge variant="outline">
                {pagination.has_more ? 'More available' : 'All loaded'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>


      {/* End of Posts Message */}
      {pagination && !pagination.has_more && posts.length > 0 && (
        <Card className="border-border bg-muted/50">
          <CardContent className="py-6 text-center">
            <div className="text-muted-foreground">
              ✅ All {pagination.total.toLocaleString()} posts loaded
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}