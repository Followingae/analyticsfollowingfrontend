"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { v4 as uuidv4 } from "uuid"
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Link,
  BarChart3,
  Loader2,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { toast } from "sonner"
import { postAnalyticsApi } from "@/services/postAnalyticsApi"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"

// Form validation schemas
const basicInfoSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters").max(100, "Campaign name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description too long"),
})

const postsSchema = z.object({
  posts: z.array(z.object({
    url: z.string().url("Please enter a valid Instagram URL")
  })).min(1, "Please add at least one post URL")
})

type BasicInfoData = z.infer<typeof basicInfoSchema>
type PostsData = z.infer<typeof postsSchema>

interface CampaignData {
  name: string
  description: string
  posts: Array<{ url: string }>
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [campaignData, setCampaignData] = useState<Partial<CampaignData>>({})

  // Step 1: Basic Information Form
  const basicInfoForm = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  // Step 2: Posts Form
  const postsForm = useForm<PostsData>({
    resolver: zodResolver(postsSchema),
    defaultValues: {
      posts: [{ url: "" }],
    },
  })

  const handleBasicInfoSubmit = (data: BasicInfoData) => {
    setCampaignData(prev => ({ ...prev, ...data }))
    setCurrentStep(2)
  }

  const addPostField = () => {
    const currentPosts = postsForm.getValues("posts")
    postsForm.setValue("posts", [...currentPosts, { url: "" }])
  }

  const removePostField = (index: number) => {
    const currentPosts = postsForm.getValues("posts")
    if (currentPosts.length > 1) {
      postsForm.setValue("posts", currentPosts.filter((_, i) => i !== index))
    }
  }

  const handleTestApiConnection = async () => {
    try {
      toast.success("Testing API connection...")
      const healthResult = await postAnalyticsApi.healthCheck()
      console.log('API Health Check:', healthResult)

      if (healthResult.success) {
        toast.success("✅ API connection successful!")
      } else {
        toast.error(`❌ API connection failed: ${healthResult.error}`)
      }
    } catch (error) {
      console.error('API test error:', error)
      toast.error(`❌ API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCreateCampaign = async (data: PostsData) => {
    setIsLoading(true)

    // Validate all URLs first
    const urlValidationErrors: string[] = []
    data.posts.forEach((post, index) => {
      const validation = postAnalyticsApi.validateInstagramUrl(post.url)
      if (!validation.valid) {
        urlValidationErrors.push(`Post ${index + 1}: ${validation.error}`)
      }
    })

    if (urlValidationErrors.length > 0) {
      toast.error(`Invalid URLs:\n${urlValidationErrors.join('\n')}`)
      setIsLoading(false)
      return
    }

    // Create campaign ID and basic info outside try block for error handling
    const campaignId = uuidv4()
    const newCampaign = {
      id: campaignId,
      name: campaignData.name,
      description: campaignData.description,
      posts: data.posts.map(p => ({ url: p.url, analytics: null })),
      createdAt: new Date().toISOString(),
      status: 'analyzing' as const
    }

    try {

      // Save campaign to localStorage
      const existingCampaigns = JSON.parse(localStorage.getItem('campaigns') || '[]')
      existingCampaigns.push(newCampaign)
      localStorage.setItem('campaigns', JSON.stringify(existingCampaigns))

      // Start post analysis - use single or batch based on number of posts
      const postUrls = data.posts.map(p => p.url)
      toast.success("Campaign created! Starting post analysis...")

      let analysisResults: any

      if (postUrls.length === 1) {
        // Single post analysis for better efficiency
        console.log('Using single post analysis for 1 URL')
        const singleResult = await postAnalyticsApi.monitorAnalysis(postUrls[0], campaignId)
        analysisResults = {
          analyses: [singleResult],
          failed_urls: [],
          total_processed: 1,
          total_successful: 1,
          total_failed: 0
        }
      } else {
        // Batch analysis for multiple posts
        console.log(`Using batch analysis for ${postUrls.length} URLs`)
        analysisResults = await postAnalyticsApi.monitorBatchAnalysis(postUrls, campaignId)
      }

      console.log('Analysis result:', analysisResults)
      console.log('Analyses array:', analysisResults.analyses)

      // Update campaign with analysis results
      const updatedCampaign = {
        ...newCampaign,
        posts: data.posts.map(post => {
          const analysis = analysisResults.analyses.find((a: any) => a.post_url === post.url) || null
          return {
            url: post.url,
            analytics: analysis
          }
        }),
        status: 'completed' as const
      }

      // Update localStorage
      const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]')
      const updatedCampaigns = campaigns.map((c: any) =>
        c.id === campaignId ? updatedCampaign : c
      )
      localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns))

      if (analysisResults.total_failed && analysisResults.total_failed > 0) {
        toast.warning(`Analysis completed with ${analysisResults.total_failed} failed posts`)
      } else {
        toast.success("All posts analyzed successfully! 🎉")
      }

      // Navigate to analytics page regardless of analysis success
      router.push(`/campaigns/${campaignId}/analytics`)
    } catch (error) {
      console.error('Campaign creation error:', error)

      // Even if analysis fails, keep the campaign but without analytics
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Analysis failed: ${errorMessage}. Campaign created without analytics.`)

      // Update campaign status to show analysis failed
      const failedCampaign = { ...newCampaign, status: 'draft' as const }
      const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]')
      const updatedCampaigns = campaigns.map((c: any) =>
        c.id === campaignId ? failedCampaign : c
      )
      localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns))

      // Still navigate to analytics page
      router.push(`/campaigns/${campaignId}/analytics`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 66)",
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
                  onClick={() => currentStep === 1 ? router.back() : setCurrentStep(1)}
                  className="h-10 w-10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Create New Campaign</h1>
                  <p className="text-muted-foreground mt-1">
                    Step {currentStep} of 2: {currentStep === 1 ? 'Basic Information' : 'Add Posts'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                </div>
              </div>
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card className="w-full max-w-4xl mx-auto">
                <CardHeader className="pb-8">
                  <CardTitle className="text-2xl">Campaign Basic Information</CardTitle>
                  <CardDescription className="text-base">
                    Start by giving your campaign a name and description
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <Form {...basicInfoForm}>
                    <form onSubmit={basicInfoForm.handleSubmit(handleBasicInfoSubmit)} className="space-y-8">
                      <FormField
                        control={basicInfoForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Campaign Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Summer Fashion Campaign 2024"
                                className="h-12 text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={basicInfoForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Campaign Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your campaign goals, target audience, and what you want to track..."
                                className="min-h-[150px] text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end pt-6">
                        <Button type="submit" size="lg" className="h-12 px-8">
                          Next: Add Posts
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Add Posts */}
            {currentStep === 2 && (
              <Card className="w-full max-w-5xl mx-auto">
                <CardHeader className="pb-8">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Link className="h-6 w-6" />
                    Add Instagram Posts
                  </CardTitle>
                  <CardDescription className="text-base">
                    Add the Instagram post URLs you want to analyze in this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <Form {...postsForm}>
                    <form onSubmit={postsForm.handleSubmit(handleCreateCampaign)} className="space-y-8">
                      <div className="space-y-6">
                        {postsForm.watch("posts").map((_, index) => (
                          <FormField
                            key={index}
                            control={postsForm.control}
                            name={`posts.${index}.url`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium">Post URL {index + 1}</FormLabel>
                                <div className="flex gap-3">
                                  <FormControl>
                                    <Input
                                      placeholder="https://www.instagram.com/p/..."
                                      className="h-12 text-base"
                                      {...field}
                                    />
                                  </FormControl>
                                  {postsForm.watch("posts").length > 1 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-12 w-12 shrink-0"
                                      onClick={() => removePostField(index)}
                                    >
                                      <X className="h-5 w-5" />
                                    </Button>
                                  )}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addPostField}
                        className="w-full h-12 text-base"
                        size="lg"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Add Another Post
                      </Button>

                      <div className="flex justify-between pt-8">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          size="lg"
                          className="h-12 px-8"
                        >
                          <ArrowLeft className="mr-2 h-5 w-5" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          size="lg"
                          className="min-w-[180px] h-12"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="mr-2 h-5 w-5" />
                              Create Campaign
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}