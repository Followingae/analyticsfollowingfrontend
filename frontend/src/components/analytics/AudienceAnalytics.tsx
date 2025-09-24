'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  Globe, 
  UserCheck,
  PieChart,
  BarChart3,
  Target
} from 'lucide-react'

interface AudienceDemographics {
  age_groups: Record<string, number>
  gender_distribution: {
    male: number
    female: number
  }
  top_countries: string[]
  verified_followers_percentage: number
}

interface AudienceAnalyticsProps {
  demographics: AudienceDemographics
}

export function AudienceAnalytics({ demographics }: AudienceAnalyticsProps) {
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getCountryName = (code: string): string => {
    const countries: Record<string, string> = {
      'US': '🇺🇸 United States',
      'BR': '🇧🇷 Brazil',
      'ES': '🇪🇸 Spain',
      'IN': '🇮🇳 India',
      'GB': '🇬🇧 United Kingdom',
      'FR': '🇫🇷 France',
      'DE': '🇩🇪 Germany',
      'IT': '🇮🇹 Italy',
      'MX': '🇲🇽 Mexico',
      'AR': '🇦🇷 Argentina',
      'CO': '🇨🇴 Colombia',
      'PE': '🇵🇪 Peru',
      'CL': '🇨🇱 Chile',
      'CA': '🇨🇦 Canada',
      'AU': '🇦🇺 Australia'
    }
    return countries[code] || `${code}`
  }

  const getAgeGroupData = () => {
    return Object.entries(demographics.age_groups)
      .sort(([, a], [, b]) => b - a) // Sort by percentage descending
  }

  const getAgeGroupColor = (ageGroup: string): string => {
    const colors: Record<string, string> = {
      '18-24': 'bg-primary',
      '25-34': 'bg-green-500',
      '35-44': 'bg-yellow-500 dark:bg-yellow-600',
      '45-54': 'bg-orange-500 dark:bg-orange-600',
      '55+': 'bg-destructive',
      '45+': 'bg-primary/80'
    }
    return colors[ageGroup] || 'bg-muted'
  }

  return (
    <div className="space-y-6">
      {/* Age Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Age Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of audience by age groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getAgeGroupData().map(([ageGroup, percentage]) => (
              <div key={ageGroup} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getAgeGroupColor(ageGroup)}`} />
                    <span className="font-medium">{ageGroup} years</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPercentage(percentage)}
                  </span>
                </div>
                <Progress value={percentage * 100} className="w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gender Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gender Distribution
          </CardTitle>
          <CardDescription>
            Male vs female audience breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Male */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="font-medium">Male</span>
                </div>
                <span className="text-sm font-semibold">
                  {formatPercentage(demographics.gender_distribution.male)}
                </span>
              </div>
              <Progress 
                value={demographics.gender_distribution.male * 100} 
                className="w-full" 
              />
            </div>

            {/* Female */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500 dark:bg-pink-600" />
                  <span className="font-medium">Female</span>
                </div>
                <span className="text-sm font-semibold">
                  {formatPercentage(demographics.gender_distribution.female)}
                </span>
              </div>
              <Progress 
                value={demographics.gender_distribution.female * 100} 
                className="w-full" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Top Countries
          </CardTitle>
          <CardDescription>
            Primary geographic distribution of audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {demographics.top_countries.slice(0, 6).map((countryCode, index) => (
              <div 
                key={countryCode}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {getCountryName(countryCode)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audience Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Verified Followers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">
              {formatPercentage(demographics.verified_followers_percentage)}
            </div>
            <Progress 
              value={demographics.verified_followers_percentage * 100} 
              className="w-full mb-2" 
            />
            <p className="text-sm text-muted-foreground">
              Higher percentages indicate better audience quality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Audience Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Primary Age Group:</span>
                <Badge variant="secondary">
                  {getAgeGroupData()[0]?.[0]} years
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Top Market:</span>
                <Badge variant="secondary">
                  {getCountryName(demographics.top_countries[0])}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Audience Quality:</span>
                <Badge 
                  variant={demographics.verified_followers_percentage > 0.1 ? "default" : "secondary"}
                >
                  {demographics.verified_followers_percentage > 0.15 ? "High" : 
                   demographics.verified_followers_percentage > 0.1 ? "Good" : "Average"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}