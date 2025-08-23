"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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
  FileText,
  UserPlus,
  Settings,
  Activity,
  Target,
  Zap,
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

import { AppSidebar } from "@/components/app-sidebar"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
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
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function MyListsPage() {
  const [myLists, setMyLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("updated_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
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
      console.error("Failed to load templates:", err)
    }
  }

  useEffect(() => {
    loadLists()
    loadTemplates()
  }, [sortBy, sortOrder, searchQuery])

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
      console.error("Create list error:", err)
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
    if (!window.confirm(`Are you sure you want to delete "${list.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await listsApiService.deleteList(list.id)
      toast.success("List deleted successfully!")
      loadLists()
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
      console.error("Failed to load analytics:", err)
    }
  }

  const filteredAndSortedLists = myLists
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

  const colorOptions = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffd93d", "#ff9472", "#a8e6cf", "#dda0dd", "#ffa07a", "#98fb98"]

  if (loading && myLists.length === 0) {
    return (
      <AuthGuard requireAuth={true}>
        <SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading your lists...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button variant="outline" onClick={() => loadLists()}>
                  Try Again
                </Button>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
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
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">My Lists</h1>
                  <p className="text-muted-foreground">Organize your creators into custom lists</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Create New List Button */}
                  <Button
                    onClick={() => setIsCreatingList(true)}
                    className="gap-2"
                                      >
                    <Plus className="h-4 w-4" />
                    New List
                  </Button>
                </div>
              </div>

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
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="created_at">Created</SelectItem>
                      <SelectItem value="updated_at">Updated</SelectItem>
                      <SelectItem value="profile_count">Size</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </Button>
                </div>
              </div>

              {/* Lists Grid */}
              {filteredAndSortedLists.length === 0 ? (
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
                      onClick: () => setIsCreatingList(true)
                    } : undefined}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedLists.map((list) => (
                    <Card key={list.id} className="group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: list.color || '#5100f3' }}
                            />
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg truncate">{list.name}</CardTitle>
                              {list.description && (
                                <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                                  {list.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedList(list)
                                  setNewListName(list.name)
                                  setNewListDescription(list.description || "")
                                  setSelectedColor(list.color || "#5100f3")
                                  setIsEditingList(true)
                                }}
                              >
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
                              <DropdownMenuItem
                                onClick={() => deleteList(list)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{list.profile_count} creators</span>
                          </div>
                          <span>Updated {formatDate(list.updated_at)}</span>
                        </div>
                        
                        <Button
                          onClick={() => router.push(`/my-lists/${list.id}`)}
                          className="w-full"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View List
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Create List Dialog */}
              <Dialog open={isCreatingList} onOpenChange={setIsCreatingList}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New List</DialogTitle>
                    <DialogDescription>
                      Create a new list to organize your creators
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium">List Name</label>
                      <Input
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Enter list name..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description (Optional)</label>
                      <Input
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                        placeholder="Brief description..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Color</label>
                      <div className="flex gap-2 mt-2">
                        {colorOptions.slice(0, 6).map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? 'border-[#5100f3]' : 'border-gray-300 hover:border-gray-400'} transition-colors`}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreatingList(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createList} style={{ backgroundColor: '#5100f3', color: 'white' }}>
                      Create List
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit List Dialog */}
              <Dialog open={isEditingList} onOpenChange={setIsEditingList}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit List</DialogTitle>
                    <DialogDescription>
                      Update your list details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium">List Name</label>
                      <Input
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                        className="mt-1"
                        placeholder="Brief description..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Color</label>
                      <div className="flex gap-2 mt-2">
                        {colorOptions.slice(0, 6).map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? 'border-[#5100f3]' : 'border-gray-300 hover:border-gray-400'} transition-colors`}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditingList(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateList} style={{ backgroundColor: '#5100f3', color: 'white' }}>
                      Update List
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}