"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { COLUMN_DEFINITIONS, type ColumnKey } from "@/types/influencerDatabase"
import { Columns3 } from "lucide-react"

interface ColumnVisibilityToggleProps {
  visibleColumns: ColumnKey[]
  onVisibleColumnsChange: (cols: ColumnKey[]) => void
}

const ALWAYS_VISIBLE: ColumnKey[] = ["select", "actions"]

export function ColumnVisibilityToggle({
  visibleColumns,
  onVisibleColumnsChange,
}: ColumnVisibilityToggleProps) {
  const toggleableColumns = COLUMN_DEFINITIONS.filter(
    (col) => !ALWAYS_VISIBLE.includes(col.key)
  )

  const handleToggle = (key: ColumnKey, checked: boolean) => {
    if (checked) {
      onVisibleColumnsChange([...visibleColumns, key])
    } else {
      onVisibleColumnsChange(visibleColumns.filter((k) => k !== key))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns3 className="size-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleableColumns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.key}
            checked={visibleColumns.includes(col.key)}
            onCheckedChange={(checked) => handleToggle(col.key, !!checked)}
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
