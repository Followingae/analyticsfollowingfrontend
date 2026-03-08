"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { SiriOrb } from "@/components/siri-orb"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, ChevronDown, ChevronUp, TrendingUp, Users, Globe, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIInsight {
  type: string
  title: string
  data: any
}

interface AISnapshotData {
  headline: string
  insights: AIInsight[]
  recommendations: string[]
  scores: {
    authenticity: number
    sentiment: number
    avg_engagement: number
    total_reach: number
    creators_with_ai_data: number
    total_selected: number
  }
}

interface AISnapshotPanelProps {
  proposalId: string
  selectedIds: Set<string>
  onFetchSnapshot: (selectedIds: string[]) => Promise<AISnapshotData>
  className?: string
}

export function AISnapshotPanel({
  proposalId,
  selectedIds,
  onFetchSnapshot,
  className,
}: AISnapshotPanelProps) {
  const [snapshot, setSnapshot] = useState<AISnapshotData | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSnapshot = useCallback(async () => {
    if (selectedIds.size === 0) {
      setSnapshot(null)
      return
    }

    setLoading(true)
    try {
      const data = await onFetchSnapshot(Array.from(selectedIds))
      setSnapshot(data)
    } catch {
      // Silently fail — AI snapshot is non-critical
    } finally {
      setLoading(false)
    }
  }, [selectedIds, onFetchSnapshot])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchSnapshot, 800)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchSnapshot])

  const hasData = snapshot && selectedIds.size > 0

  useEffect(() => {
    if (snapshot && selectedIds.size > 0) {
      setExpanded(true)
    }
  }, [snapshot, selectedIds.size])

  return (
    <div className={cn(
      "border-b border-border/40",
      hasData && "bg-gradient-to-b from-primary/5 to-transparent",
      className
    )}>
      {/* Orb + Label */}
      <div className="flex flex-col items-center py-5">
        <div className={cn("transition-opacity duration-500", loading ? "opacity-60" : "opacity-100")}>
          <SiriOrb
            size="96px"
            animationDuration={loading ? 8 : 20}
            colors={{
              c1: "oklch(75% 0.18 280)",
              c2: "oklch(70% 0.15 200)",
              c3: "oklch(72% 0.16 330)",
            }}
            className="drop-shadow-lg"
          />
        </div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-3 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          AI Snapshot
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <AnimatePresence mode="wait">
          {!hasData ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground text-center"
            >
              {loading
                ? "Analyzing your selection..."
                : "Select creators to see AI-powered insights"}
            </motion.p>
          ) : (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Headline */}
              <p className="text-sm font-semibold text-foreground text-center leading-snug">
                {snapshot.headline}
              </p>

              {/* Score pills */}
              {snapshot.scores && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {snapshot.scores.avg_engagement > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                      <TrendingUp className="h-2.5 w-2.5" />
                      {snapshot.scores.avg_engagement.toFixed(1)}% eng
                    </span>
                  )}
                  {snapshot.scores.total_reach > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-[10px] font-medium">
                      <Users className="h-2.5 w-2.5" />
                      {(snapshot.scores.total_reach / 1000).toFixed(0)}K reach
                    </span>
                  )}
                  {snapshot.scores.authenticity > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-0.5 text-[10px] font-medium">
                      <Shield className="h-2.5 w-2.5" />
                      {snapshot.scores.authenticity}% auth
                    </span>
                  )}
                </div>
              )}

              {/* Expandable details */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? "Less" : "More insights"}
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-3"
                  >
                    {/* Demographics insight */}
                    {snapshot.insights.map((insight, i) => (
                      <div key={i} className="rounded-lg bg-muted/30 p-2.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          {insight.title}
                        </p>
                        {insight.type === "categories" && Array.isArray(insight.data) && (
                          <div className="space-y-1">
                            {insight.data.slice(0, 3).map((cat: any) => (
                              <div key={cat.name} className="flex items-center justify-between">
                                <span className="text-xs text-foreground">{cat.name}</span>
                                <span className="text-[10px] text-muted-foreground">{cat.value}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {insight.type === "demographics" && insight.data && (
                          <div className="space-y-1 text-xs">
                            {insight.data.gender && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Gender</span>
                                <span>{insight.data.gender.female}% F / {insight.data.gender.male}% M</span>
                              </div>
                            )}
                            {insight.data.top_age_group && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Top Age</span>
                                <span>{insight.data.top_age_group}</span>
                              </div>
                            )}
                            {insight.data.top_country && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Top Region</span>
                                <span>{insight.data.top_country}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {insight.type === "reach" && insight.data && (
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Followers</span>
                              <span>{(insight.data.total_followers / 1000).toFixed(0)}K</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg Engagement</span>
                              <span>{insight.data.avg_engagement?.toFixed(1)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Recommendations */}
                    {snapshot.recommendations.length > 0 && (
                      <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5">
                        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5">
                          Recommendations
                        </p>
                        <ul className="space-y-1">
                          {snapshot.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                              <span className="text-primary mt-0.5 shrink-0">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
