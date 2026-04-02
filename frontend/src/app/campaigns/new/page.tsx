"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Upload, X, Link as LinkIcon, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BrandUserInterface } from "@/components/brand/BrandUserInterface";
import { AuthGuard } from "@/components/AuthGuard";
import { API_CONFIG } from "@/config/api";
import { tokenManager } from "@/utils/tokenManager";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { ImageCropper } from "@/components/ui/image-cropper";

interface CampaignPost {
  url: string;
  id: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useEnhancedAuth();
  const [campaignName, setCampaignName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [isAddPostDialogOpen, setIsAddPostDialogOpen] = useState(false);
  const [newPostUrl, setNewPostUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // ROLE-BASED FLOW DETECTION (NO MORE USER CHOICE)
  const isSuperadmin = user?.role === 'superadmin';
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'influencer' | 'ugc' | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > MAX_SIZE) {
        toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 2MB.`);
        e.target.value = ""; // Reset file input
        return;
      }

      // Validate file type
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload PNG, JPEG, WEBP, or SVG.");
        e.target.value = ""; // Reset file input
        return;
      }

      // Store the selected file and open cropper

      setSelectedImageFile(file);
      setIsCropperOpen(true);

      // Clear the file input so user can select same file again if needed
      e.target.value = "";
    }
  };

  const handleImageCropped = (croppedFile: File) => {
    setBrandLogo(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
    toast.success("Logo cropped and ready to upload");
  };

  const handleAddPost = () => {
    const trimmedUrl = newPostUrl.trim();

    // Validate URL is not empty
    if (!trimmedUrl) {
      toast.error("Please enter a post URL");
      return;
    }

    // Validate Instagram URL format
    const instagramUrlPattern = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv)\/[\w-]+\/?/i;
    if (!instagramUrlPattern.test(trimmedUrl)) {
      toast.error("Invalid Instagram URL. Please use format: https://instagram.com/p/...");
      return;
    }

    // Check for duplicate URLs
    if (posts.some(post => post.url === trimmedUrl)) {
      toast.error("This post URL has already been added");
      return;
    }

    const newPost: CampaignPost = {
      url: trimmedUrl,
      id: `post-${Date.now()}`,
    };
    setPosts([...posts, newPost]);
    setNewPostUrl("");
    setIsAddPostDialogOpen(false);
    toast.success("Post added successfully");
  };

  const handleRemovePost = (postId: string) => {
    setPosts(posts.filter((post) => post.id !== postId));
    toast.success("Post removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }

    if (!brandName.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    // Validate superadmin-specific fields
    if (isSuperadmin && !targetUserId.trim()) {
      toast.error("Please enter the user ID for whom you're creating this campaign");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Creating campaign...");

    try {
      // ROLE-BASED API ENDPOINT SELECTION
      const { campaignApi } = await import('@/services/campaignApiComplete');

      let campaignData: any;
      let response: any;

      if (isSuperadmin) {
        // SUPERADMIN: Create campaign FOR another user
        campaignData = {
          user_id: targetUserId.trim(),
          name: campaignName.trim(),
          brand_name: brandName.trim(),
          description: description.trim() || undefined,
          budget: budget || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          campaign_type: selectedType || 'influencer',
        };


        response = await campaignApi.createSuperadminCampaign(campaignData);
      } else {
        // REGULAR USER: Create campaign for themselves
        campaignData = {
          name: campaignName.trim(),
          brand_name: brandName.trim(),
          description: description.trim() || undefined,
          budget: budget || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          campaign_type: selectedType || 'influencer',
        };


        response = await campaignApi.createUserCampaign(campaignData);
      }



      if (response.data) {

      }

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create campaign');
      }

      const campaignId = response.data.id;

      if (!campaignId) {

        throw new Error("No campaign ID returned from server");
      }



      // STEP 2: Upload logo if provided (separate multipart request)
      if (brandLogo) {

        const tokenResult = await tokenManager.getValidTokenWithRefresh();
        if (!tokenResult.isValid || !tokenResult.token) {
          throw new Error('Authentication required for logo upload');
        }
        const logoFormData = new FormData();
        logoFormData.append("logo", brandLogo);

        const logoResponse = await fetch(
          `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/logo`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenResult.token}`,
            },
            body: logoFormData,
          }
        );

        if (!logoResponse.ok) {

          toast.warning("Campaign created but logo upload failed");
        } else {

        }
      }

      // STEP 3: Add posts to campaign if any (optional) — one at a time
      if (posts.length > 0) {
        const tokenResult = await tokenManager.getValidTokenWithRefresh();
        if (!tokenResult.isValid || !tokenResult.token) {
          throw new Error('Authentication required for adding posts');
        }

        let postsAdded = 0;
        for (const post of posts) {
          try {
            const postsResponse = await fetch(
              `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/posts/async`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${tokenResult.token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ instagram_post_url: post.url }),
              }
            );
            if (postsResponse.ok) postsAdded++;
          } catch {
            // Continue with remaining posts
          }
        }

        if (postsAdded === 0 && posts.length > 0) {
          toast.warning("Campaign created but posts could not be added");
        } else if (postsAdded < posts.length) {
          toast.warning(`Campaign created. ${postsAdded}/${posts.length} posts queued for analysis.`);
        }
      }

      // Success notification
      toast.dismiss(loadingToast);
      toast.success("Campaign created successfully!");

      // Redirect based on campaign type
      if (selectedType === 'ugc') {
        router.push(`/campaigns/${campaignId}/ugc`);
      } else {
        router.push(`/campaigns`);
      }
    } catch (error) {

      if (error instanceof Error) {



      }
      toast.dismiss(loadingToast);
      const errorMessage = error instanceof Error ? error.message : "Failed to create campaign";
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    router.push("/campaigns");
  };

  return (
    <AuthGuard>
      <BrandUserInterface>
          <div className="container mx-auto py-8 px-4 max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Button type="button" variant="ghost" size="icon" onClick={() => {
                  if (selectedType) {
                    setSelectedType(null);
                  } else {
                    handleCancel();
                  }
                }}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  {selectedType && (
                    <h2 className="text-lg font-semibold">
                      New {selectedType === 'ugc' ? 'UGC' : 'Influencer'} Campaign
                    </h2>
                  )}
                </div>
                <Badge variant="outline" className={isSuperadmin ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                  {isSuperadmin ? 'Admin Mode' : 'Self-Managed'}
                </Badge>
              </div>

        {/* Campaign Type Selector */}
        {!selectedType ? (
          <div className="py-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Choose Campaign Type</h2>
              <p className="text-muted-foreground">Select the type of campaign you want to create</p>
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button
                type="button"
                onClick={() => setSelectedType('influencer')}
                className="p-8 rounded-2xl border-2 border-zinc-700 hover:border-blue-500 transition-all bg-zinc-900/50 text-left group"
              >
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Influencer Campaign</h3>
                <p className="text-sm text-zinc-400">Track posts, analyze reach, and measure ROI from influencer collaborations</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('ugc')}
                className="p-8 rounded-2xl border-2 border-zinc-700 hover:border-purple-500 transition-all bg-zinc-900/50 text-left group"
              >
                <div className="text-3xl mb-4">🎬</div>
                <h3 className="text-xl font-bold text-white mb-2">UGC Campaign</h3>
                <p className="text-sm text-zinc-400">Creative concepts, model casting, video production & delivery management</p>
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Basic information about your campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Selection (Superadmin Only) */}
            {isSuperadmin && (
              <div className="space-y-2 p-4 bg-purple-50 rounded-lg border-purple-200 border">
                <Label htmlFor="targetUser" className="font-semibold text-purple-700">
                  Create Campaign For User <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="targetUser"
                  placeholder="Enter user ID or email"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  required={isSuperadmin}
                  className="border-purple-200 focus:border-purple-500"
                />
                <p className="text-xs text-purple-600">
                  As a superadmin, you are creating this campaign FOR another user. Enter their user ID.
                </p>
              </div>
            )}

            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="campaignName">
                Campaign Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="campaignName"
                placeholder="e.g., Summer Collection Launch"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                required
              />
            </div>

            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="brandName">
                Brand Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brandName"
                placeholder="e.g., Nike"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
            </div>

            {/* Brand Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="brandLogo">Brand Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="h-20 w-20 rounded-lg border overflow-hidden">
                    <img
                      src={logoPreview}
                      alt="Brand logo preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="brandLogo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG or SVG (max. 2MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Campaign Description
              </Label>
              <textarea
                id="description"
                placeholder="Describe your campaign goals, target audience, and key messaging..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">
                Provide details about campaign objectives and requirements
              </p>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">
                Campaign Budget
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="budget"
                  type="number"
                  placeholder="0"
                  value={budget?.toString() || ""}
                  onChange={(e) => setBudget(e.target.value ? parseInt(e.target.value) : null)}
                  className="pl-8"
                  min="0"
                  step="1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Total budget for this campaign (optional)
              </p>
            </div>

            {/* Campaign Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  When should this campaign begin?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Campaign completion deadline
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select value={status} onValueChange={(value: "draft" | "active") => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Draft campaigns are not visible to creators
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Posts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campaign Posts</CardTitle>
                <CardDescription>Add Instagram post URLs to track</CardDescription>
              </div>
              <Dialog open={isAddPostDialogOpen} onOpenChange={setIsAddPostDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Posts
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Post URL</DialogTitle>
                    <DialogDescription>
                      Enter the Instagram post URL you want to track in this campaign
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="postUrl">Instagram Post URL</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="postUrl"
                            placeholder="https://instagram.com/p/..."
                            value={newPostUrl}
                            onChange={(e) => setNewPostUrl(e.target.value)}
                            className="pl-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddPost();
                              }
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Example: https://instagram.com/p/CXXXxxxxxx/
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddPostDialogOpen(false);
                        setNewPostUrl("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleAddPost}>
                      Add Post
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No posts added yet. Click "Add Posts" to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{post.url}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePost(post.id)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    {posts.length} {posts.length === 1 ? "post" : "posts"} added
                  </p>
                  <Badge variant="secondary">{posts.length} URLs</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => setSelectedType(null)}>
            Back
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!campaignName || !brandName || (isSuperadmin && !targetUserId)}
          >
            {isSuperadmin ? 'Create Managed Campaign' : 'Create My Campaign'}
          </Button>
        </div>
        </>
        )}
              </form>
          </div>
      </BrandUserInterface>

      {/* Image Cropper Dialog */}
      <ImageCropper
        open={isCropperOpen}
        onOpenChange={setIsCropperOpen}
        onImageCropped={handleImageCropped}
        title="Crop Brand Logo"
        cropAspectRatio={1} // Square crop
        preSelectedFile={selectedImageFile}
      />
    </AuthGuard>
  );
}
