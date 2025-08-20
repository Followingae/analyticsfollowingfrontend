'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Languages, Globe } from 'lucide-react'
import { AILanguageDistribution, AILanguageCode } from '@/services/instagramApi'
import { cn } from '@/lib/utils'

interface LanguageDistributionProps {
  distribution: AILanguageDistribution
  className?: string
  maxLanguages?: number
  showPercentages?: boolean
}

// Language code to full name mapping
const LANGUAGE_NAMES: Record<string, { name: string; flag: string; nativeName: string }> = {
  'ar': { name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  'bg': { name: 'Bulgarian', flag: '🇧🇬', nativeName: 'български' },
  'de': { name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  'el': { name: 'Greek', flag: '🇬🇷', nativeName: 'Ελληνικά' },
  'en': { name: 'English', flag: '🇺🇸', nativeName: 'English' },
  'es': { name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  'fr': { name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  'hi': { name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  'it': { name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  'ja': { name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  'nl': { name: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' },
  'pl': { name: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
  'pt': { name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  'ru': { name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  'sw': { name: 'Swahili', flag: '🇰🇪', nativeName: 'Kiswahili' },
  'th': { name: 'Thai', flag: '🇹🇭', nativeName: 'ไทย' },
  'tr': { name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
  'ur': { name: 'Urdu', flag: '🇵🇰', nativeName: 'اردو' },
  'vi': { name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
  'zh': { name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
}

// Color scheme for progress bars
const PROGRESS_COLORS = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-purple-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-emerald-500'
]

interface LanguageData {
  code: string
  name: string
  flag: string
  nativeName: string
  percentage: number
  color: string
}

export function LanguageDistribution({ 
  distribution, 
  className,
  maxLanguages = 5,
  showPercentages = true
}: LanguageDistributionProps) {
  // Process and sort language data
  const languageData: LanguageData[] = React.useMemo(() => {
    return Object.entries(distribution)
      .filter(([_, percentage]) => percentage > 0)
      .map(([code, percentage], index) => {
        const languageInfo = LANGUAGE_NAMES[code] || { 
          name: code.toUpperCase(), 
          flag: '🌐', 
          nativeName: code.toUpperCase() 
        }
        return {
          code,
          name: languageInfo.name,
          flag: languageInfo.flag,
          nativeName: languageInfo.nativeName,
          percentage,
          color: PROGRESS_COLORS[index % PROGRESS_COLORS.length]
        }
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, maxLanguages)
  }, [distribution, maxLanguages])

  // Calculate stats
  const totalLanguages = Object.keys(distribution).filter(key => distribution[key] > 0).length
  const primaryLanguage = languageData[0]
  const isMultilingual = languageData.length > 1

  if (languageData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Language Distribution
          </CardTitle>
          <CardDescription>
            AI-powered language detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No language analysis available yet</p>
            <p className="text-sm">Language detection will appear here once analysis is complete</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          Language Distribution
        </CardTitle>
        <CardDescription>
          {isMultilingual ? 
            `Multilingual content across ${totalLanguages} languages` :
            `Monolingual content in ${primaryLanguage.name}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Primary language highlight */}
          {primaryLanguage && (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{primaryLanguage.flag}</span>
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-300">
                    Primary Language
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {primaryLanguage.name} ({primaryLanguage.nativeName})
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {(primaryLanguage.percentage * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">of content</p>
              </div>
            </div>
          )}

          {/* Language breakdown */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground">
              Language Breakdown
            </h4>
            
            {languageData.map((lang, index) => (
              <div key={lang.code} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    <div>
                      <p className="text-sm font-medium">{lang.name}</p>
                      <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                    </div>
                  </div>
                  {showPercentages && (
                    <Badge variant="outline" className="text-xs">
                      {(lang.percentage * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Progress 
                    value={lang.percentage * 100} 
                    className="h-2"
                  />
                  <div 
                    className={cn("absolute inset-0 rounded-full", lang.color)}
                    style={{ width: `${lang.percentage * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Additional languages indicator */}
          {totalLanguages > maxLanguages && (
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                +{totalLanguages - maxLanguages} more languages detected
              </p>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalLanguages}</p>
              <p className="text-sm text-muted-foreground">Languages Detected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {isMultilingual ? 'Multi' : 'Mono'}
              </p>
              <p className="text-sm text-muted-foreground">Content Type</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact language badge for use in post cards
export function LanguageBadge({ 
  languageCode, 
  className 
}: { 
  languageCode?: AILanguageCode | string | null
  className?: string 
}) {
  if (!languageCode) {
    return (
      <Badge variant="outline" className={cn("text-xs", className)}>
        <Globe className="w-3 h-3 mr-1" />
        Unknown
      </Badge>
    )
  }

  const languageInfo = LANGUAGE_NAMES[languageCode] || { 
    name: languageCode.toUpperCase(), 
    flag: '🌐', 
    nativeName: languageCode.toUpperCase() 
  }
  
  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs gap-1", className)}
    >
      <span>{languageInfo.flag}</span>
      {languageInfo.name}
    </Badge>
  )
}