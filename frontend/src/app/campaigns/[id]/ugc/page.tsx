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

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
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
  foc_products?: string[];
  month?: string;
  brand_feedback?: string;
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
  created_at?: string;
  updated_at?: string;
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
  const colors: Record<string, string> = {
    draft: "bg-zinc-700 text-zinc-300",
    proposed: "bg-blue-900/50 text-blue-300",
    approved: "bg-green-900/50 text-green-300",
    rejected: "bg-red-900/50 text-red-300",
    revision_requested: "bg-yellow-900/50 text-yellow-300",
    in_production: "bg-purple-900/50 text-purple-300",
    completed: "bg-emerald-900/50 text-emerald-300",
    pending: "bg-zinc-700 text-zinc-300",
    uploaded: "bg-blue-900/50 text-blue-300",
    in_review: "bg-yellow-900/50 text-yellow-300",
    final: "bg-emerald-900/50 text-emerald-300",
    selected: "bg-green-900/50 text-green-300",
    confirmed: "bg-emerald-900/50 text-emerald-300",
  };
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
        colors[status] || "bg-zinc-700 text-zinc-300"
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
  });

  // Video form state
  const [videoForm, setVideoForm] = useState({
    video_name: "",
    video_url: "",
    concept_id: "",
    dimension: "",
    duration_seconds: "",
  });

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
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, router]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/stats`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || data);
      }
    } catch (error) {
    }
  }, [campaignId]);

  const fetchModels = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ugc/models`
      );
      if (response.ok) {
        const data = await response.json();
        setModels(data.data || []);
      }
    } catch (error) {
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
        if (response.ok) {
          const data = await response.json();
          setConcepts(data.data || []);
        }
      } catch (error) {
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
        if (response.ok) {
          const data = await response.json();
          setVideos(data.data || []);
        }
      } catch (error) {
      }
    },
    [campaignId]
  );

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
  }, [campaign, fetchStats, fetchModels, fetchConcepts, fetchVideos]);

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
        });
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
        });
        fetchVideos(videoStatusFilter);
        fetchStats();
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
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-zinc-400">Loading campaign...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!campaign) {
    return (
      <AuthGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="container mx-auto py-8 px-4">
              <div className="text-center py-12">
                <p className="text-zinc-400">Campaign not found</p>
                <button
                  onClick={() => router.push("/campaigns")}
                  className="mt-4 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                >
                  Back to Campaigns
                </button>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    );
  }

  // =========================================================================
  // TAB CONTENT RENDERERS
  // =========================================================================

  const renderOverview = () => {
    if (!stats) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-32"
            />
          ))}
        </div>
      );
    }

    const pipelineStages = [
      { label: "Draft", count: stats.concepts.draft, color: "bg-zinc-600" },
      { label: "Proposed", count: stats.concepts.proposed, color: "bg-blue-500" },
      { label: "Approved", count: stats.concepts.approved, color: "bg-green-500" },
      { label: "In Production", count: stats.concepts.in_production, color: "bg-purple-500" },
      { label: "Completed", count: stats.concepts.completed, color: "bg-emerald-500" },
    ];
    const totalPipeline = pipelineStages.reduce((s, p) => s + p.count, 0);

    return (
      <div className="space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Concepts */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Concepts
              </span>
              <Lightbulb className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.concepts.total_concepts}
            </p>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Draft</span>
                <span className="text-zinc-400">{stats.concepts.draft}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Proposed</span>
                <span className="text-blue-400">{stats.concepts.proposed}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Approved</span>
                <span className="text-green-400">{stats.concepts.approved}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">In Production</span>
                <span className="text-purple-400">{stats.concepts.in_production}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Completed</span>
                <span className="text-emerald-400">{stats.concepts.completed}</span>
              </div>
            </div>
          </div>

          {/* Total Videos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Videos
              </span>
              <Video className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.videos.total_videos}
            </p>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Pending</span>
                <span className="text-zinc-400">{stats.videos.pending}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">In Review</span>
                <span className="text-yellow-400">{stats.videos.in_review}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Approved</span>
                <span className="text-green-400">{stats.videos.approved}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Final</span>
                <span className="text-emerald-400">{stats.videos.final}</span>
              </div>
            </div>
          </div>

          {/* Models */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Models
              </span>
              <Users className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.models.total_models}
            </p>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Proposed</span>
                <span className="text-blue-400">{stats.models.proposed}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Selected</span>
                <span className="text-green-400">{stats.models.selected}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Confirmed</span>
                <span className="text-emerald-400">{stats.models.confirmed}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Rejected</span>
                <span className="text-red-400">{stats.models.rejected}</span>
              </div>
            </div>
          </div>

          {/* Approval Rate */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Approval Rate
              </span>
              <ThumbsUp className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.approval_rate}%
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Based on approved + completed concepts
            </p>
          </div>

          {/* Avg Revisions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Avg Revisions
              </span>
              <RefreshCw className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.avg_revisions}
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Average revisions per video
            </p>
          </div>
        </div>

        {/* Production Pipeline */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">
            Production Pipeline
          </h3>

          {/* Pipeline bar */}
          <div className="relative h-3 rounded-full overflow-hidden bg-zinc-800 mb-6">
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
                    <span className="text-xs text-zinc-400">{stage.label}</span>
                  </div>
                  <p className="text-xl font-bold text-white">{stage.count}</p>
                </div>
                {index < pipelineStages.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-zinc-700 mx-4" />
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
          <h3 className="text-lg font-semibold text-white">
            Campaign Models{" "}
            <span className="text-zinc-500 text-sm font-normal">
              ({models.length})
            </span>
          </h3>
          {isSuperadmin && (
            <button
              onClick={() => {
                setShowAddModelModal(true);
                searchModelPool();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Models
            </button>
          )}
        </div>

        {/* Model Cards */}
        {models.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">No models assigned to this campaign yet</p>
            {isSuperadmin && (
              <p className="text-zinc-600 text-sm mt-1">
                Click "Add Models" to assign from the talent pool
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {models.map((model) => (
              <div
                key={model.assignment_id || model.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-4"
              >
                {/* Photo */}
                <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                  {model.profile_photo_url ? (
                    <img
                      src={model.profile_photo_url}
                      alt={model.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">
                    {model.full_name}
                  </h4>
                  {model.ethnicity && (
                    <p className="text-sm text-zinc-400">{model.ethnicity}</p>
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
                        className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {model.brand_feedback && (
                    <div className="mt-2 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <p className="text-xs text-zinc-500 mb-0.5">Feedback</p>
                      <p className="text-xs text-zinc-300">{model.brand_feedback}</p>
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
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
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
          <h3 className="text-lg font-semibold text-white">
            Concepts{" "}
            <span className="text-zinc-500 text-sm font-normal">
              ({concepts.length})
            </span>
          </h3>
          {isSuperadmin && (
            <button
              onClick={() => setShowCreateConceptModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
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
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
        {concepts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Lightbulb className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">
              {conceptStatusFilter !== "all"
                ? `No concepts with status "${conceptStatusFilter.replace(/_/g, " ")}"`
                : "No concepts created yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {concepts.map((concept) => (
              <div
                key={concept.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-3">
                    <span className="text-xs text-zinc-500 font-mono">
                      #{concept.concept_number}
                    </span>
                    <h4 className="font-semibold text-white truncate">
                      {concept.concept_name}
                    </h4>
                    {concept.product_group && (
                      <p className="text-sm text-zinc-400 mt-0.5">
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
                  <p className="text-sm text-zinc-300 mt-2 italic leading-relaxed">
                    &ldquo;{concept.primary_hook}&rdquo;
                  </p>
                )}

                {/* Model */}
                {concept.model_name && (
                  <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                    <User className="w-3 h-3" /> Model: {concept.model_name}
                  </p>
                )}

                {/* Shoot date */}
                {concept.shoot_date && (
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Shoot:{" "}
                    {formatDate(concept.shoot_date)}
                  </p>
                )}

                {/* Brand Feedback */}
                {concept.brand_feedback && (
                  <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <p className="text-xs text-zinc-500 mb-1">Brand Feedback</p>
                    <p className="text-sm text-zinc-300">
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
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
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
                        className="text-xs px-3 py-1.5 text-zinc-400 hover:text-white"
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
                    className="text-xs px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-1"
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
                      className="text-xs px-3 py-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1"
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Videos{" "}
            <span className="text-zinc-500 text-sm font-normal">
              ({videos.length})
            </span>
          </h3>
          {isSuperadmin && (
            <button
              onClick={() => setShowUploadVideoModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
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
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
        {videos.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Film className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">
              {videoStatusFilter !== "all"
                ? `No videos with status "${videoStatusFilter.replace(/_/g, " ")}"`
                : "No videos uploaded yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <h4 className="font-semibold text-white truncate">
                        {video.video_name || "Untitled Video"}
                      </h4>
                    </div>
                    {video.concept_name && (
                      <p className="text-sm text-zinc-400 mt-0.5 ml-6">
                        Concept #{video.concept_number}: {video.concept_name}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={video.status} />
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mb-3">
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
                </div>

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
                  <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <p className="text-xs text-zinc-500 mb-1">Brand Feedback</p>
                    <p className="text-sm text-zinc-300">
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
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
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
                        className="text-xs px-3 py-1.5 text-zinc-400 hover:text-white"
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
                      className="text-xs px-3 py-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1"
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
        <h3 className="text-lg font-semibold text-white">
          Production Schedule
        </h3>

        {sortedDates.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">No concepts scheduled yet</p>
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
                          ? "bg-zinc-800 text-zinc-400"
                          : "bg-zinc-800 text-white"
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
                    <span className="text-xs text-zinc-500">
                      {dateConcepts.length} concept
                      {dateConcepts.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex-1 border-t border-zinc-800" />
                  </div>

                  {/* Concepts for this date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-4">
                    {dateConcepts.map((concept) => (
                      <div
                        key={concept.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs text-zinc-500 font-mono">
                              #{concept.concept_number}
                            </span>
                            <h4 className="text-sm font-semibold text-white truncate">
                              {concept.concept_name}
                            </h4>
                          </div>
                          <StatusBadge status={concept.status} />
                        </div>

                        {concept.model_name && (
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" /> {concept.model_name}
                          </p>
                        )}

                        {concept.shoot_location && (
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />{" "}
                            {concept.shoot_location}
                          </p>
                        )}

                        {concept.product_group && (
                          <p className="text-xs text-zinc-500 mt-1">
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
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="container mx-auto py-8 px-4 space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/campaigns")}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {campaign.brand_logo_url ? (
                    <img
                      src={campaign.brand_logo_url}
                      alt={campaign.brand_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm font-bold">
                      {campaign.brand_name
                        ? campaign.brand_name.substring(0, 2).toUpperCase()
                        : "UG"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-white truncate">
                      {campaign.name}
                    </h1>
                    <p className="text-sm text-zinc-400">
                      {campaign.brand_name} &middot; UGC Campaign
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={campaign.status} />
                <button
                  onClick={refreshAll}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-zinc-800">
              <div className="flex gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-white text-white"
                          : "border-transparent text-zinc-500 hover:text-zinc-300"
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
        </SidebarInset>
      </SidebarProvider>

      {/* ================================================================== */}
      {/* MODALS                                                             */}
      {/* ================================================================== */}

      {/* Add Models Modal (Superadmin) */}
      {showAddModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                Add Models from Pool
              </h3>
              <button
                onClick={() => {
                  setShowAddModelModal(false);
                  setSelectedModelIds([]);
                  setModelPoolResults([]);
                  setModelPoolSearch("");
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={modelPoolSearch}
                  onChange={(e) => setModelPoolSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchModelPool()}
                  placeholder="Search by name, email, ethnicity..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <button
                onClick={searchModelPool}
                disabled={isSearchingModels}
                className="px-4 py-2.5 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors"
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
                <p className="text-zinc-500 text-sm text-center py-8">
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
                          ? "border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "border-blue-500/50 bg-blue-900/20"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      {/* Photo */}
                      <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                        {model.profile_photo_url ? (
                          <img
                            src={model.profile_photo_url}
                            alt={model.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {model.full_name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {[model.ethnicity, model.gender, model.age_range]
                            .filter(Boolean)
                            .join(" / ")}
                        </p>
                        {(model.specialties || []).length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {(model.specialties || []).slice(0, 3).map((s, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {isAlreadyAssigned ? (
                        <span className="text-xs text-zinc-600">
                          Already assigned
                        </span>
                      ) : isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-zinc-700 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  setShowAddModelModal(false);
                  setSelectedModelIds([]);
                  setModelPoolResults([]);
                  setModelPoolSearch("");
                }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignModels}
                disabled={
                  selectedModelIds.length === 0 ||
                  actionLoading === "assign-models"
                }
                className="px-5 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">New Concept</h3>
              <button
                onClick={() => setShowCreateConceptModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Concept Name */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Two column layout */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Primary Hook */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Reference URL */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Location and Shoot Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Creative Direction */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              {/* Scene Description */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              {/* Script */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              {/* Captions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                  />
                </div>
              </div>

              {/* Assigned Model */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
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
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
                >
                  <option value="draft">Draft</option>
                  <option value="proposed">Proposed</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
              <button
                onClick={() => setShowCreateConceptModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createConcept}
                disabled={actionLoading === "create-concept"}
                className="px-5 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Add Video</h3>
              <button
                onClick={() => setShowUploadVideoModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Video Name */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Linked Concept */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
                >
                  <option value="">None (standalone)</option>
                  {concepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.concept_number} - {c.concept_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dimensions and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                    Dimensions
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
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
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
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
              <button
                onClick={() => setShowUploadVideoModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createVideo}
                disabled={actionLoading === "create-video"}
                className="px-5 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-xs text-zinc-500 font-mono">
                  Concept #{selectedConcept.concept_number}
                </span>
                <h3 className="text-lg font-bold text-white">
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
                  className="text-zinc-400 hover:text-white"
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
                    <p className="text-xs text-zinc-500 mb-0.5">Product Group</p>
                    <p className="text-sm text-white">
                      {selectedConcept.product_group}
                    </p>
                  </div>
                )}
                {selectedConcept.month && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Month</p>
                    <p className="text-sm text-white">{selectedConcept.month}</p>
                  </div>
                )}
                {selectedConcept.shoot_date && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Shoot Date</p>
                    <p className="text-sm text-white">
                      {formatDate(selectedConcept.shoot_date)}
                    </p>
                  </div>
                )}
                {selectedConcept.shoot_location && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Location</p>
                    <p className="text-sm text-white">
                      {selectedConcept.shoot_location}
                    </p>
                  </div>
                )}
                {selectedConcept.model_name && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Assigned Model</p>
                    <p className="text-sm text-white">
                      {selectedConcept.model_name}
                    </p>
                  </div>
                )}
                {selectedConcept.content_purpose && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Content Purpose</p>
                    <p className="text-sm text-white">
                      {selectedConcept.content_purpose}
                    </p>
                  </div>
                )}
              </div>

              {/* Reference */}
              {selectedConcept.reference_url && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Reference</p>
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
                  <p className="text-xs text-zinc-500 mb-1">Primary Hook</p>
                  <p className="text-sm text-zinc-200 italic bg-zinc-800/50 rounded-lg p-3 border border-zinc-800">
                    &ldquo;{selectedConcept.primary_hook}&rdquo;
                  </p>
                </div>
              )}

              {/* Creative Direction */}
              {selectedConcept.creative_direction && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">
                    Creative Direction
                  </p>
                  <p className="text-sm text-zinc-300">
                    {selectedConcept.creative_direction}
                  </p>
                </div>
              )}

              {/* Scene Description */}
              {selectedConcept.scene_description && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Scene Description</p>
                  <p className="text-sm text-zinc-300">
                    {selectedConcept.scene_description}
                  </p>
                </div>
              )}

              {/* On-Screen Text */}
              {selectedConcept.on_screen_text && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">On-Screen Text</p>
                  <p className="text-sm text-zinc-300">
                    {selectedConcept.on_screen_text}
                  </p>
                </div>
              )}

              {/* Script */}
              {selectedConcept.script && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Script</p>
                  <pre className="text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3 border border-zinc-800 whitespace-pre-wrap font-sans">
                    {selectedConcept.script}
                  </pre>
                </div>
              )}

              {/* Usability Notes */}
              {selectedConcept.usability_notes && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Usability Notes</p>
                  <p className="text-sm text-zinc-300">
                    {selectedConcept.usability_notes}
                  </p>
                </div>
              )}

              {/* Captions */}
              {(selectedConcept.caption_en || selectedConcept.caption_ar) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedConcept.caption_en && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Caption (EN)</p>
                      <p className="text-sm text-zinc-300">
                        {selectedConcept.caption_en}
                      </p>
                    </div>
                  )}
                  {selectedConcept.caption_ar && (
                    <div dir="rtl">
                      <p className="text-xs text-zinc-500 mb-1">Caption (AR)</p>
                      <p className="text-sm text-zinc-300">
                        {selectedConcept.caption_ar}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* FOC Products */}
              {selectedConcept.foc_products &&
                selectedConcept.foc_products.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">FOC Products</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedConcept.foc_products.map((p, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-zinc-800 rounded-full text-zinc-300"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Brand Feedback */}
              {selectedConcept.brand_feedback && (
                <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <p className="text-xs text-zinc-500 mb-1">Brand Feedback</p>
                  <p className="text-sm text-zinc-300">
                    {selectedConcept.brand_feedback}
                  </p>
                </div>
              )}
            </div>

            {/* Close */}
            <div className="flex justify-end mt-6 pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  setShowConceptDetailModal(false);
                  setSelectedConcept(null);
                }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
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
