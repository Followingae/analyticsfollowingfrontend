"use client"

/**
 * Section 1 of the proposal builder: everything about the deal that is not a
 * creator. Lifted out of `create/page.tsx` unchanged in behaviour — the page
 * still owns every piece of state, this file only draws it.
 *
 * No cost or margin figure appears here or may be added here. `Total Budget` is
 * the sell-side number the client is quoted, which is why it is allowed.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Calendar, Image as ImageIcon, Loader2, Upload, X } from "lucide-react"
import { ImageCropper } from "@/components/ui/image-cropper"
import { DatePicker } from "@/components/ui/date-picker"
import { STOCK_IMAGES } from "@/components/proposals/proposal-utils"
import { motion, AnimatePresence } from "motion/react"
import { PaymentStructure, type PaymentTerms } from "@/components/superadmin/proposals/PaymentStructure"
import type { BrandUser } from "./types"

export type CampaignTypeTarget = "influencer" | "cashback" | "paid_deal" | "barter"

export type VisibilityFlags = {
  show_sell_pricing: boolean
  show_analytics: boolean
  show_engagement: boolean
  show_audience: boolean
  show_content_analysis: boolean
}

const CAMPAIGN_TYPES = [
  { key: "influencer", label: "Influencer", hint: "Paid posts via brand portal" },
  { key: "cashback",   label: "Cashback",   hint: "QR scan earnings at merchant" },
  { key: "paid_deal",  label: "Paid Deal",  hint: "Flat payout per creator" },
  { key: "barter",     label: "Barter",     hint: "Product-for-content" },
] as const

interface Props {
  isEditMode: boolean

  campaignTypeTarget: CampaignTypeTarget
  onCampaignTypeTarget: (v: CampaignTypeTarget) => void

  brandUsers: BrandUser[]
  usersLoading: boolean
  selectedUserId: string
  onSelectedUserId: (v: string) => void

  title: string
  onTitle: (v: string) => void
  campaignName: string
  onCampaignName: (v: string) => void
  totalBudget: string
  onTotalBudget: (v: string) => void

  paymentTerms: PaymentTerms
  onPaymentTerms: (v: PaymentTerms) => void

  description: string
  onDescription: (v: string) => void
  proposalNotes: string
  onProposalNotes: (v: string) => void

  deadline: Date | undefined
  onDeadline: (d: Date | undefined) => void

  coverImageUrl: string
  onCoverImageUrl: (v: string) => void
  coverUploading: boolean
  cropperOpen: boolean
  onCropperOpen: (v: boolean) => void
  onCoverCropped: (file: File) => void | Promise<void>
  showStockPicker: boolean
  onShowStockPicker: (v: boolean) => void

  visibility: VisibilityFlags
  onVisibility: (next: VisibilityFlags) => void
}

export function ProposalDetailsCard(p: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proposal Details</CardTitle>
        <CardDescription>Core information about the proposal</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Campaign type target */}
        <div>
          <Label>Campaign Type *</Label>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            The type of campaign this proposal becomes when the brand approves it.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CAMPAIGN_TYPES.map((opt) => {
              const active = p.campaignTypeTarget === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={p.isEditMode}
                  onClick={() => p.onCampaignTypeTarget(opt.key)}
                  className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  } ${p.isEditMode ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {opt.hint}
                  </div>
                </button>
              )
            })}
          </div>
          {p.campaignTypeTarget !== "influencer" && (
            <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
              Note: for {p.campaignTypeTarget.replace("_", " ")} campaigns, creators must
              already be FA-app members. Use the <span className="font-medium">FA Members</span>{" "}
              tab in the picker below.
            </p>
          )}
        </div>

        {/* Brand user */}
        <div>
          <Label>Brand User *</Label>
          <Select
            value={p.selectedUserId}
            onValueChange={p.onSelectedUserId}
            disabled={p.isEditMode}
          >
            <SelectTrigger className="mt-1">
              <SelectValue
                placeholder={p.usersLoading ? "Loading users..." : "Select brand user..."}
              />
            </SelectTrigger>
            <SelectContent>
              {p.brandUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name
                    ? `${u.full_name}${u.company ? ` - ${u.company}` : ""} (${u.email})`
                    : u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Title *</Label>
            <Input
              className="mt-1"
              placeholder="Q2 Campaign Proposal"
              value={p.title}
              onChange={(e) => p.onTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Campaign Name *</Label>
            <Input
              className="mt-1"
              placeholder="Summer 2026 Launch"
              value={p.campaignName}
              onChange={(e) => p.onCampaignName(e.target.value)}
            />
          </div>
          <div>
            <Label>Total Budget (AED)</Label>
            <Input
              className="mt-1"
              type="number"
              placeholder="e.g. 50000"
              value={p.totalBudget}
              onChange={(e) => p.onTotalBudget(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Hidden from talent managers; visible to approvers + the client.
            </p>
          </div>
        </div>

        <PaymentStructure
          terms={p.paymentTerms}
          onChange={p.onPaymentTerms}
          total={Number(p.totalBudget) || 0}
        />

        <div>
          <Label>Description</Label>
          <Textarea
            className="mt-1"
            rows={3}
            placeholder="Brief description of the campaign..."
            value={p.description}
            onChange={(e) => p.onDescription(e.target.value)}
          />
        </div>

        <div>
          <Label>Admin Notes for Brand</Label>
          <Textarea
            className="mt-1"
            rows={2}
            placeholder="Notes visible to the brand..."
            value={p.proposalNotes}
            onChange={(e) => p.onProposalNotes(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Deadline
            </Label>
            <div className="mt-1">
              <DatePicker
                date={p.deadline}
                onSelect={p.onDeadline}
                placeholder="Select deadline"
              />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" /> Cover Image
            </Label>
            {p.coverImageUrl ? (
              <div className="mt-2 relative group">
                <img
                  src={p.coverImageUrl}
                  alt="Cover preview"
                  className="h-32 w-full rounded-md border object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => p.onCropperOpen(true)}>
                    Upload New
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => p.onShowStockPicker(true)}>
                    Stock
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => p.onCoverImageUrl("")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => p.onCropperOpen(true)}
                  disabled={p.coverUploading}
                >
                  {p.coverUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {p.coverUploading ? "Uploading..." : "Upload"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => p.onShowStockPicker(true)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Stock photos
                </Button>
              </div>
            )}

            {/* Stock image picker */}
            <AnimatePresence>
              {p.showStockPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-md border p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Choose a stock image
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => p.onShowStockPicker(false)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {STOCK_IMAGES.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`relative h-14 rounded overflow-hidden border-2 transition-all hover:opacity-100 ${
                            p.coverImageUrl === url
                              ? "border-primary ring-1 ring-primary"
                              : "border-transparent opacity-75"
                          }`}
                          onClick={() => {
                            p.onCoverImageUrl(url)
                            p.onShowStockPicker(false)
                          }}
                        >
                          <img
                            src={url.replace("w=1920", "w=200").replace("h=600", "h=80")}
                            alt={`Stock ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <ImageCropper
          open={p.cropperOpen}
          onOpenChange={p.onCropperOpen}
          onImageCropped={p.onCoverCropped}
          title="Crop Cover Image"
          aspect={16 / 5}
          outputWidth={1200}
          cropHint="Drag to select the banner area. The image will be cropped to a 16:5 wide banner."
        />

        <Separator />

        <div>
          <Label className="mb-2 block">Visibility Settings</Label>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {Object.entries(p.visibility).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={key}
                  checked={val}
                  onCheckedChange={(c) =>
                    p.onVisibility({ ...p.visibility, [key]: c === true })
                  }
                />
                <label htmlFor={key} className="text-sm cursor-pointer capitalize">
                  {key.replace("show_", "").replace(/_/g, " ")}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
