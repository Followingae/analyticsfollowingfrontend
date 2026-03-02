"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { superadminApiService } from "@/services/superadminApi"
import {
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  TIER_OPTIONS,
  DELIVERABLES,
  parseToCents,
  formatCents,
  type InfluencerCategory,
  type InfluencerStatus,
  type PricingTier,
  type CostPricing,
  type SellPricing,
} from "@/types/influencerDatabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, X } from "lucide-react"

export function AddInfluencerForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<InfluencerCategory[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<InfluencerStatus>("active")
  const [tier, setTier] = useState<PricingTier | "">("")
  const [adding, setAdding] = useState(false)

  // Pricing state — dollar strings for controlled inputs
  const [costInputs, setCostInputs] = useState<Record<string, string>>({})
  const [sellInputs, setSellInputs] = useState<Record<string, string>>({})

  const toggleCategory = (cat: InfluencerCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setTagInput("")
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const buildPricingObject = (inputs: Record<string, string>, prefix: "cost" | "sell") => {
    const obj: Record<string, number> = {}
    let hasAny = false
    for (const [key, val] of Object.entries(inputs)) {
      if (!key.startsWith(prefix)) continue
      const cents = parseToCents(val)
      if (cents !== null && cents > 0) {
        obj[key] = cents
        hasAny = true
      }
    }
    return hasAny ? obj : undefined
  }

  const handleAdd = async () => {
    const trimmed = username.trim().replace(/^@/, "")
    if (!trimmed) {
      toast.error("Enter a username")
      return
    }
    try {
      setAdding(true)

      const costPricing = buildPricingObject(costInputs, "cost")
      const sellPricing = buildPricingObject(sellInputs, "sell")

      const result = await superadminApiService.addInfluencerToDatabase(trimmed, {
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        tags: tags.length > 0 ? tags : undefined,
        internal_notes: notes || undefined,
        status,
        tier: tier || undefined,
        cost_pricing: costPricing,
        sell_pricing: sellPricing,
      })

      if (result.success) {
        toast.success(`@${trimmed} added to database`)
        router.push("/superadmin/influencers")
      } else {
        toast.error(result.error || "Failed to add influencer")
      }
    } catch {
      toast.error("Failed to add influencer")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Username */}
      <Card>
        <CardHeader>
          <CardTitle>Instagram Username</CardTitle>
          <CardDescription>
            Enter the Instagram username. If they already exist in our analytics database,
            their profile data will be auto-populated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
            <Input
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status, Tier & Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Set status, tier, categories, tags, and notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status & Tier row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as InfluencerStatus)}>
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Pricing Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as PricingTier)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier..." />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <Badge
                  key={opt.value}
                  variant={selectedCategories.includes(opt.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(opt.value)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
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
              <Button variant="outline" size="sm" onClick={addTag}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              placeholder="Add any internal notes about this influencer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing (Optional)</CardTitle>
          <CardDescription>
            Set initial cost and sell prices per deliverable. You can also set these later from the detail view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-3 gap-3 text-xs font-medium text-muted-foreground">
              <span>Deliverable</span>
              <span>Cost (USD)</span>
              <span>Sell (USD)</span>
            </div>

            {DELIVERABLES.map((d) => (
              <div key={d.label} className="grid grid-cols-3 gap-3 items-center">
                <span className="text-sm">{d.label}</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    className="pl-6 h-8 text-sm"
                    value={costInputs[d.costKey] ?? ""}
                    onChange={(e) => setCostInputs((prev) => ({ ...prev, [d.costKey]: e.target.value }))}
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    className="pl-6 h-8 text-sm"
                    value={sellInputs[d.sellKey] ?? ""}
                    onChange={(e) => setSellInputs((prev) => ({ ...prev, [d.sellKey]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/superadmin/influencers")}
        >
          Cancel
        </Button>
        <Button onClick={handleAdd} disabled={adding || !username.trim()}>
          {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add to Database
        </Button>
      </div>
    </div>
  )
}
