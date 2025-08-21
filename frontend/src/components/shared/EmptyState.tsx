"use client"

import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
  }
  children?: ReactNode
  size?: 'sm' | 'default' | 'lg'
  variant?: 'card' | 'plain'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  size = 'default',
  variant = 'plain'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-8 w-8',
      title: 'text-base',
      description: 'text-sm',
    },
    default: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-lg',
    }
  }

  const classes = sizeClasses[size]

  const content = (
    <div className={`flex flex-col items-center justify-center text-center space-y-4 ${classes.container}`}>
      {Icon && (
        <Icon className={`${classes.icon} text-muted-foreground mx-auto`} />
      )}
      
      <div className="space-y-2">
        <h3 className={`${classes.title} font-semibold tracking-tight`}>
          {title}
        </h3>
        <p className={`${classes.description} text-muted-foreground max-w-md`}>
          {description}
        </p>
      </div>

      {action && (
        <Button 
          onClick={action.onClick} 
          variant={action.variant || 'default'}
          style={action.variant !== 'outline' && action.variant !== 'ghost' && action.variant !== 'secondary' ? 
            { backgroundColor: '#5100f3', color: 'white' } : undefined}
          className={action.variant !== 'outline' && action.variant !== 'ghost' && action.variant !== 'secondary' ? 
            "hover:opacity-90" : undefined}
        >
          {action.label}
        </Button>
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

  return content
}

// Pre-configured empty states for common scenarios
export const NoDataFound = ({ 
  title = "No data found", 
  description = "There's no data to display at the moment.",
  action,
  icon
}: Partial<EmptyStateProps>) => (
  <EmptyState
    icon={icon}
    title={title}
    description={description}
    action={action}
  />
)

export const NoSearchResults = ({
  searchTerm,
  onClearSearch,
  suggestions,
}: {
  searchTerm?: string
  onClearSearch?: () => void
  suggestions?: string[]
}) => (
  <EmptyState
    title="No results found"
    description={
      searchTerm 
        ? `No results found for "${searchTerm}". Try adjusting your search terms.`
        : "No results found. Try adjusting your search or filter criteria."
    }
    action={onClearSearch ? {
      label: "Clear search",
      onClick: onClearSearch,
      variant: 'outline'
    } : undefined}
  >
    {suggestions && suggestions.length > 0 && (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-2">Try searching for:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    )}
  </EmptyState>
)

export const LoadingError = ({
  error = "Something went wrong",
  onRetry,
}: {
  error?: string
  onRetry?: () => void
}) => (
  <EmptyState
    title="Error loading data"
    description={error}
    action={onRetry ? {
      label: "Try again",
      onClick: onRetry,
      variant: 'outline'
    } : undefined}
    variant="card"
  />
)