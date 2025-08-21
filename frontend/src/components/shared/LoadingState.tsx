"use client"

import { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'card' | 'plain' | 'inline'
  children?: ReactNode
}

export function LoadingState({
  message = "Loading...",
  size = 'default',
  variant = 'plain',
  children
}: LoadingStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-6',
      spinner: 'h-4 w-4',
      text: 'text-sm',
    },
    default: {
      container: 'py-12',
      spinner: 'h-8 w-8',
      text: 'text-base',
    },
    lg: {
      container: 'py-16',
      spinner: 'h-12 w-12',
      text: 'text-lg',
    }
  }

  const classes = sizeClasses[size]

  const content = (
    <div className={`flex flex-col items-center justify-center text-center space-y-4 ${variant !== 'inline' ? classes.container : ''}`}>
      <Loader2 className={`${classes.spinner} animate-spin text-muted-foreground`} />
      
      {message && (
        <p className={`${classes.text} text-muted-foreground`}>
          {message}
        </p>
      )}

      {children}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    )
  }

  return content
}

// Skeleton loaders for different content types
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
)

export const CardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export const ListSkeleton = ({ items = 3 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    ))}
  </div>
)

export const GridSkeleton = ({ items = 6, columns = 3 }: { items?: number; columns?: number }) => (
  <div className={`grid gap-4 md:grid-cols-${columns}`}>
    {Array.from({ length: items }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
)

export const StatsSkeleton = ({ stats = 4 }: { stats?: number }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: stats }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

// Page loading wrapper
export const PageLoader = ({ children, loading, error, onRetry }: {
  children: ReactNode
  loading: boolean
  error?: string | null
  onRetry?: () => void
}) => {
  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}