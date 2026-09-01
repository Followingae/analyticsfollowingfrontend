import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card.
 *
 * The defaults here are the look of roughly 650 surfaces in this product, so
 * they are worth spending a minute on rather than overriding one card at a
 * time. Three rules hold this together:
 *
 *   A surface is rounder than the controls sitting on it. Card is one radius
 *   step above Button, which is what stops a card reading as a box with a box
 *   inside it.
 *
 *   The edge does the work, not the shadow. On a near-white ground a heavy
 *   drop shadow is a smudge; one hairline border and the faintest lift is
 *   enough to say "this is a surface" without saying it twice.
 *
 *   Padding is 24px and stays 24px. It was already generous. Every one of the
 *   330-odd per-instance padding overrides in this codebase makes a card
 *   TIGHTER, not roomier, so the fix is a lint rule that asks why, not a new
 *   default that would move all 330 at once.
 *
 * Everything below is stock Tailwind rather than the `ds-` scale on purpose:
 * tailwind-merge does not recognise `p-ds-4` as a padding class, so a caller
 * passing `p-4` would end up with both. A caller's className must always win.
 */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-xs",
      className,
    )}
    {...props}
  />
))
Card.displayName = "Card"

/* `gap` rather than `space-y`, because roughly sixty call sites pass
   `flex-row` to lay a title out against an action on the right, and a
   `space-y` written for a column silently becomes a stray top margin on the
   thing at the end of a row. A gap is correct in both directions. */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/* 18px, not 24px. A card title names a panel; it is not the title of the
   page, and at 24px it competed with one. The old size is why so many call
   sites pass their own `text-base` or `text-lg`. */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight",
      className,
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/* The one place running text reliably lives inside a card, so the reading
   width cap goes here rather than into 650 pages. 68 characters is about the
   point past which the eye starts losing the start of the next line. It is a
   maximum, not a width: a description in a narrow card is untouched. */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("max-w-[68ch] text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
