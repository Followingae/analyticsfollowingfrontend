"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { formatCents, parseToCents } from "@/types/influencerDatabase"

interface InlineEditCellProps {
  value: number | null
  onSave: (newValue: number | null) => void
  prefix?: string
  placeholder?: string
}

export function InlineEditCell({
  value,
  onSave,
  prefix = "د.إ",
  placeholder = "Set price",
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleStartEdit = () => {
    setEditValue(value !== null ? (value / 100).toString() : "")
    setEditing(true)
  }

  const handleSave = () => {
    setEditing(false)
    const newCents = editValue.trim() === "" ? null : parseToCents(editValue)
    if (newCents !== value) {
      onSave(newCents)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{prefix}</span>
        <Input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-7 w-24 text-xs"
          placeholder="0"
          min={0}
          step="1"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className="cursor-pointer rounded px-1.5 py-0.5 text-left text-sm hover:bg-muted transition-colors"
    >
      {value !== null ? (
        <span className="font-medium">{formatCents(value)}</span>
      ) : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
    </button>
  )
}
