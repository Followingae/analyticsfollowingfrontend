"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, DollarSign, Users, Target, Calendar, MessageSquare, Check, X, Eye, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from "@/components/AuthGuard";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { toast } from "sonner";

interface ProposalSection {
  id: string;
  title: string;
  content: string;
  status: "pending" | "approved" | "needs_revision";
}

export default function CampaignProposalPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user, isLoading: authLoading } = useEnhancedAuth();

  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth context to load
    if (authLoading) return;

    // If no user after auth loading is complete, redirect to login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Load proposal data
    if (campaignId) {
      loadProposalData();
    }
  }, [user, authLoading, campaignId, router]);

  const loadProposalData = async () => {
    try {
      setIsLoading(true);

      // Mock proposal data
      const mockProposal = {
        id: `proposal_${campaignId}`,
        campaign_name: campaignId === "1" ? "Summer Collection Launch" :
                      campaignId === "2" ? "Brand Awareness Q4" :
                      campaignId === "3" ? "Product Launch" : "Holiday Campaign 2024",
        brand_name: "Fashion Forward",
        status: "pending_review",
        created_at: "2024-10-20T00:00:00Z",
        total_budget: 18500,
        estimated_reach: 750000,
        campaign_duration: "3 weeks",
        deliverables: [
          "12 Instagram posts (mix of static and reels)",
          "4 Instagram stories per influencer",
          "1 long-form video for brand channels"
        ],
        kpis: [
          "750K+ total reach",
          "3.5%+ average engagement rate",
          "50K+ total engagements",
          "15%+ brand mention increase"
        ],
        timeline: [
          { phase: "Influencer Outreach", duration: "3 days", start: "Oct 21" },
          { phase: "Content Planning", duration: "2 days", start: "Oct 24" },
          { phase: "Content Creation", duration: "7 days", start: "Oct 26" },
          { phase: "Content Review", duration: "2 days", start: "Nov 2" },
          { phase: "Publishing", duration: "7 days", start: "Nov 4" },
          { phase: "Reporting", duration: "2 days", start: "Nov 11" }
        ],
        influencer_strategy: `We'll partner with 6-8 micro and mid-tier influencers in the fashion and lifestyle space. Focus on authentic creators who align with your brand values and have engaged, fashion-forward audiences.`,
        content_strategy: `Mix of outfit styling posts, behind-the-scenes content, and lifestyle integration. Each influencer will create unique content showcasing your summer collection in their personal style.`,
        sections: [
          {
            id: "overview",
            title: "Campaign Overview",
            content: "This comprehensive influencer marketing campaign will showcase your Summer Collection through authentic creator partnerships...",
            status: "approved"
          },
          {
            id: "strategy",
            title: "Influencer Strategy",
            content: "We'll partner with 6-8 carefully selected micro and mid-tier influencers...",
            status: "pending"
          },
          {
            id: "timeline",
            title: "Timeline & Deliverables",
            content: "3-week campaign with structured phases for maximum impact...",
            status: "pending"
          },
          {
            id: "budget",
            title: "Budget Breakdown",
            content: "Total investment of $18,500 including influencer fees, content rights, and management...",
            status: "needs_revision"
          }
        ] as ProposalSection[]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProposal(mockProposal);
    } catch (error) {
      console.error("Error loading proposal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    try {
      // Mock approval process
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (approved) {
        toast.success("Proposal approved! Moving to influencer selection stage.");
        router.push(`/campaigns/${campaignId}/influencers`);
      } else {
        toast.info("Proposal feedback submitted for revision.");
        setProposal({
          ...proposal,
          status: "needs_revision"
        });
      }
    } catch (error) {
      toast.error("Failed to submit proposal response");
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: "Pending Review", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      approved: { label: "Approved", className: "bg-green-50 text-green-700 border-green-200" },
      needs_revision: { label: "Needs Revision", className: "bg-red-50 text-red-700 border-red-200" }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  // Show loading state
  if (authLoading || isLoading || !user) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading proposal...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!proposal) {
    return (
      <AuthGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="container mx-auto py-8 px-4">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Proposal not found</p>
                <Button className="mt-4" onClick={() => router.push("/campaigns")}>
                  Back to Campaigns
                </Button>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    );
  }

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
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/campaigns/${campaignId}`)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Campaign Proposal</h1>
                    <p className="text-sm text-muted-foreground">{proposal.campaign_name}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={getStatusConfig(proposal.status).className}>
                  {getStatusConfig(proposal.status).label}
                </Badge>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-lg font-semibold">${proposal.total_budget.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total Budget</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-lg font-semibold">{(proposal.estimated_reach / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-muted-foreground">Estimated Reach</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-lg font-semibold">{proposal.campaign_duration}</div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="text-lg font-semibold">6-8</div>
                      <div className="text-xs text-muted-foreground">Influencers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Proposal Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Campaign Strategy */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Strategy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Influencer Strategy</h4>
                      <p className="text-sm text-muted-foreground">{proposal.influencer_strategy}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Content Strategy</h4>
                      <p className="text-sm text-muted-foreground">{proposal.content_strategy}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {proposal.timeline.map((phase: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <div className="font-medium">{phase.phase}</div>
                            <div className="text-sm text-muted-foreground">Starting {phase.start}</div>
                          </div>
                          <div className="text-sm font-medium">{phase.duration}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Deliverables */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {proposal.deliverables.map((deliverable: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* KPIs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Success Metrics & KPIs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {proposal.kpis.map((kpi: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-blue-600" />
                          {kpi}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Approval Actions */}
                {proposal.status === "pending_review" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Proposal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Add feedback or comments (optional)"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleApproval(true)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleApproval(false)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Proposal Sections */}
                <Card>
                  <CardHeader>
                    <CardTitle>Proposal Sections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {proposal.sections.map((section: ProposalSection) => (
                        <div
                          key={section.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => setSelectedSection(section.id)}
                        >
                          <span className="text-sm">{section.title}</span>
                          <Badge variant="outline" className={getStatusConfig(section.status).className}>
                            {getStatusConfig(section.status).label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Manager</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="font-medium">Sarah Johnson</div>
                        <div className="text-sm text-muted-foreground">Senior Campaign Manager</div>
                      </div>
                      <div className="text-sm">
                        <div>sarah@following.ae</div>
                        <div>+971 50 123 4567</div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}