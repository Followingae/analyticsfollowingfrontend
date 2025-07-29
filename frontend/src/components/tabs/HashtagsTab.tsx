'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/utils'
// TODO: Create hashtag API service when backend endpoints are ready
// import { hashtagApiService } from '@/services/hashtagApi'
import { HashtagOpportunity } from '@/types'
import { Loader2, Search, Hash, TrendingUp, Target, Lightbulb, BarChart3 } from 'lucide-react'

export default function HashtagsTab() {
  const [hashtag, setHashtag] = useState('')
  const [loading, setLoading] = useState(false)
  const [hashtagData, setHashtagData] = useState<Record<string, unknown> | null>(null)
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')

  const handleAnalyze = async () => {
    if (!hashtag.trim()) return
    
    setLoading(true)
    try {
      // TODO: Implement hashtag analysis API when backend endpoints are ready
      // const cleanHashtag = hashtag.trim().replace('#', '')
      // const result = await hashtagApiService.analyzeHashtag(cleanHashtag)
      // if (result.success) {
      //   setHashtagData(result.data)
      // }
      
      // Temporary placeholder - remove when backend is ready
      console.log('Hashtag analysis feature will be implemented when backend endpoints are available')
      setHashtagData(null) // Show empty state
    } catch (err) {
      console.error('Hashtag analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const sampleOpportunities: HashtagOpportunity[] = [
    {
      hashtag: 'microworkout',
      difficulty: 'Easy',
      posts_count: 15420,
      avg_engagement: 2850,
      competition_level: 2.3,
      opportunity_score: 8.7
    },
    {
      hashtag: 'sustainablefashion',
      difficulty: 'Medium',
      posts_count: 890340,
      avg_engagement: 5200,
      competition_level: 5.8,
      opportunity_score: 7.2
    },
    {
      hashtag: 'mindfulcooking',
      difficulty: 'Easy',
      posts_count: 28750,
      avg_engagement: 1950,
      competition_level: 3.1,
      opportunity_score: 8.1
    },
    {
      hashtag: 'digitalminimalism',
      difficulty: 'Medium',
      posts_count: 156890,
      avg_engagement: 3400,
      competition_level: 4.7,
      opportunity_score: 7.8
    },
    {
      hashtag: 'remoteworklife',
      difficulty: 'Hard',
      posts_count: 2340000,
      avg_engagement: 8900,
      competition_level: 8.2,
      opportunity_score: 6.5
    },
    {
      hashtag: 'urbangardening',
      difficulty: 'Easy',
      posts_count: 45200,
      avg_engagement: 2100,
      competition_level: 2.8,
      opportunity_score: 8.4
    }
  ]

  const filteredOpportunities = difficulty === 'all' 
    ? sampleOpportunities 
    : sampleOpportunities.filter(op => op.difficulty.toLowerCase() === difficulty)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getOpportunityColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Single Hashtag Analysis */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Hashtag Analysis
          </CardTitle>
          <CardDescription>
            Deep dive into hashtag performance and metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Enter hashtag (e.g., fitness, food, travel)..."
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={loading || !hashtag.trim()}
              className="px-6"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {hashtagData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber((hashtagData as any)?.posts_count || 1250000)}
                </div>
                <div className="text-sm text-gray-600">Total Posts</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber((hashtagData as any)?.avg_engagement || 3500)}
                </div>
                <div className="text-sm text-gray-600">Avg Engagement</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {(hashtagData as any)?.difficulty_score || 6.8}/10
                </div>
                <div className="text-sm text-gray-600">Difficulty</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(hashtagData as any)?.growth_rate || 12}%
                </div>
                <div className="text-sm text-gray-600">Growth Rate</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hashtag Opportunities */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Hashtag Opportunities
          </CardTitle>
          <CardDescription>
            Discover high-opportunity hashtags with low competition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Difficulty Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={difficulty === 'all' ? 'default' : 'outline'}
              onClick={() => setDifficulty('all')}
              size="sm"
            >
              All Difficulties
            </Button>
            <Button
              variant={difficulty === 'easy' ? 'default' : 'outline'}
              onClick={() => setDifficulty('easy')}
              size="sm"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              Easy
            </Button>
            <Button
              variant={difficulty === 'medium' ? 'default' : 'outline'}
              onClick={() => setDifficulty('medium')}
              size="sm"
              className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
            >
              Medium
            </Button>
            <Button
              variant={difficulty === 'hard' ? 'default' : 'outline'}
              onClick={() => setDifficulty('hard')}
              size="sm"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            >
              Hard
            </Button>
          </div>

          {/* Opportunities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOpportunities.map((opportunity) => (
              <Card key={opportunity.hashtag} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        #{opportunity.hashtag}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          className={`text-white text-xs ${getDifficultyColor(opportunity.difficulty)}`}
                        >
                          {opportunity.difficulty}
                        </Badge>
                        <span className={`text-sm font-semibold ${getOpportunityColor(opportunity.opportunity_score)}`}>
                          {opportunity.opportunity_score}/10
                        </span>
                      </div>
                    </div>
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posts</span>
                      <span className="font-medium">{formatNumber(opportunity.posts_count)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Engagement</span>
                      <span className="font-medium">{formatNumber(opportunity.avg_engagement)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Competition</span>
                      <span className="font-medium">{opportunity.competition_level}/10</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Opportunity Score</span>
                      <span>{opportunity.opportunity_score}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          opportunity.opportunity_score >= 8 ? 'bg-green-500' :
                          opportunity.opportunity_score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(opportunity.opportunity_score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => setHashtag(opportunity.hashtag)}
                  >
                    Analyze
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hashtag Strategy Tips */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Hashtag Strategy Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-700">✅ Best Practices</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Mix popular and niche hashtags (70/30 rule)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Use 11-15 hashtags for optimal reach</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Target hashtags with 10K-500K posts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Create branded hashtags for campaigns</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-red-700">❌ Avoid These</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>Using banned or shadowbanned hashtags</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>Copying the same hashtags every post</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>Using irrelevant trending hashtags</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>Overusing extremely popular hashtags</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Hashtag Sets */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Hashtag Sets
          </CardTitle>
          <CardDescription>
            Pre-curated hashtag combinations for different niches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                niche: 'Fitness',
                tags: ['#fitness', '#workout', '#gym', '#healthylifestyle', '#fitnessmotivation'],
                color: 'bg-red-50 border-red-200'
              },
              {
                niche: 'Food',
                tags: ['#food', '#foodie', '#delicious', '#homecooking', '#recipe'],
                color: 'bg-orange-50 border-orange-200'
              },
              {
                niche: 'Travel',
                tags: ['#travel', '#wanderlust', '#explore', '#adventure', '#vacation'],
                color: 'bg-blue-50 border-blue-200'
              }
            ].map((set) => (
              <Card key={set.niche} className={`${set.color} hover:shadow-md transition-shadow cursor-pointer`}>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">{set.niche}</h4>
                  <div className="flex flex-wrap gap-1">
                    {set.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => {
                      navigator.clipboard.writeText(set.tags.join(' '))
                    }}
                  >
                    Copy Set
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}