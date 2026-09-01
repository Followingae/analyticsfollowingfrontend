/**
 * Step 1's core control: what you want made, and how many of each.
 *
 * A brief is not a proposal. The brand is describing what they want, not pitching a
 * roster, so this is seven toggles and a number — not a per-creator pricing grid.
 */
"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DELIVERABLE_LABELS,
  type DeliverableAsk,
  type DeliverableType,
} from "@/services/runApi"

const ORDER: DeliverableType[] = [
  "post",
  "reel",
  "story",
  "carousel",
  "video",
  "bundle",
  "monthly",
]

export function DeliverablePicker({
  value,
  onChange,
}: {
  value: DeliverableAsk[]
  onChange: (next: DeliverableAsk[]) => void
}) {
  const byType = new Map(value.map((ask) => [ask.type, ask.quantity]))

  const toggle = (type: DeliverableType) => {
    onChange(
      byType.has(type)
        ? value.filter((ask) => ask.type !== type)
        : [...value, { type, quantity: 1 }]
    )
  }

  const setQuantity = (type: DeliverableType, quantity: number) => {
    if (quantity < 1) return toggle(type)
    onChange(value.map((ask) => (ask.type === type ? { ...ask, quantity } : ask)))
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ORDER.map((type) => {
        const quantity = byType.get(type)
        const on = quantity !== undefined
        return (
          <div
            key={type}
            className={cn(
              "rounded-ds-surface flex items-center justify-between gap-3 border p-3 transition-colors",
              on ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"
            )}
          >
            <button
              type="button"
              onClick={() => toggle(type)}
              aria-pressed={on}
              className="text-ds-label flex-1 text-start outline-none"
            >
              {DELIVERABLE_LABELS[type]}
            </button>

            {on && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-ds-control size-7"
                  onClick={() => setQuantity(type, (quantity ?? 1) - 1)}
                  aria-label={`One fewer ${DELIVERABLE_LABELS[type]}`}
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="text-ds-label w-6 text-center tabular-nums">{quantity}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-ds-control size-7"
                  onClick={() => setQuantity(type, (quantity ?? 1) + 1)}
                  aria-label={`One more ${DELIVERABLE_LABELS[type]}`}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
