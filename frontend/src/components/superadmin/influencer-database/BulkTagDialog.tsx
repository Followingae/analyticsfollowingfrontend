"use client"

import { useState } from "react"
import { toast } from "sonner"
import { superadminApiService } from "@/services/superadminApi"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Loader2 } from "lucide-react"

interface BulkTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  onComplete: () => void
}

const SUGGESTED_TAGS = [
  "verified",
  "high-engagement",
  "micro-influencer",
  "macro-influencer",
  "nano-influencer",
  "brand-safe",
  "priority",
  "new",
  "returning",
  "top-performer",
]

export function BulkTagDialog({
  open,
  onOpenChange,
  selectedIds,
  onComplete,
}: BulkTagDialogProps) {
  const [action, setAction] = useState<"add" | "remove">("add")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function addTag(tag?: string) {
    const value = (tag || tagInput).trim().toLowerCase()
    if (value && !tags.includes(value)) {
      setTags((prev) => [...prev, value])
    }
    setTagInput("")
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  async function handleSubmit() {
    if (tags.length === 0) return
    try {
      setSubmitting(true)
      await superadminApiService.bulkTagInfluencers(selectedIds, tags, action)
      toast.success(`Tags ${action === "add" ? "added" : "removed"} successfully`)
      onComplete()
      onOpenChange(false)
      reset()
    } catch {
      toast.error("Failed to update tags")
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setAction("add")
    setTags([])
    setTagInput("")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags for {selectedIds.length} Influencers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Action Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Action</Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tagAction"
                  checked={action === "add"}
                  onChange={() => setAction("add")}
                  className="accent-primary"
                />
                <span className="text-sm">Add Tags</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tagAction"
                  checked={action === "remove"}
                  onChange={() => setAction("remove")}
                  className="accent-primary"
                />
                <span className="text-sm">Remove Tags</span>
              </label>
            </div>
          </div>

          {/* Tag Input */}
          <div className="space-y-2">
            <Label className="text-sm">Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={() => addTag()}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Current Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Suggested Tags */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick add</Label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={tags.length === 0 || submitting}>
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : null}
            {action === "add" ? "Add Tags" : "Remove Tags"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
