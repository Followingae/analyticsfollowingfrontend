"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Users,
  Heart,
  MapPin,
  Star,
  ChevronDown,
  Unlock,
  Eye,
  TrendingUp,
  Globe,
  Target,
  Plus,
  X,
  Check,
} from "lucide-react"
import ReactCountryFlag from "react-country-flag"

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Checkbox } from "@/components/ui/checkbox"
import { getCountryCode } from "@/lib/countryUtils"

export default function DiscoverPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")
  const [location, setLocation] = useState("all")
  const [tier, setTier] = useState("all")
  const [platform, setPlatform] = useState("all")
  const [minFollowers, setMinFollowers] = useState([1000])
  const [maxFollowers, setMaxFollowers] = useState([1000000])
  const [minEngagement, setMinEngagement] = useState([1])
  const [maxEngagement, setMaxEngagement] = useState([10])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isPlatformDrawerOpen, setIsPlatformDrawerOpen] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [draggedCreator, setDraggedCreator] = useState<any>(null)
  const [selectedCreators, setSelectedCreators] = useState<Set<number>>(new Set())
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false)
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false)
  const [creatorToUnlock, setCreatorToUnlock] = useState<any>(null)
  
  // TODO: Replace with real backend data
  const creators: any[] = []
  
  // TODO: Replace with real backend data  
  const discoverData = {
    totalCreators: '--',
    brandReady: '--', 
    avgROI: '--',
    successRate: '--'
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handleCreatorSelection = (creatorId: number) => {
    const newSelected = new Set(selectedCreators)
    if (newSelected.has(creatorId)) {
      newSelected.delete(creatorId)
    } else {
      newSelected.add(creatorId)
    }
    setSelectedCreators(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedCreators.size === creators.length) {
      setSelectedCreators(new Set())
    } else {
      const newSelected = new Set(creators.map(creator => creator.id))
      setSelectedCreators(newSelected)
    }
  }

  const handleBulkUnlock = () => {
    const selectedCount = selectedCreators.size
    if (selectedCount > 0) {
      toast.success(`Unlocking ${selectedCount} creator${selectedCount > 1 ? 's' : ''}...`)
      setSelectedCreators(new Set())
    }
  }

  const handleUnlockCreator = (creator: any) => {
    setCreatorToUnlock(creator)
    setUnlockDialogOpen(true)
  }

  const confirmUnlockCreator = () => {
    if (creatorToUnlock) {
      toast.success(`${creatorToUnlock.full_name} has been unlocked!`)
      setUnlockDialogOpen(false)
      setCreatorToUnlock(null)
    }
  }

  // Filter and paginate creators
  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.username?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const resultsPerPage = 12
  const totalPages = Math.ceil(filteredCreators.length / resultsPerPage)
  const startIndex = (currentPage - 1) * resultsPerPage
  const endIndex = startIndex + resultsPerPage
  const currentResults = filteredCreators.slice(startIndex, endIndex)

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
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Discover Creators</h1>
              </div>
            </div>

            {/* Overview Cards */}
            <SectionCards mode="discover" discoverData={discoverData} />

            {/* Empty State */}
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No creators found</h3>
                <p className="text-muted-foreground text-center">
                  Connect to backend to load creator discovery data
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}