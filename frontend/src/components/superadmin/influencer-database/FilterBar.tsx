"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  CATEGORY_OPTIONS,
  TIER_OPTIONS,
  STATUS_OPTIONS,
  type InfluencerDatabaseFilters,
  type InfluencerCategory,
  type PricingTier,
  type InfluencerStatus,
} from "@/types/influencerDatabase"
import { ChevronDown, X } from "lucide-react"

interface FilterBarProps {
  filters: InfluencerDatabaseFilters
  onFiltersChange: (filters: InfluencerDatabaseFilters) => void
}

function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { label: string; value: T; color?: string }[]
  selected: T[]
  onChange: (values: T[]) => void
}) {
  const toggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-2">
        <div className="space-y-1">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox
                checked={selected.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const update = (patch: Partial<InfluencerDatabaseFilters>) => {
    onFiltersChange({ ...filters, ...patch, page: 1 })
  }

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.pricing_tier.length > 0 ||
    filters.status.length > 0 ||
    filters.engagement_min !== null ||
    filters.engagement_max !== null ||
    filters.is_verified !== null ||
    filters.has_pricing !== null

  const clearAll = () => {
    update({
      categories: [],
      pricing_tier: [],
      status: [],
      engagement_min: null,
      engagement_max: null,
      is_verified: null,
      has_pricing: null,
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelectFilter<InfluencerCategory>
        label="Category"
        options={CATEGORY_OPTIONS}
        selected={filters.categories}
        onChange={(categories) => update({ categories })}
      />
      <MultiSelectFilter<PricingTier>
        label="Tier"
        options={TIER_OPTIONS}
        selected={filters.pricing_tier}
        onChange={(pricing_tier) => update({ pricing_tier })}
      />
      <MultiSelectFilter<InfluencerStatus>
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status}
        onChange={(status) => update({ status })}
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            Engagement
            {(filters.engagement_min !== null || filters.engagement_max !== null) && (
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
                1
              </Badge>
            )}
            <ChevronDown className="size-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Engagement Rate (%)
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              className="h-8 text-xs"
              value={filters.engagement_min ?? ""}
              onChange={(e) =>
                update({
                  engagement_min: e.target.value ? Number(e.target.value) : null,
                })
              }
              min={0}
              step={0.1}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              className="h-8 text-xs"
              value={filters.engagement_max ?? ""}
              onChange={(e) =>
                update({
                  engagement_max: e.target.value ? Number(e.target.value) : null,
                })
              }
              min={0}
              step={0.1}
            />
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant={filters.is_verified === true ? "default" : "outline"}
        size="sm"
        className="h-8"
        onClick={() =>
          update({ is_verified: filters.is_verified === true ? null : true })
        }
      >
        Verified
      </Button>

      <Button
        variant={filters.has_pricing === true ? "default" : "outline"}
        size="sm"
        className="h-8"
        onClick={() =>
          update({ has_pricing: filters.has_pricing === true ? null : true })
        }
      >
        Has Pricing
      </Button>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={clearAll}
        >
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
