"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { PageHead, Panel } from "@/components/console/primitives"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  Calendar,
  Megaphone,
  LinkIcon,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { faClientApi } from "@/services/faAdminApi"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.following.ae"

interface ClientOption {
  id: string
  name: string
  company_name: string
  email?: string
  brand_user_id?: string
  subscription_tier?: string
}

interface PostEntry {
  url: string
  id: string
}

export default function SuperadminCreateCampaignPage() {
  const router = useRouter()

  // Client selection
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClientId, setSelectedClientId] = useState("")
  const [loadingClients, setLoadingClients] = useState(true)

  // Campaign details
  const [campaignName, setCampaignName] = useState("")
  const [brandName, setBrandName] = useState("")
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState<number | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [campaignType, setCampaignType] = useState<"influencer" | "ugc">("influencer")

  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")

  // Posts
  const [posts, setPosts] = useState<PostEntry[]>([])
  const [newPostUrl, setNewPostUrl] = useState("")
  const [isAddPostOpen, setIsAddPostOpen] = useState(false)

  // Submission
  const [submitting, setSubmitting] = useState(false)

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await faClientApi.list({ limit: 200 })
        const clientList = data.data || data.clients || data || []
        setClients(Array.isArray(clientList) ? clientList : [])
      } catch {
        toast.error("Could not load the client list")
      } finally {
        setLoadingClients(false)
      }
    }
    loadClients()
  }, [])

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  // When client selected, auto-fill brand name
  useEffect(() => {
    if (selectedClient) {
      setBrandName(selectedClient.company_name || selectedClient.name || "")
    }
  }, [selectedClient])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB")
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleAddPost = () => {
    const url = newPostUrl.trim()
    if (!url) return
    if (!/^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv)\/[\w-]+\/?/i.test(url)) {
      toast.error("That is not an Instagram post link")
      return
    }
    if (posts.some((p) => p.url === url)) {
      toast.error("Already on the list")
      return
    }
    setPosts([...posts, { url, id: `post-${Date.now()}` }])
    setNewPostUrl("")
    setIsAddPostOpen(false)
  }

  const handleSubmit = async () => {
    if (!campaignName.trim()) return toast.error("Campaign name is required")
    if (!selectedClientId) return toast.error("Select a client")
    if (!brandName.trim()) return toast.error("Brand name is required")
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) return toast.error("End date must be after start date")

    // We need the user's ID (users.id) for the superadmin/create endpoint
    const userId = selectedClient?.brand_user_id || selectedClient?.id
    if (!userId) return toast.error("Could not determine user ID for selected client")

    setSubmitting(true)
    const loadingToast = toast.loading("Creating campaign...")

    try {
      const { campaignApi } = await import("@/services/campaignApiComplete")
      const { tokenManager } = await import("@/utils/tokenManager")
      const token = tokenManager.getTokenSync() || localStorage.getItem("access_token") || ""

      // Create campaign
      const response = await campaignApi.createSuperadminCampaign({
        user_id: userId,
        name: campaignName.trim(),
        brand_name: brandName.trim(),
        description: description.trim() || undefined,
        budget: budget || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        campaign_type: campaignType,
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to create campaign")
      }

      const campaignId = response.data.id
      toast.dismiss(loadingToast)

      // Upload logo if provided
      if (logoFile && campaignId) {
        try {
          const formData = new FormData()
          formData.append("logo", logoFile)
          await fetch(`${API_BASE}/api/v1/campaigns/${campaignId}/logo`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          })
        } catch {
          toast.warning("Campaign created but logo upload failed")
        }
      }

      // Add posts if any
      for (const post of posts) {
        try {
          await fetch(`${API_BASE}/api/v1/campaigns/${campaignId}/posts/async`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ instagram_post_url: post.url }),
          })
        } catch (postErr) {
          toast.warning(`Failed to queue post: ${post.url.slice(0, 40)}...`)
        }
      }

      toast.success("Campaign created")

      // The UGC branch has always opened the campaign it just made; the other one dropped
      // you on the list holding the same id it had used two lines earlier to attach posts.
      if (campaignType === "ugc") {
        router.push(`/campaigns/${campaignId}/ugc`)
      } else {
        router.push(campaignId ? `/superadmin/campaigns/${campaignId}` : `/superadmin/campaigns`)
      }
    } catch (e: any) {
      toast.dismiss(loadingToast)
      toast.error(e?.message || "Failed to create campaign")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <div className="mx-auto max-w-4xl space-y-ds-5 p-4 pb-16 md:p-7">
          {/* Header */}
          <div>
            <Link
              href="/superadmin/campaigns"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> All campaigns
            </Link>
            <PageHead title="Create a campaign"
                      sub="Runs without the client approving a creator list." />
            {/* Forty-eight words of prose in a tinted box, before the first field, explaining
                a routing decision. It is a choice between two doors, so it is drawn as two
                doors: this page, or the proposal flow. */}
            <div className="mt-ds-3 flex flex-wrap gap-ds-3 text-sm">
              <div className="min-w-[220px] flex-1 rounded-ds-lg bg-[var(--tone-neutral-wash)] px-ds-3 py-ds-2">
                <p className="font-medium">Direct campaign</p>
                <p className="mt-0.5 text-muted-foreground">Runs straight away. No client sign-off.</p>
              </div>
              <Link href="/superadmin/proposals/create"
                    className="min-w-[220px] flex-1 rounded-ds-lg px-ds-3 py-ds-2 transition-colors hover:bg-black/[0.035] dark:hover:bg-white/[0.05]">
                <p className="font-medium text-primary">Start from a proposal →</p>
                <p className="mt-0.5 text-muted-foreground">
                  Internal approval, then the client signs. Agreement and invoices included.
                </p>
              </Link>
            </div>
          </div>

          {/* Client Selection */}
          <Panel title="Client" description="Which brand this campaign is for"
                 action={<Users className="h-4 w-4 text-muted-foreground" />}>
              {loadingClients ? (
                <p className="text-sm text-muted-foreground">Loading clients...</p>
              ) : (
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company_name || c.name}
                        {c.email ? ` (${c.email})` : ""}
                        {c.subscription_tier ? ` · ${c.subscription_tier}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedClient && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {(selectedClient.company_name || selectedClient.name || "?").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{selectedClient.company_name || selectedClient.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
                  </div>
                  {selectedClient.subscription_tier && (
                    <Badge variant="outline" className="ml-auto capitalize">
                      {selectedClient.subscription_tier}
                    </Badge>
                  )}
                </div>
              )}
          </Panel>

          {/* Campaign Type */}
          <Panel title="Campaign type" description="What kind of work this is">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCampaignType("influencer")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    campaignType === "influencer"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Megaphone className="h-6 w-6 mb-2 text-primary" />
                  <h3 className="font-semibold">Influencer</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instagram posts and engagement
                  </p>
                </button>
                <button
                  onClick={() => setCampaignType("ugc")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    campaignType === "ugc"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Upload className="h-6 w-6 mb-2 text-primary" />
                  <h3 className="font-semibold">UGC</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Concepts, models and video
                  </p>
                </button>
              </div>
          </Panel>

          {/* Campaign Details */}
          <Panel title="Details" description="Name, dates and budget">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign name</Label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Ramadan 2026 Campaign"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client name</Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Auto-filled from client"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Campaign description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Input
                    type="number"
                    value={budget || ""}
                    onChange={(e) => setBudget(parseFloat(e.target.value) || null)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    <Calendar className="h-3.5 w-3.5 inline mr-1" />
                    Starts
                  </Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>
                    <Calendar className="h-3.5 w-3.5 inline mr-1" />
                    Ends
                  </Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              {/* Brand Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-lg object-cover" />
                      <button
                        onClick={() => { setLogoFile(null); setLogoPreview("") }}
                        className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP. Max 2MB.</p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Instagram Posts (for influencer campaigns) */}
          {campaignType === "influencer" && (
            <Panel
              title="Instagram posts"
              description="Post URLs to track. Analytics run once the campaign exists"
              action={
                  <Dialog open={isAddPostOpen} onOpenChange={setIsAddPostOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add a post
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby="add-post-description">
                      <DialogHeader>
                        <DialogTitle>Add a post</DialogTitle>
                        <p id="add-post-description" className="text-sm text-muted-foreground">Paste the Instagram link</p>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Instagram link</Label>
                          <Input
                            value={newPostUrl}
                            onChange={(e) => setNewPostUrl(e.target.value)}
                            placeholder="https://www.instagram.com/p/..."
                            onKeyDown={(e) => e.key === "Enter" && handleAddPost()}
                          />
                        </div>
                        <Button onClick={handleAddPost} className="w-full">Add it</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
              }
            >
                {posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No posts yet. You can add them now, or once the campaign exists.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {/* A bordered, tinted line per URL, inside a panel that already has an
                        edge. The rows are separated by the gap now. */}
                    {posts.map((post) => (
                      <div key={post.id} className="flex items-center gap-3 rounded-ds-lg px-3 py-2.5 transition-colors hover:bg-black/[0.035] dark:hover:bg-white/[0.05]">
                        <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-sm">{post.url}</span>
                        <Button variant="ghost" size="icon" onClick={() => setPosts(posts.filter((p) => p.id !== post.id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
            </Panel>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/superadmin/campaigns")}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !campaignName.trim() || !selectedClientId || !brandName.trim()}
              size="lg"
            >
              {submitting ? "Creating..." : "Create the campaign"}
            </Button>
          </div>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
