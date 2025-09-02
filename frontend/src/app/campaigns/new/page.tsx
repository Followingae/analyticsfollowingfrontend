"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Target,
  ArrowLeft,
  Upload,
  Eye,
  Users,
  TrendingUp,
  ShoppingCart,
  MousePointer,
  Calendar,
  DollarSign,
  Briefcase,
  Sparkles,
  Loader2,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { teamApiService } from "@/services/teamApi"
import { campaignsApiService } from "@/services/campaignsApi"

// Form validation schema
const campaignSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters").max(100, "Campaign name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description too long"),
  objective: z.enum(["awareness", "engagement", "conversions", "sales", "traffic"], {
    required_error: "Please select a campaign objective",
  }),
  budget: z.string().min(1, "Budget is required").refine((val) => {
    const num = parseFloat(val)
    return num > 0 && num <= 1000000
  }, "Budget must be between 1 and 1,000,000 AED"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  priority: z.enum(["low", "medium", "high", "critical"], {
    required_error: "Please select campaign priority",
  }),
})

type CampaignFormData = z.infer<typeof campaignSchema>

const objectives = [
  { 
    value: "awareness" as const, 
    label: "Brand Awareness", 
    description: "Increase brand recognition and reach",
    icon: Eye,
    color: "bg-blue-50 border-blue-200 text-blue-700"
  },
  { 
    value: "engagement" as const, 
    label: "Engagement", 
    description: "Drive interactions and community building",
    icon: Users,
    color: "bg-green-50 border-green-200 text-green-700"
  },
  { 
    value: "conversions" as const, 
    label: "Conversions", 
    description: "Convert prospects into customers",
    icon: MousePointer,
    color: "bg-purple-50 border-purple-200 text-purple-700"
  },
  { 
    value: "sales" as const, 
    label: "Sales", 
    description: "Generate direct revenue and sales",
    icon: ShoppingCart,
    color: "bg-orange-50 border-orange-200 text-orange-700"
  },
  { 
    value: "traffic" as const, 
    label: "Website Traffic", 
    description: "Drive visitors to your website",
    icon: TrendingUp,
    color: "bg-indigo-50 border-indigo-200 text-indigo-700"
  }
]

const priorities = [
  { value: "low" as const, label: "Low", color: "bg-gray-50 text-gray-600" },
  { value: "medium" as const, label: "Medium", color: "bg-yellow-50 text-yellow-700" },
  { value: "high" as const, label: "High", color: "bg-orange-50 text-orange-700" },
  { value: "critical" as const, label: "Critical", color: "bg-red-50 text-red-700" },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [teamContext, setTeamContext] = useState<any>(null)
  const [loadingTeam, setLoadingTeam] = useState(true)

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      objective: undefined,
      budget: "",
      startDate: "",
      endDate: "",
      priority: "medium",
    },
  })

  // Load team context for automatic brand name
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        const result = await teamApiService.getTeamContext()
        if (result.success && result.data) {
          setTeamContext(result.data)

        }
      } catch (error) {

        toast.error('Failed to load team information')
      } finally {
        setLoadingTeam(false)
      }
    }

    loadTeamData()
  }, [])

  const handleCreateCampaign = async (data: CampaignFormData) => {
    setIsLoading(true)
    
    try {
      // Create campaign using the API service
      const campaignData = {
        name: data.name,
        description: data.description,
        objective: data.objective,
        budget_allocated: parseFloat(data.budget),
        start_date: data.startDate,
        end_date: data.endDate,
        priority: data.priority,
        status: 'planning' as const,
      }

      const result = await campaignsApiService.createCampaign(campaignData)
      
      if (result.success) {
        toast.success("Campaign created successfully! 🎉")
        router.push("/campaigns")
      } else {
        toast.error(result.error || "Failed to create campaign")
      }
    } catch (error) {

      toast.error("Failed to create campaign")
    } finally {
      setIsLoading(false)
    }
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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.back()}
                  className="h-10 w-10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Create New Campaign</h1>
                  <p className="text-muted-foreground mt-1">
                    {loadingTeam ? "Loading team information..." : `Build a campaign for ${teamContext?.team_name || 'your team'}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#5100f3]" />
                <Badge variant="secondary" className="bg-[#5100f3]/10 text-[#5100f3] border-[#5100f3]/20">
                  {teamContext?.subscription_tier || 'Loading...'}
                </Badge>
              </div>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateCampaign)} className="space-y-8">
                
                {/* Team Information Card */}
                <Card className="border-2 border-dashed border-muted-foreground/25">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#5100f3]/10 rounded-lg">
                        <Briefcase className="h-5 w-5 text-[#5100f3]" />
                      </div>
                      <div>
                        <CardTitle>Team Information</CardTitle>
                        <CardDescription>
                          Campaign will be created for your team account
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingTeam ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading team information...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Team Name</p>
                          <p className="text-2xl font-bold">{teamContext?.team_name || 'Unknown Team'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Subscription</p>
                          <Badge className={`${
                            teamContext?.subscription_tier === 'premium' ? 'bg-purple-100 text-purple-700' :
                            teamContext?.subscription_tier === 'standard' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {teamContext?.subscription_tier?.toUpperCase() || 'FREE'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-8 lg:grid-cols-2">
                  
                  {/* Left Column - Campaign Details */}
                  <div className="space-y-6">
                    
                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Campaign Details
                        </CardTitle>
                        <CardDescription>
                          Define your campaign's core information and goals
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter campaign name..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your campaign goals, target audience, and key messaging..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide a clear description of what you want to achieve
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {priorities.map((priority) => (
                                    <SelectItem key={priority.value} value={priority.value}>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className={priority.color}>
                                          {priority.label}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Campaign Objective */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Campaign Objective
                        </CardTitle>
                        <CardDescription>
                          Choose the primary goal for your campaign
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="objective"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormControl>
                                <div className="grid grid-cols-1 gap-3">
                                  {objectives.map((objective) => {
                                    const IconComponent = objective.icon
                                    return (
                                      <label
                                        key={objective.value}
                                        className={`
                                          flex items-center space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all
                                          ${field.value === objective.value 
                                            ? `${objective.color} border-current` 
                                            : 'border-muted hover:border-muted-foreground/50'
                                          }
                                        `}
                                        onClick={() => field.onChange(objective.value)}
                                      >
                                        <IconComponent className="h-5 w-5" />
                                        <div className="flex-1 space-y-1">
                                          <p className="text-sm font-medium">{objective.label}</p>
                                          <p className="text-xs text-muted-foreground">{objective.description}</p>
                                        </div>
                                        <input
                                          type="radio"
                                          className="sr-only"
                                          value={objective.value}
                                          checked={field.value === objective.value}
                                          onChange={() => field.onChange(objective.value)}
                                        />
                                      </label>
                                    )
                                  })}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Budget & Timeline */}
                  <div className="space-y-6">
                    
                    {/* Budget */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Budget Planning
                        </CardTitle>
                        <CardDescription>
                          Set your campaign budget allocation
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Budget (AED)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type="number" 
                                    placeholder="Enter total budget..."
                                    className="pl-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    {...field}
                                  />
                                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Budget should be between 1 and 1,000,000 AED
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Campaign Timeline
                        </CardTitle>
                        <CardDescription>
                          Define when your campaign will run
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Form Actions */}
                <Separator />
                <div className="flex items-center justify-between pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isLoading}
                    className="min-w-[150px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Create Campaign
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}