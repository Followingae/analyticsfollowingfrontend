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
import { AuthGuard } from "@/components/AuthGuard";
import { BrandUserInterface } from "@/components/brand/BrandUserInterface";
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
      <BrandUserInterface>
        <div className="flex flex-col h-[calc(100vh-theme(spacing.12))] bg-background">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-background">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
              <p className="text-muted-foreground mt-1">
                Manage your influencer marketing campaigns in one place
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {!isAgencyClient && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Campaign
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => router.push('/campaigns/new')}>
                      Start from scratch
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/campaigns/templates')}>
                      Use a template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/campaigns/import')}>
                      Import from CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <div className="border-b px-6">
              <TabsList className="h-12 bg-transparent p-0 w-full justify-start">
                {tabConfig.map(tab => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {tabConfig.map(tab => {
              const TabComponent = tab.component;
              return (
                <TabsContent key={tab.id} value={tab.id} className="flex-1 overflow-auto mt-0">
                  <TabComponent searchQuery={searchQuery} />
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </BrandUserInterface>
    </AuthGuard>
  );
}