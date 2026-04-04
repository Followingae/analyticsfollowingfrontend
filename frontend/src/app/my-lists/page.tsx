"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { AuthGuard } from "@/components/AuthGuard"
import { instagramApiService, UnlockedProfile } from "@/services/instagramApi"
import { listsApiService, List, CreateListRequest, UpdateListRequest, ListsPaginatedResponse, ListTemplate, CollaborationSettings, ExportSettings, PerformanceMetrics, Collaborator, ActivityLog } from "@/services/listsApi"
import {
  Plus,
  Users,
  Eye,
  Heart,
  BarChart3,
  Search,
  List as ListIcon,
  FileText,
  X,
  Edit3,
  Trash2,
  Calendar,
  TrendingUp,
  GripVertical,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Share2,
  Copy,
  Download,
  UserPlus,
  Settings,
  Activity,
  Target,
  Zap,
  Bookmark,
  Star,
  Clock,
  ExternalLink,
} from "lucide-react"

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { superadminApiService } from "@/services/superadminApi"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

  if (loading && myLists.length === 0) {
    return (
      <AuthGuard requireAuth={true}>
        <BrandUserInterface>
            <div className="flex flex-1 flex-col items-center justify-center p-4">
              <div className="text-center space-y-4">
                <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading your lists...</p>
              </div>
            </div>
        </BrandUserInterface>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <BrandUserInterface>
            <div className="flex flex-1 flex-col items-center justify-center p-4">
              <div className="text-center space-y-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button variant="outline" onClick={() => loadLists()}>
                  Try Again
                </Button>
              </div>
            </div>
        </BrandUserInterface>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">

              {/* Tab Switcher */}
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
                <button
                  onClick={() => setActiveTab("my-lists")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "my-lists"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  My Lists
                </button>
                <button
                  onClick={() => setActiveTab("shared")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === "shared"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Shared with Me
                  {sharedLists.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-5 min-w-5 px-1.5 ml-1">
                      {sharedLists.length}
                    </Badge>
                  )}
                </button>
              </div>

              {/* === MY LISTS TAB === */}
              {activeTab === "my-lists" && (
                <>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search lists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCreateList}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New List
                  </Button>
                </div>
              </div>

              {/* Lists Grid */}
              {filteredLists.length === 0 ? (
                <div className="flex justify-center py-12">
                  <EmptyState
                    title={searchQuery.trim() ? "No lists found" : "No lists yet"}
                    description={searchQuery.trim()
                      ? "Try adjusting your search criteria\nto find the lists you're looking for."
                      : "Create your first list to get started\norganizing and managing your creators."
                    }
                    icons={[ListIcon, Users, FileText]}
                    action={!searchQuery.trim() ? {
                      label: "Create Your First List",
                      onClick: handleCreateList
                    } : undefined}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLists.map((list) => {
                    const bannerColor = list.color || '#5100f3'

                    return (
                      <Card key={list.id} className="group hover:scale-[1.02] transition-all duration-200 bg-card border border-border">
                        {/* Color banner */}
                        <div
                          className="h-2 w-full"
                          style={{ backgroundColor: bannerColor }}
                        />

                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg leading-tight truncate">
                                {list.name}
                              </CardTitle>
                              {list.description && (
                                <CardDescription className="line-clamp-2 mt-1">
                                  {list.description}
                                </CardDescription>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 ml-2"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditList(list)}>
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedListForSharing(list)
                                    setIsShareDialogOpen(true)
                                  }}
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedListForExport(list)
                                    setIsExportDialogOpen(true)
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Export
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedListForAnalytics(list)
                                    getListAnalytics(list.id)
                                    setIsAnalyticsDialogOpen(true)
                                  }}
                                >
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Analytics
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteList(list)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs mb-3 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{list.profile_count || 0} creators</span>
                            </div>
                            <span>Updated {formatDate(list.updated_at)}</span>
                          </div>

                          <Button
                            onClick={() => router.push(`/my-lists/${list.id}`)}
                            size="sm"
                            className="w-full"
                            variant="outline"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View List
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

                </>
              )}

              {/* === SHARED WITH ME TAB === */}
              {activeTab === "shared" && (
                <div className="space-y-6">
                  {sharedLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-muted-foreground mt-4">Loading shared lists...</p>
                    </div>
                  ) : sharedError ? (
                    <div className="text-center py-12">
                      <p className="text-red-600 dark:text-red-400">{sharedError}</p>
                      <Button variant="outline" className="mt-4" onClick={loadSharedLists}>
                        Try Again
                      </Button>
                    </div>
                  ) : sharedLists.length === 0 ? (
                    <div className="flex justify-center py-12">
                      <EmptyState
                        title="No shared lists"
                        description={"No influencer lists have been shared with you yet.\nShared lists from admins will appear here."}
                        icons={[Share2, Users, FileText]}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sharedLists.map((share) => {
                        const now = new Date()
                        const expiresAt = share.expires_at ? new Date(share.expires_at) : null
                        const isExpired = expiresAt && expiresAt < now
                        const isExpiringSoon = expiresAt && !isExpired && (expiresAt.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000

                        return (
                          <Card
                            key={share.share_id}
                            className="group hover:scale-[1.02] transition-all duration-200 bg-card border border-border"
                          >
                            {/* Status banner */}
                            <div
                              className={`h-2 w-full ${
                                isExpired
                                  ? 'bg-red-500'
                                  : isExpiringSoon
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="text-lg leading-tight truncate">
                                    {share.share_name}
                                  </CardTitle>
                                  {share.shared_by && (
                                    <CardDescription className="mt-1">
                                      Shared by {share.shared_by}
                                    </CardDescription>
                                  )}
                                </div>
                                <Badge
                                  variant={isExpired ? 'destructive' : isExpiringSoon ? 'outline' : 'secondary'}
                                  className="text-xs ml-2 shrink-0"
                                >
                                  {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between text-xs mb-3 text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{share.influencers?.length || 0} influencers</span>
                                </div>
                                {expiresAt && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {isExpired
                                        ? `Expired ${formatDate(share.expires_at!)}`
                                        : `Expires ${formatDate(share.expires_at!)}`
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                              {share.categories && share.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {share.categories.slice(0, 3).map((cat) => (
                                    <Badge key={cat} variant="outline" className="text-xs">
                                      {cat}
                                    </Badge>
                                  ))}
                                  {share.categories.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{share.categories.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <Button
                                onClick={() => router.push('/shared-influencers')}
                                size="sm"
                                className="w-full"
                                variant="outline"
                                disabled={isExpired}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Influencers
                              </Button>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
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

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <Input
                        placeholder="Enter list name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                      <Textarea
                        placeholder="Enter description"
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Banner Color</label>
                      <div className="flex gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              selectedColor === color
                                ? 'border-gray-400 scale-110'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreatingList(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createList}
                      className="flex-1"
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

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <Input
                        placeholder="Enter list name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                      <Textarea
                        placeholder="Enter description"
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Banner Color</label>
                      <div className="flex gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              selectedColor === color
                                ? 'border-gray-400 scale-110'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingList(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={updateList}
                      className="flex-1"
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
            </div>
          </div>
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