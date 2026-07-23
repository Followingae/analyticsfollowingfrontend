"use client"

import * as React from "react"
import { motion } from "motion/react"
import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface User {
  src: string
  fallback: string
}

interface Action {
  Icon: React.ElementType
  bgColor: string
}

interface WorkflowBuilderCardProps {
  imageUrl: string
  status: "Active" | "Inactive"
  lastUpdated: string
  title: string
  description: string
  tags: string[]
  users: User[]
  actions: Action[]
  className?: string
}

export const WorkflowBuilderCard = ({
  imageUrl,
  status,
  lastUpdated,
  title,
  description,
  tags,
  users,
  actions,
  className,
}: WorkflowBuilderCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className={cn("w-full max-w-sm cursor-pointer", className)}
    >
      <Card className="overflow-hidden rounded-xl shadow-md transition-shadow duration-300 hover:shadow-xl">
        <div className="relative h-36 w-full">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{lastUpdated}</span>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      status === "Active" ? "bg-primary" : "bg-muted-foreground/40"
                    )}
                    aria-label={status}
                  />
                  <span>{status}</span>
                </div>
              </div>
              <h3 className="mt-1 text-lg font-semibold text-card-foreground">
                {title}
              </h3>
            </div>
            {/* No per-card menu exists yet. Kept visible but disabled + labelled so it
                reads as "not available", not a broken control (disabled = no click, so it
                also can't accidentally trigger the card's own navigation). */}
            <button
              type="button"
              disabled
              aria-label="More options (coming soon)"
              title="More options — coming soon"
              className="cursor-not-allowed text-muted-foreground/40"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Description + tags render unconditionally — hover-gating hid every informative
              detail on touch devices, which cannot hover. */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{description}</p>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border p-4">
          <div className="flex -space-x-2">
            {users.map((user, index) => (
              <Avatar
                key={index}
                className="h-7 w-7 border-2 border-card"
                aria-label={user.fallback}
              >
                <AvatarImage src={user.src} />
                <AvatarFallback>{user.fallback}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex items-center -space-x-2">
            {actions.map(({ Icon, bgColor }, index) => (
              <div
                key={index}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-white",
                  bgColor
                )}
              >
                <Icon size={14} />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
