'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Users,
  Share,
  Download,
  Plus,
  Search,
  MoreHorizontal,
  Edit3,
  Trash2,
  UserPlus,
  X,
  Hash,
  AtSign,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SiteHeader } from '@/components/site-header'
import { listsApiService } from '@/services/listsApi'
import { instagramApiService, UnlockedProfile } from '@/services/instagramApi'
import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface ListItem {
  id: string
  username: string
  display_name: string
  notes?: string
  added_at: string
  avatar_url?: string
}

interface ListDetail {
  id: string
  name: string
  description: string
  color: string
  creator_count: number
  created_at: string
  updated_at: string
  items: ListItem[]
}

export default function ListDetailPage() {
  const params = useParams()
  const listId = params.id as string
  const [list, setList] = useState<ListDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Creator addition states
  const [isAddingCreator, setIsAddingCreator] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UnlockedProfile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [allAvailableCreators, setAllAvailableCreators] = useState<UnlockedProfile[]>([])
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set())
  const [isAddingSelectedCreators, setIsAddingSelectedCreators] = useState(false)

  // Creator management states
  const [isEditingCreator, setIsEditingCreator] = useState(false)
  const [selectedCreator, setSelectedCreator] = useState<ListItem | null>(null)
  const [creatorNotes, setCreatorNotes] = useState("")
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [creatorToDelete, setCreatorToDelete] = useState<ListItem | null>(null)

  useEffect(() => {
    const loadListData = async () => {
      try {
        const response = await listsApiService.getListDetails(listId, { include_profiles: true })
        if (response.success) {
          setList(response.data)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error loading list data:', error)
        setLoading(false)
      }
    }

    if (listId) {
      loadListData()
    }
  }, [listId])

  const loadAvailableCreators = async () => {
    setSearchLoading(true)
    try {
      console.log('Loading available creators for list:', listId)

      // The lists/available-profiles endpoint has UUID validation issues
      // Let's use the auth/unlocked-profiles endpoint instead
      console.log('Using auth/unlocked-profiles endpoint...')
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.auth.unlockedProfiles}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      let data
      if (response.ok) {
        data = await response.json()
        console.log('Raw unlocked profiles response:', data)
      } else {
        const errorData = await response.json()
        console.log('Auth unlocked profiles error:', errorData)
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
      }

      // Convert response to our expected format
      const apiResponse = { success: response.ok, data }
      console.log('Available creators API response:', apiResponse)
      console.log('Response data structure:', JSON.stringify(data, null, 2))

      if (apiResponse.success) {
        console.log('Response is successful, checking data structure...')

        // Handle different possible response structures
        let profiles = []

        // Try different potential data structures
        if (data && data.profiles && Array.isArray(data.profiles)) {
          profiles = data.profiles
          console.log('Found profiles in data.profiles:', profiles.length)
        } else if (data && data.items && Array.isArray(data.items)) {
          profiles = data.items
          console.log('Found profiles in data.items:', profiles.length)
        } else if (data && Array.isArray(data)) {
          profiles = data
          console.log('Found profiles in data:', profiles.length)
        } else if (Array.isArray(data)) {
          profiles = data
          console.log('Data itself is array:', profiles.length)
        } else {
          console.log('Could not find profiles array in response structure')
          console.log('Available keys in data:', Object.keys(data || {}))
        }

        if (profiles.length > 0) {
          // Log a sample profile to understand the structure
          console.log('Sample profile structure:', profiles[0])

          // Convert unlocked profiles to expected format using high-quality CDN images
          const convertedProfiles = profiles.map((profile, index) => {
            console.log(`Converting profile ${index}:`, profile)

            // Create safe profile object with fallbacks
            const safeProfile = {
              username: profile.username || profile.handle || `user_${index}`,
              full_name: profile.full_name || profile.name || profile.display_name || '',
              profile_pic_url: profile.cdn_avatar_url || profile.profile_pic_url_hd || profile.profile_pic_url || profile.avatar_url || '',
              followers_count: profile.followers_count || profile.followers || 0,
              engagement_rate: profile.engagement_rate || 0,
              is_verified: profile.is_verified || false
            }

            console.log(`Converted profile ${index}:`, safeProfile)
            return safeProfile
          })
          console.log('Successfully converted available profiles:', convertedProfiles)
          setAllAvailableCreators(convertedProfiles)
          setSearchResults(convertedProfiles)
        } else {
          console.log('No profiles found in the response structure')
          console.log('Setting empty arrays...')
          setAllAvailableCreators([])
          setSearchResults([])
        }
      } else {
        console.log('API call was not successful. ApiResponse:', apiResponse)
        setAllAvailableCreators([])
        setSearchResults([])
        toast.error('Failed to load unlocked creators')
      }
    } catch (error) {
      console.error('Error loading available creators:', error)
      setAllAvailableCreators([])
      setSearchResults([])
      toast.error('Network error while loading creators')
    } finally {
      setSearchLoading(false)
    }
  }

  const searchCreators = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(allAvailableCreators)
      return
    }

    // Filter locally first for better UX
    const localResults = allAvailableCreators.filter(profile =>
      profile.username.toLowerCase().includes(query.toLowerCase()) ||
      profile.full_name.toLowerCase().includes(query.toLowerCase())
    )
    setSearchResults(localResults)

    // If local search gives few results, also search server
    if (localResults.length < 5) {
      setSearchLoading(true)
      try {
        const response = await listsApiService.getAvailableProfiles({
          search: query,
          not_in_list: listId,
          page: 1,
          limit: 50
        })
        if (response.success && response.data) {
          const profiles = response.data.items.map(profile => ({
            username: profile.username,
            full_name: profile.full_name,
            profile_pic_url: profile.profile_pic_url,
            followers_count: profile.followers_count,
            engagement_rate: profile.engagement_rate,
            is_verified: profile.is_verified
          }))
          setSearchResults(profiles)
        }
      } catch (error) {
        console.error('Error searching creators:', error)
        toast.error('Failed to search creators')
      } finally {
        setSearchLoading(false)
      }
    }
  }

  const toggleCreatorSelection = (username: string) => {
    setSelectedCreators(prev => {
      const newSet = new Set(prev)
      if (newSet.has(username)) {
        newSet.delete(username)
      } else {
        newSet.add(username)
      }
      return newSet
    })
  }

  const addSelectedCreatorsToList = async () => {
    if (selectedCreators.size === 0) return

    setIsAddingSelectedCreators(true)
    try {
      const selectedProfiles = searchResults.filter(profile =>
        selectedCreators.has(profile.username)
      )

      const promises = selectedProfiles.map(creator =>
        listsApiService.addProfileToList(listId, {
          profile_username: creator.username,
          notes: ""
        })
      )

      const results = await Promise.allSettled(promises)
      const successful = results.filter(result =>
        result.status === 'fulfilled' && result.value.success
      ).length

      if (successful > 0) {
        toast.success(`${successful} creator${successful > 1 ? 's' : ''} added to list!`)
        setSelectedCreators(new Set())
        setIsAddingCreator(false)
        setSearchQuery("")
        setSearchResults([])

        // Reload list data
        const updatedResponse = await listsApiService.getListDetails(listId, { include_profiles: true })
        if (updatedResponse.success) {
          setList(updatedResponse.data)
        }
      } else {
        toast.error("Failed to add creators to list")
      }
    } catch (error) {
      toast.error("Failed to add creators to list")
    } finally {
      setIsAddingSelectedCreators(false)
    }
  }

  const removeCreatorFromList = async (creator: ListItem) => {
    try {
      const response = await listsApiService.removeProfileFromList(listId, creator.id)

      if (response.success) {
        toast.success(`${creator.username} removed from list`)
        setIsDeleteConfirmOpen(false)
        setCreatorToDelete(null)
        // Reload list data
        const updatedResponse = await listsApiService.getListDetails(listId, { include_profiles: true })
        if (updatedResponse.success) {
          setList(updatedResponse.data)
        }
      } else {
        toast.error("Failed to remove creator")
      }
    } catch (error) {
      toast.error("Failed to remove creator from list")
    }
  }

  const updateCreatorNotes = async () => {
    if (!selectedCreator) return

    try {
      const response = await listsApiService.updateListItem(listId, selectedCreator.id, {
        notes: creatorNotes
      })

      if (response.success) {
        toast.success("Notes updated!")
        setIsEditingCreator(false)
        setSelectedCreator(null)
        setCreatorNotes("")
        // Reload list data
        const updatedResponse = await listsApiService.getListDetails(listId, { include_profiles: true })
        if (updatedResponse.success) {
          setList(updatedResponse.data)
        }
      } else {
        toast.error("Failed to update notes")
      }
    } catch (error) {
      toast.error("Failed to update notes")
    }
  }

  const handleEditCreator = (creator: ListItem) => {
    setSelectedCreator(creator)
    setCreatorNotes(creator.notes || "")
    setIsEditingCreator(true)
  }

  const handleDeleteCreator = (creator: ListItem) => {
    setCreatorToDelete(creator)
    setIsDeleteConfirmOpen(true)
  }

  return (
    <AuthGuard requireAuth={true}>
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
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : !list ? (
              <Card>
                <CardContent className="text-center py-8">
                  <h2 className="text-lg font-semibold mb-2">List not found</h2>
                  <p className="text-muted-foreground mb-4">The list you're looking for doesn't exist.</p>
                  <Link href="/my-lists">
                    <Button variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Lists
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link href="/my-lists">
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    </Link>
                    <div className="flex items-center space-x-3">
                      <div
                        className="h-6 w-1 rounded"
                        style={{ backgroundColor: list.color }}
                      />
                      <div>
                        <h1 className="text-2xl font-bold">{list.name}</h1>
                        {list.description && (
                          <p className="text-muted-foreground">{list.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => {
                        setIsAddingCreator(true)
                        loadAvailableCreators()
                      }}
                      className="gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Creator
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>


                {/* Creators Grid */}
                {list.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.items.map((creator) => (
                      <Card key={creator.id} className="group hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-lg">
                                {creator.display_name?.charAt(0) || creator.username?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold truncate">{creator.display_name || creator.username}</h3>
                                <p className="text-sm text-muted-foreground flex items-center">
                                  <AtSign className="w-3 h-3 mr-1" />
                                  {creator.username}
                                </p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCreator(creator)}>
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Edit Notes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteCreator(creator)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {creator.notes ? (
                            <div className="bg-muted/50 rounded-md p-3">
                              <p className="text-sm text-muted-foreground mb-1 flex items-center">
                                <Hash className="w-3 h-3 mr-1" />
                                Notes
                              </p>
                              <p className="text-sm">{creator.notes}</p>
                            </div>
                          ) : (
                            <div className="text-center py-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCreator(creator)}
                                className="text-xs"
                              >
                                Add notes
                              </Button>
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                              Added {new Date(creator.added_at).toLocaleDateString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No creators yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your creator list by adding influencers you want to work with
                      </p>
                      <Button
                        onClick={() => {
                          setIsAddingCreator(true)
                          loadAvailableCreators()
                        }}
                        className="gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add Creator
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Add Creator Dialog */}
                <Dialog open={isAddingCreator} onOpenChange={() => {
                  setIsAddingCreator(false)
                  setSelectedCreators(new Set())
                }}>
                  <DialogContent className="max-w-[95vw] max-h-[90vh] w-[95vw] h-[90vh] sm:max-w-[95vw] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>Select Creators to Add</DialogTitle>
                      <DialogDescription>
                        Choose from your unlocked creators to add to this list
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col min-h-0 space-y-4">
                      <div className="relative flex-shrink-0">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search by username or name..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            searchCreators(e.target.value)
                          }}
                          className="pl-9"
                        />
                      </div>

                      <div className="flex-1 min-h-0">
                        {searchLoading ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                              <p className="text-sm text-muted-foreground mt-2">Loading creators...</p>
                            </div>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="h-full overflow-y-auto">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-6 p-4">
                            {searchResults.map((creator, index) => {
                              const username = creator.username || `unknown-${index}`
                              const isSelected = selectedCreators.has(username)
                              return (
                                <div
                                  key={username}
                                  className="flex flex-col items-center space-y-3 cursor-pointer"
                                  onClick={() => toggleCreatorSelection(username)}
                                >
                                  <div className="relative">
                                    <div className="w-40 h-40 rounded-xl overflow-hidden bg-muted relative transition-all duration-200 hover:scale-105 border-4 border-transparent">
                                      {creator.profile_pic_url ? (
                                        <img
                                          src={creator.profile_pic_url}
                                          alt={creator.full_name || username}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                          <span className="text-xl font-bold text-primary">
                                            {creator.full_name?.charAt(0) || creator.username?.charAt(0)?.toUpperCase() || '?'}
                                          </span>
                                        </div>
                                      )}

                                      {/* Selection overlay */}
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                                          <Check className="w-6 h-6 text-white" />
                                        </div>
                                      )}

                                      {/* Verified badge */}
                                      {creator.is_verified && (
                                        <div className="absolute top-0 right-0 bg-blue-500 rounded-full p-1 transform translate-x-1 -translate-y-1">
                                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>

                                    {/* Selection ring */}
                                    {isSelected && (
                                      <div className="absolute inset-0 rounded-xl border-4 border-green-500 animate-pulse" />
                                    )}
                                  </div>

                                  {/* Creator info */}
                                  <div className="text-center space-y-1 min-w-0 w-40">
                                    <p className="text-sm font-medium truncate w-full">
                                      {username !== `unknown-${index}` ? `@${username}` : 'No username'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {creator.followers_count && creator.followers_count > 0 ? (
                                        creator.followers_count >= 1000000
                                          ? `${(creator.followers_count / 1000000).toFixed(1)}M followers`
                                          : creator.followers_count >= 1000
                                          ? `${(creator.followers_count / 1000).toFixed(0)}K followers`
                                          : `${creator.followers_count} followers`
                                      ) : (
                                        'No follower data'
                                      )}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          </div>
                        ) : searchQuery.trim() ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-muted-foreground">
                              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No creators found matching "{searchQuery}"</p>
                            </div>
                          </div>
                        ) : allAvailableCreators.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-muted-foreground space-y-4">
                              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <div>
                                <p className="font-medium">No available creators to add</p>
                                <p className="text-xs mt-2">Check console for API response details</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-muted-foreground">
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted-foreground border-t-transparent mx-auto mb-4" />
                              <p>Loading creators...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Selection footer */}
                      {selectedCreators.size > 0 && (
                        <div className="flex-shrink-0 border-t pt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              {selectedCreators.size} creator{selectedCreators.size > 1 ? 's' : ''} selected
                            </p>
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                onClick={() => setSelectedCreators(new Set())}
                                disabled={isAddingSelectedCreators}
                                size="lg"
                              >
                                Clear Selection
                              </Button>
                              <Button
                                onClick={addSelectedCreatorsToList}
                                disabled={isAddingSelectedCreators || selectedCreators.size === 0}
                                className="gap-2"
                                size="lg"
                              >
                                {isAddingSelectedCreators ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                                Add {selectedCreators.size} Creator{selectedCreators.size > 1 ? 's' : ''}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Creator Notes Dialog */}
                <Dialog open={isEditingCreator} onOpenChange={setIsEditingCreator}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Creator Notes</DialogTitle>
                      <DialogDescription>
                        Add notes about {selectedCreator?.display_name || selectedCreator?.username} for your campaign planning
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <Textarea
                        placeholder="Add your thoughts, collaboration ideas, or any notes about this creator..."
                        value={creatorNotes}
                        onChange={(e) => setCreatorNotes(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingCreator(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={updateCreatorNotes}
                        className="flex-1"
                      >
                        Save Notes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Delete Creator Confirmation */}
                <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Creator</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {creatorToDelete?.display_name || creatorToDelete?.username} from this list?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => {
                          setIsDeleteConfirmOpen(false)
                          setCreatorToDelete(null)
                        }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => creatorToDelete && removeCreatorFromList(creatorToDelete)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}