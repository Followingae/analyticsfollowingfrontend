"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare } from "lucide-react"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface RequestMoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (notes: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RequestMoreDialog({
  open,
  onOpenChange,
  onSubmit,
}: RequestMoreDialogProps) {
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!notes.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(notes.trim())
      setNotes("")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setNotes("")
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Request More Suggestions
          </DialogTitle>
          <DialogDescription>
            Let the agency team know what kind of additional influencers you are
            looking for. They will review your request and add more options to
            this proposal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="request-notes">Your notes</Label>
            <Textarea
              id="request-notes"
              placeholder="e.g. We need more fashion influencers in the 50K-200K follower range, preferably based in the UAE..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Be as specific as possible about categories, follower range, location,
            or any other preferences.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!notes.trim() || submitting}
          >
            {submitting ? "Sending..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
