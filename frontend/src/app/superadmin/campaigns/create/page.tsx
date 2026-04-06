"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
        toast.error("Failed to load clients")
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
      toast.error("Invalid Instagram URL")
      return
    }
    if (posts.some((p) => p.url === url)) {
      toast.error("Already added")
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

    // We need the user's ID (users.id) for the superadmin/create endpoint
    const userId = selectedClient?.brand_user_id || selectedClient?.id
    if (!userId) return toast.error("Could not determine user ID for selected client")

    setSubmitting(true)
    const loadingToast = toast.loading("Creating campaign...")

    try {
      const { campaignApi } = await import("@/services/campaignApiComplete")
      const token = localStorage.getItem("access_token") || ""

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

      toast.success("Campaign created successfully!")

      if (campaignType === "ugc") {
        router.push(`/campaigns/${campaignId}/ugc`)
      } else {
        router.push(`/superadmin/campaigns`)
      }
    } catch (e: any) {
      toast.dismiss(loadingToast)
      toast.error(e?.message || "Failed to create campaign")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
          {/* Header */}
          <div>
            <Link
              href="/superadmin/campaigns"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Campaigns
            </Link>
            <h1 className="text-3xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground mt-1">
              Create a managed campaign for a brand client
            </p>
          </div>

          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Select Client
              </CardTitle>
              <CardDescription>
                Choose which brand this campaign is for
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Campaign Type */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Type</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <h3 className="font-semibold">Influencer Campaign</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Track Instagram posts, engagement, and ROI
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
                  <h3 className="font-semibold">UGC Campaign</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage creative concepts, models, and video production
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Ramadan 2026 Campaign"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brand Name *</Label>
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Budget (AED)</Label>
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
                    Start Date
                  </Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>
                    <Calendar className="h-3.5 w-3.5 inline mr-1" />
                    End Date
                  </Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              {/* Brand Logo */}
              <div className="space-y-2">
                <Label>Brand Logo</Label>
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
            </CardContent>
          </Card>

          {/* Instagram Posts (for influencer campaigns) */}
          {campaignType === "influencer" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Instagram Posts</span>
                  <Dialog open={isAddPostOpen} onOpenChange={setIsAddPostOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby="add-post-description">
                      <DialogHeader>
                        <DialogTitle>Add Instagram Post</DialogTitle>
                        <p id="add-post-description" className="text-sm text-muted-foreground">Enter an Instagram post URL to track in this campaign</p>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Instagram Post URL</Label>
                          <Input
                            value={newPostUrl}
                            onChange={(e) => setNewPostUrl(e.target.value)}
                            placeholder="https://www.instagram.com/p/..."
                            onKeyDown={(e) => e.key === "Enter" && handleAddPost()}
                          />
                        </div>
                        <Button onClick={handleAddPost} className="w-full">Add Post</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription>
                  Add Instagram post URLs to track. Analytics will be processed after campaign creation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No posts added yet. You can add posts now or after campaign creation.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {posts.map((post) => (
                      <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate flex-1">{post.url}</span>
                        <Button variant="ghost" size="icon" onClick={() => setPosts(posts.filter((p) => p.id !== post.id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
              {submitting ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
