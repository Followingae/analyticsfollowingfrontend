"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Target,
  ArrowLeft,
  Upload,
  Edit,
  Eye,
  Users,
  TrendingUp,
  ShoppingCart,
  MousePointer,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Calendar05 from "@/components/calendar-05"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function NewCampaignPage() {
  const router = useRouter()
  const [campaignData, setCampaignData] = useState({
    name: "",
    description: "",
    objective: "",
    budget: "",
    brandName: "Your Brand Name",
    brandLogo: "/followinglogo.svg"
  })

  const objectives = [
    { 
      value: "awareness", 
      label: "Brand Awareness", 
      icon: Eye 
    },
    { 
      value: "engagement", 
      label: "Engagement", 
      icon: Users 
    },
    { 
      value: "conversions", 
      label: "Conversions", 
      icon: MousePointer 
    },
    { 
      value: "sales", 
      label: "Sales", 
      icon: ShoppingCart 
    },
    { 
      value: "traffic", 
      label: "Website Traffic", 
      icon: TrendingUp 
    }
  ]

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCampaignData(prev => ({ ...prev, brandLogo: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateCampaign = () => {
    toast.success("Campaign created successfully!")
    router.push("/campaigns")
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col p-4 md:p-6">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold">Create New Campaign</h1>
            </div>

            {/* Form Content */}
            <div className="grid gap-8 lg:grid-cols-2 flex-1">
              
              {/* Left Column */}
              <div className="space-y-7">
                
                {/* Brand Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Brand Information</h2>
                  
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar className="h-18 w-18 bg-black">
                        <AvatarImage src={campaignData.brandLogo} alt="Brand Logo" />
                        <AvatarFallback className="text-lg text-white">{campaignData.brandName.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div 
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Edit className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="brand-name">Brand Name</Label>
                      <Input
                        id="brand-name"
                        value={campaignData.brandName}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, brandName: e.target.value }))}
                      />
                    </div>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                  </div>
                </div>

                {/* Campaign Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Campaign Information</h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaign-name">Campaign Name</Label>
                      <Input
                        id="campaign-name"
                        placeholder="Enter campaign name..."
                        value={campaignData.name}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="campaign-description">Description</Label>
                      <Textarea
                        id="campaign-description"
                        placeholder="Describe your campaign goals, target audience, and key messaging..."
                        value={campaignData.description}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                        className="min-h-[90px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Campaign Objective */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Campaign Objective</h2>
                  
                  <RadioGroup 
                    value={campaignData.objective} 
                    onValueChange={(value) => setCampaignData(prev => ({ ...prev, objective: value }))}
                    className="flex gap-3"
                  >
                    {objectives.map((objective) => {
                      const IconComponent = objective.icon
                      return (
                        <div key={objective.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={objective.value} id={objective.value} className="peer sr-only" />
                          <Label
                            htmlFor={objective.value}
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-muted hover:border-muted-foreground peer-data-[state=checked]:bg-black peer-data-[state=checked]:text-white peer-data-[state=checked]:border-black [&:has([data-state=checked])]:bg-black [&:has([data-state=checked])]:text-white [&:has([data-state=checked])]:border-black cursor-pointer transition-all w-18 h-18"
                          >
                            <IconComponent className="h-4 w-4 mb-1" />
                            <div className="text-xs font-medium text-center leading-tight">{objective.label.split(' ')[0]}</div>
                          </Label>
                        </div>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-7">
                
                {/* Campaign Duration */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Campaign Duration</h2>
                  <Calendar05 />
                </div>

                {/* Budget */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Budget</h2>
                  
                  <div className="space-y-2">
                    <Label htmlFor="budget">Total Budget (<span className="aed-currency">AED</span>)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="Enter total budget..."
                      value={campaignData.budget}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, budget: e.target.value }))}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleCreateCampaign} size="lg">
                <Target className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}