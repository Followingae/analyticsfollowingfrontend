"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
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
      aria-label="Creator Discovery: AI-powered insights to find the right voices. Activate to discover now."
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
      
      {/* The scrim.
          It was `bg-background/20` in light mode under `text-white`, which a contrast check
          measured at 1.0:1 — white text on a white-ish surface, twice, at whatever the
          animation happened to be doing. A scrim that varies frame by frame cannot be relied
          on to carry text, so the text no longer depends on it: the headline uses the theme's
          own foreground colour in both modes, and the scrim is here to settle the background
          rather than to rescue the type. */}
      <div className="absolute inset-0 z-10 bg-background/70 dark:bg-background/60 transition-all duration-700 ease-out rounded-xl" />
      <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-background/50 dark:bg-background/40 transition-all duration-700 ease-out rounded-xl" />

      {/* Content overlay — the whole Card is the interactive control, so the
          content layer stays non-interactive (no nested tab stop / no dead
          large target: clicking anywhere activates the Card). */}
      <div className="relative z-20 p-6 h-full flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center">
          {/* This was `text-4xl md:text-5xl font-black`: 48px at weight 900, which made an
              advertisement for a feature the largest thing on the client's home screen,
              louder than the client's own name at 44px and louder than every measured number
              on a page whose whole argument is that the numbers are trustworthy. It is now
              one thing among several, which is what it is. */}
          <h2 className="text-foreground font-semibold text-2xl relative z-10 tracking-tight leading-tight">
            Creator Discovery
          </h2>
          <p className="text-muted-foreground text-sm mt-2 relative z-10">
            AI-powered insights to find the right voices instantly
          </p>
          {/* There used to be a <Button asChild> wrapping a <span> here: a control that
              looked like a button, was not focusable, and sat inside a layer with
              `pointer-events-none` — so it advertised an action it could not perform, and
              the card underneath already carried the real one. Two affordances for one
              action, one of them fake. The card's own hover and focus ring carry the
              invitation now. */}
        </div>
      </div>
    </Card>
  )
}