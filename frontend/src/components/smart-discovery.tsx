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
  return (
    <Card className={cn(
      "relative text-center overflow-hidden group border-0 hover:shadow-lg transition-all duration-700 ease-out",
      className
    )}>
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
      <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-background/30 dark:bg-background/60 transition-all duration-700 ease-out rounded-xl" />
      
      
      
      {/* Content overlay */}
      <div className="relative z-20 p-6 h-full flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center">
        
        {/* Content with large font styles */}
        <h1 className="text-white dark:text-foreground group-hover:text-foreground font-black text-4xl md:text-5xl relative z-10 transition-colors duration-700 ease-out tracking-tight leading-tight">Creator Discovery</h1>
        <p className="text-white/80 dark:text-foreground/80 group-hover:text-foreground/80 text-lg mt-2 whitespace-pre-line mb-6 relative z-10 transition-colors duration-700 ease-out">AI-powered insights to find the right voices instantly</p>
        <Button
          onClick={onDiscover}
          variant="outline"
          className={cn(
            "pointer-events-auto",
            "shadow-sm active:shadow-none"
          )}
        >
          Discover Now
        </Button>
        </div>
      </div>
    </Card>
  )
}