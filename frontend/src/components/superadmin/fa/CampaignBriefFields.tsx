"use client"

/**
 * Shared creative-brief + deliverable + coupon inputs for FA campaign creation
 * (barter / paid / cashback). Captures the full brand intake brief so it can be
 * surfaced to creators in the mobile app. Controlled via `value` / `onChange`.
 */
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, X, Globe, Instagram, Hash, Link2, MapPin, Ticket, Camera, Video, Image as ImageIcon } from "lucide-react"

// ─── Deliverable presets (platform + format + how proof is submitted) ────────
export interface DeliverableSpec {
  key: string
  platform: "instagram" | "tiktok" | "snapchat"
  format: "story" | "reel" | "post" | "video"
  proof_type: "screenshot" | "link"
  label: string
  proofLabel: string
  icon: typeof Camera
  quantity: number
}

export const DELIVERABLE_OPTIONS: Omit<DeliverableSpec, "quantity">[] = [
  { key: "ig_story", platform: "instagram", format: "story", proof_type: "screenshot", label: "Instagram Story", proofLabel: "Screenshot", icon: Camera },
  { key: "ig_reel", platform: "instagram", format: "reel", proof_type: "link", label: "Instagram Reel", proofLabel: "Link", icon: Video },
  { key: "ig_post", platform: "instagram", format: "post", proof_type: "link", label: "Instagram Post", proofLabel: "Link", icon: ImageIcon },
  { key: "tiktok_video", platform: "tiktok", format: "video", proof_type: "link", label: "TikTok Video", proofLabel: "Link", icon: Video },
  { key: "snap_story", platform: "snapchat", format: "story", proof_type: "screenshot", label: "Snapchat Story", proofLabel: "Screenshot", icon: Camera },
]

// ─── Brief state ─────────────────────────────────────────────────────────────
export interface BriefState {
  brand_website: string
  brand_instagram: string
  brand_tiktok: string
  brand_snapchat: string
  brand_description: string
  objective: string
  occasion: string
  age_min: string
  age_max: string
  gender: string
  languages: string
  interests: string
  cta: string
  vibe: string
  reference_links: { url: string; note: string }[]
  content_requirements: string[]
  things_to_avoid: string[]
  mandatory_tags: string[]
  mandatory_hashtags: string[]
  visit_required: boolean
  visit_location: string
  coupon_enabled: boolean
  coupon_discount_label: string
  redemption_url: string
  ordering_instructions: string
}

export const emptyBrief: BriefState = {
  brand_website: "", brand_instagram: "", brand_tiktok: "", brand_snapchat: "",
  brand_description: "", objective: "", occasion: "",
  age_min: "", age_max: "", gender: "", languages: "", interests: "",
  cta: "", vibe: "",
  reference_links: [], content_requirements: [], things_to_avoid: [],
  mandatory_tags: [], mandatory_hashtags: [],
  visit_required: false, visit_location: "",
  coupon_enabled: false, coupon_discount_label: "", redemption_url: "", ordering_instructions: "",
}

const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean)

/** Map the flat UI state into the backend brief payload (omitting empties). */
export function buildBriefPayload(b: BriefState): Record<string, any> {
  const p: Record<string, any> = {}
  if (b.brand_website.trim()) p.brand_website = b.brand_website.trim()
  const socials: Record<string, string> = {}
  if (b.brand_instagram.trim()) socials.instagram = b.brand_instagram.trim()
  if (b.brand_tiktok.trim()) socials.tiktok = b.brand_tiktok.trim()
  if (b.brand_snapchat.trim()) socials.snapchat = b.brand_snapchat.trim()
  if (Object.keys(socials).length) p.brand_socials = socials
  if (b.brand_description.trim()) p.brand_description = b.brand_description.trim()
  if (b.objective.trim()) p.objective = b.objective.trim()
  if (b.occasion.trim()) p.occasion = b.occasion.trim()
  const audience: Record<string, any> = {}
  if (b.age_min || b.age_max) audience.age_range = `${b.age_min || "?"}-${b.age_max || "?"}`
  if (b.gender.trim()) audience.gender = b.gender.trim()
  if (b.languages.trim()) audience.languages = csv(b.languages)
  if (b.interests.trim()) audience.interests = b.interests.trim()
  if (Object.keys(audience).length) p.audience_note = audience
  if (b.cta.trim()) p.cta = b.cta.trim()
  if (b.vibe.trim()) p.vibe = csv(b.vibe)
  const refs = b.reference_links.filter((r) => r.url.trim()).map((r) => ({ url: r.url.trim(), note: r.note.trim() || undefined }))
  if (refs.length) p.reference_links = refs
  if (b.content_requirements.length) p.content_requirements = b.content_requirements
  if (b.things_to_avoid.length) p.things_to_avoid = b.things_to_avoid
  if (b.mandatory_tags.length) p.mandatory_tags = b.mandatory_tags
  if (b.mandatory_hashtags.length) p.mandatory_hashtags = b.mandatory_hashtags
  p.visit_required = b.visit_required
  if (b.visit_required && b.visit_location.trim()) p.visit_location = b.visit_location.trim()
  if (b.coupon_enabled) {
    p.coupon_enabled = true
    if (b.coupon_discount_label.trim()) p.coupon_discount_label = b.coupon_discount_label.trim()
    if (b.redemption_url.trim()) p.redemption_url = b.redemption_url.trim()
    if (b.ordering_instructions.trim()) p.ordering_instructions = b.ordering_instructions.trim()
  }
  return p
}

// ─── Small chip-list input ───────────────────────────────────────────────────
function ChipInput({ label, placeholder, prefix, items, onChange }: {
  label: string; placeholder: string; prefix?: string; items: string[]; onChange: (v: string[]) => void
}) {
  const [draft, setDraft] = useState("")
  const add = () => {
    const raw = draft.trim()
    if (!raw) return
    const v = prefix && !raw.startsWith(prefix) ? `${prefix}${raw.replace(/^[@#]/, "")}` : raw
    if (!items.includes(v)) onChange([...items, v])
    setDraft("")
  }
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it) => (
            <Badge key={it} variant="secondary" className="gap-1 pr-1">
              {it}
              <button type="button" onClick={() => onChange(items.filter((x) => x !== it))} className="rounded-sm hover:bg-muted-foreground/20">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Deliverables picker ─────────────────────────────────────────────────────
export function DeliverablePicker({ value, onChange }: { value: DeliverableSpec[]; onChange: (v: DeliverableSpec[]) => void }) {
  const toggle = (opt: Omit<DeliverableSpec, "quantity">) => {
    const exists = value.find((d) => d.key === opt.key)
    if (exists) onChange(value.filter((d) => d.key !== opt.key))
    else onChange([...value, { ...opt, quantity: 1 }])
  }
  const setQty = (key: string, q: number) => onChange(value.map((d) => d.key === key ? { ...d, quantity: Math.max(1, q) } : d))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deliverables *</CardTitle>
        <CardDescription>What the creator must post. Stories are verified by screenshot; Reels/Posts/Videos by link.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {DELIVERABLE_OPTIONS.map((opt) => {
            const on = !!value.find((d) => d.key === opt.key)
            const Icon = opt.icon
            return (
              <Button key={opt.key} type="button" variant={on ? "secondary" : "outline"} size="sm" className="gap-1.5" onClick={() => toggle(opt)}>
                <Icon className="h-3.5 w-3.5" />{opt.label}
                <span className="text-[10px] text-muted-foreground">({opt.proofLabel})</span>
              </Button>
            )
          })}
        </div>
        {value.length > 0 && (
          <div className="space-y-2 pt-1">
            {value.map((d) => {
              const Icon = d.icon
              return (
                <div key={d.key} className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{d.platform} · proof: {d.proof_type}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(d.key, d.quantity - 1)}>-</Button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums">{d.quantity}</span>
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(d.key, d.quantity + 1)}>+</Button>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => toggle(d)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Serialize deliverable specs into the backend `deliverable_requirements` payload. */
export function buildDeliverablePayload(items: DeliverableSpec[]) {
  return items.map((d) => ({
    type: d.label,            // human label (kept for back-compat with existing readers)
    platform: d.platform,
    format: d.format,
    proof_type: d.proof_type,
    quantity: d.quantity,
    deadline_days: 7,
  }))
}

// ─── Full brief section ──────────────────────────────────────────────────────
export function CampaignBriefSection({ value, onChange }: { value: BriefState; onChange: (v: BriefState) => void }) {
  const set = (patch: Partial<BriefState>) => onChange({ ...value, ...patch })
  return (
    <>
      {/* Brand */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Brand</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Brand description</Label>
            <Textarea value={value.brand_description} onChange={(e) => set({ brand_description: e.target.value })} placeholder="Who is the brand? What do they stand for?" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Website</Label>
              <Input value={value.brand_website} onChange={(e) => set({ brand_website: e.target.value })} placeholder="order.mandarinoak.com" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5" />Instagram</Label>
              <Input value={value.brand_instagram} onChange={(e) => set({ brand_instagram: e.target.value })} placeholder="@mandarinoak_uae" />
            </div>
            <div className="space-y-2">
              <Label>TikTok</Label>
              <Input value={value.brand_tiktok} onChange={(e) => set({ brand_tiktok: e.target.value })} placeholder="@mandarinoak_ae" />
            </div>
            <div className="space-y-2">
              <Label>Snapchat</Label>
              <Input value={value.brand_snapchat} onChange={(e) => set({ brand_snapchat: e.target.value })} placeholder="@mandarinoak" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brief */}
      <Card>
        <CardHeader><CardTitle>Creative Brief</CardTitle><CardDescription>The story creators should tell. Shown in the app before they apply.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Objective</Label><Input value={value.objective} onChange={(e) => set({ objective: e.target.value })} placeholder="Awareness" /></div>
            <div className="space-y-2"><Label>Occasion</Label><Input value={value.occasion} onChange={(e) => set({ occasion: e.target.value })} placeholder="New Product Launch" /></div>
            <div className="space-y-2"><Label>Call to action</Label><Input value={value.cta} onChange={(e) => set({ cta: e.target.value })} placeholder="Try / Buy the Product" /></div>
            <div className="space-y-2"><Label>Vibe (comma-separated)</Label><Input value={value.vibe} onChange={(e) => set({ vibe: e.target.value })} placeholder="Premium, Trendy / Viral" /></div>
          </div>
          <ChipInput label="Reference links (inspiration reels)" placeholder="Paste a reel/post URL and press Enter"
            items={value.reference_links.map((r) => r.url)}
            onChange={(urls) => set({ reference_links: urls.map((u) => value.reference_links.find((r) => r.url === u) || { url: u, note: "" }) })} />
          <ChipInput label="Content requirements (do's / must-mention)" placeholder="e.g. Shoot in daylight - press Enter" items={value.content_requirements} onChange={(v) => set({ content_requirements: v })} />
          <ChipInput label="Things to avoid (don'ts)" placeholder="e.g. No soiled packaging - press Enter" items={value.things_to_avoid} onChange={(v) => set({ things_to_avoid: v })} />
        </CardContent>
      </Card>

      {/* Mandatory tags */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5" />Tags &amp; Hashtags</CardTitle><CardDescription>Creators can copy these directly in the app.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <ChipInput label="Mandatory @tags" prefix="@" placeholder="mandarinoak_uae - press Enter" items={value.mandatory_tags} onChange={(v) => set({ mandatory_tags: v })} />
          <ChipInput label="Mandatory #hashtags" prefix="#" placeholder="ThaiFireEdit - press Enter" items={value.mandatory_hashtags} onChange={(v) => set({ mandatory_hashtags: v })} />
        </CardContent>
      </Card>

      {/* Audience context (informational, not a filter) */}
      <Card>
        <CardHeader><CardTitle>Audience Context</CardTitle><CardDescription>Shown to creators as guidance - these do not filter who can apply.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-2"><Label>Age from</Label><Input type="number" value={value.age_min} onChange={(e) => set({ age_min: e.target.value })} placeholder="18" /></div>
            <div className="space-y-2"><Label>Age to</Label><Input type="number" value={value.age_max} onChange={(e) => set({ age_max: e.target.value })} placeholder="55" /></div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={value.gender || undefined} onValueChange={(v: string) => set({ gender: v })}>
                <SelectTrigger><SelectValue placeholder="Both" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Languages</Label><Input value={value.languages} onChange={(e) => set({ languages: e.target.value })} placeholder="English, Arabic, Hindi" /></div>
          </div>
          <div className="space-y-2"><Label>Interests / lifestyle</Label><Textarea value={value.interests} onChange={(e) => set({ interests: e.target.value })} placeholder="Food lovers into bold, craveable Asian cuisine…" /></div>
        </CardContent>
      </Card>

      {/* Visit */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><MapPin className="h-4.5 w-4.5 text-muted-foreground" /></div>
              <div>
                <p className="font-medium text-sm">Visit required to shoot content?</p>
                <p className="text-xs text-muted-foreground">Turn on if the creator must visit a location.</p>
              </div>
            </div>
            <Switch checked={value.visit_required} onCheckedChange={(c: boolean) => set({ visit_required: c })} />
          </div>
          {value.visit_required && (
            <div className="space-y-2 mt-4">
              <Label>Location</Label>
              <Input value={value.visit_location} onChange={(e) => set({ visit_location: e.target.value })} placeholder="Dubai Mall, Dubai" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupon fulfilment */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Ticket className="h-4.5 w-4.5 text-muted-foreground" /></div>
              <div>
                <p className="font-medium text-sm">Coupon-code fulfilment</p>
                <p className="text-xs text-muted-foreground">Creators receive a unique code once approved. Upload the codes after creating the campaign.</p>
              </div>
            </div>
            <Switch checked={value.coupon_enabled} onCheckedChange={(c: boolean) => set({ coupon_enabled: c })} />
          </div>
          {value.coupon_enabled && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Discount label</Label><Input value={value.coupon_discount_label} onChange={(e) => set({ coupon_discount_label: e.target.value })} placeholder="AED 200 off" /></div>
                <div className="space-y-2"><Label className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" />Redemption URL</Label><Input value={value.redemption_url} onChange={(e) => set({ redemption_url: e.target.value })} placeholder="https://order.mandarinoak.com" /></div>
              </div>
              <div className="space-y-2"><Label>Ordering instructions</Label><Textarea rows={5} value={value.ordering_instructions} onChange={(e) => set({ ordering_instructions: e.target.value })} placeholder={"1. Go to order.mandarinoak.com\n2. Add items from the Thai Fire Edit collection\n3. Apply your code for AED 200 off\n4. Place the order, capture & publish"} /></div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
