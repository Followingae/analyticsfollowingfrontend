"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from "@/components/AuthGuard";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";

import { CampaignsOverview } from "@/components/campaigns/unified/CampaignsOverview";
import { ActiveCampaigns } from "@/components/campaigns/unified/ActiveCampaigns";
import { ProposalsTab } from "@/components/campaigns/unified/ProposalsTab";
import { ArchiveTab } from "@/components/campaigns/unified/ArchiveTab";

export default function UnifiedCampaignsDashboard() {
  const router = useRouter();
  const { user } = useEnhancedAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Simple feature flag - can be made dynamic later
  const isAgencyClient = user?.role === 'premium' || user?.role === 'enterprise' || false;

  const tabConfig = [
    { id: "overview", label: "Overview", component: CampaignsOverview },
    { id: "active", label: "Active Campaigns", component: ActiveCampaigns },
    ...(isAgencyClient ? [{ id: "proposals", label: "Proposals", component: ProposalsTab }] : []),
    { id: "archive", label: "Archive", component: ArchiveTab },
  ];

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
          <div className="flex flex-col h-[calc(100vh-theme(spacing.12))] bg-background">
            {/* Header Section */}
            <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-muted-foreground">
                      End-to-end influencer campaign management
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search campaigns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-80"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Create <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push("/campaigns/new")}>
                          <Plus className="mr-2 h-4 w-4" />
                          New Campaign
                        </DropdownMenuItem>
                        {isAgencyClient && (
                          <DropdownMenuItem onClick={() => router.push("/campaigns/request-proposal")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Request Proposal
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-border/40 bg-background">
              <div className="container mx-auto px-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid h-12 w-full bg-transparent p-0" style={{ gridTemplateColumns: `repeat(${tabConfig.length}, 1fr)` }}>
                    {tabConfig.map(({ id, label }) => (
                      <TabsTrigger
                        key={id}
                        value={id}
                        className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-6 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                      >
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                {tabConfig.map(({ id, component: Component }) => (
                  <TabsContent key={id} value={id} className="h-full m-0 p-0">
                    <Component searchQuery={searchQuery} />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}