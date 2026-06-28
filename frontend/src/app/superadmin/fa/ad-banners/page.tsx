"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ImageIcon, Pencil, Trash2, Upload, Loader2, X, ExternalLink, Link2 } from "lucide-react"
import { faAdBannerApi, type AdBanner } from "@/services/faAdminApi"
import { toast } from "sonner"

function BannerForm({ banner, onSave, onCancel }: { banner?: AdBanner | null; onSave: (data: Partial<AdBanner>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: banner?.title || "",
    image_url: banner?.image_url || "",
    link_url: banner?.link_url || "",
    link_type: (banner?.link_type || "internal") as "internal" | "external",
    is_active: banner?.is_active ?? true,
    sort_order: banner?.sort_order ?? 0,
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Use JPEG, PNG, or WebP"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too large (max 5MB)"); return }
    setUploading(true)
    try {
      const res = await faAdBannerApi.uploadImage(file)
      const url = res?.data?.url
      if (url) { setForm((f) => ({ ...f, image_url: url })); toast.success("Image uploaded") }
      else toast.error("Upload failed")
    } catch { toast.error("Upload failed") }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = "" }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Banner Image *</label>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} className="hidden" />
        <div className="mt-1 space-y-2">
          <div className="aspect-[2.4/1] w-full rounded-xl border bg-muted/40 flex items-center justify-center overflow-hidden">
            {form.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {form.image_url ? "Replace image" : "Upload image"}
            </Button>
            {form.image_url && (
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setForm({ ...form, image_url: "" })}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <Input className="mt-2" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="...or paste an image URL" />
        <p className="text-[11px] text-muted-foreground mt-1">Recommended ~2.4:1 ratio. JPEG, PNG, or WebP · max 5MB</p>
      </div>
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Internal label (not shown on the banner)" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Link Type</label>
          <Select value={form.link_type} onValueChange={(v: string) => setForm({ ...form, link_type: v as "internal" | "external" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">In-app (route)</SelectItem>
              <SelectItem value="external">External (web URL)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Sort Order</label>
          <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || "0", 10) })} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Link URL</label>
        <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder={form.link_type === "external" ? "https://example.com/promo" : "/campaigns or /campaigns/123"} />
        <p className="text-[11px] text-muted-foreground mt-1">
          {form.link_type === "external" ? "Opens in the device browser." : "In-app route path the carousel navigates to on tap."}
        </p>
      </div>
      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-[11px] text-muted-foreground">Only active banners appear in the creator app</p>
        </div>
        <Switch checked={form.is_active} onCheckedChange={(v: boolean) => setForm({ ...form, is_active: v })} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.image_url}>Save</Button>
      </div>
    </div>
  )
}

export default function FAAdBannersPage() {
  const [banners, setBanners] = useState<AdBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdBanner | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await faAdBannerApi.list()
      const list = res?.data?.items || res?.data || []
      setBanners(Array.isArray(list) ? list : [])
    } catch { toast.error("Failed to load banners") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: Partial<AdBanner>) => {
    try {
      if (editing) {
        await faAdBannerApi.update(editing.id, data)
        toast.success("Banner updated")
      } else {
        await faAdBannerApi.create(data)
        toast.success("Banner created")
      }
      setDialogOpen(false)
      setEditing(null)
      load()
    } catch { toast.error("Failed to save banner") }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return
    try {
      await faAdBannerApi.delete(id)
      toast.success("Banner deleted")
      load()
    } catch { toast.error("Failed to delete") }
  }

  const toggleActive = async (b: AdBanner) => {
    try {
      await faAdBannerApi.update(b.id, { is_active: !b.is_active })
      load()
    } catch { toast.error("Failed to update") }
  }

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Ad Banners</h1>
              <p className="text-muted-foreground text-sm">Promo banners shown in the creator app home carousel</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(o: boolean) => { setDialogOpen(o); if (!o) setEditing(null) }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Banner</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Banner" : "Add Banner"}</DialogTitle>
                </DialogHeader>
                <BannerForm banner={editing} onSave={handleSave} onCancel={() => { setDialogOpen(false); setEditing(null) }} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <Card key={b.id} className="overflow-hidden">
                <div className="aspect-[2.4/1] w-full bg-muted/40 overflow-hidden">
                  {b.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image_url} alt={b.title || "Banner"} className="h-full w-full object-cover" />
                  )}
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <h3 className="font-semibold truncate">{b.title || "Untitled banner"}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className="text-[10px]">#{b.sort_order}</Badge>
                      <Badge variant={b.is_active ? "default" : "secondary"} className="text-[10px]">{b.is_active ? "Active" : "Hidden"}</Badge>
                    </div>
                  </div>
                  {b.link_url && (
                    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1 truncate">
                      {b.link_type === "external" ? <ExternalLink className="h-3 w-3 shrink-0" /> : <Link2 className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{b.link_url}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(b); setDialogOpen(true) }}>
                      <Pencil className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Active</span>
                      <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!loading && banners.length === 0 && (
            <Card><CardContent className="text-center py-12"><ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No banners yet</p></CardContent></Card>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
