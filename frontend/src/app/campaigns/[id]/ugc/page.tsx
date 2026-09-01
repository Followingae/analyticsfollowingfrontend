"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  X,
  Trash2,
  User,
  Video,
  Film,
  Lightbulb,
  Users,
  BarChart3,
  Calendar,
  Check,
  XCircle,
  MessageSquare,
  ExternalLink,
  Search,
  Loader2,
  ChevronRight,
  RefreshCw,
  Eye,
  Clock,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  MapPin,
} from "lucide-react";

import { BrandUserInterface } from "@/components/brand/BrandUserInterface";
import {
  Empty as SurfaceEmpty,
  Failed,
  Money,
  Page,
  Waiting,
} from "@/components/campaigns/surface";
import { AuthGuard } from "@/components/AuthGuard";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { fetchWithAuth } from "@/utils/apiInterceptor";
import { API_CONFIG } from "@/config/api";
import { toast } from "sonner";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface CampaignDetails {
  id: string;
  name: string;
  brand_name: string;
  brand_logo_url: string | null;
  status: string;
  campaign_type?: string;
  created_at: string;
  updated_at: string;
}

interface UGCModel {
  id: string;
  assignment_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  instagram_url?: string;
  portfolio_url?: string;
  profile_photo_url?: string;
  ethnicity?: string;
  nationality?: string;
  gender?: string;
  age_range?: string;
  languages?: string[];
  specialties?: string[];
  day_rate_aed_cents?: number;
  previous_brands?: string[];
  notes?: string;
  status?: string;
  rating?: number;
  assignment_status?: string;
  selected_by_brand?: boolean;
  brand_feedback?: string;
  assigned_concepts?: number;
  assigned_at?: string;
}

interface FOCProductRow {
  product_name: string;
  quantity: number;
  link: string;
}

interface UGCConcept {
  id: string;
  campaign_id: string;
  concept_number: number;
  concept_name: string;
  status: string;
  reference_url?: string;
  product_group?: string;
  shoot_location?: string;
  creative_direction?: string;
  primary_hook?: string;
  content_purpose?: string;
  scene_description?: string;
  on_screen_text?: string;
  script?: string;
  usability_notes?: string;
  caption_en?: string;
  caption_ar?: string;
  assigned_model_id?: string;
  model_name?: string;
  model_photo?: string;
  model_instagram?: string;
  shoot_date?: string;
  foc_products?: FOCProductRow[];
  month?: string;
  brand_feedback?: string;
  props_required?: string;
  shoot_type?: string;
  created_at?: string;
  updated_at?: string;
}

interface UGCVideo {
  id: string;
  concept_id?: string;
  campaign_id: string;
  video_name?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  dimension?: string;
  file_size_bytes?: number;
  status: string;
  brand_feedback?: string;
  revision_count?: number;
  posting_status?: string;
  posted_url?: string;
  learnings?: string;
  concept_name?: string;
  concept_number?: number;
  budget_consumed?: number;
  requested_dimensions?: string[];
  created_at?: string;
  updated_at?: string;
}

interface BudgetSummary {
  total_budget: number;
  total_consumed: number;
  video_count: number;
  avg_per_video: number;
  remaining: number;
}

interface UGCStats {
  concepts: {
    total_concepts: number;
    draft: number;
    proposed: number;
    approved: number;
    rejected: number;
    revision_requested: number;
    in_production: number;
    completed: number;
  };
  videos: {
    total_videos: number;
    pending: number;
    uploaded: number;
    in_review: number;
    revision_requested: number;
    approved: number;
    final: number;
    avg_revisions: number;
  };
  models: {
    total_models: number;
    proposed: number;
    selected: number;
    rejected: number;
    confirmed: number;
  };
  approval_rate: number;
  avg_revisions: number;
}

interface ModelPoolResult {
  models: UGCModel[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const info = "bg-blue-500/10 text-blue-700 dark:text-blue-400";
  const good = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  const warn = "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  const bad = "bg-red-500/10 text-red-700 dark:text-red-400";
  const busy = "bg-violet-500/10 text-violet-700 dark:text-violet-400";
  const quiet = "bg-muted text-muted-foreground";
  const colors: Record<string, string> = {
    draft: quiet,
    proposed: info,
    approved: good,
    rejected: bad,
    revision_requested: warn,
    in_production: busy,
    completed: good,
    pending: quiet,
    uploaded: info,
    in_review: warn,
    final: good,
    selected: good,
    confirmed: good,
  };
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
        colors[status] || quiet
      }`}
    >
      {status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())}
    </span>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function UGCCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user, isLoading: authLoading } = useEnhancedAuth();

  // Core state
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  /**
   * Which reads failed, as opposed to coming back with nothing.
   *
   * Every fetch on this page used to swallow its error into an empty catch, so a models
   * endpoint returning 500 left `models` at `[]` and the tab said "No models assigned to
   * this campaign yet". A client reading that concludes we have not cast anybody. These
   * flags exist so the screen can tell the two apart, which it could not before.
   */
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const markFailed = (key: string, value: boolean) =>
    setFailed((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));

  // Data state
  const [stats, setStats] = useState<UGCStats | null>(null);
  const [models, setModels] = useState<UGCModel[]>([]);
  const [concepts, setConcepts] = useState<UGCConcept[]>([]);
  const [videos, setVideos] = useState<UGCVideo[]>([]);

  // Filter state
  const [conceptStatusFilter, setConceptStatusFilter] = useState<string>("all");
  const [videoStatusFilter, setVideoStatusFilter] = useState<string>("all");

  // Modal state
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [showCreateConceptModal, setShowCreateConceptModal] = useState(false);
  const [showUploadVideoModal, setShowUploadVideoModal] = useState(false);
  const [showConceptDetailModal, setShowConceptDetailModal] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<UGCConcept | null>(null);

  // Model pool search state
  const [modelPoolSearch, setModelPoolSearch] = useState("");
  const [modelPoolResults, setModelPoolResults] = useState<UGCModel[]>([]);
  const [isSearchingModels, setIsSearchingModels] = useState(false);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);

  // Concept form state
  const [conceptForm, setConceptForm] = useState({
    concept_name: "",
    product_group: "",
    primary_hook: "",
    reference_url: "",
    shoot_location: "",
    creative_direction: "",
    scene_description: "",
    script: "",
    content_purpose: "",
    on_screen_text: "",
    caption_en: "",
    caption_ar: "",
    assigned_model_id: "",
    shoot_date: "",
    month: "",
    status: "draft",
    props_required: "",
    shoot_type: "",
  });

  // FOC Products rows state
  const [focProductRows, setFocProductRows] = useState<FOCProductRow[]>([
    { product_name: "", quantity: 1, link: "" },
  ]);

  // Video form state
  const [videoForm, setVideoForm] = useState({
    video_name: "",
    video_url: "",
    concept_id: "",
    dimension: "",
    duration_seconds: "",
    budget_consumed: "",
    requested_dimensions: [] as string[],
  });

  // Budget summary state
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);

  // Feedback state
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"concept" | "video" | null>(null);

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isSuperadmin = user?.role === "superadmin";

  // =========================================================================
  // DATA FETCHING
  // =========================================================================

  const fetchCampaignData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          setCampaign(null);
          return;
        }
        throw new Error(`Campaign fetch failed: ${response.status}`);
      }
      const data = await response.json();
      const campaignData = data.data || data;
      setCampaign({
        id: campaignData.id,
        name: campaignData.name,
        brand_name: campaignData.brand_name,
        brand_logo_url: campaignData.brand_logo_url,
        status: campaignData.status,
        campaign_type: campaignData.campaign_type,
        created_at: campaignData.created_at,
        updated_at: campaignData.updated_at,
      });
    } catch (error: any) {
      if (
        error.message?.includes("401") ||
        error.message?.includes("authentication")
      ) {
        router.push("/auth/login");
        return;
      }
      toast.error("Failed to load campaign data");
      // Not a 404: the campaign exists, we just could not read it. Reporting it as "not
      // found" told the client their campaign had been deleted.
      markFailed("campaign", true);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, router]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/stats`
      );
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      setStats(data.data || data);
      markFailed("stats", false);
    } catch (error) {
      markFailed("stats", true);
    }
  }, [campaignId]);

  const fetchModels = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/models`
      );
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      setModels(data.data || []);
      markFailed("models", false);
    } catch (error) {
      // A failed read is not an empty cast list, and the tab has to be able to say so.
      markFailed("models", true);
    }
  }, [campaignId]);

  const fetchConcepts = useCallback(
    async (statusFilter?: string) => {
      try {
        const filterParam =
          statusFilter && statusFilter !== "all"
            ? `?status=${statusFilter}`
            : "";
        const response = await fetchWithAuth(
          `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/concepts${filterParam}`
        );
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        setConcepts(data.data || []);
        markFailed("concepts", false);
      } catch (error) {
        markFailed("concepts", true);
      }
    },
    [campaignId]
  );

  const fetchVideos = useCallback(
    async (statusFilter?: string) => {
      try {
        const filterParam =
          statusFilter && statusFilter !== "all"
            ? `?status=${statusFilter}`
            : "";
        const response = await fetchWithAuth(
          `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/videos${filterParam}`
        );
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        setVideos(data.data || []);
        markFailed("videos", false);
      } catch (error) {
        markFailed("videos", true);
      }
    },
    [campaignId]
  );

  const fetchBudgetSummary = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/budget-summary`
      );
      if (response.ok) {
        const data = await response.json();
        setBudgetSummary(data.data || null);
      }
    } catch (error) {
      // Silent fail — budget summary is optional
    }
  }, [campaignId]);

  // =========================================================================
  // EFFECTS
  // =========================================================================

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (campaignId) {
      fetchCampaignData();
    }
  }, [user, authLoading, campaignId, router, fetchCampaignData]);

  useEffect(() => {
    if (!campaign) return;
    fetchStats();
    fetchModels();
    fetchConcepts();
    fetchVideos();
    fetchBudgetSummary();
  }, [campaign, fetchStats, fetchModels, fetchConcepts, fetchVideos, fetchBudgetSummary]);

  useEffect(() => {
    if (campaign) {
      fetchConcepts(conceptStatusFilter);
    }
  }, [conceptStatusFilter, campaign, fetchConcepts]);

  useEffect(() => {
    if (campaign) {
      fetchVideos(videoStatusFilter);
    }
  }, [videoStatusFilter, campaign, fetchVideos]);

  // =========================================================================
  // MODEL POOL ACTIONS (Superadmin)
  // =========================================================================

  const searchModelPool = async () => {
    setIsSearchingModels(true);
    try {
      const searchParam = modelPoolSearch ? `&search=${encodeURIComponent(modelPoolSearch)}` : "";
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/ugc/models?limit=20${searchParam}`
      );
      if (response.ok) {
        const data = await response.json();
        const result: ModelPoolResult = data.data || data;
        setModelPoolResults(result.models || []);
      }
    } catch (error) {
      toast.error("Failed to search model pool");
    } finally {
      setIsSearchingModels(false);
    }
  };

  const assignModels = async () => {
    if (selectedModelIds.length === 0) {
      toast.error("Select at least one model");
      return;
    }
    setActionLoading("assign-models");
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/models`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model_ids: selectedModelIds }),
        }
      );
      if (response.ok) {
        toast.success("Models assigned to campaign");
        setShowAddModelModal(false);
        setSelectedModelIds([]);
        setModelPoolResults([]);
        setModelPoolSearch("");
        fetchModels();
        fetchStats();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.detail || "Failed to assign models");
      }
    } catch (error) {
      toast.error("Failed to assign models");
    } finally {
      setActionLoading(null);
    }
  };

  const removeModel = async (modelId: string) => {
    if (!confirm("Remove this model from the campaign?")) return;
    setActionLoading(`remove-model-${modelId}`);
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/models/${modelId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        toast.success("Model removed from campaign");
        fetchModels();
        fetchStats();
      } else {
        toast.error("Failed to remove model");
      }
    } catch (error) {
      toast.error("Failed to remove model");
    } finally {
      setActionLoading(null);
    }
  };

  const selectModel = async (modelId: string, selected: boolean, feedback?: string) => {
    setActionLoading(`select-model-${modelId}`);
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/models/${modelId}/select`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected, feedback: feedback || null }),
        }
      );
      if (response.ok) {
        toast.success(selected ? "Model selected" : "Model rejected");
        fetchModels();
        fetchStats();
      } else {
        toast.error("Failed to update model selection");
      }
    } catch (error) {
      toast.error("Failed to update model selection");
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================================
  // CONCEPT ACTIONS
  // =========================================================================

  const createConcept = async () => {
    if (!conceptForm.concept_name.trim()) {
      toast.error("Concept name is required");
      return;
    }
    setActionLoading("create-concept");
    try {
      const payload: Record<string, any> = {};
      Object.entries(conceptForm).forEach(([key, val]) => {
        if (val && val !== "") {
          payload[key] = val;
        }
      });
      // Add FOC products as structured data
      const validFocProducts = focProductRows.filter(
        (row) => row.product_name.trim() !== ""
      );
      if (validFocProducts.length > 0) {
        payload.foc_products = validFocProducts;
      }
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/concepts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        toast.success("Concept created");
        setShowCreateConceptModal(false);
        setConceptForm({
          concept_name: "",
          product_group: "",
          primary_hook: "",
          reference_url: "",
          shoot_location: "",
          creative_direction: "",
          scene_description: "",
          script: "",
          content_purpose: "",
          on_screen_text: "",
          caption_en: "",
          caption_ar: "",
          assigned_model_id: "",
          shoot_date: "",
          month: "",
          status: "draft",
          props_required: "",
          shoot_type: "",
        });
        setFocProductRows([{ product_name: "", quantity: 1, link: "" }]);
        fetchConcepts(conceptStatusFilter);
        fetchStats();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.detail || "Failed to create concept");
      }
    } catch (error) {
      toast.error("Failed to create concept");
    } finally {
      setActionLoading(null);
    }
  };

  const updateConceptStatus = async (
    conceptId: string,
    newStatus: string,
    brandFeedback?: string
  ) => {
    setActionLoading(`concept-status-${conceptId}`);
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/concepts/${conceptId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            brand_feedback: brandFeedback || null,
          }),
        }
      );
      if (response.ok) {
        toast.success(`Concept ${newStatus.replace(/_/g, " ")}`);
        setFeedbackTargetId(null);
        setFeedbackType(null);
        setFeedbackText("");
        fetchConcepts(conceptStatusFilter);
        fetchStats();
      } else {
        toast.error("Failed to update concept status");
      }
    } catch (error) {
      toast.error("Failed to update concept status");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteConcept = async (conceptId: string) => {
    if (!confirm("Delete this concept? This cannot be undone.")) return;
    setActionLoading(`delete-concept-${conceptId}`);
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/concepts/${conceptId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        toast.success("Concept deleted");
        fetchConcepts(conceptStatusFilter);
        fetchStats();
      } else {
        toast.error("Failed to delete concept");
      }
    } catch (error) {
      toast.error("Failed to delete concept");
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================================
  // VIDEO ACTIONS
  // =========================================================================

  const createVideo = async () => {
    if (!videoForm.video_name?.trim() && !videoForm.video_url?.trim()) {
      toast.error("Video name or URL is required");
      return;
    }
    setActionLoading("create-video");
    try {
      const payload: Record<string, any> = {};
      if (videoForm.video_name) payload.video_name = videoForm.video_name;
      if (videoForm.video_url) payload.video_url = videoForm.video_url;
      if (videoForm.concept_id) payload.concept_id = videoForm.concept_id;
      if (videoForm.dimension) payload.dimension = videoForm.dimension;
      if (videoForm.duration_seconds)
        payload.duration_seconds = parseInt(videoForm.duration_seconds);
      if (videoForm.budget_consumed)
        payload.budget_consumed = parseFloat(videoForm.budget_consumed);
      if (videoForm.requested_dimensions.length > 0)
        payload.requested_dimensions = videoForm.requested_dimensions;

      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/videos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        toast.success("Video added");
        setShowUploadVideoModal(false);
        setVideoForm({
          video_name: "",
          video_url: "",
          concept_id: "",
          dimension: "",
          duration_seconds: "",
          budget_consumed: "",
          requested_dimensions: [],
        });
        fetchVideos(videoStatusFilter);
        fetchStats();
        fetchBudgetSummary();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.detail || "Failed to add video");
      }
    } catch (error) {
      toast.error("Failed to add video");
    } finally {
      setActionLoading(null);
    }
  };

  const reviewVideo = async (videoId: string, status: string, feedback?: string) => {
    setActionLoading(`review-video-${videoId}`);
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/videos/${videoId}/review`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            feedback: feedback || null,
          }),
        }
      );
      if (response.ok) {
        toast.success(`Video ${status.replace(/_/g, " ")}`);
        setFeedbackTargetId(null);
        setFeedbackType(null);
        setFeedbackText("");
        fetchVideos(videoStatusFilter);
        fetchStats();
      } else {
        toast.error("Failed to review video");
      }
    } catch (error) {
      toast.error("Failed to review video");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    setActionLoading(`delete-video-${videoId}`);
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/videos/${videoId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        toast.success("Video deleted");
        fetchVideos(videoStatusFilter);
        fetchStats();
      } else {
        toast.error("Failed to delete video");
      }
    } catch (error) {
      toast.error("Failed to delete video");
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================================
  // HELPERS
  // =========================================================================

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const refreshAll = () => {
    fetchStats();
    fetchModels();
    fetchConcepts(conceptStatusFilter);
    fetchVideos(videoStatusFilter);
    fetchBudgetSummary();
    toast.success("Data refreshed");
  };

  // Tabs definition
  const tabs = isSuperadmin
    ? [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "models", label: "Models", icon: Users },
        { id: "concepts", label: "Concepts", icon: Lightbulb },
        { id: "videos", label: "Videos", icon: Video },
        { id: "schedule", label: "Schedule", icon: Calendar },
      ]
    : [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "models", label: "Models", icon: Users },
        { id: "concepts", label: "Concepts", icon: Lightbulb },
        { id: "videos", label: "Videos", icon: Video },
      ];

  // =========================================================================
  // LOADING & ERROR STATES
  // =========================================================================

  if (authLoading || isLoading || !user) {
    return (
      <AuthGuard>
        <BrandUserInterface>
          <Page width="page">
            {/* Shapes the size of what is coming, at the width it will land at, so the page
                does not jump. A spinner centred in an empty viewport told the reader nothing
                about what was on its way. */}
            <div className="flex flex-col gap-ds-6" aria-busy="true">
              <div className="space-y-ds-2">
                <div className="h-9 w-72 animate-pulse rounded bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              </div>
              <Waiting lines={5} />
            </div>
          </Page>
        </BrandUserInterface>
      </AuthGuard>
    );
  }

  if (!campaign) {
    return (
      <AuthGuard>
        <BrandUserInterface>
            <Page width="page">
              {/* "Campaign not found" over a 500 tells a client their campaign has been
                  deleted. A failed read and a missing campaign now say different things. */}
              <div className="flex flex-col items-start gap-ds-4">
                {failed.campaign ? (
                  <Failed
                    what="We could not load this campaign"
                    detail="Nothing has changed on the campaign itself. This is a read that failed at our end."
                    onRetry={() => fetchCampaignData()}
                  />
                ) : (
                  <div className="space-y-ds-2">
                    <h1 className="text-ds-heading">This campaign is not here</h1>
                    <p className="max-w-prose text-ds-body text-muted-foreground">
                      It may have been removed, or the link may point somewhere that no
                      longer exists.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => router.push("/campaigns")}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-ds-control font-medium hover:bg-primary/90 transition-colors"
                >
                  Back to campaigns
                </button>
              </div>
            </Page>
        </BrandUserInterface>
      </AuthGuard>
    );
  }

  // =========================================================================
  // TAB CONTENT RENDERERS
  // =========================================================================

  const renderOverview = () => {
    if (failed.stats && !stats) {
      return (
        <Failed
          what="We could not load this campaign's figures"
          detail="Nothing below is a real number until this loads, so none are shown."
          onRetry={() => fetchStats()}
        />
      );
    }
    if (!stats) {
      return (
        <div className="grid grid-cols-1 gap-x-ds-5 gap-y-ds-4 md:grid-cols-2 lg:grid-cols-5" aria-busy="true">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-ds-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      );
    }

    const pipelineStages = [
      { label: "Draft", count: stats.concepts.draft, color: "bg-muted-foreground/30" },
      { label: "Proposed", count: stats.concepts.proposed, color: "bg-blue-500" },
      { label: "Approved", count: stats.concepts.approved, color: "bg-green-500" },
      { label: "In Production", count: stats.concepts.in_production, color: "bg-purple-500" },
      { label: "Completed", count: stats.concepts.completed, color: "bg-emerald-500" },
    ];
    const totalPipeline = pipelineStages.reduce((s, p) => s + p.count, 0);

    return (
      <div className="flex flex-col gap-ds-6">
        {/* The five figures */}
        <div className="grid grid-cols-1 gap-x-ds-5 gap-y-ds-5 md:grid-cols-2 lg:grid-cols-5">
          {/* Total Concepts */}
          <div>
            <div className="mb-ds-2 flex items-center justify-between gap-ds-2">
              <span className="text-ds-overline uppercase text-muted-foreground">
                Concepts
              </span>
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-[34px] font-semibold leading-none tracking-[-0.025em] tabular-nums">
              {stats.concepts.total_concepts}
            </p>
            <div className="mt-ds-3 space-y-1 border-t pt-ds-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Draft</span>
                <span className="tabular-nums text-muted-foreground">{stats.concepts.draft}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Proposed</span>
                <span className="tabular-nums text-foreground">{stats.concepts.proposed}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Approved</span>
                <span className="tabular-nums text-foreground">{stats.concepts.approved}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">In Production</span>
                <span className="tabular-nums text-foreground">{stats.concepts.in_production}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Completed</span>
                <span className="tabular-nums text-foreground">{stats.concepts.completed}</span>
              </div>
            </div>
          </div>

          {/* Total Videos */}
          <div>
            <div className="mb-ds-2 flex items-center justify-between gap-ds-2">
              <span className="text-ds-overline uppercase text-muted-foreground">
                Videos
              </span>
              <Video className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-[34px] font-semibold leading-none tracking-[-0.025em] tabular-nums">
              {stats.videos.total_videos}
            </p>
            <div className="mt-ds-3 space-y-1 border-t pt-ds-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pending</span>
                <span className="tabular-nums text-muted-foreground">{stats.videos.pending}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">In Review</span>
                <span className="tabular-nums text-foreground">{stats.videos.in_review}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Approved</span>
                <span className="tabular-nums text-foreground">{stats.videos.approved}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Final</span>
                <span className="tabular-nums text-foreground">{stats.videos.final}</span>
              </div>
            </div>
          </div>

          {/* Models */}
          <div>
            <div className="mb-ds-2 flex items-center justify-between gap-ds-2">
              <span className="text-ds-overline uppercase text-muted-foreground">
                Models
              </span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-[34px] font-semibold leading-none tracking-[-0.025em] tabular-nums">
              {stats.models.total_models}
            </p>
            <div className="mt-ds-3 space-y-1 border-t pt-ds-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Proposed</span>
                <span className="tabular-nums text-foreground">{stats.models.proposed}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Selected</span>
                <span className="tabular-nums text-foreground">{stats.models.selected}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Confirmed</span>
                <span className="tabular-nums text-foreground">{stats.models.confirmed}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rejected</span>
                <span className="tabular-nums text-foreground">{stats.models.rejected}</span>
              </div>
            </div>
          </div>

          {/* Approval Rate */}
          <div>
            <div className="mb-ds-2 flex items-center justify-between gap-ds-2">
              <span className="text-ds-overline uppercase text-muted-foreground">
                Approval Rate
              </span>
              <ThumbsUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-[34px] font-semibold leading-none tracking-[-0.025em] tabular-nums">
              {stats.approval_rate}%
            </p>
            <p className="mt-ds-2 text-ds-caption text-muted-foreground">
              Based on approved + completed concepts
            </p>
          </div>

          {/* Avg Revisions */}
          <div>
            <div className="mb-ds-2 flex items-center justify-between gap-ds-2">
              <span className="text-ds-overline uppercase text-muted-foreground">
                Avg Revisions
              </span>
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-[34px] font-semibold leading-none tracking-[-0.025em] tabular-nums">
              {stats.avg_revisions}
            </p>
            <p className="mt-ds-2 text-ds-caption text-muted-foreground">
              Average revisions per video
            </p>
          </div>
        </div>

        {/* Production Pipeline */}
        <div className="rounded-ds-lg border p-ds-4">
          <h3 className="mb-ds-4 text-ds-overline uppercase text-muted-foreground">
            Production pipeline
          </h3>

          {/* Pipeline bar */}
          <div className="relative h-3 rounded-full overflow-hidden bg-muted mb-6">
            {totalPipeline > 0 && (
              <div className="flex h-full">
                {pipelineStages.map((stage) =>
                  stage.count > 0 ? (
                    <div
                      key={stage.label}
                      className={`${stage.color} h-full transition-all duration-500`}
                      style={{
                        width: `${(stage.count / totalPipeline) * 100}%`,
                      }}
                    />
                  ) : null
                )}
              </div>
            )}
          </div>

          {/* Pipeline stages */}
          <div className="flex items-center justify-between">
            {pipelineStages.map((stage, index) => (
              <div key={stage.label} className="flex items-center">
                <div className="text-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="text-xs text-muted-foreground">{stage.label}</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{stage.count}</p>
                </div>
                {index < pipelineStages.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderModels = () => {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Campaign Models{" "}
            <span className="text-muted-foreground text-sm font-normal">
              ({models.length})
            </span>
          </h3>
          {isSuperadmin && (
            <button
              onClick={() => {
                setShowAddModelModal(true);
                searchModelPool();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-ds-control text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Models
            </button>
          )}
        </div>

        {/* Model Cards */}
        {failed.models ? (
          <Failed
            what="We could not load the models on this campaign"
            detail="Nobody has been removed from the cast. This is a read that failed at our end."
            onRetry={() => fetchModels()}
          />
        ) : models.length === 0 ? (
          <div className="flex flex-col items-start gap-ds-2">
            <SurfaceEmpty>Nobody has been cast on this campaign yet.</SurfaceEmpty>
            {isSuperadmin && (
              <p className="text-ds-body-sm text-muted-foreground">
                Add models to assign them from the talent pool.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {models.map((model) => (
              <div
                key={model.assignment_id || model.id}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-4"
              >
                {/* Photo */}
                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {model.profile_photo_url ? (
                    <img
                      src={model.profile_photo_url}
                      alt={model.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">
                    {model.full_name}
                  </h4>
                  {model.ethnicity && (
                    <p className="text-sm text-muted-foreground">{model.ethnicity}</p>
                  )}
                  {model.instagram_url && (
                    <a
                      href={model.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      Instagram <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(model.specialties || []).map((s, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-muted rounded-full text-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {model.brand_feedback && (
                    <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">Feedback</p>
                      <p className="text-xs text-foreground">{model.brand_feedback}</p>
                    </div>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <StatusBadge status={model.assignment_status || "proposed"} />

                  {/* Brand select/reject for proposed models */}
                  {!isSuperadmin && model.assignment_status === "proposed" && (
                    <div className="flex gap-1.5 mt-1">
                      <button
                        onClick={() => selectModel(model.id, true)}
                        disabled={actionLoading === `select-model-${model.id}`}
                        className="p-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors disabled:opacity-50"
                        title="Select"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => selectModel(model.id, false)}
                        disabled={actionLoading === `select-model-${model.id}`}
                        className="p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Superadmin remove */}
                  {isSuperadmin && (
                    <button
                      onClick={() => removeModel(model.id)}
                      disabled={actionLoading === `remove-model-${model.id}`}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-muted transition-colors disabled:opacity-50"
                      title="Remove from campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderConcepts = () => {
    const conceptStatuses = [
      "all",
      "draft",
      "proposed",
      "approved",
      "in_production",
      "completed",
      "rejected",
      "revision_requested",
    ];

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Concepts{" "}
            <span className="text-muted-foreground text-sm font-normal">
              ({concepts.length})
            </span>
          </h3>
          {isSuperadmin && (
            <button
              onClick={() => setShowCreateConceptModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-ds-control text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Concept
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {conceptStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setConceptStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                conceptStatusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "all"
                ? "All"
                : s
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Concept Cards */}
        {failed.concepts ? (
          <Failed
            what="We could not load the concepts"
            detail="Nothing has been deleted. This is a read that failed at our end."
            onRetry={() => fetchConcepts(conceptStatusFilter)}
          />
        ) : concepts.length === 0 ? (
          <SurfaceEmpty>
            {conceptStatusFilter !== "all"
              ? `No concepts are at "${conceptStatusFilter.replace(/_/g, " ")}" right now.`
              : "No concepts have been written for this campaign yet."}
          </SurfaceEmpty>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {concepts.map((concept) => (
              <div
                key={concept.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-foreground/25 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      #{concept.concept_number}
                    </span>
                    <h4 className="font-semibold text-foreground truncate">
                      {concept.concept_name}
                    </h4>
                    {concept.product_group && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {concept.product_group}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={concept.status} />
                </div>

                {/* Reference */}
                {concept.reference_url && (
                  <a
                    href={concept.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline inline-flex items-center gap-1 mb-2"
                  >
                    View Reference <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {/* Hook */}
                {concept.primary_hook && (
                  <p className="text-sm text-foreground mt-2 italic leading-relaxed">
                    &ldquo;{concept.primary_hook}&rdquo;
                  </p>
                )}

                {/* Model */}
                {concept.model_name && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <User className="w-3 h-3" /> Model: {concept.model_name}
                  </p>
                )}

                {/* Shoot date */}
                {concept.shoot_date && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Shoot:{" "}
                    {formatDate(concept.shoot_date)}
                  </p>
                )}

                {/* Shoot type */}
                {concept.shoot_type && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{" "}
                    {concept.shoot_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                )}

                {/* Brand Feedback */}
                {concept.brand_feedback && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Brand Feedback</p>
                    <p className="text-sm text-foreground">
                      {concept.brand_feedback}
                    </p>
                  </div>
                )}

                {/* Revision feedback input */}
                {feedbackTargetId === concept.id && feedbackType === "concept" && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Add your feedback..."
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updateConceptStatus(
                            concept.id,
                            "revision_requested",
                            feedbackText
                          )
                        }
                        disabled={actionLoading === `concept-status-${concept.id}`}
                        className="text-xs px-3 py-1.5 bg-yellow-900/30 text-yellow-300 rounded-lg hover:bg-yellow-900/50 disabled:opacity-50"
                      >
                        Submit Revision Request
                      </button>
                      <button
                        onClick={() => {
                          setFeedbackTargetId(null);
                          setFeedbackType(null);
                          setFeedbackText("");
                        }}
                        className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {/* View detail */}
                  <button
                    onClick={() => {
                      setSelectedConcept(concept);
                      setShowConceptDetailModal(true);
                    }}
                    className="text-xs px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Details
                  </button>

                  {/* Brand approve/reject on proposed concepts */}
                  {!isSuperadmin && concept.status === "proposed" && (
                    <>
                      <button
                        onClick={() =>
                          updateConceptStatus(concept.id, "approved")
                        }
                        disabled={
                          actionLoading === `concept-status-${concept.id}`
                        }
                        className="text-xs px-3 py-1.5 bg-green-900/30 text-green-300 rounded-lg hover:bg-green-900/50 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() =>
                          updateConceptStatus(concept.id, "rejected")
                        }
                        disabled={
                          actionLoading === `concept-status-${concept.id}`
                        }
                        className="text-xs px-3 py-1.5 bg-red-900/30 text-red-300 rounded-lg hover:bg-red-900/50 disabled:opacity-50 flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                      <button
                        onClick={() => {
                          setFeedbackTargetId(concept.id);
                          setFeedbackType("concept");
                          setFeedbackText("");
                        }}
                        className="text-xs px-3 py-1.5 bg-yellow-900/30 text-yellow-300 rounded-lg hover:bg-yellow-900/50 flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" /> Revision
                      </button>
                    </>
                  )}

                  {/* Superadmin can also approve/reject + delete */}
                  {isSuperadmin && concept.status === "proposed" && (
                    <>
                      <button
                        onClick={() =>
                          updateConceptStatus(concept.id, "approved")
                        }
                        disabled={
                          actionLoading === `concept-status-${concept.id}`
                        }
                        className="text-xs px-3 py-1.5 bg-green-900/30 text-green-300 rounded-lg hover:bg-green-900/50 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                    </>
                  )}

                  {isSuperadmin && (
                    <button
                      onClick={() => deleteConcept(concept.id)}
                      disabled={
                        actionLoading === `delete-concept-${concept.id}`
                      }
                      className="text-xs px-3 py-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-muted disabled:opacity-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderVideos = () => {
    const videoStatuses = [
      "all",
      "uploaded",
      "in_review",
      "approved",
      "revision_requested",
      "final",
    ];

    return (
      <div className="space-y-4">
        {/* Budget Summary Card */}
        {budgetSummary && (budgetSummary.total_budget > 0 || budgetSummary.total_consumed > 0) && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Budget Summary
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
<Money amount={budgetSummary.total_consumed} decimals={2} /> consumed across {budgetSummary.video_count} video{budgetSummary.video_count !== 1 ? "s" : ""}
                </p>
              </div>
              {budgetSummary.total_budget > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className={`text-lg font-bold ${budgetSummary.remaining >= 0 ? "text-emerald-400" : "text-red-400"}`}>
<Money amount={budgetSummary.remaining} decimals={2} />
                  </p>
                </div>
              )}
            </div>
            {budgetSummary.total_budget > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span><Money amount={budgetSummary.total_consumed} /></span>
                  <span><Money amount={budgetSummary.total_budget} /></span>
                </div>
                <div className="relative h-2.5 rounded-full overflow-hidden bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (budgetSummary.total_consumed / budgetSummary.total_budget) > 0.9
                        ? "bg-red-500"
                        : (budgetSummary.total_consumed / budgetSummary.total_budget) > 0.7
                        ? "bg-yellow-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min((budgetSummary.total_consumed / budgetSummary.total_budget) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {((budgetSummary.total_consumed / budgetSummary.total_budget) * 100).toFixed(1)}% used
                </p>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Videos{" "}
            <span className="text-muted-foreground text-sm font-normal">
              ({videos.length})
            </span>
          </h3>
          {isSuperadmin && (
            <button
              onClick={() => setShowUploadVideoModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-ds-control text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload Video
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {videoStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setVideoStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                videoStatusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "all"
                ? "All"
                : s
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Video Cards */}
        {failed.videos ? (
          <Failed
            what="We could not load the videos"
            detail="Nothing has been removed. This is a read that failed at our end."
            onRetry={() => fetchVideos(videoStatusFilter)}
          />
        ) : videos.length === 0 ? (
          <SurfaceEmpty>
            {videoStatusFilter !== "all"
              ? `No videos are at "${videoStatusFilter.replace(/_/g, " ")}" right now.`
              : "No videos have been delivered on this campaign yet."}
          </SurfaceEmpty>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-foreground/25 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <h4 className="font-semibold text-foreground truncate">
                        {video.video_name || "Untitled Video"}
                      </h4>
                    </div>
                    {video.concept_name && (
                      <p className="text-sm text-muted-foreground mt-0.5 ml-6">
                        Concept #{video.concept_number}: {video.concept_name}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={video.status} />
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                  {video.dimension && (
                    <span className="flex items-center gap-1">
                      {video.dimension}
                    </span>
                  )}
                  {video.duration_seconds != null && video.duration_seconds > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {video.duration_seconds}s
                    </span>
                  )}
                  {(video.revision_count ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <RefreshCw className="w-3 h-3" /> {video.revision_count}{" "}
                      revision{(video.revision_count ?? 0) > 1 ? "s" : ""}
                    </span>
                  )}
                  {video.budget_consumed != null && video.budget_consumed > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
<Money amount={Number(video.budget_consumed)} decimals={2} />
                    </span>
                  )}
                </div>
                {/* Requested dimensions */}
                {video.requested_dimensions && video.requested_dimensions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {video.requested_dimensions.map((dim, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-muted border border-border rounded-full text-foreground"
                      >
                        {dim === "9:16" ? "9:16 Vertical" : dim === "16:9" ? "16:9 Horizontal" : dim === "1:1" ? "1:1 Square" : dim}
                      </span>
                    ))}
                  </div>
                )}

                {/* Video URL */}
                {video.video_url && (
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline inline-flex items-center gap-1 mb-3"
                  >
                    Watch Video <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {/* Brand Feedback */}
                {video.brand_feedback && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Brand Feedback</p>
                    <p className="text-sm text-foreground">
                      {video.brand_feedback}
                    </p>
                  </div>
                )}

                {/* Feedback input */}
                {feedbackTargetId === video.id && feedbackType === "video" && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Add your feedback..."
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          reviewVideo(
                            video.id,
                            "revision_requested",
                            feedbackText
                          )
                        }
                        disabled={
                          actionLoading === `review-video-${video.id}`
                        }
                        className="text-xs px-3 py-1.5 bg-yellow-900/30 text-yellow-300 rounded-lg hover:bg-yellow-900/50 disabled:opacity-50"
                      >
                        Submit Revision Request
                      </button>
                      <button
                        onClick={() => {
                          setFeedbackTargetId(null);
                          setFeedbackType(null);
                          setFeedbackText("");
                        }}
                        className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {/* Brand review actions on in_review / uploaded videos */}
                  {(video.status === "in_review" || video.status === "uploaded") && (
                    <>
                      <button
                        onClick={() => reviewVideo(video.id, "approved")}
                        disabled={
                          actionLoading === `review-video-${video.id}`
                        }
                        className="text-xs px-3 py-1.5 bg-green-900/30 text-green-300 rounded-lg hover:bg-green-900/50 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setFeedbackTargetId(video.id);
                          setFeedbackType("video");
                          setFeedbackText("");
                        }}
                        className="text-xs px-3 py-1.5 bg-yellow-900/30 text-yellow-300 rounded-lg hover:bg-yellow-900/50 flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" /> Request Revision
                      </button>
                    </>
                  )}

                  {/* Superadmin delete */}
                  {isSuperadmin && (
                    <button
                      onClick={() => deleteVideo(video.id)}
                      disabled={actionLoading === `delete-video-${video.id}`}
                      className="text-xs px-3 py-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-muted disabled:opacity-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSchedule = () => {
    // Group concepts by shoot_date
    const conceptsByDate = concepts.reduce<Record<string, UGCConcept[]>>(
      (acc, concept) => {
        const dateKey = concept.shoot_date || "unscheduled";
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(concept);
        return acc;
      },
      {}
    );

    const sortedDates = Object.keys(conceptsByDate).sort((a, b) => {
      if (a === "unscheduled") return 1;
      if (b === "unscheduled") return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">
          Production Schedule
        </h3>

        {sortedDates.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-muted-foreground">No concepts scheduled yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((dateKey) => {
              const dateConcepts = conceptsByDate[dateKey];
              const isUnscheduled = dateKey === "unscheduled";

              return (
                <div key={dateKey} className="relative">
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        isUnscheduled
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      {isUnscheduled
                        ? "Unscheduled"
                        : new Date(dateKey + "T00:00:00").toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dateConcepts.length} concept
                      {dateConcepts.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex-1 border-t border-border" />
                  </div>

                  {/* Concepts for this date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-4">
                    {dateConcepts.map((concept) => (
                      <div
                        key={concept.id}
                        className="bg-card border border-border rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs text-muted-foreground font-mono">
                              #{concept.concept_number}
                            </span>
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {concept.concept_name}
                            </h4>
                          </div>
                          <StatusBadge status={concept.status} />
                        </div>

                        {concept.model_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" /> {concept.model_name}
                          </p>
                        )}

                        {concept.shoot_location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />{" "}
                            {concept.shoot_location}
                          </p>
                        )}

                        {concept.product_group && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {concept.product_group}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // MAIN RENDER
  // =========================================================================

  return (
    <AuthGuard>
      <BrandUserInterface>
          <Page width="page">
           <div className="flex flex-col gap-ds-6">
            {/*
              The header. The way back is a quiet link above the title rather than an icon
              button wedged against the edge of the screen, so the title starts where every
              other page title starts and the row beside it holds only what you can do here.
            */}
            <div className="flex flex-col gap-ds-3">
              <button
                onClick={() => router.push("/campaigns")}
                className="inline-flex w-fit items-center gap-ds-2 text-ds-body-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                All campaigns
              </button>
              <div className="flex flex-col gap-ds-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-ds-3">
                  {campaign.brand_logo_url ? (
                    <img
                      src={campaign.brand_logo_url}
                      alt={campaign.brand_name}
                      className="w-11 h-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 shrink-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-semibold">
                      {campaign.brand_name
                        ? campaign.brand_name.substring(0, 2).toUpperCase()
                        : "UG"}
                    </div>
                  )}
                  <div className="min-w-0 space-y-ds-2">
                    <h1 className="text-ds-title text-balance">{campaign.name}</h1>
                    <p className="text-ds-body-sm text-muted-foreground">
                      {campaign.brand_name} &middot; UGC campaign
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-ds-2">
                  <StatusBadge status={campaign.status} />
                  <button
                    onClick={refreshAll}
                    className="p-2 rounded-ds-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Refresh data"
                    aria-label="Refresh data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-border">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === "overview" && renderOverview()}
              {activeTab === "models" && renderModels()}
              {activeTab === "concepts" && renderConcepts()}
              {activeTab === "videos" && renderVideos()}
              {activeTab === "schedule" && isSuperadmin && renderSchedule()}
            </div>
           </div>
          </Page>
      </BrandUserInterface>

      {/* ================================================================== */}
      {/* MODALS                                                             */}
      {/* ================================================================== */}

      {/* Add Models Modal (Superadmin) */}
      {showAddModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">
                Add Models from Pool
              </h3>
              <button
                onClick={() => {
                  setShowAddModelModal(false);
                  setSelectedModelIds([]);
                  setModelPoolResults([]);
                  setModelPoolSearch("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={modelPoolSearch}
                  onChange={(e) => setModelPoolSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchModelPool()}
                  placeholder="Search by name, email, ethnicity..."
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
              </div>
              <button
                onClick={searchModelPool}
                disabled={isSearchingModels}
                className="px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {isSearchingModels ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            </div>

            {/* Selected count */}
            {selectedModelIds.length > 0 && (
              <p className="text-sm text-blue-400 mb-3">
                {selectedModelIds.length} model
                {selectedModelIds.length !== 1 ? "s" : ""} selected
              </p>
            )}

            {/* Results */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {modelPoolResults.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  {isSearchingModels
                    ? "Searching..."
                    : "Search the model pool to find talent"}
                </p>
              ) : (
                modelPoolResults.map((model) => {
                  const isSelected = selectedModelIds.includes(model.id);
                  const isAlreadyAssigned = models.some(
                    (m) => m.id === model.id
                  );
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        if (isAlreadyAssigned) return;
                        setSelectedModelIds((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== model.id)
                            : [...prev, model.id]
                        );
                      }}
                      disabled={isAlreadyAssigned}
                      className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                        isAlreadyAssigned
                          ? "border-border bg-card/50 opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "border-blue-500/50 bg-blue-900/20"
                          : "border-border bg-card hover:border-foreground/25"
                      }`}
                    >
                      {/* Photo */}
                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                        {model.profile_photo_url ? (
                          <img
                            src={model.profile_photo_url}
                            alt={model.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {model.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[model.ethnicity, model.gender, model.age_range]
                            .filter(Boolean)
                            .join(" / ")}
                        </p>
                        {(model.specialties || []).length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {(model.specialties || []).slice(0, 3).map((s, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {isAlreadyAssigned ? (
                        <span className="text-xs text-muted-foreground">
                          Already assigned
                        </span>
                      ) : isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-foreground" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-border flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowAddModelModal(false);
                  setSelectedModelIds([]);
                  setModelPoolResults([]);
                  setModelPoolSearch("");
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignModels}
                disabled={
                  selectedModelIds.length === 0 ||
                  actionLoading === "assign-models"
                }
                className="px-5 py-2 bg-primary text-primary-foreground rounded-ds-control text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {actionLoading === "assign-models" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Assign {selectedModelIds.length > 0 ? `(${selectedModelIds.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Concept Modal (Superadmin) */}
      {showCreateConceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">New Concept</h3>
              <button
                onClick={() => setShowCreateConceptModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Concept Name */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Concept Name *
                </label>
                <input
                  type="text"
                  value={conceptForm.concept_name}
                  onChange={(e) =>
                    setConceptForm((f) => ({
                      ...f,
                      concept_name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Morning Routine - Product Unboxing"
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
              </div>

              {/* Two column layout */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                    Product Group
                  </label>
                  <input
                    type="text"
                    value={conceptForm.product_group}
                    onChange={(e) =>
                      setConceptForm((f) => ({
                        ...f,
                        product_group: e.target.value,
                      }))
                    }
                    placeholder="e.g., Skincare, Electronics"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                    Month
                  </label>
                  <input
                    type="text"
                    value={conceptForm.month}
                    onChange={(e) =>
                      setConceptForm((f) => ({
                        ...f,
                        month: e.target.value,
                      }))
                    }
                    placeholder="e.g., March 2026"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  />
                </div>
              </div>

              {/* Primary Hook */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Primary Hook
                </label>
                <input
                  type="text"
                  value={conceptForm.primary_hook}
                  onChange={(e) =>
                    setConceptForm((f) => ({
                      ...f,
                      primary_hook: e.target.value,
                    }))
                  }
                  placeholder="e.g., You won't believe what this product does..."
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
              </div>

              {/* Reference URL */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Reference URL
                </label>
                <input
                  type="url"
                  value={conceptForm.reference_url}
                  onChange={(e) =>
                    setConceptForm((f) => ({
                      ...f,
                      reference_url: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
              </div>

              {/* Location and Shoot Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                    Shoot Location
                  </label>
                  <input
                    type="text"
                    value={conceptForm.shoot_location}
                    onChange={(e) =>
                      setConceptForm((f) => ({
                        ...f,
                        shoot_location: e.target.value,
                      }))
                    }
                    placeholder="e.g., Studio A, Dubai"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                    Shoot Date
                  </label>
                  <input
                    type="date"
                    value={conceptForm.shoot_date}
                    onChange={(e) =>
                      setConceptForm((f) => ({
                        ...f,
                        shoot_date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-ring [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Shoot Type */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Shoot Type
                </label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {[
                    { value: "on_site", label: "On-Site" },
                    { value: "off_site", label: "Off-Site" },
                    { value: "studio", label: "Studio" },
                    { value: "outdoor", label: "Outdoor" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                        conceptForm.shoot_type === option.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-foreground/25"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shoot_type"
                        value={option.value}
                        checked={conceptForm.shoot_type === option.value}
                        onChange={(e) =>
                          setConceptForm((f) => ({
                            ...f,
                            shoot_type: e.target.value,
                          }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          conceptForm.shoot_type === option.value
                            ? "border-primary"
                            : "border-border"
                        }`}
                      >
                        {conceptForm.shoot_type === option.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Props Required */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Props Needed for Shoot
                </label>
                <textarea
                  value={conceptForm.props_required}
                  onChange={(e) =>
                    setConceptForm((f) => ({
                      ...f,
                      props_required: e.target.value,
                    }))
                  }
                  placeholder="List all props needed (e.g., product samples, signage, packaging...)"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
                />
              </div>

              {/* FOC Products - Repeatable Rows */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  FOC Products
                </label>
                <div className="space-y-2">
                  {focProductRows.map((row, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={row.product_name}
                        onChange={(e) => {
                          const updated = [...focProductRows];
                          updated[index] = {
                            ...updated[index],
                            product_name: e.target.value,
                          };
                          setFocProductRows(updated);
                        }}
                        placeholder="Product name"
                        className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                      />
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => {
                          const updated = [...focProductRows];
                          updated[index] = {
                            ...updated[index],
                            quantity: parseInt(e.target.value) || 1,
                          };
                          setFocProductRows(updated);
                        }}
                        min={1}
                        placeholder="Qty"
                        className="w-20 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                      />
                      <input
                        type="text"
                        value={row.link}
                        onChange={(e) => {
                          const updated = [...focProductRows];
                          updated[index] = {
                            ...updated[index],
                            link: e.target.value,
                          };
                          setFocProductRows(updated);
                        }}
                        placeholder="Product link (optional)"
                        className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                      />
                      {focProductRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFocProductRows(
                              focProductRows.filter((_, i) => i !== index)
                            );
                          }}
                          className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setFocProductRows([
                        ...focProductRows,
                        { product_name: "", quantity: 1, link: "" },
                      ])
                    }
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Row
                  </button>
                </div>
              </div>

              {/* Creative Direction */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Creative Direction
                </label>
                <textarea
                  value={conceptForm.creative_direction}
                  onChange={(e) =>
                    setConceptForm((f) => ({
                      ...f,
                      creative_direction: e.target.value,
                    }))
                  }
                  placeholder="Overall creative vision and direction..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
                />
              </div>

              {/* Scene Description */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Scene Description
                </label>
                <textarea
                  value={conceptForm.scene_description}
                  onChange={(e) =>
                    setConceptForm((f) => ({
                      ...f,
                      scene_description: e.target.value,
                    }))
                  }
                  placeholder="Describe the visual scene..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
                />
              </div>

              {/* Script */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Script
                </label>
                <textarea
                  value={conceptForm.script}
                  onChange={(e) =>
                    setConceptForm((f) => ({
                      ...f,
                      script: e.target.value,
                    }))
                  }
                  placeholder="Script or talking points..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
                />
              </div>

              {/* Captions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                    Caption (EN)
                  </label>
                  <textarea
                    value={conceptForm.caption_en}
                    onChange={(e) =>
                      setConceptForm((f) => ({
                        ...f,
                        caption_en: e.target.value,
                      }))
                    }
                    placeholder="English caption..."
                    rows={2}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                    Caption (AR)
                  </label>
                  <textarea
                    value={conceptForm.caption_ar}
                    onChange={(e) =>
                      setConceptForm((f) => ({
                        ...f,
                        caption_ar: e.target.value,
                      }))
                    }
                    placeholder="Arabic caption..."
                    rows={2}
                    dir="rtl"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
                  />
                </div>
              </div>

              {/* Assigned Model */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Assigned Model
                </label>
                <select
                  value={conceptForm.assigned_model_id}
                  onChange={(e) =>
                    setConceptForm((f) => ({
                      ...f,
                      assigned_model_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-ring [color-scheme:dark]"
                >
                  <option value="">No model assigned</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Initial Status
                </label>
                <select
                  value={conceptForm.status}
                  onChange={(e) =>
                    setConceptForm((f) => ({
                      ...f,
                      status: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-ring [color-scheme:dark]"
                >
                  <option value="draft">Draft</option>
                  <option value="proposed">Proposed</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setShowCreateConceptModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createConcept}
                disabled={actionLoading === "create-concept"}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-ds-control text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {actionLoading === "create-concept" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Create Concept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Video Modal (Superadmin) */}
      {showUploadVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">Add Video</h3>
              <button
                onClick={() => setShowUploadVideoModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Video Name */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Video Name
                </label>
                <input
                  type="text"
                  value={videoForm.video_name}
                  onChange={(e) =>
                    setVideoForm((f) => ({
                      ...f,
                      video_name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Final Edit v2 - Concept #5"
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Video URL
                </label>
                <input
                  type="url"
                  value={videoForm.video_url}
                  onChange={(e) =>
                    setVideoForm((f) => ({
                      ...f,
                      video_url: e.target.value,
                    }))
                  }
                  placeholder="https://drive.google.com/... or direct link"
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
              </div>

              {/* Linked Concept */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Linked Concept
                </label>
                <select
                  value={videoForm.concept_id}
                  onChange={(e) =>
                    setVideoForm((f) => ({
                      ...f,
                      concept_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-ring [color-scheme:dark]"
                >
                  <option value="">None (standalone)</option>
                  {concepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.concept_number} - {c.concept_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dimension and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                    Output Dimension
                  </label>
                  <input
                    type="text"
                    value={videoForm.dimension}
                    onChange={(e) =>
                      setVideoForm((f) => ({
                        ...f,
                        dimension: e.target.value,
                      }))
                    }
                    placeholder="e.g., 9:16, 1:1, 16:9"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={videoForm.duration_seconds}
                    onChange={(e) =>
                      setVideoForm((f) => ({
                        ...f,
                        duration_seconds: e.target.value,
                      }))
                    }
                    placeholder="e.g., 30"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  />
                </div>
              </div>

              {/* Budget Consumed */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Budget Consumed
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    AED
                  </span>
                  <input
                    type="number"
                    value={videoForm.budget_consumed}
                    onChange={(e) =>
                      setVideoForm((f) => ({
                        ...f,
                        budget_consumed: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-12 pr-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  />
                </div>
              </div>

              {/* Requested Dimensions */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Requested Dimensions
                </label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {[
                    { value: "9:16", label: "9:16 Vertical" },
                    { value: "16:9", label: "16:9 Horizontal" },
                    { value: "1:1", label: "1:1 Square" },
                  ].map((option) => {
                    const isChecked = videoForm.requested_dimensions.includes(
                      option.value
                    );
                    return (
                      <label
                        key={option.value}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                          isChecked
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-foreground/25"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setVideoForm((f) => ({
                              ...f,
                              requested_dimensions: isChecked
                                ? f.requested_dimensions.filter(
                                    (d) => d !== option.value
                                  )
                                : [...f.requested_dimensions, option.value],
                            }));
                          }}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            isChecked
                              ? "border-primary bg-primary"
                              : "border-border"
                          }`}
                        >
                          {isChecked && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setShowUploadVideoModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createVideo}
                disabled={actionLoading === "create-video"}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-ds-control text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {actionLoading === "create-video" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Add Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concept Detail Modal */}
      {showConceptDetailModal && selectedConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-xs text-muted-foreground font-mono">
                  Concept #{selectedConcept.concept_number}
                </span>
                <h3 className="text-lg font-bold text-foreground">
                  {selectedConcept.concept_name}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedConcept.status} />
                <button
                  onClick={() => {
                    setShowConceptDetailModal(false);
                    setSelectedConcept(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {selectedConcept.product_group && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Product Group</p>
                    <p className="text-sm text-foreground">
                      {selectedConcept.product_group}
                    </p>
                  </div>
                )}
                {selectedConcept.month && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Month</p>
                    <p className="text-sm text-foreground">{selectedConcept.month}</p>
                  </div>
                )}
                {selectedConcept.shoot_date && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Shoot Date</p>
                    <p className="text-sm text-foreground">
                      {formatDate(selectedConcept.shoot_date)}
                    </p>
                  </div>
                )}
                {selectedConcept.shoot_location && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                    <p className="text-sm text-foreground">
                      {selectedConcept.shoot_location}
                    </p>
                  </div>
                )}
                {selectedConcept.model_name && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Assigned Model</p>
                    <p className="text-sm text-foreground">
                      {selectedConcept.model_name}
                    </p>
                  </div>
                )}
                {selectedConcept.content_purpose && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Content Purpose</p>
                    <p className="text-sm text-foreground">
                      {selectedConcept.content_purpose}
                    </p>
                  </div>
                )}
              </div>

              {/* Reference */}
              {selectedConcept.reference_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reference</p>
                  <a
                    href={selectedConcept.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    {selectedConcept.reference_url}{" "}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Primary Hook */}
              {selectedConcept.primary_hook && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Primary Hook</p>
                  <p className="text-sm text-foreground italic bg-muted/50 rounded-lg p-3 border border-border">
                    &ldquo;{selectedConcept.primary_hook}&rdquo;
                  </p>
                </div>
              )}

              {/* Creative Direction */}
              {selectedConcept.creative_direction && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Creative Direction
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedConcept.creative_direction}
                  </p>
                </div>
              )}

              {/* Scene Description */}
              {selectedConcept.scene_description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scene Description</p>
                  <p className="text-sm text-foreground">
                    {selectedConcept.scene_description}
                  </p>
                </div>
              )}

              {/* On-Screen Text */}
              {selectedConcept.on_screen_text && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">On-Screen Text</p>
                  <p className="text-sm text-foreground">
                    {selectedConcept.on_screen_text}
                  </p>
                </div>
              )}

              {/* Script */}
              {selectedConcept.script && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Script</p>
                  <pre className="text-sm text-foreground bg-muted/50 rounded-lg p-3 border border-border whitespace-pre-wrap font-sans">
                    {selectedConcept.script}
                  </pre>
                </div>
              )}

              {/* Usability Notes */}
              {selectedConcept.usability_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Usability Notes</p>
                  <p className="text-sm text-foreground">
                    {selectedConcept.usability_notes}
                  </p>
                </div>
              )}

              {/* Captions */}
              {(selectedConcept.caption_en || selectedConcept.caption_ar) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedConcept.caption_en && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Caption (EN)</p>
                      <p className="text-sm text-foreground">
                        {selectedConcept.caption_en}
                      </p>
                    </div>
                  )}
                  {selectedConcept.caption_ar && (
                    <div dir="rtl">
                      <p className="text-xs text-muted-foreground mb-1">Caption (AR)</p>
                      <p className="text-sm text-foreground">
                        {selectedConcept.caption_ar}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Shoot Type */}
              {selectedConcept.shoot_type && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Shoot Type</p>
                  <span className="text-xs px-2.5 py-1 bg-muted rounded-full text-foreground font-medium">
                    {selectedConcept.shoot_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
              )}

              {/* Props Required */}
              {selectedConcept.props_required && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Props Required</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 border border-border whitespace-pre-wrap">
                    {selectedConcept.props_required}
                  </p>
                </div>
              )}

              {/* FOC Products */}
              {selectedConcept.foc_products &&
                selectedConcept.foc_products.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">FOC Products</p>
                    <div className="space-y-1.5">
                      {selectedConcept.foc_products.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border"
                        >
                          {typeof p === "string" ? (
                            <span>{p}</span>
                          ) : (
                            <>
                              <span className="flex-1 truncate">{(p as FOCProductRow).product_name}</span>
                              <span className="text-xs text-muted-foreground">x{(p as FOCProductRow).quantity}</span>
                              {(p as FOCProductRow).link && (
                                <a
                                  href={(p as FOCProductRow).link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline text-xs flex items-center gap-1"
                                >
                                  Link <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Brand Feedback */}
              {selectedConcept.brand_feedback && (
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Brand Feedback</p>
                  <p className="text-sm text-foreground">
                    {selectedConcept.brand_feedback}
                  </p>
                </div>
              )}
            </div>

            {/* Close */}
            <div className="flex justify-end mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowConceptDetailModal(false);
                  setSelectedConcept(null);
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
