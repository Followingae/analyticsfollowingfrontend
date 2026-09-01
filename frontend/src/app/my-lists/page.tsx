"use client"

import { useState, useEffect, Suspense, type MouseEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { AuthGuard } from "@/components/AuthGuard"
import { UnlockedProfile } from "@/services/instagramApi"
import { listsApiService, List, CreateListRequest, UpdateListRequest, ListTemplate, CollaborationSettings, ExportSettings, PerformanceMetrics, Collaborator, ActivityLog } from "@/services/listsApi"
import {
  Plus,
  Search,
  BarChart3,
  Edit3,
  Trash2,
  MoreHorizontal,
  Share2,
  Download,
  ExternalLink,
} from "lucide-react"

import { superadminApiService } from "@/services/superadminApi"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Page,
  PageHead,
  ListRow,
  LoadFailed,
  Nothing,
  Loading,
  UNKNOWN,
} from "@/components/brand/primitives"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

interface SharedListData {
  share_id: string
  share_name: string
  influencers: any[]
  expires_at: string | null
  shared_by?: string
  categories?: string[]
  is_active?: boolean
}

function MyListsContent() {
  const [activeTab, setActiveTab] = useState<"my-lists" | "shared">("my-lists")
  const [myLists, setMyLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Shared lists state
  const [sharedLists, setSharedLists] = useState<SharedListData[]>([])
  const [sharedLoading, setSharedLoading] = useState(false)
  const [sharedError, setSharedError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  })

  // Dialog states
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [isEditingList, setIsEditingList] = useState(false)
  const [selectedList, setSelectedList] = useState<List | null>(null)
  const [isAddingCreators, setIsAddingCreators] = useState(false)
  const [selectedListForCreators, setSelectedListForCreators] = useState<List | null>(null)
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedListForSharing, setSelectedListForSharing] = useState<List | null>(null)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedListForExport, setSelectedListForExport] = useState<List | null>(null)
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false)
  const [selectedListForAnalytics, setSelectedListForAnalytics] = useState<List | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedListForDeletion, setSelectedListForDeletion] = useState<List | null>(null)

  // Form states
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [selectedColor, setSelectedColor] = useState("#5100f3")
  const [searchResults, setSearchResults] = useState<UnlockedProfile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [creatorSearchQuery, setCreatorSearchQuery] = useState("")
  const [selectedProfiles, setSelectedProfiles] = useState<UnlockedProfile[]>([])

  // Enhanced features state
  const [templates, setTemplates] = useState<ListTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [listPerformance, setListPerformance] = useState<PerformanceMetrics | null>(null)

  const router = useRouter()

  const loadLists = async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      const response = await listsApiService.getAllLists()

      if (response.success && response.data) {
        // Handle both array and paginated response formats
        if (Array.isArray(response.data)) {
          setMyLists(response.data)
          setPagination({
            page: 1,
            limit: response.data.length,
            total: response.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false
          })
        } else {
          // Handle paginated response
          setMyLists(response.data.lists || response.data.data || [])
          setPagination({
            page: response.data.pagination?.page || 1,
            limit: response.data.pagination?.limit || 20,
            total: response.data.pagination?.total || 0,
            totalPages: response.data.pagination?.total_pages || 1,
            hasNext: response.data.pagination?.has_next || false,
            hasPrevious: response.data.pagination?.has_previous || false
          })
        }
      } else {
        throw new Error(response.error || 'Failed to load lists')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load lists")
      toast.error("Failed to load your lists")
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const templatesResponse = await listsApiService.getListTemplates()
      setTemplates(templatesResponse)
    } catch (err) {
      console.error('Failed to load list templates:', err)
    }
  }

  const loadSharedLists = async () => {
    try {
      setSharedLoading(true)
      setSharedError(null)
      const response = await superadminApiService.getSharedListsForUser()
      if (response.success && response.data) {
        // Backend returns { lists: [...], total_count: N }
        const lists = response.data?.lists || response.data || []
        if (Array.isArray(lists)) {
          setSharedLists(lists.map((share: any) => ({
            share_id: share.id || '',
            share_name: share.name || 'Shared List',
            influencers: Array.from({ length: share.influencer_count || 0 }),
            expires_at: share.expires_at || null,
            shared_by: share.shared_by || share.created_by || '',
            categories: share.categories || [],
            is_active: share.is_active !== false,
          })))
        }
      } else {
        setSharedError(response.error || 'Failed to load shared lists')
      }
    } catch (err: any) {
      setSharedError('Failed to load shared lists')
    } finally {
      setSharedLoading(false)
    }
  }

  // Check URL params for initial tab
  const searchParams = useSearchParams()
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'shared') {
      setActiveTab('shared')
    }
  }, [searchParams])

  useEffect(() => {
    loadLists()
    loadTemplates()
  }, [searchQuery])

  // Load shared lists when switching to shared tab
  useEffect(() => {
    if (activeTab === 'shared') {
      loadSharedLists()
    }
  }, [activeTab])

  const createList = async () => {
    if (!newListName.trim()) {
      toast.error("Please enter a list name")
      return
    }

    try {
      const listData: CreateListRequest = {
        name: newListName.trim(),
        description: newListDescription.trim(),
        color: selectedColor
      }

      await listsApiService.createList(listData)

      toast.success("List created successfully!")
      setIsCreatingList(false)
      setNewListName("")
      setNewListDescription("")
      setSelectedColor("#5100f3")

      loadLists()
    } catch (err: any) {

      toast.error(err.response?.data?.detail || "Failed to create list")
    }
  }

  const createListFromTemplate = async () => {
    if (!selectedTemplate || !newListName.trim()) {
      toast.error("Please select a template and enter a list name")
      return
    }

    try {
      await listsApiService.createListFromTemplate(selectedTemplate, {
        name: newListName.trim(),
        description: newListDescription.trim(),
        color: selectedColor
      })

      toast.success("List created from template!")
      setIsCreatingFromTemplate(false)
      setSelectedTemplate("")
      setNewListName("")
      setNewListDescription("")
      setSelectedColor("#5100f3")

      loadLists()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create list from template")
    }
  }

  const updateList = async () => {
    if (!selectedList || !newListName.trim()) return

    try {
      const updateData: UpdateListRequest = {
        name: newListName.trim(),
        description: newListDescription.trim(),
        color: selectedColor
      }

      await listsApiService.updateList(selectedList.id, updateData)

      toast.success("List updated successfully!")
      setIsEditingList(false)
      setSelectedList(null)
      setNewListName("")
      setNewListDescription("")
      setSelectedColor("#5100f3")

      loadLists()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update list")
    }
  }

  const deleteList = async (list: List) => {
    setSelectedListForDeletion(list)
    setIsDeleteConfirmOpen(true)
  }

  const confirmDeleteList = async () => {
    if (!selectedListForDeletion) return

    try {
      const response = await listsApiService.deleteList(selectedListForDeletion.id)
      if (response.success) {
        toast.success("List deleted successfully!")
        loadLists()
        setIsDeleteConfirmOpen(false)
        setSelectedListForDeletion(null)
      } else {
        toast.error(response.error || "Failed to delete list")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete list")
    }
  }

  const shareList = async (listId: string, settings: CollaborationSettings) => {
    try {
      await listsApiService.shareList(listId, settings)
      toast.success("List sharing settings updated!")
      setIsShareDialogOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update sharing settings")
    }
  }

  const exportList = async (listId: string, settings: ExportSettings) => {
    try {
      const blob = await listsApiService.exportList(listId, settings)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `list-export-${Date.now()}.${settings.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success("List exported successfully!")
      setIsExportDialogOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to export list")
    }
  }

  const getListAnalytics = async (listId: string) => {
    try {
      const [performance, activity] = await Promise.all([
        listsApiService.getPerformanceMetrics(listId),
        listsApiService.getActivityLog(listId)
      ])
      setListPerformance(performance)
      setActivityLog(activity)
    } catch (err) {
      console.error('Failed to load list analytics:', err)
    }
  }

  const filteredLists = myLists
    .filter(list =>
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleCreateList = () => {
    setIsCreatingList(true)
  }

  const handleEditList = (list: List) => {
    setSelectedList(list)
    setNewListName(list.name)
    setNewListDescription(list.description || '')
    setSelectedColor(list.color || '#5100f3')
    setIsEditingList(true)
  }

  const colorOptions = [
    "#5100f3", // primary
    "#8b5cf6", // purple variant
    "#10b981", // emerald
    "#f59e0b", // amber
    "#06b6d4", // cyan
    "#64748b", // slate
    "#475569", // darker slate
    "#94a3b8", // light slate
    "#ef4444"  // red
  ]

  // The three states, kept apart. Loading shows the page's own shape; the failure says it
  // is a failure and never falls through into the "No lists yet" copy, which is what an
  // empty grid over a 500 used to tell a client who had fourteen lists.
  if (loading && myLists.length === 0) {
    return (
      <AuthGuard requireAuth={true}>
        <BrandUserInterface>
          <Page tier="working">
            <PageHead title="Your lists" sub="Shortlists of creators you are considering." />
            <Loading rows={4} />
          </Page>
        </BrandUserInterface>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <BrandUserInterface>
          <Page tier="working">
            <PageHead title="Your lists" />
            <LoadFailed what="Your lists" detail={error} onRetry={() => loadLists()} />
          </Page>
        </BrandUserInterface>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
          {/* Density tier: WORKING. A list is not a card: the boxes came off and one shared
              hairline per row went on, which fits eight rows where four used to sit and
              stops each list claiming to be a separate object. The user's chosen colour
              survives as a swatch on the row rather than a full-bleed banner. */}
          <Page tier="working">

            <PageHead
              title="Your lists"
              sub="Shortlists of creators you are considering. Open one to add people, or write a note against a name."
              action={
                activeTab === "my-lists" ? (
                  <Button onClick={handleCreateList}>
                    <Plus className="mr-2 h-4 w-4" />
                    New list
                  </Button>
                ) : undefined
              }
            />

            {/* Two populations of the same thing, so a quiet underline switch rather than
                a filled pill group that competes with the page's one primary action. */}
            <div className="flex items-center gap-ds-5 border-b border-border/70">
              {([
                { key: "my-lists" as const, label: "Yours" },
                { key: "shared" as const, label: "Shared with you" },
              ]).map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`-mb-px flex items-center gap-ds-2 border-b-2 pb-ds-2 text-ds-label transition-colors ${
                    activeTab === t.key
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {t.key === "shared" && sharedLists.length > 0 && (
                    <span className="text-ds-caption tabular-nums text-muted-foreground">{sharedLists.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* === YOURS === */}
            {activeTab === "my-lists" && (
              <>
                <div className="flex flex-col gap-ds-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-[280px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search your lists"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {/* The count reflects what is SELECTED once a search is on. */}
                  <p className="text-ds-body-sm text-muted-foreground sm:ml-auto">
                    {searchQuery.trim()
                      ? `${filteredLists.length} of ${myLists.length} shown`
                      : `${myLists.length} list${myLists.length === 1 ? '' : 's'}`}
                  </p>
                </div>

                {filteredLists.length === 0 ? (
                  searchQuery.trim() ? (
                    <Nothing>No list matches that search.</Nothing>
                  ) : (
                    <Nothing action={
                      <Button onClick={handleCreateList}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create your first list
                      </Button>
                    }>
                      You have not made a list yet.
                    </Nothing>
                  )
                ) : (
                  <div className="flex flex-col border-t border-border/70">
                    {filteredLists.map((list) => (
                      <ListRow key={list.id} onClick={() => router.push(`/my-lists/${list.id}`)}>
                        <span
                          aria-hidden
                          className="h-8 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: list.color || '#5100f3' }}
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                          <span className="truncate text-ds-label font-semibold">{list.name}</span>
                          {list.description && (
                            <span className="truncate text-ds-body-sm text-muted-foreground">{list.description}</span>
                          )}
                        </div>
                        {/* Two bugs in one line, both of which printed "0 creators".
                            The field is `profiles_count` — the page has always read
                            `profile_count`, which does not exist on `List`, so every list
                            resolved to `undefined`. And `|| 0` then turned that undefined
                            into a confident zero. It is `?? UNKNOWN` now, so a count we do
                            not have shows an en dash rather than claiming the list is
                            empty. */}
                        <span className="hidden shrink-0 text-ds-body-sm tabular-nums text-muted-foreground sm:block">
                          {list.profiles_count ?? UNKNOWN} creators
                        </span>
                        <span className="hidden shrink-0 text-ds-body-sm text-muted-foreground lg:block">
                          Updated {formatDate(list.updated_at)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e: MouseEvent) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Actions for ${list.name}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e: MouseEvent) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleEditList(list)}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {/* Share / Export / Analytics have no dialog wired yet. Kept
                                visible but honest — they announce that rather than silently
                                setting state no dialog consumes. */}
                            <DropdownMenuItem onClick={() => toast.info("Sharing lists is coming soon.")}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Exporting lists is coming soon.")}>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("List analytics are coming soon.")}>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteList(list)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </ListRow>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* === SHARED WITH YOU === */}
            {activeTab === "shared" && (
              sharedLoading ? (
                <Loading rows={3} />
              ) : sharedError ? (
                <LoadFailed what="Lists shared with you" detail={sharedError} onRetry={loadSharedLists} />
              ) : sharedLists.length === 0 ? (
                <Nothing>Nobody has shared a list with you yet.</Nothing>
              ) : (
                <div className="flex flex-col border-t border-border/70">
                  {sharedLists.map((share) => {
                    const now = new Date()
                    const expiresAt = share.expires_at ? new Date(share.expires_at) : null
                    const isExpired = expiresAt ? expiresAt < now : false
                    const isExpiringSoon = expiresAt ? (!isExpired && (expiresAt.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000) : false

                    return (
                      <ListRow
                        key={share.share_id}
                        onClick={isExpired ? undefined : () => router.push('/shared-influencers')}
                      >
                        {/* Status as a dot plus the word beside it, from the global
                            semantic tokens. It was a raw bg-red-500 / bg-amber-500 /
                            bg-emerald-500 banner, three colours this theme does not own. */}
                        <span
                          aria-hidden
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            isExpired ? 'bg-danger' : isExpiringSoon ? 'bg-warning' : 'bg-success'
                          }`}
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                          <span className="truncate text-ds-label font-semibold">{share.share_name}</span>
                          <span className="truncate text-ds-body-sm text-muted-foreground">
                            {share.shared_by ? `Shared by ${share.shared_by}. ` : ''}
                            {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring soon' : 'Active'}
                            {expiresAt ? `, ${isExpired ? 'ended' : 'until'} ${formatDate(share.expires_at!)}` : ''}
                          </span>
                        </div>
                        {share.categories && share.categories.length > 0 && (
                          <span className="hidden shrink-0 text-ds-body-sm text-muted-foreground lg:block">
                            {share.categories.slice(0, 3).join(', ')}
                            {share.categories.length > 3 ? ` +${share.categories.length - 3}` : ''}
                          </span>
                        )}
                        <span className="hidden shrink-0 text-ds-body-sm tabular-nums text-muted-foreground sm:block">
                          {share.influencers?.length ?? 0} influencers
                        </span>
                        {!isExpired && <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      </ListRow>
                    )
                  })}
                </div>
              )
            )}

              {/* Create List Dialog */}
              <Dialog open={isCreatingList} onOpenChange={setIsCreatingList}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New List</DialogTitle>
                    <DialogDescription>
                      Create a new list to organize your creators
                    </DialogDescription>
                  </DialogHeader>

                  {/* A form with rhythm: 8px from a label to its input, 16px between
                      siblings, and 40px before the actions because they are a different
                      subject. Nothing is wrapped in a box. */}
                  <div className="flex max-w-[640px] flex-col gap-ds-3">
                    <div className="flex flex-col gap-ds-2">
                      <label className="text-ds-label">Name</label>
                      <Input
                        placeholder="Ramadan shortlist"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-ds-2">
                      <label className="text-ds-label">Description</label>
                      <Textarea
                        placeholder="What this list is for. Optional."
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col gap-ds-2">
                      <label className="text-ds-label">Colour</label>
                      <div className="flex flex-wrap gap-ds-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            aria-label={`Colour ${color}`}
                            aria-pressed={selectedColor === color}
                            onClick={() => setSelectedColor(color)}
                            className={`h-7 w-7 rounded-ds-full transition-transform ${
                              selectedColor === color
                                ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background'
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-ds-5 flex gap-ds-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsCreatingList(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createList}
                      disabled={!newListName.trim()}
                    >
                      Create List
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit List Dialog */}
              <Dialog open={isEditingList} onOpenChange={setIsEditingList}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit List</DialogTitle>
                    <DialogDescription>
                      Update your list details
                    </DialogDescription>
                  </DialogHeader>

                  {/* A form with rhythm: 8px from a label to its input, 16px between
                      siblings, and 40px before the actions because they are a different
                      subject. Nothing is wrapped in a box. */}
                  <div className="flex max-w-[640px] flex-col gap-ds-3">
                    <div className="flex flex-col gap-ds-2">
                      <label className="text-ds-label">Name</label>
                      <Input
                        placeholder="Ramadan shortlist"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-ds-2">
                      <label className="text-ds-label">Description</label>
                      <Textarea
                        placeholder="What this list is for. Optional."
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col gap-ds-2">
                      <label className="text-ds-label">Colour</label>
                      <div className="flex flex-wrap gap-ds-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            aria-label={`Colour ${color}`}
                            aria-pressed={selectedColor === color}
                            onClick={() => setSelectedColor(color)}
                            className={`h-7 w-7 rounded-ds-full transition-transform ${
                              selectedColor === color
                                ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background'
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-ds-5 flex gap-ds-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditingList(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={updateList}
                      disabled={!newListName.trim()}
                    >
                      Update List
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete List</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{selectedListForDeletion?.name}"?
                      This action cannot be undone and will permanently remove all creators from this list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setIsDeleteConfirmOpen(false)
                        setSelectedListForDeletion(null)
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmDeleteList}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete List
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </Page>
      </BrandUserInterface>
    </AuthGuard>
  )
}

export default function MyListsPage() {
  return (
    <Suspense>
      <MyListsContent />
    </Suspense>
  )
}