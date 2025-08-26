import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, MapPin, UserCheck, Globe } from "lucide-react"
import type { AudienceInsights } from "@/types/creatorTypes"

interface AudienceInsightsCardProps {
  audienceInsights: AudienceInsights
}

export function AudienceInsightsCard({ audienceInsights }: AudienceInsightsCardProps) {
  const { estimated_demographics } = audienceInsights
  
  // Sort age groups by percentage
  const sortedAgeGroups = Object.entries(estimated_demographics.age_groups)
    .sort(([, a], [, b]) => b - a)

  // Get dominant gender
  const dominantGender = estimated_demographics.gender_split.female > estimated_demographics.gender_split.male 
    ? { gender: 'Female', percentage: estimated_demographics.gender_split.female }
    : { gender: 'Male', percentage: estimated_demographics.gender_split.male }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Audience Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gender Distribution */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-purple-500" />
            Gender Distribution
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Female</span>
                <span className="font-medium text-pink-600">
                  {estimated_demographics.gender_split.female}%
                </span>
              </div>
              <Progress 
                value={estimated_demographics.gender_split.female} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Male</span>
                <span className="font-medium text-blue-600">
                  {estimated_demographics.gender_split.male}%
                </span>
              </div>
              <Progress 
                value={estimated_demographics.gender_split.male} 
                className="h-2"
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Primary audience: <span className="font-medium">{dominantGender.gender}</span> ({dominantGender.percentage}%)
          </div>
        </div>

        {/* Age Groups */}
        <div>
          <h4 className="text-sm font-medium mb-3">Age Demographics</h4>
          <div className="space-y-3">
            {sortedAgeGroups.map(([ageGroup, percentage]) => (
              <div key={ageGroup} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{ageGroup}</span>
                  <span className="text-muted-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Target age group: <span className="font-medium">{sortedAgeGroups[0][0]}</span> ({sortedAgeGroups[0][1]}%)
          </div>
        </div>

        {/* Top Locations */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-green-500" />
            Top Locations
          </h4>
          <div className="flex flex-wrap gap-2">
            {estimated_demographics.top_locations.map((location, index) => (
              <Badge 
                key={location} 
                variant={index === 0 ? "default" : "outline"}
                className="flex items-center gap-1"
              >
                <MapPin className="h-3 w-3" />
                {location}
                {index === 0 && (
                  <span className="ml-1 text-xs opacity-75">(Primary)</span>
                )}
              </Badge>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Geographic reach: <span className="font-medium">{estimated_demographics.top_locations.length}</span> key markets
          </div>
        </div>

        {/* Audience Quality Indicator */}
        <div className="pt-4 border-t bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Audience Quality</span>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {estimated_demographics.top_locations.length >= 3 ? 'Global Reach' : 
               estimated_demographics.top_locations.length >= 2 ? 'Regional' : 'Local Focus'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Demographics:</strong> Well-defined {sortedAgeGroups[0][0]} {dominantGender.gender.toLowerCase()} audience
            </p>
            <p>
              <strong>Market Reach:</strong> Strong presence in {estimated_demographics.top_locations.slice(0, 2).join(' and ')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}