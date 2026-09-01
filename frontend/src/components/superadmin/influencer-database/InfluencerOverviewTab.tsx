"use client"

/**
 * Who this creator is, and the handful of things we record about them. Tier: WORKING.
 *
 * The four figures at the top were four cards. Four numbers of the same kind, laid out in a
 * row, is already the entire message a border was carrying, so they are a band separated by
 * space instead. An engagement rate we do not hold is a dash: it read `?.toFixed(2) || "0"`,
 * which printed a confident 0% for every creator we have never measured, and 0% engagement
 * is what a failed scrape looks like as much as a dead account.
 */
import { useEffect, useState } from "react"
import { proposalApprovalApi } from "@/services/proposalApprovalApi"
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
  getEngagementColor,
} from "@/types/influencerDatabase"
import { count } from "./Money"
import { cn } from "@/lib/utils"

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
  const [country, setCountry] = useState(influencer.country || "")
  const [countryOptions, setCountryOptions] = useState<string[]>([])

  useEffect(() => {
    proposalApprovalApi.getCountries()
      .then((r) => setCountryOptions((r?.data?.countries ?? []).map((c: { country: string }) => c.country)))
      .catch(() => setCountryOptions([]))
  }, [])

  function handleCountryBlur() {
    const v = country.trim()
    if (v === (influencer.country || "")) return
    // Empty means "not recorded" — send null rather than "" so it reads as unknown, not as
    // a creator whose country is the empty string.
    onSave({ country: v || null })
  }

  const metrics = [
    { label: "Followers", value: count(influencer.followers_count), icon: Users },
    { label: "Following", value: count(influencer.following_count), icon: UserCheck },
    { label: "Posts", value: count(influencer.posts_count), icon: ImageIcon },
    {
      label: "Engagement",
      // A rate we hold, or a dash. Never 0%: we have never measured most of this database,
      // and a fabricated zero here reads as a creator nobody engages with.
      value: influencer.engagement_rate != null
        ? `${influencer.engagement_rate.toFixed(2)}%`
        : "–",
      icon: TrendingUp,
      className: influencer.engagement_rate != null
        ? getEngagementColor(influencer.engagement_rate)
        : "text-muted-foreground",
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
    <div className="flex max-w-[640px] flex-col gap-ds-5">
      {/* Four figures of the same kind, grouped by the space around them. A metric is not
          an object, so none of them is a card. */}
      <div className="grid grid-cols-2 gap-x-ds-5 gap-y-ds-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="flex items-center gap-ds-1 text-ds-caption text-muted-foreground">
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </p>
            <p className={cn("mt-ds-1 text-ds-heading tabular-nums", m.className || "")}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Biography */}
      {influencer.biography && (
        <div className="flex flex-col gap-ds-2">
          <Label>Biography</Label>
          <p className="max-w-[65ch] whitespace-pre-line text-ds-body text-muted-foreground">
            {influencer.biography}
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-col gap-ds-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {tags.length === 0 && (
            <p className="text-ds-caption text-muted-foreground">No tags yet</p>
          )}
        </div>
        <div className="flex gap-ds-2">
          <Input
            placeholder="Add a tag"
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
      <div className="flex flex-col gap-ds-2">
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
      <div className="flex flex-col gap-ds-2">
        <Label>Internal notes</Label>
        <Textarea
          placeholder="Anything the team should know before booking them"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          rows={3}
        />
      </div>

      {/* Country — where they are OPEN TO WORK */}
      <div className="flex flex-col gap-ds-2">
        <Label>Country</Label>
        {/* Free text with existing values suggested, not a fixed dropdown: the real spread
            is not known yet, and an enum would reject a country nobody thought to list.
            The datalist keeps spellings consistent without forbidding a new one. */}
        <Input
          list="imd-country-options"
          className="w-[200px]"
          placeholder="e.g. UAE"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onBlur={handleCountryBlur}
        />
        <datalist id="imd-country-options">
          {countryOptions.map((c) => <option key={c} value={c} />)}
        </datalist>
        <p className="max-w-[65ch] text-ds-caption text-muted-foreground">
          Where this creator is open to <em>work</em>: our record, not where they live. Leave blank if unknown.
        </p>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-ds-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* The word is the status. The old palette step on each option was decoration:
                the label already says which one it is. */}
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
