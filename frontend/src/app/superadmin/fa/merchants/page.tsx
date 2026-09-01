"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Store, Pencil, Trash2, Upload, Loader2, X, Copy, RefreshCw } from "lucide-react"
import { CARD, PageHead } from "@/components/console/primitives"
import { FaPage, Failed, Loading, Nothing, TONE_BADGE } from "../_ui"
import { faMerchantApi, faClientApi } from "@/services/faAdminApi"
import { toast } from "sonner"

interface BrandOption { id: string; brand_user_id?: string; company_name?: string; name?: string }

function MerchantForm({ merchant, brands, onSave, onCancel }: { merchant?: any; brands: BrandOption[]; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: merchant?.name || "",
    category: merchant?.category || "",
    brand_user_id: merchant?.brand_user_id || "",
    logo_url: merchant?.logo_url || "",
    location_address: merchant?.location_address || "",
    gradient_start: merchant?.gradient_start || "#cafe48",
    gradient_end: merchant?.gradient_end || "#a288e3",
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Use JPEG, PNG, or WebP"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("Logo too large (max 5MB)"); return }
    setUploading(true)
    try {
      const res = await faMerchantApi.uploadLogo(file)
      const url = res?.data?.url
      if (url) { setForm((f) => ({ ...f, logo_url: url })); toast.success("Logo uploaded") }
      else toast.error("Upload failed")
    } catch { toast.error("Upload failed") }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = "" }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-ds-label">Brand *</label>
        <Select
          value={form.brand_user_id || undefined}
          onValueChange={(v: string) => setForm({ ...form, brand_user_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select the brand this merchant belongs to" />
          </SelectTrigger>
          <SelectContent>
            {brands.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                No brands found. Create a brand user first in /superadmin.
              </div>
            ) : (
              brands.map((b) => (
                <SelectItem key={b.id} value={b.brand_user_id || b.id}>
                  {b.company_name || b.name || "Unnamed brand"}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground mt-1">
          Cashback campaigns and pools belong to the brand; the merchant is the redemption location.
        </p>
      </div>
      <div>
        <label className="text-ds-label">Name *</label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Swiss Butter - Dubai Mall" />
      </div>
      <div>
        <label className="text-ds-label">Category *</label>
        <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="F&B, Fitness, Beauty..." />
      </div>
      <div>
        <label className="text-ds-label">Logo</label>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoFile} className="hidden" />
        <div className="flex items-center gap-3 mt-1">
          <div className="h-14 w-14 rounded-lg border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
            {form.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logo_url} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <Store className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {form.logo_url ? "Replace logo" : "Upload logo"}
          </Button>
          {form.logo_url && (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setForm({ ...form, logo_url: "" })}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">JPEG, PNG, or WebP · max 5MB</p>
      </div>
      <div>
        <label className="text-ds-label">Address</label>
        <Input value={form.location_address} onChange={(e) => setForm({ ...form, location_address: e.target.value })} placeholder="Dubai Mall, Dubai" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-ds-label">Gradient start</label>
          <Input type="color" value={form.gradient_start} onChange={(e) => setForm({ ...form, gradient_start: e.target.value })} />
        </div>
        <div>
          <label className="text-ds-label">Gradient end</label>
          <Input type="color" value={form.gradient_end} onChange={(e) => setForm({ ...form, gradient_end: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.name || !form.category || !form.brand_user_id}>Save</Button>
      </div>
    </div>
  )
}

export default function FAMerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([])
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [loading, setLoading] = useState(true)
  /* Whether the list request actually answered. Without it a 500 emptied the grid and the
     screen said "No merchants yet" — a claim about the world assembled out of a failed
     fetch, and the one that sends somebody off to create a merchant that already exists. */
  const [error, setError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [rotating, setRotating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [merchRes, brandRes] = await Promise.all([
        faMerchantApi.list(),
        faClientApi.list({ limit: 200 }),
      ])
      const mlist = merchRes?.data?.merchants || merchRes?.data || []
      setMerchants(Array.isArray(mlist) ? mlist : [])
      const blist = brandRes?.clients || brandRes?.data?.clients || brandRes?.data || []
      setBrands(Array.isArray(blist) ? blist : [])
    } catch {
      setError(true)
      toast.error("Could not load merchants")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await faMerchantApi.update(editing.id, data)
        toast.success("Merchant updated")
      } else {
        await faMerchantApi.create(data)
        toast.success("Merchant created")
      }
      setDialogOpen(false)
      setEditing(null)
      load()
    } catch { toast.error("Failed to save merchant") }
  }

  // Rotation is destructive to anyone holding the old code, so confirm — but keep
  // it one step, because the reason you rotate is that the code has leaked and
  // you want it dead now.
  const handleRotate = async (m: any) => {
    if (!confirm(`Issue a new venue code for ${m.name}? The current code stops working immediately.`)) return
    setRotating(m.id)
    try {
      const res = await faMerchantApi.rotateVenueCode(m.id)
      const code = res?.data?.venue_code
      setMerchants((prev) => prev.map((x) => (x.id === m.id ? { ...x, venue_code: code } : x)))
      toast.success(`New venue code: ${code}`)
    } catch { toast.error("Could not rotate the venue code") }
    finally { setRotating(null) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this merchant?")) return
    try {
      await faMerchantApi.delete(id)
      toast.success("Merchant deleted")
      load()
    } catch { toast.error("Failed to delete") }
  }

  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <FaPage>
          <PageHead
            title="Merchants"
            sub="The places a creator actually walks into. A merchant is where cashback gets redeemed and where a dine-in visit is confirmed, so its venue code lives here too."
            action={
              <Dialog open={dialogOpen} onOpenChange={(o: boolean) => { setDialogOpen(o); if (!o) setEditing(null) }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add a merchant</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editing ? "Edit this merchant" : "Add a merchant"}</DialogTitle>
                  </DialogHeader>
                  <MerchantForm merchant={editing} brands={brands} onSave={handleSave} onCancel={() => { setDialogOpen(false); setEditing(null) }} />
                </DialogContent>
              </Dialog>
            }
          />

          {/* A merchant is a place with a face, so it keeps its card: the gradient and the
              logo are what a person recognises it by. What comes off is the second box the
              venue code sat in, and the palette badge that told a brand-less merchant off
              in a red the console uses nowhere else. */}
          <div className="grid grid-cols-1 gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
            {merchants.map((m: any) => (
              <div key={m.id} className={`${CARD} overflow-hidden bg-[var(--tone-neutral-wash)]`}>
                <div className="h-16" style={{ background: `linear-gradient(135deg, ${m.gradient_start || "#cafe48"}, ${m.gradient_end || "#a288e3"})` }} />
                <div className="p-ds-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{m.name}</h3>
                    <Badge variant="outline" className={TONE_BADGE.neutral}>{m.category}</Badge>
                  </div>
                  {m.brand_name && (
                    <p className="text-xs font-medium mb-1">{m.brand_name}</p>
                  )}
                  {m.location_address && <p className="text-xs text-muted-foreground mb-3">{m.location_address}</p>}
                  {!m.brand_user_id && (
                    <Badge variant="outline" className={`mb-2 text-[10px] ${TONE_BADGE.bad}`}>No brand linked</Badge>
                  )}

                  {/* The venue code. Print it on a card by the till: it's the whole
                      access control on dine-in confirmation, so it's shown only here
                      and rotating it is one click. */}
                  {m.venue_code && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-ds-overline uppercase text-muted-foreground">Venue code</p>
                          <p className="text-lg font-semibold tracking-[0.3em] tabular-nums">{m.venue_code}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            title="Copy the code"
                            onClick={() => { navigator.clipboard.writeText(m.venue_code); toast.success("Venue code copied") }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            title="Issue a new code (the old one stops working)"
                            onClick={() => handleRotate(m)}
                            disabled={rotating === m.id}
                          >
                            {rotating === m.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <RefreshCw className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 text-ds-caption text-muted-foreground">Venue staff type this to confirm a walk-in</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(m); setDialogOpen(true) }}>
                      <Pencil className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Three separate answers, told apart. Waiting is not the same as broken, and
              broken is not the same as "we have no merchants". */}
          {loading && merchants.length === 0 && <Loading label="Loading merchants" />}
          {!loading && error && <Failed what="merchants" onRetry={load} />}
          {!loading && !error && merchants.length === 0 && (
            <Nothing>No merchants yet. Add the first one to run a cashback campaign against it.</Nothing>
          )}
        </FaPage>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
