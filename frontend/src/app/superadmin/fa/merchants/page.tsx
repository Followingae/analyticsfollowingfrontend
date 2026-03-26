"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Store, Pencil, Trash2 } from "lucide-react"
import { faMerchantApi } from "@/services/faAdminApi"
import { toast } from "sonner"

function MerchantForm({ merchant, onSave, onCancel }: { merchant?: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: merchant?.name || "",
    category: merchant?.category || "",
    logo_url: merchant?.logo_url || "",
    location_address: merchant?.location_address || "",
    gradient_start: merchant?.gradient_start || "#cafe48",
    gradient_end: merchant?.gradient_end || "#a288e3",
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name *</label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Swiss Butter" />
      </div>
      <div>
        <label className="text-sm font-medium">Category *</label>
        <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="F&B, Fitness, Beauty..." />
      </div>
      <div>
        <label className="text-sm font-medium">Logo URL</label>
        <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
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
        <Button onClick={() => onSave(form)} disabled={!form.name || !form.category}>Save</Button>
      </div>
    </div>
  )
}

export default function FAMerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await faMerchantApi.list()
      if (res.success) setMerchants(res.data || [])
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
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null) }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Merchant</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Merchant" : "Add Merchant"}</DialogTitle>
                </DialogHeader>
                <MerchantForm merchant={editing} onSave={handleSave} onCancel={() => { setDialogOpen(false); setEditing(null) }} />
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
                  {m.location_address && <p className="text-xs text-muted-foreground mb-3">{m.location_address}</p>}
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
