"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, ImageIcon, TrendingUp, X, Plus } from "lucide-react"
import type { MasterInfluencer, InfluencerCategory } from "@/types/influencerDatabase"
import {
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  formatCount,
  getEngagementColor,
} from "@/types/influencerDatabase"

interface InfluencerOverviewTabProps {
  influencer: MasterInfluencer
  onSave: (data: any) => void
}

export function InfluencerOverviewTab({ influencer, onSave }: InfluencerOverviewTabProps) {
  const [tags, setTags] = useState<string[]>(influencer.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [categories, setCategories] = useState<InfluencerCategory[]>(
    (influencer.categories || []) as InfluencerCategory[]
  )
  const [notes, setNotes] = useState(influencer.internal_notes || "")
  const [status, setStatus] = useState(influencer.status)

  const metrics = [
    { label: "Followers", value: formatCount(influencer.followers_count), icon: Users },
    { label: "Following", value: formatCount(influencer.following_count), icon: UserCheck },
    { label: "Posts", value: formatCount(influencer.posts_count), icon: ImageIcon },
    {
      label: "Engagement Rate",
      value: `${influencer.engagement_rate?.toFixed(2) || "0"}%`,
      icon: TrendingUp,
      className: getEngagementColor(influencer.engagement_rate || 0),
    },
  ]

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      const updated = [...tags, trimmed]
      setTags(updated)
      onSave({ tags: updated })
    }
    setTagInput("")
  }

  function removeTag(tag: string) {
    const updated = tags.filter((t) => t !== tag)
    setTags(updated)
    onSave({ tags: updated })
  }

  function toggleCategory(cat: InfluencerCategory) {
    const updated = categories.includes(cat)
      ? categories.filter((c) => c !== cat)
      : [...categories, cat]
    setCategories(updated)
    onSave({ categories: updated })
  }

  function handleNotesBlur() {
    if (notes !== influencer.internal_notes) {
      onSave({ internal_notes: notes })
    }
  }

  function handleStatusChange(value: string) {
    setStatus(value as typeof status)
    onSave({ status: value })
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={`text-lg font-semibold ${m.className || ""}`}>{m.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Biography */}
      {influencer.biography && (
        <div className="space-y-2">
          <Label>Biography</Label>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {influencer.biography}
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {tags.length === 0 && (
            <p className="text-sm text-muted-foreground">No tags added</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={addTag}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <Label>Categories</Label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_OPTIONS.map((cat) => (
            <Badge
              key={cat.value}
              variant={categories.includes(cat.value) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Internal Notes */}
      <div className="space-y-2">
        <Label>Internal Notes</Label>
        <Textarea
          placeholder="Add internal notes about this influencer..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          rows={3}
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className={opt.color}>{opt.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
