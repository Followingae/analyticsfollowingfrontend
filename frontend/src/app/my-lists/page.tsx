"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { AuthGuard } from "@/components/AuthGuard"
import { instagramApiService, UnlockedProfile } from "@/services/instagramApi"
import { listsApiService, List, CreateListRequest, UpdateListRequest, ListsPaginatedResponse } from "@/services/listsApi"
import {
  Plus,
  Users,
  Eye,
  Heart,
  BarChart3,
  Search,
  X,
  Edit3,
  Trash2,
  Calendar,
  TrendingUp,
  GripVertical,
  Folder,
  FolderOpen,
  MoreHorizontal,
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
  const [listsLoading, setListsLoading] = useState(true)
  const [listsError, setListsError] = useState<string | null>(null)
  
  const [unlockedCreators, setUnlockedCreators] = useState<UnlockedProfile[]>([])
  const [unlockedLoading, setUnlockedLoading] = useState(true)
  const [selectedList, setSelectedList] = useState<List | null>(null)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [isEditingList, setIsEditingList] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [selectedColor, setSelectedColor] = useState("#ff6b6b")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"name" | "created" | "count">("name")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterByCreatorCount, setFilterByCreatorCount] = useState<"all" | "empty" | "populated">("all")
  const [isAddingCreators, setIsAddingCreators] = useState(false)
  const [selectedListForCreators, setSelectedListForCreators] = useState<List | null>(null)
  const [selectedCreatorsToAdd, setSelectedCreatorsToAdd] = useState<string[]>([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasNext: false, total: 0 })

  const router = useRouter()

  // Load lists from backend with pagination support
  const loadLists = async (page: number = 1, pageSize: number = 20) => {
    setListsLoading(true)
    setListsError(null)
    try {
      const result = await listsApiService.getAllLists()
      if (result.success && result.data) {
        // Handle the nested structure: {lists: [...], pagination: {...}}
        if (result.data && typeof result.data === 'object' && 'lists' in result.data && Array.isArray((result.data as ListsPaginatedResponse).lists)) {
          const paginatedData = result.data as ListsPaginatedResponse
          setMyLists(paginatedData.lists)
          
          // Handle pagination if provided
          if (paginatedData.pagination) {
            setPagination({
              page: paginatedData.pagination.page || page,
              totalPages: paginatedData.pagination.total_pages || 1,
              hasNext: paginatedData.pagination.has_next || false,
              total: paginatedData.pagination.total || paginatedData.lists.length
            })
          } else {
            // Reset pagination for non-paginated response
            setPagination({
              page: 1,
              totalPages: 1,
              hasNext: false,
              total: paginatedData.lists.length
            })
          }
        } else if (Array.isArray(result.data)) {
          // Fallback for direct array response
          setMyLists(result.data)
          setPagination({
            page: 1,
            totalPages: 1,
            hasNext: false,
            total: result.data.length
          })
        } else {
          setMyLists([])
          setListsError('Backend returned invalid data format')
        }
      } else {
        setListsError(result.error || 'Failed to load lists')
      }
    } catch (error) {
      setListsError('Network error while loading lists')
    } finally {
      setListsLoading(false)
    }
  }

  // Load unlocked profiles from backend
  const loadUnlockedProfiles = async () => {
    setUnlockedLoading(true)
    try {
      const result = await instagramApiService.getUnlockedProfiles(1, 50)
      if (result.success && result.data && result.data.profiles) {
        // Ensure we have a valid array of creators
        const profiles = Array.isArray(result.data.profiles) ? result.data.profiles : []
        const validProfiles = profiles.filter(profile => 
          profile && 
          typeof profile === 'object' && 
          profile.username && 
          typeof profile.username === 'string'
        )
        setUnlockedCreators(validProfiles)
      } else {
        setUnlockedCreators([])
      }
    } catch (error) {
      setUnlockedCreators([])
    } finally {
      setUnlockedLoading(false)
    }
  }

  useEffect(() => {
    loadLists()
    loadUnlockedProfiles()
  }, [])

  // Handle list creation
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error("Please enter a list name")
      return
    }

    const listData: CreateListRequest = {
      name: newListName.trim(),
      description: newListDescription.trim() || undefined,
      color: selectedColor
    }

    try {
      const result = await listsApiService.createList(listData)
      if (result.success && result.data) {
        setMyLists(prev => [...prev, result.data!])
        setNewListName("")
        setNewListDescription("")
        setIsCreatingList(false)
        toast.success(`Created list "${result.data.name}"`)
      } else {
        toast.error(result.error || 'Failed to create list')
      }
    } catch (error) {
      toast.error('Network error while creating list')
    }
  }

  // Handle list editing
  const handleEditList = (list: List) => {
    setSelectedList(list)
    setNewListName(list.name)
    setNewListDescription(list.description || "")
    setSelectedColor(list.color)
    setIsEditingList(true)
  }

  const handleUpdateList = async () => {
    if (!selectedList || !newListName.trim()) return

    const updateData: UpdateListRequest = {
      name: newListName.trim(),
      description: newListDescription.trim() || undefined,
      color: selectedColor
    }

    try {
      const result = await listsApiService.updateList(selectedList.id, updateData)
      if (result.success && result.data) {
        setMyLists(prev => prev.map(list => 
          list.id === selectedList.id ? result.data! : list
        ))
        setIsEditingList(false)
        setSelectedList(null)
        setNewListName("")
        setNewListDescription("")
        toast.success("List updated successfully")
      } else {
        toast.error(result.error || 'Failed to update list')
      }
    } catch (error) {
      toast.error('Network error while updating list')
    }
  }

  // Handle opening add creators dialog
  const handleAddCreators = (list: List) => {
    setSelectedListForCreators(list)
    setSelectedCreatorsToAdd([])
    setIsAddingCreators(true)
  }

  // Handle adding creators to list
  const handleAddSelectedCreators = async () => {
    if (!selectedListForCreators || selectedCreatorsToAdd.length === 0) {
      toast.error("Please select at least one creator")
      return
    }

    try {
      // Add each selected creator to the list
      for (const creatorUsername of selectedCreatorsToAdd) {
        const result = await listsApiService.addProfileToList(selectedListForCreators.id, {
          profile_username: creatorUsername,
          position: 0 // Backend will assign appropriate position
        })
        
        if (!result.success) {
          const errorMessage = typeof result.error === 'string' ? result.error : 'Unknown error'
          toast.error(`Failed to add ${creatorUsername}: ${errorMessage}`)
          return
        }
      }

      // Update the list's creator count locally
      setMyLists(prev => prev.map(list => 
        list.id === selectedListForCreators.id 
          ? { ...list, creator_count: list.creator_count + selectedCreatorsToAdd.length }
          : list
      ))

      toast.success(`Added ${selectedCreatorsToAdd.length} creator${selectedCreatorsToAdd.length > 1 ? 's' : ''} to "${selectedListForCreators.name}"`)
      setIsAddingCreators(false)
      setSelectedListForCreators(null)
      setSelectedCreatorsToAdd([])
    } catch (error) {
      toast.error('Failed to add creators to list')
    }
  }

  // Handle creator selection toggle
  const toggleCreatorSelection = (username: string) => {
    setSelectedCreatorsToAdd(prev => 
      prev.includes(username) 
        ? prev.filter(u => u !== username)
        : [...prev, username]
    )
  }

  // Delete list with confirmation
  const handleDeleteList = async (listId: string) => {
    const list = myLists.find(l => l.id === listId)
    if (!list) return

    if (window.confirm(`Are you sure you want to delete "${list.name}"? This action cannot be undone.`)) {
      try {
        const result = await listsApiService.deleteList(listId)
        if (result.success) {
          setMyLists(prev => prev.filter(l => l.id !== listId))
          toast.success(`Deleted list "${list.name}"`)
        } else {
          toast.error(result.error || 'Failed to delete list')
        }
      } catch (error) {
        toast.error('Network error while deleting list')
      }
    }
  }


  // Filter and sort lists - with safety check
  const filteredAndSortedLists = Array.isArray(myLists) ? myLists
    .filter(list => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = list.name.toLowerCase().includes(query)
        const matchesDescription = list.description?.toLowerCase().includes(query) || false
        if (!matchesName && !matchesDescription) {
          return false
        }
      }
      
      // Creator count filter
      switch (filterByCreatorCount) {
        case "empty":
          return list.creator_count === 0
        case "populated":
          return list.creator_count > 0
        case "all":
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "count":
          return b.creator_count - a.creator_count
        default:
          return 0
      }
    }) : []

  // Get creators in a specific list - placeholder for now, will be implemented with list items API
  const getCreatorsInList = (list: List) => {
    // For now, return empty array since we need to implement list items API
    // This will be replaced with actual API call to get list items
    return []
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const colorOptions = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffd93d", "#ff9472", "#a8e6cf", "#dda0dd", "#ffa07a", "#98fb98"]

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
                
                <Dialog open={isCreatingList} onOpenChange={setIsCreatingList}>
                  <DialogTrigger asChild>
                    <Button style={{ backgroundColor: '#5100f3', color: 'white' }} className="hover:opacity-90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New List
                    </Button>
                  </DialogTrigger>
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
                          placeholder="e.g. Fashion Creators"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description (Optional)</label>
                        <Input
                          placeholder="Brief description..."
                          value={newListDescription}
                          onChange={(e) => setNewListDescription(e.target.value)}
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
                      <Button onClick={handleCreateList} style={{ backgroundColor: '#5100f3', color: 'white' }} className="hover:opacity-90">
                        Create List
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>


              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search lists..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[250px] pl-10"
                    />
                  </div>
                  
                  {/* Filters */}
                  <Select value={filterByCreatorCount} onValueChange={(value) => setFilterByCreatorCount(value as "all" | "empty" | "populated")}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Lists</SelectItem>
                      <SelectItem value="empty">Empty Lists</SelectItem>
                      <SelectItem value="populated">With Creators</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as "name" | "created" | "count")}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="created">Recent</SelectItem>
                      <SelectItem value="count">Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-muted" : ""}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-muted" : ""}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Results Summary */}
              {(searchQuery.trim() || filterByCreatorCount !== "all") && (
                <div className="text-sm text-muted-foreground">
                  {filteredAndSortedLists.length} list{filteredAndSortedLists.length !== 1 ? 's' : ''} 
                  {searchQuery.trim() && ` matching "${searchQuery}"`}
                  {filterByCreatorCount === "empty" && " (empty)"}
                  {filterByCreatorCount === "populated" && " (with creators)"}
                  {(searchQuery.trim() || filterByCreatorCount !== "all") && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-1 ml-2 text-xs"
                      onClick={() => {
                        setSearchQuery("")
                        setFilterByCreatorCount("all")
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}

              {/* Loading State */}
              {listsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading your lists...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {listsError && !listsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <p className="text-red-600 dark:text-red-400">{listsError}</p>
                    <Button variant="outline" onClick={() => loadLists()}>
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {/* Beautiful Lists Display */}
              {!listsLoading && !listsError && (
                <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
                  {filteredAndSortedLists.map((list) => {
                    const creatorsInList = getCreatorsInList(list)
                  
                  return viewMode === "grid" ? (
                    <Card key={list.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/20 hover:to-muted/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                      {/* Accent Border */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5100f3] to-[#d3ff02]" 
                      />
                      
                      <CardHeader className="pb-4 pt-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#5100f3]" />
                              <CardTitle className="text-lg font-semibold tracking-tight leading-tight">{list.name}</CardTitle>
                            </div>
                            {list.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{list.description}</p>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditList(list)}>
                                <Edit3 className="h-3 w-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteList(list.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Statistics */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{list.creator_count} creator{list.creator_count !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(list.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Creator Preview */}
                          {list.creator_count > 0 ? (
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-3">
                                {Array.from({ length: Math.min(4, list.creator_count) }).map((_, index) => (
                                  <div 
                                    key={index} 
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5100f3]/20 to-[#d3ff02]/20 border-2 border-background flex items-center justify-center text-sm font-medium shadow-md"
                                  >
                                    {index + 1}
                                  </div>
                                ))}
                                {list.creator_count > 4 && (
                                  <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-sm font-medium shadow-md">
                                    +{list.creator_count - 4}
                                  </div>
                                )}
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="ml-auto text-xs hover:bg-[#5100f3] hover:text-white transition-colors"
                              >
                                View All
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                              <div className="text-center space-y-2">
                                <Users className="h-8 w-8 mx-auto text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">No creators yet</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs text-[#5100f3] hover:text-[#5100f3] hover:bg-[#5100f3]/10"
                                  onClick={() => handleAddCreators(list)}
                                >
                                  Add Creators
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card key={list.id} className="group border-0 bg-gradient-to-r from-background to-muted/10 hover:to-muted/20 shadow-md hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Color indicator */}
                            <div className="w-3 h-3 rounded-full bg-[#5100f3] flex-shrink-0" />
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base truncate">{list.name}</h3>
                              {list.description && (
                                <p className="text-sm text-muted-foreground truncate mt-0.5">{list.description}</p>
                              )}
                            </div>
                            
                            {/* Quick stats */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{list.creator_count}</span>
                              </div>
                              
                              {list.creator_count > 0 && (
                                <div className="flex -space-x-2">
                                  {Array.from({ length: Math.min(3, list.creator_count) }).map((_, index) => (
                                    <div 
                                      key={index} 
                                      className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5100f3]/20 to-[#d3ff02]/20 border-2 border-background flex items-center justify-center text-xs font-medium"
                                    >
                                      {index + 1}
                                    </div>
                                  ))}
                                  {list.creator_count > 3 && (
                                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                      +{list.creator_count - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditList(list)}>
                                <Edit3 className="h-3 w-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteList(list.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  )
                  })}
                </div>
              )}

              {/* Empty State */}
              {!listsLoading && !listsError && filteredAndSortedLists.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <Folder className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">
                        {searchQuery.trim() || filterByCreatorCount !== "all" ? "No lists found" : "No lists yet"}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchQuery.trim() || filterByCreatorCount !== "all" 
                          ? "Try adjusting your search or filter criteria"
                          : "Create your first list to organize your creators"
                        }
                      </p>
                    </div>
                    {(!searchQuery.trim() && filterByCreatorCount === "all") && (
                      <Button onClick={() => setIsCreatingList(true)} style={{ backgroundColor: '#5100f3', color: 'white' }} className="hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First List
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Pagination Controls */}
              {!listsLoading && !listsError && filteredAndSortedLists.length > 0 && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadLists(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadLists(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredAndSortedLists.length} of {pagination.total} lists
                  </div>
                </div>
              )}

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
                    <Button onClick={handleUpdateList} style={{ backgroundColor: '#5100f3', color: 'white' }} className="hover:opacity-90">
                      Update List
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Add Creators Dialog */}
              {isAddingCreators && selectedListForCreators && (
                <Dialog open={isAddingCreators} onOpenChange={setIsAddingCreators}>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add Creators to "{selectedListForCreators.name}"</DialogTitle>
                      <DialogDescription>
                        Select creators from your unlocked profiles to add to this list.
                      </DialogDescription>
                    </DialogHeader>
                  
                  <div className="space-y-4">
                    {unlockedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : unlockedCreators.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No unlocked creators found</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Search for Instagram profiles first to unlock them for 30 days
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[400px] overflow-y-auto space-y-2">
                        {unlockedCreators.filter(creator => creator && creator.username).map((creator) => (
                          <div
                            key={creator.username}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedCreatorsToAdd.includes(creator.username)
                                ? 'bg-[#5100f3]/10 border-[#5100f3]'
                                : 'bg-background hover:bg-muted border-border'
                            }`}
                            onClick={() => toggleCreatorSelection(creator.username)}
                          >
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5100f3]/20 to-[#d3ff02]/20 border flex items-center justify-center">
                                {creator.proxied_profile_pic_url ? (
                                  <img 
                                    src={creator.proxied_profile_pic_url} 
                                    alt={creator.full_name || creator.username}
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {(creator.full_name || creator.username || '?').charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{creator.full_name || creator.username}</p>
                              <p className="text-sm text-muted-foreground truncate">@{creator.username}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span>{(creator.followers_count || 0).toLocaleString()} followers</span>
                                {creator.is_verified && <span className="text-blue-500">✓ Verified</span>}
                                <span>{creator.days_remaining || 0} days remaining</span>
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedCreatorsToAdd.includes(creator.username)
                                  ? 'bg-[#5100f3] border-[#5100f3] text-white'
                                  : 'border-muted-foreground'
                              }`}>
                                {selectedCreatorsToAdd.includes(creator.username) && (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedCreatorsToAdd.length > 0 && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-medium">
                          Selected: {selectedCreatorsToAdd.length} creator{selectedCreatorsToAdd.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedCreatorsToAdd.filter(username => username && typeof username === 'string').map(username => (
                            <Badge key={username} variant="secondary" className="text-xs">
                              @{username}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingCreators(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddSelectedCreators}
                      disabled={selectedCreatorsToAdd.length === 0}
                      style={{ backgroundColor: '#5100f3', color: 'white' }} 
                      className="hover:opacity-90 disabled:opacity-50"
                    >
                      Add {selectedCreatorsToAdd.length > 0 ? `${selectedCreatorsToAdd.length} ` : ''}Creator{selectedCreatorsToAdd.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}