"use client"

import { Button } from "@/components/ui/button"
import { Download, Tag, Coins, ListPlus, FileText, Gift, Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Country is filtered on verbatim, so it is picked, never typed: "Qatar", "QA" and "qat"
// would be three markets. Short codes match the UAE/KSA already on the records.
const GCC_COUNTRIES: { code: string; name: string }[] = [
  { code: "UAE", name: "United Arab Emirates" },
  { code: "KSA", name: "Saudi Arabia" },
  { code: "QAT", name: "Qatar" },
  { code: "KWT", name: "Kuwait" },
  { code: "BHR", name: "Bahrain" },
  { code: "OMN", name: "Oman" },
]
import { useAdminAccess } from "@/hooks/useAdminAccess"

interface BulkActionsBarProps {
  selectedCount: number
  onExport: () => void
  onTag: () => void
  onPricing: () => void
  onAddToList?: () => void
  onAddToProposal?: () => void
  /** Turn "takes barter" on or off for everybody selected. */
  onBarter?: (accepts: boolean) => void
  barterBusy?: boolean
  /** Set the country for everybody selected; null clears it. */
  onCountry?: (country: string | null) => void
}

export function BulkActionsBar({
  selectedCount,
  onExport,
  onTag,
  onPricing,
  onAddToList,
  onAddToProposal,
  onBarter,
  barterBusy,
  onCountry,
}: BulkActionsBarProps) {
  // Bulk extraction is leadership-only — the server refuses regardless, this stops us
  // showing the team a button that always fails. See app/core/field_policy.py.
  const { canExport } = useAdminAccess()
  return (
    // A selection is a state, so it is a tint rather than a bordered box: the surface says
    // "something is set apart here" without drawing a fourth edge across the toolbar.
    <div className="flex flex-wrap items-center gap-ds-2 rounded-ds-surface bg-[var(--tone-info-wash)] px-ds-3 py-ds-2">
      <span className="text-ds-label">
        {selectedCount} selected
      </span>
      <div className="h-4 w-px bg-black/10 dark:bg-white/15" />
      {onAddToProposal && (
        <Button variant="ghost" size="sm" onClick={onAddToProposal}>
          <FileText className="size-4" />
          Add to proposal
        </Button>
      )}
      {onAddToList && (
        <Button variant="ghost" size="sm" onClick={onAddToList}>
          <ListPlus className="size-4" />
          Add to list
        </Button>
      )}
      {canExport && (
        <Button variant="ghost" size="sm" onClick={onExport}>
          <Download className="size-4" />
          Export
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onTag}>
        <Tag className="size-4" />
        Tag
      </Button>
      <Button variant="ghost" size="sm" onClick={onPricing}>
        <Coins className="size-4" />
        Set their rates
      </Button>
      {onCountry && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={barterBusy}>
              <Globe className="size-4" />
              Set country
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {GCC_COUNTRIES.map((c) => (
              <DropdownMenuItem key={c.code} onSelect={() => onCountry(c.code)}>
                <span className="w-10 font-medium">{c.code}</span>
                <span className="text-muted-foreground">{c.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onCountry(null)} className="text-muted-foreground">
              Clear country
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {/* Who will consider product instead of a fee. It is learned in batches - a category
          at a time, an event at a time - so it is set in batches. Two buttons rather than one
          toggle, because a mixed selection has no "current" state to flip and a single button
          would have to guess which way the founder meant it. */}
      {onBarter && (
        <>
          <div className="h-4 w-px bg-black/10 dark:bg-white/15" />
          <Button variant="ghost" size="sm" disabled={barterBusy}
                  onClick={() => onBarter(true)}>
            <Gift className="size-4" />
            Takes barter
          </Button>
          <Button variant="ghost" size="sm" disabled={barterBusy}
                  onClick={() => onBarter(false)}
                  className="text-muted-foreground">
            Does not
          </Button>
        </>
      )}
    </div>
  )
}
