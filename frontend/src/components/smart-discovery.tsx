"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import UnicornScene from "unicornstudio-react"

// Custom background component that scales to fit container
const SmartDiscoveryBackground = () => {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ 
          width: Math.round(rect.width), 
          height: Math.round(rect.height) 
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <UnicornScene 
          production={true} 
          projectId="1grEuiVDSVmyvEMAYhA6" 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      )}
    </div>
  )
}

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
      "relative text-center overflow-hidden",
      "rounded-xl w-full h-[320px]",
      "group transition duration-500 hover:duration-200",
      className
    )}>
      {/* Animated Background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <SmartDiscoveryBackground />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8">
        <h1 className="text-white font-bold text-4xl mb-3 drop-shadow-lg tracking-tight">Smart Discovery</h1>
        <p className="text-white/90 text-sm mb-5 drop-shadow-md max-w-sm">AI-powered search finds influencers with unmatched accuracy.</p>
        <Button
          onClick={onDiscover}
          variant="outline"
          className="bg-white/90 backdrop-blur-sm border-white/50 text-gray-900 hover:bg-white/95 shadow-lg"
        >
          Discover Now
        </Button>
      </div>
    </div>
  )
}