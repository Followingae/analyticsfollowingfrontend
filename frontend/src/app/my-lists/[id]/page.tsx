'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
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
  Check,
  BadgeCheck
} from 'lucide-react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { listsApiService } from '@/services/listsApi'
import { UnlockedProfile } from '@/services/instagramApi'
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
import { cdnAvatar } from "@/lib/avatar"
import {
  Page,
  PageHead,
  ListRow,
  LoadFailed,
  Nothing,
  Loading,
  compact,
} from "@/components/brand/primitives"

/** The one way back, above the title rather than beside it. */
function BackLink() {
  return (
    <Link
      href="/my-lists"
      className="-ml-1 inline-flex w-fit items-center gap-1.5 text-ds-body-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Your lists
    </Link>
  )
}

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

function transformListResponse(data: any): ListDetail {
  const items: ListItem[] = (data.items || []).map((item: any) => {
    const profile = item.profile || {}
    return {
      id: item.id,
      username: profile.username || item.username || '',
      display_name: profile.full_name || item.display_name || profile.username || item.username || '',
      notes: item.notes || '',
      added_at: item.added_at,
      avatar_url: profile.profile_pic_url || item.avatar_url || '',
    }
  })
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    color: data.color || '#3B82F6',
    creator_count: data.items_count ?? items.length,
    created_at: data.created_at,
    updated_at: data.updated_at,
    items,
  }
}

export default function ListDetailPage() {
  const params = useParams()
  const listId = params.id as string
  const [list, setList] = useState<ListDetail | null>(null)
  const [loading, setLoading] = useState(true)
  /**
   * Three states, not two.
   *
   * This page used to `catch (error) { setLoading(false) }` and then render "List not
   * found. The list you're looking for doesn't exist." That sentence was printed over a
   * 500, over a 403, and over a dropped connection. It is the worst version of the bug
   * this codebase keeps repeating, because it does not merely omit information, it
   * asserts something false about the client's own data.
   *
   * `loadError` now separates "we could not ask" from "we asked and it is not there".
   */
  const [loadError, setLoadError] = useState<string | null>(null)

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

  const loadListData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await listsApiService.getListDetails(listId, { include_profiles: true })
      if (response.success && response.data) {
        setList(transformListResponse(response.data))
      } else {
        // The request came back and said no. Only a 404 is genuinely "not there"; every
        // other failure is ours and must say so.
        const msg = response.error || ''
        if (/404|not found/i.test(msg)) {
          setList(null)
        } else {
          setLoadError(msg || 'We could not load this list.')
        }
      }
    } catch (error: any) {
      setLoadError(error?.message || 'We could not load this list.')
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    if (listId) loadListData()
  }, [listId, loadListData])

  const loadAvailableCreators = async () => {
    setSearchLoading(true)
    try {


      // The lists/available-profiles endpoint has UUID validation issues
      // Let's use the auth/unlocked-profiles endpoint instead

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

      } else {
        const errorData = await response.json()

        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
      }

      // Convert response to our expected format
      const apiResponse = { success: response.ok, data }



      if (apiResponse.success) {


        // Handle different possible response structures
        let profiles = []

        // Try different potential data structures
        if (data && data.profiles && Array.isArray(data.profiles)) {
          profiles = data.profiles

        } else if (data && data.items && Array.isArray(data.items)) {
          profiles = data.items

        } else if (data && Array.isArray(data)) {
          profiles = data

        } else if (Array.isArray(data)) {
          profiles = data

        } else {


        }

        if (profiles.length > 0) {
          // Log a sample profile to understand the structure


          // Convert unlocked profiles to expected format using high-quality CDN images
          const convertedProfiles = profiles.map((profile, index) => {


            // Create safe profile object with fallbacks
            const safeProfile = {
              username: profile.username || profile.handle || `user_${index}`,
              full_name: profile.full_name || profile.name || profile.display_name || '',
              profile_pic_url: profile.cdn_avatar_url || profile.profile_pic_url_hd || profile.profile_pic_url || profile.avatar_url || '',
              // Keep null rather than collapsing to 0: a creator we could not measure
              // must not be rendered as a creator measured at nothing.
              followers_count: profile.followers_count ?? profile.followers ?? null,
              engagement_rate: profile.engagement_rate ?? null,
              is_verified: profile.is_verified || false
            } as unknown as UnlockedProfile


            return safeProfile
          })

          setAllAvailableCreators(convertedProfiles)
          setSearchResults(convertedProfiles)
        } else {


          setAllAvailableCreators([])
          setSearchResults([])
        }
      } else {

        setAllAvailableCreators([])
        setSearchResults([])
        toast.error('Failed to load unlocked creators')
      }
    } catch (error) {

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
        if (response.success && response.data && Array.isArray(response.data.items)) {
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
        if (updatedResponse.success && updatedResponse.data) {
          setList(transformListResponse(updatedResponse.data))
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
        if (updatedResponse.success && updatedResponse.data) {
          setList(transformListResponse(updatedResponse.data))
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
        if (updatedResponse.success && updatedResponse.data) {
          setList(transformListResponse(updatedResponse.data))
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
      <BrandUserInterface>
          {/* Density tier: WORKING at the head, SCANNING in the roster. The roster used to
              be a grid of cards, one border per creator, with the note wrapped in a second
              tinted box inside it. A list of people is a list: one hairline per row, the
              note beside the name, four rows of air saved. */}
          <Page tier="working">
            {loading ? (
              <>
                <PageHead title="Loading this list" />
                <Loading rows={5} />
              </>
            ) : loadError ? (
              <>
                <PageHead
                  back={<BackLink />}
                  title="This list"
                />
                <LoadFailed what="This list" detail={loadError} onRetry={loadListData} />
              </>
            ) : !list ? (
              <>
                <PageHead back={<BackLink />} title="List not found" />
                <Nothing action={
                  <Button variant="outline" asChild>
                    <Link href="/my-lists">Back to your lists</Link>
                  </Button>
                }>
                  This list has been deleted, or it was never yours.
                </Nothing>
              </>
            ) : (
              <>
                <PageHead
                  back={<BackLink />}
                  title={
                    <span className="flex items-center gap-ds-3">
                      <span
                        aria-hidden
                        className="h-7 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: list.color }}
                      />
                      <span className="min-w-0 truncate">{list.name}</span>
                    </span>
                  }
                  sub={
                    list.description ||
                    `${list.items.length} creator${list.items.length === 1 ? '' : 's'} on this shortlist.`
                  }
                  action={
                    <>
                      {/* No handler wired yet, kept visible but honest. */}
                      <Button variant="ghost" size="sm" onClick={() => toast.info("Sharing lists is coming soon.")}>
                        <Share className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toast.info("Exporting lists is coming soon.")}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button
                        onClick={() => {
                          setIsAddingCreator(true)
                          loadAvailableCreators()
                        }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add creator
                      </Button>
                    </>
                  }
                />

                {list.items.length > 0 ? (
                  <div className="flex flex-col border-t border-border/70">
                    {list.items.map((creator) => (
                      <ListRow key={creator.id}>
                        {/* cdnAvatar(): raw scontent-*.cdninstagram.com URLs are hotlink
                            blocked and render as a broken image. This row was passing
                            avatar_url through untouched while the dialog below already
                            went through the helper. */}
                        {creator.avatar_url ? (
                          <img
                            src={cdnAvatar(creator.avatar_url)}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-ds-full object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-ds-full bg-muted text-ds-label text-muted-foreground">
                            {creator.display_name?.charAt(0)?.toUpperCase() || creator.username?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}

                        <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                          <span className="truncate text-ds-label font-semibold">
                            {creator.display_name || creator.username}
                          </span>
                          <span className="truncate text-ds-body-sm text-muted-foreground">
                            @{creator.username}
                          </span>
                        </div>

                        {/* The note, as a column rather than a tinted box inside a card. */}
                        <div className="hidden min-w-0 flex-1 md:block">
                          {creator.notes ? (
                            <p className="truncate text-ds-body-sm text-muted-foreground" title={creator.notes}>
                              {creator.notes}
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleEditCreator(creator)}
                              className="text-ds-body-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                            >
                              Add a note
                            </button>
                          )}
                        </div>

                        <span className="hidden shrink-0 text-ds-body-sm text-muted-foreground lg:block">
                          Added {new Date(creator.added_at).toLocaleDateString()}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Actions for ${creator.username}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCreator(creator)}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit note
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteCreator(creator)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </ListRow>
                    ))}
                  </div>
                ) : (
                  <Nothing action={
                    <Button
                      onClick={() => {
                        setIsAddingCreator(true)
                        loadAvailableCreators()
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add a creator
                    </Button>
                  }>
                    Nobody on this list yet.
                  </Nothing>
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

                    <div className="flex min-h-0 flex-1 flex-col gap-ds-3">
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
                                <button
                                  key={username}
                                  type="button"
                                  aria-pressed={isSelected}
                                  className="flex flex-col items-center gap-ds-2 text-left outline-none"
                                  onClick={() => toggleCreatorSelection(username)}
                                >
                                  {/* The face carries the tile and nothing is ever written
                                      over it. Selection is a ring on the theme's primary,
                                      not a green wash across the photograph; the whole
                                      point of this grid is being able to see the person. */}
                                  <div
                                    className={`relative aspect-square w-full overflow-hidden rounded-ds-lg bg-muted transition-shadow ${
                                      isSelected
                                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                                        : 'hover:ring-2 hover:ring-border hover:ring-offset-2 hover:ring-offset-background'
                                    }`}
                                  >
                                    {creator.profile_pic_url ? (
                                      <img
                                        src={cdnAvatar(creator.profile_pic_url)}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="grid h-full w-full place-items-center text-ds-heading text-muted-foreground">
                                        {creator.full_name?.charAt(0) || creator.username?.charAt(0)?.toUpperCase() || '?'}
                                      </span>
                                    )}

                                    {isSelected && (
                                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-ds-full bg-primary text-primary-foreground">
                                        <Check className="h-3.5 w-3.5" />
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex w-full min-w-0 flex-col gap-ds-1">
                                    <span className="flex min-w-0 items-center gap-ds-1">
                                      <span className="truncate text-ds-body-sm font-medium">
                                        {username !== `unknown-${index}` ? `@${username}` : 'No username'}
                                      </span>
                                      {creator.is_verified && (
                                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                                      )}
                                    </span>
                                    {/* An en dash, not "No follower data": a creator with
                                        no follower count has failed to scrape, and the row
                                        should not imply we measured them at nothing. */}
                                    <span className="text-ds-caption tabular-nums text-muted-foreground">
                                      {compact(creator.followers_count, true)} followers
                                    </span>
                                  </div>
                                </button>
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
                            <div className="flex flex-col gap-ds-3 text-center text-muted-foreground">
                              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <div>
                                <p className="font-medium">No available creators to add</p>
                                <p className="text-xs mt-2">Every creator you&apos;ve unlocked is already in this list. Unlock more from Discovery to add them here.</p>
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

                    <div className="flex max-w-[640px] flex-col gap-ds-3">
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
              </>
            )}
          </Page>
      </BrandUserInterface>
    </AuthGuard>
  )
}