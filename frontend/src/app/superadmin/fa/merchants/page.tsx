"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Store, Pencil, Trash2, Upload, Loader2, X } from "lucide-react"
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
        <label className="text-sm font-medium">Brand *</label>
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
        <label className="text-sm font-medium">Name *</label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Swiss Butter — Dubai Mall" />
      </div>
      <div>
        <label className="text-sm font-medium">Category *</label>
        <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="F&B, Fitness, Beauty..." />
      </div>
      <div>
        <label className="text-sm font-medium">Logo</label>
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
        <label className="text-sm font-medium">Address</label>
        <Input value={form.location_address} onChange={(e) => setForm({ ...form, location_address: e.target.value })} placeholder="Dubai Mall, Dubai" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Gradient Start</label>
          <Input type="color" value={form.gradient_start} onChange={(e) => setForm({ ...form, gradient_start: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Gradient End</label>
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [merchRes, brandRes] = await Promise.all([
        faMerchantApi.list(),
        faClientApi.list({ limit: 200 }),
      ])
      const mlist = merchRes?.data?.merchants || merchRes?.data || []
      setMerchants(Array.isArray(mlist) ? mlist : [])
      const blist = brandRes?.clients || brandRes?.data?.clients || brandRes?.data || []
      setBrands(Array.isArray(blist) ? blist : [])
    } catch { toast.error("Failed to load merchants") }
    finally { setLoading(false) }
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this merchant?")) return
    try {
      await faMerchantApi.delete(id)
      toast.success("Merchant deleted")
      load()
    } catch { toast.error("Failed to delete") }
  }

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">FA Merchants</h1>
              <p className="text-muted-foreground text-sm">Manage participating merchants for cashback campaigns</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(o: boolean) => { setDialogOpen(o); if (!o) setEditing(null) }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Merchant</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Merchant" : "Add Merchant"}</DialogTitle>
                </DialogHeader>
                <MerchantForm merchant={editing} brands={brands} onSave={handleSave} onCancel={() => { setDialogOpen(false); setEditing(null) }} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchants.map((m: any) => (
              <Card key={m.id} className="overflow-hidden">
                <div className="h-16" style={{ background: `linear-gradient(135deg, ${m.gradient_start || "#cafe48"}, ${m.gradient_end || "#a288e3"})` }} />
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{m.name}</h3>
                    <Badge variant="secondary">{m.category}</Badge>
                  </div>
                  {m.brand_name && (
                    <p className="text-xs font-medium mb-1">{m.brand_name}</p>
                  )}
                  {m.location_address && <p className="text-xs text-muted-foreground mb-3">{m.location_address}</p>}
                  {!m.brand_user_id && (
                    <Badge variant="destructive" className="text-[10px] mb-2">No brand linked</Badge>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(m); setDialogOpen(true) }}>
                      <Pencil className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!loading && merchants.length === 0 && (
            <Card><CardContent className="text-center py-12"><Store className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No merchants yet</p></CardContent></Card>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
