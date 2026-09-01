"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, X, Link as LinkIcon, ChevronRight, BarChart3, Clapperboard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { BrandUserInterface } from "@/components/brand/BrandUserInterface";
import { AuthGuard } from "@/components/AuthGuard";
import { API_CONFIG } from "@/config/api";
import { tokenManager } from "@/utils/tokenManager";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { ImageCropper } from "@/components/ui/image-cropper";
import { Empty, Page, PageHead, SectionHead } from "@/components/campaigns/surface";

interface CampaignPost {
  url: string;
  id: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useEnhancedAuth();

  // Only superadmins can create campaigns — brand users are managed via proposals
  useEffect(() => {
    if (user && user.role !== 'superadmin' && user.role !== 'super_admin' && user.role !== 'admin') {
      toast.error("Campaign creation is managed by your account manager via proposals.");
      router.replace('/campaigns');
    }
  }, [user, router]);

  const [campaignName, setCampaignName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [isAddPostDialogOpen, setIsAddPostDialogOpen] = useState(false);
  const [newPostUrl, setNewPostUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (isSubmitting) return;
    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/campaigns");
  };

  return (
    <AuthGuard>
      <BrandUserInterface>
          <Page width="form">
            <form onSubmit={handleSubmit} className="flex flex-col gap-ds-6">
              {/* Where you are, and the way back. The step back is a quiet link above the
                  title rather than an icon button beside it, so nothing competes with the
                  one action at the foot of the form. */}
              <PageHead
                eyebrow={isSuperadmin ? 'Creating on behalf of a client' : undefined}
                title={selectedType
                  ? `New ${selectedType === 'ugc' ? 'UGC' : 'influencer'} campaign`
                  : 'New campaign'}
                sub={selectedType
                  ? 'The name and the brand are all we need to open it. Everything else can be filled in later.'
                  : undefined}
                back={
                  <button
                    type="button"
                    onClick={() => { if (selectedType) setSelectedType(null); else handleCancel(); }}
                    className="inline-flex w-fit items-center gap-ds-2 text-ds-body-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {selectedType ? 'Choose a different type' : 'Back to campaigns'}
                  </button>
                }
              />

        {/* Campaign Type Selector */}
        {!selectedType ? (
          /* Two choices, so two rows on one hairline. The old pair were hardcoded dark
             tiles with an emoji on them: they rendered as black boxes with white text in
             light mode, which is where nearly everyone using this actually is. */
          <div className="flex flex-col gap-ds-4">
            <SectionHead
              title="What kind of campaign is this?"
              sub="It decides which screens the campaign gets. You cannot change it afterwards."
            />
            <div className="divide-y overflow-hidden rounded-ds-lg border">
              <button
                type="button"
                onClick={() => setSelectedType('influencer')}
                className="flex w-full items-start gap-ds-3 px-ds-4 py-ds-4 text-left transition-colors hover:bg-muted/60"
              >
                <BarChart3 className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                <span className="min-w-0 flex-1">
                  <span className="block text-ds-subheading">Influencer campaign</span>
                  <span className="mt-1 block max-w-prose text-ds-body-sm text-muted-foreground">
                    Creators post to their own accounts. We track the posts and report on
                    what they reached.
                  </span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('ugc')}
                className="flex w-full items-start gap-ds-3 px-ds-4 py-ds-4 text-left transition-colors hover:bg-muted/60"
              >
                <Clapperboard className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                <span className="min-w-0 flex-1">
                  <span className="block text-ds-subheading">UGC campaign</span>
                  <span className="mt-1 block max-w-prose text-ds-body-sm text-muted-foreground">
                    Creators film for you, not for their own feed. Concepts, casting,
                    production and delivery.
                  </span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* Campaign Details */}
        <div className="flex flex-col gap-ds-4">
          <SectionHead title="The campaign" sub="Basic information about your campaign" />
          <div className="flex flex-col gap-ds-3">
            {/* User Selection (Superadmin Only) */}
            {isSuperadmin && (
              /* A tint rather than a coloured border and coloured text: this is set apart
                 because it is ours and not the client's, and one surface says that. The
                 hardcoded purple had no dark variant and went unreadable at night. */
              <div className="space-y-ds-2 rounded-ds-lg bg-muted px-ds-3 py-ds-3">
                <Label htmlFor="targetUser" className="text-ds-label">
                  Create this campaign for <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="targetUser"
                  placeholder="User ID or email"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  required={isSuperadmin}
                  className="bg-background"
                />
                <p className="text-ds-caption text-muted-foreground">
                  The campaign will belong to this account, not to yours.
                </p>
              </div>
            )}

            {/* Campaign Name */}
            <div className="space-y-ds-2">
              <Label htmlFor="campaignName">
                Campaign name <span className="text-destructive">*</span>
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
            <div className="space-y-ds-2">
              <Label htmlFor="brandName">
                Brand name <span className="text-destructive">*</span>
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
            <div className="space-y-ds-2">
              <Label htmlFor="brandLogo">Brand logo</Label>
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
                  <p className="mt-ds-2 text-ds-caption text-muted-foreground">
                    PNG, JPG or SVG, up to 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-ds-2">
              <Label htmlFor="description">
                Campaign description
              </Label>
              <textarea
                id="description"
                placeholder="Describe your campaign goals, target audience, and key messaging..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-ds-caption text-muted-foreground">
                Objectives, audience, key messages. Anything the team should know.
              </p>
            </div>

            {/* Budget */}
            <div className="space-y-ds-2">
              <Label htmlFor="budget">
                Campaign budget
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">AED</span>
                <Input
                  id="budget"
                  type="number"
                  placeholder="0"
                  value={budget?.toString() || ""}
                  onChange={(e) => setBudget(e.target.value ? parseInt(e.target.value) : null)}
                  className="pl-14"
                  min="0"
                  step="1"
                />
              </div>
              <p className="text-ds-caption text-muted-foreground">
                Optional, and only your own note of it. Nothing is charged here.
              </p>
            </div>

            {/* Campaign Dates */}
            <div className="grid grid-cols-1 gap-ds-3 md:grid-cols-2">
              <div className="space-y-ds-2">
                <Label htmlFor="startDate">
                  Start date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-ds-caption text-muted-foreground">
                  When it begins.
                </p>
              </div>

              <div className="space-y-ds-2">
                <Label htmlFor="endDate">
                  End date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
                <p className="text-ds-caption text-muted-foreground">
                  When it should be finished.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Posts */}
        <div className="flex flex-col gap-ds-4">
          <SectionHead
            title="Posts to track"
            sub="Instagram posts we should measure. You can add these later, the campaign opens without them."
            action={
              <Dialog open={isAddPostDialogOpen} onOpenChange={setIsAddPostDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Posts
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a post</DialogTitle>
                    <DialogDescription>
                      Paste the Instagram post you want tracked on this campaign.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-ds-3 py-ds-3">
                    <div className="space-y-ds-2">
                      <Label htmlFor="postUrl">Instagram post URL</Label>
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
                      <p className="text-ds-caption text-muted-foreground">
                        For example https://instagram.com/p/CXXXxxxxxx/
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
                      Add post
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            }
          />
          <div>
            {posts.length === 0 ? (
              /* Nothing added is not an error and not a failure, so it is a sentence. The
                 dashed box with a large icon in it was a placeholder pretending to be
                 content. */
              <Empty>No posts added. You can add them now or once the campaign is running.</Empty>
            ) : (
              <div className="flex flex-col gap-ds-3">
                <div className="divide-y overflow-hidden rounded-ds-lg border">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-center gap-ds-3 py-1 pl-ds-3 pr-1">
                      <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-ds-body-sm">{post.url}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove this post"
                        onClick={() => handleRemovePost(post.id)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-ds-caption text-muted-foreground">
                  {posts.length} {posts.length === 1 ? "post" : "posts"} will be tracked.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* The one action. Cancel stops shouting: it is a quiet link, not a third button of
            equal weight beside the thing you actually came to do. */}
        <div className="flex items-center justify-end gap-ds-5 border-t pt-ds-5">
          <button
            type="button"
            onClick={handleCancel}
            className="text-ds-body-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !campaignName || !brandName || (isSuperadmin && !targetUserId)}
          >
            {isSubmitting ? 'Creating' : isSuperadmin ? 'Create for this client' : 'Create campaign'}
          </Button>
        </div>
        </>
        )}
            </form>
          </Page>
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
