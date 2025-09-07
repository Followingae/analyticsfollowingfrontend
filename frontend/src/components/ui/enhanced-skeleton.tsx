// components/ui/enhanced-skeleton.tsx
"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Loading animation speed - slower for better UX during long loads */
  speed?: 'fast' | 'normal' | 'slow'
  /** Shape variant for different content types */
  variant?: 'rectangular' | 'circular' | 'text' | 'button' | 'avatar' | 'card' | 'table'
  /** Size for predefined variants */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Number of lines for text skeleton */
  lines?: number
  /** Show shimmer effect */
  shimmer?: boolean
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className, 
    speed = 'normal',
    variant = 'rectangular',
    size = 'md',
    lines = 1,
    shimmer = true,
    ...props 
  }, ref) => {
    const speedClasses = {
      fast: 'animate-pulse [animation-duration:1s]',
      normal: 'animate-pulse [animation-duration:2s]', 
      slow: 'animate-pulse [animation-duration:3s]'
    }

    const variantClasses = {
      rectangular: 'rounded-md',
      circular: 'rounded-full',
      text: 'rounded-sm h-4',
      button: 'rounded-md h-10',
      avatar: 'rounded-full aspect-square',
      card: 'rounded-lg',
      table: 'rounded-sm h-12'
    }

    const sizeClasses = {
      sm: {
        rectangular: 'h-4',
        circular: 'w-8 h-8',
        text: 'h-3',
        button: 'h-8 px-3',
        avatar: 'w-8 h-8',
        card: 'h-32',
        table: 'h-8'
      },
      md: {
        rectangular: 'h-6',
        circular: 'w-12 h-12',
        text: 'h-4',
        button: 'h-10 px-4',
        avatar: 'w-12 h-12',
        card: 'h-48',
        table: 'h-12'
      },
      lg: {
        rectangular: 'h-8',
        circular: 'w-16 h-16',
        text: 'h-5',
        button: 'h-12 px-6',
        avatar: 'w-16 h-16',
        card: 'h-64',
        table: 'h-16'
      },
      xl: {
        rectangular: 'h-12',
        circular: 'w-24 h-24',
        text: 'h-6',
        button: 'h-14 px-8',
        avatar: 'w-24 h-24',
        card: 'h-80',
        table: 'h-20'
      }
    }

    const shimmerClass = shimmer 
      ? 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent' 
      : ''

    // Render multiple lines for text variant
    if (variant === 'text' && lines > 1) {
      return (
        <div className="space-y-2" {...props}>
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              ref={i === 0 ? ref : undefined}
              className={cn(
                "bg-muted",
                speedClasses[speed],
                variantClasses[variant],
                sizeClasses[size][variant],
                shimmerClass,
                // Last line is often shorter
                i === lines - 1 && lines > 2 ? 'w-3/4' : 'w-full',
                className
              )}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-muted",
          speedClasses[speed],
          variantClasses[variant],
          sizeClasses[size][variant],
          shimmerClass,
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// Compound components for common patterns
const SkeletonCard = React.forwardRef<HTMLDivElement, {
  className?: string
  showAvatar?: boolean
  showTitle?: boolean
  showDescription?: boolean
  showActions?: boolean
}>(({ 
  className, 
  showAvatar = true, 
  showTitle = true, 
  showDescription = true,
  showActions = false 
}, ref) => (
  <div ref={ref} className={cn("p-6 space-y-4", className)}>
    {showAvatar && (
      <div className="flex items-center space-x-4">
        <Skeleton variant="avatar" size="md" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-1/4" />
          <Skeleton variant="text" className="w-1/3" size="sm" />
        </div>
      </div>
    )}
    
    {showTitle && <Skeleton variant="text" className="w-1/2" size="lg" />}
    
    {showDescription && (
      <div className="space-y-2">
        <Skeleton variant="text" lines={3} />
      </div>
    )}
    
    {showActions && (
      <div className="flex space-x-2 pt-4">
        <Skeleton variant="button" className="w-24" />
        <Skeleton variant="button" className="w-20" />
      </div>
    )}
  </div>
))
SkeletonCard.displayName = "SkeletonCard"

const SkeletonTable = React.forwardRef<HTMLDivElement, {
  className?: string
  rows?: number
  columns?: number
}>(({ className, rows = 5, columns = 4 }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} variant="text" className="flex-1" size="lg" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }, (_, colIndex) => (
          <Skeleton 
            key={colIndex} 
            variant="table" 
            className="flex-1"
            speed={rowIndex % 2 === 0 ? 'normal' : 'slow'} // Stagger animation
          />
        ))}
      </div>
    ))}
  </div>
))
SkeletonTable.displayName = "SkeletonTable"

const SkeletonChart = React.forwardRef<HTMLDivElement, {
  className?: string
  type?: 'line' | 'bar' | 'pie' | 'area'
}>(({ className, type = 'line' }, ref) => {
  const chartPatterns = {
    line: (
      <div className="space-y-4">
        <div className="h-48 bg-muted rounded-lg flex items-end justify-around p-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton 
              key={i}
              className={`w-8 bg-muted-foreground/20`}
              style={{ height: `${20 + Math.random() * 60}%` }}
              speed="slow"
            />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} variant="text" className="w-12" size="sm" />
          ))}
        </div>
      </div>
    ),
    bar: (
      <div className="space-y-4">
        <div className="h-48 bg-muted rounded-lg flex items-end justify-around p-4 space-x-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton 
              key={i}
              className={`flex-1 bg-muted-foreground/20`}
              style={{ height: `${30 + Math.random() * 50}%` }}
              speed="slow"
            />
          ))}
        </div>
      </div>
    ),
    pie: (
      <div className="flex justify-center">
        <Skeleton variant="circular" className="w-48 h-48" speed="slow" />
      </div>
    ),
    area: (
      <div className="h-48 bg-muted rounded-lg relative overflow-hidden">
        <Skeleton className="absolute inset-0 bg-gradient-to-t from-muted-foreground/10 to-muted-foreground/30" speed="slow" />
      </div>
    )
  }

  return (
    <div ref={ref} className={cn("p-4", className)}>
      {chartPatterns[type]}
    </div>
  )
})
SkeletonChart.displayName = "SkeletonChart"

// Loading states for dashboard components
const DashboardSkeleton = React.forwardRef<HTMLDivElement, {
  className?: string
}>(({ className }, ref) => (
  <div ref={ref} className={cn("space-y-6", className)}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton variant="text" className="w-64" size="xl" />
        <Skeleton variant="text" className="w-48" size="sm" />
      </div>
      <Skeleton variant="button" className="w-32" />
    </div>
    
    {/* Metrics cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="p-6 border rounded-lg">
          <div className="space-y-3">
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="w-1/4" size="xl" />
            <div className="flex items-center space-x-2">
              <Skeleton variant="rectangular" className="w-4 h-4" />
              <Skeleton variant="text" className="w-1/3" size="sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="border rounded-lg">
        <SkeletonChart type="line" />
      </div>
      <div className="border rounded-lg">
        <SkeletonChart type="bar" />
      </div>
    </div>
    
    {/* Table */}
    <div className="border rounded-lg p-4">
      <div className="space-y-4">
        <Skeleton variant="text" className="w-1/4" size="lg" />
        <SkeletonTable rows={8} columns={5} />
      </div>
    </div>
  </div>
))
DashboardSkeleton.displayName = "DashboardSkeleton"

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonChart, 
  DashboardSkeleton 
}
export type { SkeletonProps }