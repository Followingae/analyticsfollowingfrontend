"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { OpenAICodexAnimatedBackground } from "@/components/open-ai-codex-animated-background"

interface SmartDiscoveryProps {
  className?: string
  onDiscover?: () => void
}

export function SmartDiscovery({
  className,
  onDiscover
}: SmartDiscoveryProps) {
  const handleActivate = () => onDiscover?.()
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label="Creator Discovery — AI-powered insights to find the right voices. Activate to discover now."
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleActivate()
        }
      }}
      className={cn(
        "relative text-center overflow-hidden group border-0 cursor-pointer hover:shadow-lg transition-all duration-700 ease-out",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {/* OpenAI Codex Animated Background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div 
          className="w-full h-full rounded-xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 ease-out"
        >
          <OpenAICodexAnimatedBackground />
        </div>
      </div>
      
      {/* Adaptive gradient overlay for better text readability in both light and dark modes */}
      <div className="absolute inset-0 z-10 bg-background/20 dark:bg-background/40 transition-all duration-700 ease-out rounded-xl" />
      <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-background/30 dark:bg-background/20 transition-all duration-700 ease-out rounded-xl" />
      
      
      
      {/* Content overlay — the whole Card is the interactive control, so the
          content layer stays non-interactive (no nested tab stop / no dead
          large target: clicking anywhere activates the Card). */}
      <div className="relative z-20 p-6 h-full flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center">
          <h2 className="text-white dark:text-foreground group-hover:text-foreground font-black text-4xl md:text-5xl relative z-10 transition-colors duration-700 ease-out tracking-tight leading-tight">
            Creator Discovery
          </h2>
          <p className="text-white/80 dark:text-foreground/80 group-hover:text-foreground/80 text-lg mt-3 mb-6 relative z-10 transition-colors duration-700 ease-out">
            AI-powered insights to find the right voices instantly
          </p>
          {/* Filled primary affordance (visual only — the Card carries the
              click + keyboard handling). Promoted from `outline` to `default`. */}
          <Button
            asChild
            variant="default"
            className={cn(
              "transition-all duration-200",
              "shadow-sm group-hover:shadow-md"
            )}
          >
            <span>Discover Now</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}