"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Plus, Users, Trash2, ListChecks } from "lucide-react"
import { toast } from "sonner"
import { imdListsApi, type ImdListSummary } from "@/services/imdListsApi"

export default function ImdListsPage() {
  const [lists, setLists] = useState<ImdListSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [toDelete, setToDelete] = useState<ImdListSummary | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await imdListsApi.list()
      setLists(res?.data?.lists ?? [])
    } catch (e) {
      toast.error((e as Error).message || "Failed to load lists")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim()) return toast.error("Give the list a name")
    setCreating(true)
    try {
      await imdListsApi.create({ name: name.trim(), description: description.trim() || undefined })
      toast.success("List created")
      setOpen(false); setName(""); setDescription("")
      load()
    } catch (e) {
      toast.error((e as Error).message || "Failed to create list")
    } finally {
      setCreating(false)
    }
  }

  const remove = async () => {
    if (!toDelete) return
    try {
      await imdListsApi.remove(toDelete.id)
      toast.success(`Deleted "${toDelete.name}"`)
      setToDelete(null)
      load()
    } catch (e) {
      toast.error((e as Error).message || "Failed to delete")
    }
  }

  return (
    <AuthGuard>
      <SuperAdminInterface>
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Lists</h1>
              <p className="mt-1 text-muted-foreground">
                Curated groups of creators from the master database. Build a shortlist once, then drop
                the whole list onto any proposal.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />New list</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New list</DialogTitle>
                  <DialogDescription>Name it for how you&apos;ll look for it later — a market, a client, a vibe.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Name *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. KSA food creators" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>Cancel</Button>
                  <Button onClick={create} disabled={creating}>
                    {creating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : lists.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border">
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium">No lists yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Create one here, or select creators in the master database and save them straight into a new list.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lists.map((l) => (
                <Card key={l.id} className="group transition-colors hover:border-foreground/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        <Link href={`/superadmin/influencers/lists/${l.id}`} className="hover:underline">{l.name}</Link>
                      </CardTitle>
                      <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => setToDelete(l)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                    {l.description && <CardDescription className="line-clamp-2">{l.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <Link href={`/superadmin/influencers/lists/${l.id}`} className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />{l.items_count} creator{l.items_count === 1 ? "" : "s"}
                      </Badge>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <AlertDialog open={!!toDelete} onOpenChange={(v: boolean) => { if (!v) setToDelete(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{toDelete?.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                The list and its grouping go away. The {toDelete?.items_count ?? 0} creator
                {toDelete?.items_count === 1 ? "" : "s"} stay in the master database, and any proposal
                they were already added to is unaffected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Delete list</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
