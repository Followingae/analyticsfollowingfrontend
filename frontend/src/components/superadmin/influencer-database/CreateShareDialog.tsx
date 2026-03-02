"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { superadminApiService } from "@/services/superadminApi"
import type {
  MasterInfluencer,
  ShareDuration,
  VisibleFields,
} from "@/types/influencerDatabase"
import {
  DURATION_OPTIONS,
  formatCount,
  getEngagementColor,
  TIER_OPTIONS,
} from "@/types/influencerDatabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  X,
  Users,
  BadgeCheck,
} from "lucide-react"

interface CreateShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

const DEFAULT_VISIBILITY: VisibleFields = {
  show_analytics: true,
  show_sell_pricing: true,
  show_engagement: true,
  show_audience: true,
  show_content_analysis: true,
  show_contact_info: false,
}

const PAGE_SIZE = 12

export function CreateShareDialog({ open, onOpenChange, onCreated }: CreateShareDialogProps) {
  const [step, setStep] = useState(1)
  const [creating, setCreating] = useState(false)

  // Step 1: Influencer picker
  const [pickerSearch, setPickerSearch] = useState("")
  const [pickerPage, setPickerPage] = useState(1)
  const [pickerResults, setPickerResults] = useState<MasterInfluencer[]>([])
  const [pickerTotal, setPickerTotal] = useState(0)
  const [pickerTotalPages, setPickerTotalPages] = useState(0)
  const [pickerLoading, setPickerLoading] = useState(false)
  const [selectedInfluencers, setSelectedInfluencers] = useState<MasterInfluencer[]>([])

  // Step 2: User selection
  const [userEmailInput, setUserEmailInput] = useState("")
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])

  // Step 3: Visibility
  const [visibility, setVisibility] = useState<VisibleFields>({ ...DEFAULT_VISIBILITY })

  // Step 4: Duration & Info
  const [duration, setDuration] = useState<ShareDuration>("90d")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Derived
  const selectedInfluencerIds = selectedInfluencers.map((i) => i.id)

  // Fetch influencers on search/page change
  const fetchInfluencers = useCallback(async () => {
    setPickerLoading(true)
    try {
      const result = await superadminApiService.getInfluencerDatabase({
        search: pickerSearch || undefined,
        page: pickerPage,
        page_size: PAGE_SIZE,
      })
      if (result.success && result.data) {
        setPickerResults(result.data.influencers || [])
        setPickerTotal(result.data.total_count || 0)
        setPickerTotalPages(result.data.total_pages || 0)
      } else {
        setPickerResults([])
        setPickerTotal(0)
        setPickerTotalPages(0)
      }
    } catch {
      setPickerResults([])
    } finally {
      setPickerLoading(false)
    }
  }, [pickerSearch, pickerPage])

  // Debounced fetch on search change
  useEffect(() => {
    if (!open || step !== 1) return
    const timer = setTimeout(() => {
      fetchInfluencers()
    }, 300)
    return () => clearTimeout(timer)
  }, [pickerSearch, pickerPage, open, step, fetchInfluencers])

  // Reset picker page when search changes
  useEffect(() => {
    setPickerPage(1)
  }, [pickerSearch])

  // Influencer selection
  const toggleInfluencer = (inf: MasterInfluencer) => {
    setSelectedInfluencers((prev) =>
      prev.some((s) => s.id === inf.id)
        ? prev.filter((s) => s.id !== inf.id)
        : [...prev, inf]
    )
  }

  const removeInfluencer = (id: string) => {
    setSelectedInfluencers((prev) => prev.filter((s) => s.id !== id))
  }

  const isSelected = (id: string) => selectedInfluencers.some((s) => s.id === id)

  // Email management
  const addEmail = () => {
    const trimmed = userEmailInput.trim()
    if (trimmed && !selectedEmails.includes(trimmed)) {
      setSelectedEmails((prev) => [...prev, trimmed])
      setUserEmailInput("")
    }
  }

  const removeEmail = (email: string) => {
    setSelectedEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleCreate = async () => {
    if (selectedInfluencerIds.length === 0) {
      toast.error("Select at least one influencer")
      return
    }
    if (selectedEmails.length === 0) {
      toast.error("Add at least one user email")
      return
    }
    if (!name.trim()) {
      toast.error("Enter a name for this share")
      return
    }

    try {
      setCreating(true)
      const result = await superadminApiService.createInfluencerShare({
        name: name.trim(),
        description: description.trim(),
        influencer_ids: selectedInfluencerIds,
        user_emails: selectedEmails,
        visible_fields: visibility,
        duration,
      })
      if (result.success) {
        toast.success("Share created successfully")
        onCreated()
        onOpenChange(false)
        resetForm()
      } else {
        toast.error(result.error || "Failed to create share")
      }
    } catch {
      toast.error("Failed to create share")
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setPickerSearch("")
    setPickerPage(1)
    setPickerResults([])
    setSelectedInfluencers([])
    setUserEmailInput("")
    setSelectedEmails([])
    setVisibility({ ...DEFAULT_VISIBILITY })
    setDuration("90d")
    setName("")
    setDescription("")
  }

  const canProceed = () => {
    if (step === 1) return selectedInfluencers.length > 0
    if (step === 2) return selectedEmails.length > 0
    if (step === 3) return true
    if (step === 4) return name.trim().length > 0
    return false
  }

  const getTierBadge = (tier: string | null) => {
    if (!tier) return null
    const opt = TIER_OPTIONS.find((t) => t.value === tier)
    return (
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${opt?.color || "bg-gray-100 text-gray-600"}`}>
        {opt?.label || tier}
      </span>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm() }}>
      <DialogContent className={step === 1 ? "max-w-4xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle>Create New Share</DialogTitle>
          <DialogDescription>Step {step} of 4</DialogDescription>
        </DialogHeader>

        {/* Progress Indicators */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Influencer Picker */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Selected influencers bar */}
            {selectedInfluencers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  {selectedInfluencers.length} influencer{selectedInfluencers.length !== 1 ? "s" : ""} selected
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {selectedInfluencers.map((inf) => (
                    <Badge key={inf.id} variant="secondary" className="flex items-center gap-1.5 pr-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={inf.profile_image_url || undefined} />
                        <AvatarFallback className="text-[8px]">
                          {inf.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">@{inf.username}</span>
                      <button
                        onClick={() => removeInfluencer(inf.id)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or name..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Results grid */}
            <div className="min-h-[360px]">
              {pickerLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[140px] rounded-lg" />
                  ))}
                </div>
              ) : pickerResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Search className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No influencers found</p>
                  <p className="text-xs mt-1">Try a different search or add new influencers first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {pickerResults.map((inf) => {
                    const selected = isSelected(inf.id)
                    return (
                      <button
                        key={inf.id}
                        type="button"
                        onClick={() => toggleInfluencer(inf)}
                        className={`relative text-left rounded-lg border p-3 transition-all hover:shadow-sm ${
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        {/* Selected indicator */}
                        {selected && (
                          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}

                        {/* Profile */}
                        <div className="flex items-center gap-2.5 mb-2">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={inf.profile_image_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {inf.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium truncate">@{inf.username}</span>
                              {inf.is_verified && (
                                <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              )}
                            </div>
                            {inf.full_name && (
                              <p className="text-xs text-muted-foreground truncate">{inf.full_name}</p>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-medium">{formatCount(inf.followers_count)}</span>
                          <span className="text-muted-foreground">followers</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {inf.engagement_rate !== null && (
                            <span className={`text-xs font-medium ${getEngagementColor(inf.engagement_rate)}`}>
                              {inf.engagement_rate.toFixed(2)}% ER
                            </span>
                          )}
                          {getTierBadge(inf.tier)}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pickerTotalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerPage((p) => Math.max(1, p - 1))}
                  disabled={pickerPage <= 1 || pickerLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {pickerPage} of {pickerTotalPages} ({pickerTotal} total)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerPage((p) => Math.min(pickerTotalPages, p + 1))}
                  disabled={pickerPage >= pickerTotalPages || pickerLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Users */}
        {step === 2 && (
          <div className="space-y-4">
            <Label>Share With Users</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter user email"
                value={userEmailInput}
                onChange={(e) => setUserEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEmail()}
              />
              <Button onClick={addEmail} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {selectedEmails.map((email) => (
                <Badge key={email} variant="secondary" className="cursor-pointer" onClick={() => removeEmail(email)}>
                  {email} &times;
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedEmails.length} user{selectedEmails.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        )}

        {/* Step 3: Configure Visibility */}
        {step === 3 && (
          <div className="space-y-4">
            <Label>Visible Fields</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Choose what data shared users can see. Cost pricing and internal notes are never shared.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-normal">Show Analytics</Label>
                <Switch
                  checked={visibility.show_analytics}
                  onCheckedChange={(v) => setVisibility((p) => ({ ...p, show_analytics: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Show Sell Pricing</Label>
                <Switch
                  checked={visibility.show_sell_pricing}
                  onCheckedChange={(v) => setVisibility((p) => ({ ...p, show_sell_pricing: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Show Engagement</Label>
                <Switch
                  checked={visibility.show_engagement}
                  onCheckedChange={(v) => setVisibility((p) => ({ ...p, show_engagement: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Show Audience Data</Label>
                <Switch
                  checked={visibility.show_audience}
                  onCheckedChange={(v) => setVisibility((p) => ({ ...p, show_audience: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Show Content Analysis</Label>
                <Switch
                  checked={visibility.show_content_analysis}
                  onCheckedChange={(v) => setVisibility((p) => ({ ...p, show_content_analysis: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Show Contact Info</Label>
                <Switch
                  checked={visibility.show_contact_info}
                  onCheckedChange={(v) => setVisibility((p) => ({ ...p, show_contact_info: v }))}
                />
              </div>
            </div>
            <Separator />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Cost pricing and internal notes are NEVER shared with users.
            </p>
          </div>
        )}

        {/* Step 4: Duration & Name */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share Name *</Label>
              <Input
                placeholder="e.g., Q1 Campaign Influencers"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={(v) => setDuration(v as ShareDuration)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Review summary */}
            <div className="text-sm space-y-1">
              <p><strong>Influencers:</strong> {selectedInfluencers.length}</p>
              <p><strong>Shared with:</strong> {selectedEmails.length} user{selectedEmails.length !== 1 ? "s" : ""}</p>
              <p><strong>Duration:</strong> {DURATION_OPTIONS.find((d) => d.value === duration)?.label}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step < 4 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={creating || !canProceed()}>
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Create Share
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
