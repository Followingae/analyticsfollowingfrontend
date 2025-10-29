"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  Download,
  Settings,
  Users,
  FileText,
  Camera,
  BarChart3,
  Target,
  Sparkles,
  TrendingUp,
  Eye,
  Calendar,
  DollarSign,
  Zap,
  Shield,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from "@/components/AuthGuard";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Import the new components we'll create
import { ModernWorkflowTimeline } from "@/components/campaigns/modern/ModernWorkflowTimeline";
import { CampaignStageDetail } from "@/components/campaigns/modern/CampaignStageDetail";
import { CampaignQuickStats } from "@/components/campaigns/modern/CampaignQuickStats";

interface CampaignStage {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "completed" | "active" | "pending" | "blocked";
  progress: number;
  startDate?: string;
  endDate?: string;
  estimatedDuration: string;
  tasks?: {
    completed: number;
    total: number;
    items: Array<{
      id: string;
      title: string;
      completed: boolean;
      priority?: "high" | "medium" | "low";
    }>;
  };
  metrics?: {
    label: string;
    value: string | number;
    trend?: "up" | "down" | "stable";
  }[];
}

export default function ModernCampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user, isLoading: authLoading } = useEnhancedAuth();

  const [campaign, setCampaign] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState<CampaignStage | null>(null);
  const [stages, setStages] = useState<CampaignStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string>("influencer_selection");

  useEffect(() => {
    if (!authLoading && user && campaignId) {
      fetchCampaignData();
    }
  }, [user, authLoading, campaignId]);

  const fetchCampaignData = async () => {
    try {
      setIsLoading(true);

      // Different campaign scenarios based on ID for comprehensive testing
      let mockCampaign: any;
      let mockStages: CampaignStage[];

      if (campaignId === "1") {
        // Scenario 1: Active campaign at Influencer Selection stage
        mockCampaign = {
          id: campaignId,
          name: "Summer Collection Launch 2024",
          brand_name: "Fashion Forward",
          brand_logo_url: "https://picsum.photos/100/100?random=" + campaignId,
          status: "active",
          budget: 25000,
          start_date: "2024-10-20",
          end_date: "2024-11-20",
          campaign_type: "Product Launch",
          objective: "Brand Awareness & Sales",
        };
        mockStages = getInfluencerSelectionScenario();
        setSelectedStageId("influencer_selection");
      } else if (campaignId === "2") {
        // Scenario 2: Content Creation stage
        mockCampaign = {
          id: campaignId,
          name: "Holiday Season Campaign",
          brand_name: "TechNova",
          brand_logo_url: "https://picsum.photos/100/100?random=" + campaignId,
          status: "active",
          budget: 35000,
          start_date: "2024-10-15",
          end_date: "2024-12-31",
          campaign_type: "Seasonal Campaign",
          objective: "Drive Holiday Sales",
        };
        mockStages = getContentCreationScenario();
        setSelectedStageId("content_creation");
      } else if (campaignId === "3") {
        // Scenario 3: Campaign Live stage
        mockCampaign = {
          id: campaignId,
          name: "Brand Awareness Q4",
          brand_name: "Lifestyle Co",
          brand_logo_url: "https://picsum.photos/100/100?random=" + campaignId,
          status: "active",
          budget: 45000,
          start_date: "2024-09-01",
          end_date: "2024-11-30",
          campaign_type: "Brand Awareness",
          objective: "Increase Market Share",
        };
        mockStages = getCampaignLiveScenario();
        setSelectedStageId("campaign_live");
      } else if (campaignId === "4") {
        // Scenario 4: Reporting stage (completed campaign)
        mockCampaign = {
          id: campaignId,
          name: "Back to School 2024",
          brand_name: "EduTech Pro",
          brand_logo_url: "https://picsum.photos/100/100?random=" + campaignId,
          status: "completed",
          budget: 20000,
          start_date: "2024-08-01",
          end_date: "2024-09-30",
          campaign_type: "Product Launch",
          objective: "Student Acquisition",
        };
        mockStages = getReportingScenario();
        setSelectedStageId("reporting");
      } else {
        // Default scenario: New campaign at proposal stage
        mockCampaign = {
          id: campaignId,
          name: "New Campaign Proposal",
          brand_name: "Your Brand",
          brand_logo_url: "https://picsum.photos/100/100?random=" + campaignId,
          status: "draft",
          budget: 15000,
          start_date: "2024-11-01",
          end_date: "2024-12-01",
          campaign_type: "Custom Campaign",
          objective: "To Be Defined",
        };
        mockStages = getProposalScenario();
        setSelectedStageId("proposal");
      }

      setCampaign(mockCampaign);
      setStages(mockStages);
      setCurrentStage(mockStages.find(s => s.status === "active") || mockStages[0]);

      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign data");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function for Influencer Selection scenario
  const getInfluencerSelectionScenario = (): CampaignStage[] => [
    {
      id: "proposal",
      title: "Campaign Proposal",
      description: "Define objectives, budget, and timeline",
          icon: FileText,
          status: "completed",
          progress: 100,
          startDate: "2024-10-15",
          endDate: "2024-10-17",
          estimatedDuration: "2-3 days",
          tasks: {
            completed: 5,
            total: 5,
            items: [
              { id: "1", title: "Define campaign objectives", completed: true },
              { id: "2", title: "Set budget allocation", completed: true },
              { id: "3", title: "Create campaign brief", completed: true },
              { id: "4", title: "Get brand approval", completed: true },
              { id: "5", title: "Finalize timeline", completed: true },
            ],
          },
          metrics: [
            { label: "Budget Approved", value: "$25,000" },
            { label: "Timeline", value: "30 days" },
            { label: "ROI Target", value: "300%", trend: "up" },
          ],
        },
        {
          id: "influencer_selection",
          title: "Influencer Selection",
          description: "Find and onboard perfect brand ambassadors",
          icon: Users,
          status: "active",
          progress: 65,
          startDate: "2024-10-18",
          estimatedDuration: "5-7 days",
          tasks: {
            completed: 8,
            total: 12,
            items: [
              { id: "1", title: "Define influencer criteria", completed: true },
              { id: "2", title: "Research potential influencers", completed: true },
              { id: "3", title: "Analyze audience demographics", completed: true },
              { id: "4", title: "Review engagement rates", completed: true },
              { id: "5", title: "Send outreach messages", completed: true },
              { id: "6", title: "Negotiate rates", completed: true },
              { id: "7", title: "Review portfolios", completed: true },
              { id: "8", title: "Sign contracts", completed: true },
              { id: "9", title: "Onboard influencers", completed: false, priority: "high" },
              { id: "10", title: "Share brand guidelines", completed: false, priority: "high" },
              { id: "11", title: "Set content deadlines", completed: false },
              { id: "12", title: "Create communication channels", completed: false },
            ],
          },
          metrics: [
            { label: "Influencers Selected", value: "8/10", trend: "up" },
            { label: "Avg. Engagement", value: "4.2%" },
            { label: "Total Reach", value: "2.5M" },
            { label: "Response Rate", value: "68%", trend: "up" },
          ],
        },
        {
          id: "content_creation",
          title: "Content Creation",
          description: "Develop compelling campaign content",
          icon: Camera,
          status: "pending",
          progress: 0,
          estimatedDuration: "7-10 days",
          tasks: {
            completed: 0,
            total: 8,
            items: [
              { id: "1", title: "Create content calendar", completed: false, priority: "high" },
              { id: "2", title: "Develop content themes", completed: false },
              { id: "3", title: "Shoot product photos", completed: false },
              { id: "4", title: "Create video content", completed: false },
              { id: "5", title: "Write captions", completed: false },
              { id: "6", title: "Design graphics", completed: false },
              { id: "7", title: "Review and edit content", completed: false },
              { id: "8", title: "Get brand approval", completed: false, priority: "high" },
            ],
          },
        },
        {
          id: "content_approval",
          title: "Content Approval",
          description: "Review and approve all campaign content",
          icon: CheckCircle2,
          status: "pending",
          progress: 0,
          estimatedDuration: "2-3 days",
          tasks: {
            completed: 0,
            total: 4,
            items: [
              { id: "1", title: "Review content quality", completed: false },
              { id: "2", title: "Check brand compliance", completed: false },
              { id: "3", title: "Approve final edits", completed: false },
              { id: "4", title: "Schedule posts", completed: false },
            ],
          },
        },
        {
          id: "campaign_live",
          title: "Campaign Live",
          description: "Monitor and optimize live campaign",
          icon: Activity,
          status: "pending",
          progress: 0,
          estimatedDuration: "14 days",
        },
        {
          id: "reporting",
          title: "Reporting & Analysis",
          description: "Analyze performance and generate insights",
          icon: BarChart3,
          status: "pending",
          progress: 0,
          estimatedDuration: "3-5 days",
        },
      ];

  const getContentCreationScenario = (): CampaignStage[] => [
    {
      id: "proposal",
      title: "Campaign Proposal",
      description: "Define objectives, budget, and timeline",
      icon: FileText,
      status: "completed",
      progress: 100,
      startDate: "2024-10-10",
      endDate: "2024-10-12",
      estimatedDuration: "2-3 days",
      tasks: {
        completed: 5,
        total: 5,
        items: [
          { id: "1", title: "Define campaign objectives", completed: true },
          { id: "2", title: "Set budget allocation", completed: true },
          { id: "3", title: "Create campaign brief", completed: true },
          { id: "4", title: "Get brand approval", completed: true },
          { id: "5", title: "Finalize timeline", completed: true },
        ],
      },
      metrics: [
        { label: "Budget Approved", value: "$35,000" },
        { label: "Timeline", value: "45 days" },
        { label: "ROI Target", value: "400%", trend: "up" },
      ],
    },
    {
      id: "influencer_selection",
      title: "Influencer Selection",
      description: "Find and onboard perfect brand ambassadors",
      icon: Users,
      status: "completed",
      progress: 100,
      startDate: "2024-10-13",
      endDate: "2024-10-18",
      estimatedDuration: "5-7 days",
      tasks: {
        completed: 12,
        total: 12,
        items: Array.from({ length: 12 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: true,
        })),
      },
      metrics: [
        { label: "Influencers Selected", value: "12/12", trend: "up" },
        { label: "Avg. Engagement", value: "5.1%" },
        { label: "Total Reach", value: "3.8M" },
        { label: "Response Rate", value: "78%", trend: "up" },
      ],
    },
    {
      id: "content_creation",
      title: "Content Creation",
      description: "Develop compelling campaign content",
      icon: Camera,
      status: "active",
      progress: 45,
      startDate: "2024-10-19",
      estimatedDuration: "7-10 days",
      tasks: {
        completed: 4,
        total: 8,
        items: [
          { id: "1", title: "Create content calendar", completed: true },
          { id: "2", title: "Develop content themes", completed: true },
          { id: "3", title: "Shoot product photos", completed: true },
          { id: "4", title: "Create video content", completed: true },
          { id: "5", title: "Write captions", completed: false, priority: "high" },
          { id: "6", title: "Design graphics", completed: false, priority: "medium" },
          { id: "7", title: "Review and edit content", completed: false },
          { id: "8", title: "Get brand approval", completed: false, priority: "high" },
        ],
      },
      metrics: [
        { label: "Content Pieces", value: "18/40", trend: "up" },
        { label: "Approved", value: "12" },
        { label: "In Review", value: "6" },
        { label: "Quality Score", value: "A+" },
      ],
    },
    {
      id: "content_approval",
      title: "Content Approval",
      description: "Review and approve all campaign content",
      icon: CheckCircle2,
      status: "pending",
      progress: 0,
      estimatedDuration: "2-3 days",
      tasks: {
        completed: 0,
        total: 4,
        items: [
          { id: "1", title: "Review content quality", completed: false },
          { id: "2", title: "Check brand compliance", completed: false },
          { id: "3", title: "Approve final edits", completed: false },
          { id: "4", title: "Schedule posts", completed: false },
        ],
      },
    },
    {
      id: "campaign_live",
      title: "Campaign Live",
      description: "Monitor and optimize live campaign",
      icon: Activity,
      status: "pending",
      progress: 0,
      estimatedDuration: "14 days",
    },
    {
      id: "reporting",
      title: "Reporting & Analysis",
      description: "Analyze performance and generate insights",
      icon: BarChart3,
      status: "pending",
      progress: 0,
      estimatedDuration: "3-5 days",
    },
  ];

  // Campaign Live Scenario
  const getCampaignLiveScenario = (): CampaignStage[] => [
    {
      id: "proposal",
      title: "Campaign Proposal",
      description: "Define objectives, budget, and timeline",
      icon: FileText,
      status: "completed",
      progress: 100,
      startDate: "2024-08-25",
      endDate: "2024-08-27",
      estimatedDuration: "2-3 days",
      tasks: {
        completed: 5,
        total: 5,
        items: Array.from({ length: 5 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: true,
        })),
      },
    },
    {
      id: "influencer_selection",
      title: "Influencer Selection",
      description: "Find and onboard perfect brand ambassadors",
      icon: Users,
      status: "completed",
      progress: 100,
      startDate: "2024-08-28",
      endDate: "2024-09-02",
      estimatedDuration: "5-7 days",
      tasks: {
        completed: 12,
        total: 12,
        items: Array.from({ length: 12 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: true,
        })),
      },
    },
    {
      id: "content_creation",
      title: "Content Creation",
      description: "Develop compelling campaign content",
      icon: Camera,
      status: "completed",
      progress: 100,
      startDate: "2024-09-03",
      endDate: "2024-09-12",
      estimatedDuration: "7-10 days",
      tasks: {
        completed: 8,
        total: 8,
        items: Array.from({ length: 8 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: true,
        })),
      },
    },
    {
      id: "content_approval",
      title: "Content Approval",
      description: "Review and approve all campaign content",
      icon: CheckCircle2,
      status: "completed",
      progress: 100,
      startDate: "2024-09-13",
      endDate: "2024-09-15",
      estimatedDuration: "2-3 days",
      tasks: {
        completed: 4,
        total: 4,
        items: Array.from({ length: 4 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: true,
        })),
      },
    },
    {
      id: "campaign_live",
      title: "Campaign Live",
      description: "Monitor and optimize live campaign",
      icon: Activity,
      status: "active",
      progress: 75,
      startDate: "2024-09-16",
      estimatedDuration: "14 days",
      tasks: {
        completed: 9,
        total: 12,
        items: [
          { id: "1", title: "Launch campaign posts", completed: true },
          { id: "2", title: "Monitor initial engagement", completed: true },
          { id: "3", title: "Track performance metrics", completed: true },
          { id: "4", title: "Engage with audience", completed: true },
          { id: "5", title: "Optimize posting schedule", completed: true },
          { id: "6", title: "Monitor influencer compliance", completed: true },
          { id: "7", title: "Mid-campaign review", completed: true },
          { id: "8", title: "Adjust strategy if needed", completed: true },
          { id: "9", title: "Boost top-performing content", completed: true },
          { id: "10", title: "Final week optimization", completed: false, priority: "high" },
          { id: "11", title: "Prepare wrap-up materials", completed: false },
          { id: "12", title: "Schedule final posts", completed: false },
        ],
      },
      metrics: [
        { label: "Live Posts", value: "42/50", trend: "up" },
        { label: "Current Reach", value: "3.2M" },
        { label: "Engagement Rate", value: "5.8%", trend: "up" },
        { label: "Conversions", value: "1,850", trend: "up" },
      ],
    },
    {
      id: "reporting",
      title: "Reporting & Analysis",
      description: "Analyze performance and generate insights",
      icon: BarChart3,
      status: "pending",
      progress: 0,
      estimatedDuration: "3-5 days",
    },
  ];

  // Reporting Scenario (Completed Campaign)
  const getReportingScenario = (): CampaignStage[] => [
    {
      id: "proposal",
      title: "Campaign Proposal",
      description: "Define objectives, budget, and timeline",
      icon: FileText,
      status: "completed",
      progress: 100,
      startDate: "2024-07-25",
      endDate: "2024-07-27",
      estimatedDuration: "2-3 days",
      tasks: {
        completed: 5,
        total: 5,
        items: Array.from({ length: 5 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: true,
        })),
      },
    },
    {
      id: "influencer_selection",
      title: "Influencer Selection",
      description: "Find and onboard perfect brand ambassadors",
      icon: Users,
      status: "completed",
      progress: 100,
      startDate: "2024-07-28",
      endDate: "2024-08-02",
      estimatedDuration: "5-7 days",
      tasks: {
        completed: 12,
        total: 12,
        items: Array.from({ length: 12 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: true,
        })),
      },
    },
    {
      id: "content_creation",
      title: "Content Creation",
      description: "Develop compelling campaign content",
      icon: Camera,
      status: "completed",
      progress: 100,
      startDate: "2024-08-03",
      endDate: "2024-08-12",
      estimatedDuration: "7-10 days",
      tasks: {
        completed: 8,
        total: 8,
        items: Array.from({ length: 8 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: true,
        })),
      },
    },
    {
      id: "content_approval",
      title: "Content Approval",
      description: "Review and approve all campaign content",
      icon: CheckCircle2,
      status: "completed",
      progress: 100,
      startDate: "2024-08-13",
      endDate: "2024-08-15",
      estimatedDuration: "2-3 days",
      tasks: {
        completed: 4,
        total: 4,
        items: Array.from({ length: 4 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: true,
        })),
      },
    },
    {
      id: "campaign_live",
      title: "Campaign Live",
      description: "Monitor and optimize live campaign",
      icon: Activity,
      status: "completed",
      progress: 100,
      startDate: "2024-08-16",
      endDate: "2024-09-15",
      estimatedDuration: "14 days",
      tasks: {
        completed: 12,
        total: 12,
        items: Array.from({ length: 12 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: true,
        })),
      },
    },
    {
      id: "reporting",
      title: "Reporting & Analysis",
      description: "Analyze performance and generate insights",
      icon: BarChart3,
      status: "active",
      progress: 85,
      startDate: "2024-09-16",
      estimatedDuration: "3-5 days",
      tasks: {
        completed: 7,
        total: 8,
        items: [
          { id: "1", title: "Collect all campaign data", completed: true },
          { id: "2", title: "Analyze performance metrics", completed: true },
          { id: "3", title: "Generate ROI report", completed: true },
          { id: "4", title: "Create audience insights", completed: true },
          { id: "5", title: "Compile influencer performance", completed: true },
          { id: "6", title: "Create executive summary", completed: true },
          { id: "7", title: "Design presentation deck", completed: true },
          { id: "8", title: "Schedule stakeholder meeting", completed: false, priority: "high" },
        ],
      },
      metrics: [
        { label: "Total Reach", value: "4.8M", trend: "up" },
        { label: "Engagement Rate", value: "6.2%", trend: "up" },
        { label: "ROI", value: "385%", trend: "up" },
        { label: "Conversions", value: "3,250", trend: "up" },
      ],
    },
  ];

  // Proposal Scenario (New Campaign)
  const getProposalScenario = (): CampaignStage[] => [
    {
      id: "proposal",
      title: "Campaign Proposal",
      description: "Define objectives, budget, and timeline",
      icon: FileText,
      status: "active",
      progress: 35,
      startDate: "2024-10-28",
      estimatedDuration: "2-3 days",
      tasks: {
        completed: 2,
        total: 5,
        items: [
          { id: "1", title: "Define campaign objectives", completed: true },
          { id: "2", title: "Set budget allocation", completed: true },
          { id: "3", title: "Create campaign brief", completed: false, priority: "high" },
          { id: "4", title: "Get brand approval", completed: false, priority: "high" },
          { id: "5", title: "Finalize timeline", completed: false },
        ],
      },
      metrics: [
        { label: "Budget Range", value: "$10-20K" },
        { label: "Timeline", value: "TBD" },
        { label: "ROI Target", value: "TBD" },
      ],
    },
    {
      id: "influencer_selection",
      title: "Influencer Selection",
      description: "Find and onboard perfect brand ambassadors",
      icon: Users,
      status: "pending",
      progress: 0,
      estimatedDuration: "5-7 days",
      tasks: {
        completed: 0,
        total: 12,
        items: Array.from({ length: 12 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: false,
        })),
      },
    },
    {
      id: "content_creation",
      title: "Content Creation",
      description: "Develop compelling campaign content",
      icon: Camera,
      status: "pending",
      progress: 0,
      estimatedDuration: "7-10 days",
      tasks: {
        completed: 0,
        total: 8,
        items: Array.from({ length: 8 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: false,
        })),
      },
    },
    {
      id: "content_approval",
      title: "Content Approval",
      description: "Review and approve all campaign content",
      icon: CheckCircle2,
      status: "pending",
      progress: 0,
      estimatedDuration: "2-3 days",
      tasks: {
        completed: 0,
        total: 4,
        items: Array.from({ length: 4 }, (_, i) => ({
          id: String(i + 1),
          title: `Task ${i + 1}`,
          completed: false,
        })),
      },
    },
    {
      id: "campaign_live",
      title: "Campaign Live",
      description: "Monitor and optimize live campaign",
      icon: Activity,
      status: "pending",
      progress: 0,
      estimatedDuration: "14 days",
    },
    {
      id: "reporting",
      title: "Reporting & Analysis",
      description: "Analyze performance and generate insights",
      icon: BarChart3,
      status: "pending",
      progress: 0,
      estimatedDuration: "3-5 days",
    },
  ];

  const getOverallProgress = () => {
    const completedStages = stages.filter(s => s.status === "completed").length;
    const activeStage = stages.find(s => s.status === "active");
    const activeProgress = activeStage ? (activeStage.progress / 100) * 0.5 : 0;
    return ((completedStages + activeProgress) / stages.length) * 100;
  };

  const handleStageAction = (stageId: string, action: string) => {
    // Handle stage-specific actions
    switch (action) {
      case "view_details":
        setSelectedStageId(stageId);
        break;
      case "complete_stage":
        toast.success("Stage marked as complete");
        break;
      default:
        break;
    }
  };

  if (authLoading || isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading campaign...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!campaign) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Campaign not found</p>
            <Button onClick={() => router.push("/campaigns")}>Back to Campaigns</Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const selectedStage = stages.find(s => s.id === selectedStageId) || currentStage;

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />

          {/* Modern Header with Glass Morphism */}
          <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/campaigns")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={campaign.brand_logo_url} />
                      <AvatarFallback>{campaign.brand_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>

                    <div>
                      <h1 className="text-xl font-semibold tracking-tight">{campaign.name}</h1>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {campaign.campaign_type}
                        </Badge>
                        <span>•</span>
                        <span>{campaign.brand_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-3 mr-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{getOverallProgress().toFixed(0)}% Complete</div>
                      <div className="text-xs text-muted-foreground">Stage {stages.findIndex(s => s.status === "active") + 1} of {stages.length}</div>
                    </div>
                    <Progress value={getOverallProgress()} className="w-32 h-2" />
                  </div>

                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Campaign Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Team
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        Pause Campaign
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-6">
            {/* Quick Stats Bar */}
            <CampaignQuickStats campaign={campaign} stages={stages} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6 mt-6">
              {/* Workflow Timeline - Left Side */}
              <div className="col-span-4 space-y-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-5 w-5 text-primary" />
                      Campaign Workflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ModernWorkflowTimeline
                      stages={stages}
                      selectedStageId={selectedStageId}
                      onStageSelect={setSelectedStageId}
                    />
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedStage?.status === "active" && (
                      <>
                        <Button className="w-full justify-start" variant="outline" size="sm">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Complete Stage
                        </Button>
                        <Button className="w-full justify-start" variant="outline" size="sm">
                          <Users className="mr-2 h-4 w-4" />
                          Assign Team Member
                        </Button>
                      </>
                    )}
                    <Button className="w-full justify-start" variant="outline" size="sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Stage Details - Right Side */}
              <div className="col-span-8">
                <CampaignStageDetail
                  stage={selectedStage}
                  campaign={campaign}
                  onAction={handleStageAction}
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}