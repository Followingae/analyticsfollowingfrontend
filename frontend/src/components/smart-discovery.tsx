"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EvervaultCard } from "@/components/ui/evervault-card"

interface SmartDiscoveryProps {
  className?: string
  onDiscover?: () => void
}

export function SmartDiscovery({
  className,
  onDiscover
}: SmartDiscoveryProps) {
  return (
    <div className={cn(
      "relative bg-background border-border text-center overflow-hidden",
      "border-2 border-dashed rounded-xl w-full h-[320px]",
      "group",
      className
    )}>
      {/* Evervault Card Background - no text */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <EvervaultCard className="w-full h-full" />
      </div>
      
      {/* Radial gradient overlay for text readability - sits between background and text */}
      <div 
        className="absolute inset-0 z-10 bg-background rounded-xl pointer-events-none"
        style={{
          maskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.3) 60%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.3) 60%, transparent 80%)'
        }}
      />
      
      {/* Content overlay */}
      <div className="relative z-20 p-14 h-full flex flex-col items-center justify-center pointer-events-none">
        <div>
        
        {/* Content with matching font styles */}
        <h2 className="text-foreground font-medium mt-6 relative z-10">Smart Discovery</h2>
        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line mb-5 relative z-10">AI-powered search finds influencers with unmatched accuracy.</p>
        <Button
          onClick={onDiscover}
          variant="outline"
          className={cn(
            "mt-4 pointer-events-auto",
            "shadow-sm active:shadow-none"
          )}
        >
          Discover Now
        </Button>
        </div>
      </div>
    </div>
  )
}