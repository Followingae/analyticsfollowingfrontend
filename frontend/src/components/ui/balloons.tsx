import * as React from "react"
import { cn } from "@/lib/utils"

// Dynamic import to avoid SSR issues and handle errors gracefully
const loadBalloons = async () => {
  try {
    const balloonsModule = await import("balloons-js")
    return balloonsModule
  } catch (error) {

    return null
  }
}

export interface BalloonsProps {
  type?: "default" | "text"
  text?: string
  fontSize?: number
  color?: string
  className?: string
  onLaunch?: () => void
}

const Balloons = React.forwardRef<HTMLDivElement, BalloonsProps>(
  ({ type = "default", text, fontSize = 120, color = "#000000", className, onLaunch }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [balloonsModule, setBalloonsModule] = React.useState<any>(null)

    // Load balloons module on mount
    React.useEffect(() => {
      loadBalloons().then(module => {
        if (module) {
          setBalloonsModule(module)
        }
      })
    }, [])
    
    const launchAnimation = React.useCallback(async () => {
      try {
        if (!balloonsModule) {
          const module = await loadBalloons()
          if (!module) return
          setBalloonsModule(module)
          
          // Launch with the newly loaded module
          if (type === "default") {
            module.balloons()
          } else if (type === "text" && text) {
            module.textBalloons([
              {
                text,
                fontSize,
                color,
              },
            ])
          }
        } else {
          // Use already loaded module
          if (type === "default") {
            balloonsModule.balloons()
          } else if (type === "text" && text) {
            balloonsModule.textBalloons([
              {
                text,
                fontSize,
                color,
              },
            ])
          }
        }
        
        if (onLaunch) {
          onLaunch()
        }
      } catch (error) {

      }
    }, [type, text, fontSize, color, onLaunch, balloonsModule])

    // Export animation launch method
    React.useImperativeHandle(ref, () => ({
      launchAnimation,
      ...(containerRef.current || {})
    }), [launchAnimation])

    return <div ref={containerRef} className={cn("balloons-container", className)} />
  }
)
Balloons.displayName = "Balloons"

export { Balloons }