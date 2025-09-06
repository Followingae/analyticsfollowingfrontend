import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Globe, Languages, MapPin, Star } from "lucide-react"
import type { LanguageAnalysis } from "@/types/creatorTypes"

interface LanguageAnalysisCardProps {
  languageAnalysis: LanguageAnalysis
}

export function LanguageAnalysisCard({ languageAnalysis }: LanguageAnalysisCardProps) {
  // Sort language distribution by percentage
  const sortedLanguages = Object.entries(languageAnalysis.language_distribution)
    .sort(([, a], [, b]) => b - a)

  const getMultilingualLevel = (score: number) => {
    if (score >= 70) return { text: 'Highly Multilingual', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' }
    if (score >= 40) return { text: 'Moderately Multilingual', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900' }
    if (score >= 20) return { text: 'Limited Multilingual', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900' }
    return { text: 'Primarily Monolingual', color: 'text-muted-foreground', bgColor: 'bg-gray-100 dark:bg-gray-900' }
  }

  const multilingualLevel = getMultilingualLevel(languageAnalysis.multilingual_score)

  const getLanguageFlag = (language: string) => {
    const flagMap: Record<string, string> = {
      'English': '🇺🇸',
      'Arabic': '🇸🇦',
      'Spanish': '🇪🇸',
      'French': '🇫🇷',
      'German': '🇩🇪',
      'Italian': '🇮🇹',
      'Portuguese': '🇵🇹',
      'Russian': '🇷🇺',
      'Japanese': '🇯🇵',
      'Chinese': '🇨🇳',
      'Korean': '🇰🇷',
      'Hindi': '🇮🇳',
      'Turkish': '🇹🇷',
      'Dutch': '🇳🇱'
    }
    return flagMap[language] || '🌐'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Languages className="h-5 w-5 text-indigo-500" />
          Language & Market Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Language */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium">Primary Language</span>
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100">
                <span className="mr-1">{getLanguageFlag(languageAnalysis.primary_language)}</span>
                {languageAnalysis.primary_language}
              </Badge>
            </div>
          </div>
        </div>

        {/* Language Distribution */}
        <div>
          <h4 className="text-sm font-medium mb-3">Language Distribution</h4>
          <div className="space-y-3">
            {sortedLanguages.map(([language, percentage]) => (
              <div key={language} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{getLanguageFlag(language)}</span>
                    <span className="font-medium">{language}</span>
                  </div>
                  <span className="text-muted-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Multilingual Score */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Multilingual Reach</span>
            </div>
            <Badge className={`${multilingualLevel.bgColor} ${multilingualLevel.color}`}>
              {multilingualLevel.text}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Multilingual Score</span>
              <span className={`font-bold ${multilingualLevel.color}`}>
                {languageAnalysis.multilingual_score}/100
              </span>
            </div>
            <Progress 
              value={languageAnalysis.multilingual_score} 
              className="h-3"
            />
          </div>
        </div>

        {/* Target Markets */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-500" />
            Target Markets
          </h4>
          <div className="flex flex-wrap gap-2">
            {languageAnalysis.target_markets.map((market, index) => (
              <Badge 
                key={market} 
                variant={index === 0 ? "default" : "outline"}
                className="flex items-center gap-1"
              >
                <Star className={`h-3 w-3 ${index === 0 ? '' : 'text-muted-foreground'}`} />
                {market}
                {index === 0 && (
                  <span className="ml-1 text-xs opacity-75">(Primary)</span>
                )}
              </Badge>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Market coverage: <span className="font-medium">{languageAnalysis.target_markets.length}</span> key regions
          </div>
        </div>

        {/* Market Potential Summary */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Content Strategy:</strong> {languageAnalysis.multilingual_score >= 40 ? 'Multi-market approach' : 'Single-market focus'} with {languageAnalysis.primary_language} as primary
            </p>
            <p>
              <strong>Global Appeal:</strong> {languageAnalysis.target_markets.length >= 3 ? 'Strong international presence' : languageAnalysis.target_markets.length >= 2 ? 'Regional appeal' : 'Local market focus'}
            </p>
            <p>
              <strong>Language Reach:</strong> {sortedLanguages.length} language{sortedLanguages.length > 1 ? 's' : ''} detected in content
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}