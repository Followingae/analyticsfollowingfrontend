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
  
  const creators = [
    { id: 1, username: "fashionista_sarah", full_name: "Sarah Johnson", profile_pic_url: "/avatars/01.png", followers: 245000, engagement_rate: 4.2, categories: ["Fashion", "Lifestyle", "Beauty"], location: "New York, USA", is_verified: true, unlocked: false },
    { id: 2, username: "tech_reviewer_mike", full_name: "Mike Chen", profile_pic_url: "/avatars/02.png", followers: 186000, engagement_rate: 5.8, categories: ["Technology", "Reviews"], location: "San Francisco, USA", is_verified: true, unlocked: true },
    { id: 3, username: "fitness_queen_anna", full_name: "Anna Rodriguez", profile_pic_url: "/avatars/03.png", followers: 320000, engagement_rate: 3.9, categories: ["Fitness", "Wellness", "Health"], location: "Miami, USA", is_verified: false, unlocked: false },
    { id: 4, username: "travel_with_elena", full_name: "Elena Rossi", profile_pic_url: "/avatars/04.png", followers: 156000, engagement_rate: 6.3, categories: ["Travel", "Photography"], location: "Rome, Italy", is_verified: true, unlocked: false },
    { id: 5, username: "foodie_james", full_name: "James Wilson", profile_pic_url: "/avatars/05.png", followers: 290000, engagement_rate: 4.8, categories: ["Food", "Restaurants", "Cooking"], location: "London, UK", is_verified: false, unlocked: false },
    { id: 6, username: "beauty_by_maya", full_name: "Maya Patel", profile_pic_url: "/avatars/06.png", followers: 425000, engagement_rate: 5.1, categories: ["Beauty", "Skincare", "Fashion"], location: "Mumbai, India", is_verified: true, unlocked: false },
    { id: 7, username: "art_lover_alex", full_name: "Alex Thompson", profile_pic_url: "/avatars/07.png", followers: 78000, engagement_rate: 7.2, categories: ["Art", "Design", "Culture"], location: "Paris, France", is_verified: false, unlocked: true },
    { id: 8, username: "gaming_guru_max", full_name: "Max Rodriguez", profile_pic_url: "/avatars/08.png", followers: 512000, engagement_rate: 8.1, categories: ["Gaming", "Technology", "Entertainment"], location: "Tokyo, Japan", is_verified: true, unlocked: false },
    { id: 9, username: "lifestyle_luna", full_name: "Luna Williams", profile_pic_url: "/avatars/09.png", followers: 195000, engagement_rate: 5.3, categories: ["Lifestyle", "Fashion", "Travel"], location: "Sydney, Australia", is_verified: true, unlocked: true },
    { id: 10, username: "cook_with_carlos", full_name: "Carlos Martinez", profile_pic_url: "/avatars/10.png", followers: 367000, engagement_rate: 6.7, categories: ["Cooking", "Food", "Culture"], location: "Barcelona, Spain", is_verified: false, unlocked: false },
    { id: 11, username: "music_maven_mia", full_name: "Mia Davis", profile_pic_url: "/avatars/11.png", followers: 89000, engagement_rate: 9.2, categories: ["Music", "Entertainment", "Art"], location: "Nashville, USA", is_verified: true, unlocked: false },
    { id: 12, username: "nature_nick", full_name: "Nicholas Green", profile_pic_url: "/avatars/12.png", followers: 234000, engagement_rate: 4.6, categories: ["Nature", "Photography", "Travel"], location: "Vancouver, Canada", is_verified: false, unlocked: true },
    { id: 13, username: "fashion_forward_fiona", full_name: "Fiona Scott", profile_pic_url: "/avatars/13.png", followers: 445000, engagement_rate: 5.9, categories: ["Fashion", "Beauty", "Lifestyle"], location: "Milan, Italy", is_verified: true, unlocked: false },
    { id: 14, username: "crypto_king_kai", full_name: "Kai Zhang", profile_pic_url: "/avatars/14.png", followers: 167000, engagement_rate: 7.8, categories: ["Cryptocurrency", "Finance", "Technology"], location: "Singapore", is_verified: true, unlocked: true },
    { id: 15, username: "yoga_with_yuki", full_name: "Yuki Tanaka", profile_pic_url: "/avatars/15.png", followers: 298000, engagement_rate: 6.1, categories: ["Yoga", "Wellness", "Mindfulness"], location: "Kyoto, Japan", is_verified: false, unlocked: false },
    { id: 16, username: "street_style_sam", full_name: "Sam Johnson", profile_pic_url: "/avatars/16.png", followers: 176000, engagement_rate: 5.4, categories: ["Fashion", "Street Style", "Photography"], location: "Berlin, Germany", is_verified: true, unlocked: false },
    { id: 17, username: "adventure_amy", full_name: "Amy Clark", profile_pic_url: "/avatars/17.png", followers: 387000, engagement_rate: 7.3, categories: ["Adventure", "Travel", "Outdoors"], location: "Denver, USA", is_verified: false, unlocked: true },
    { id: 18, username: "business_boss_ben", full_name: "Benjamin Lee", profile_pic_url: "/avatars/18.png", followers: 124000, engagement_rate: 4.9, categories: ["Business", "Entrepreneurship", "Finance"], location: "Hong Kong", is_verified: true, unlocked: false },
    { id: 19, username: "dance_diva_diana", full_name: "Diana Rodriguez", profile_pic_url: "/avatars/19.png", followers: 456000, engagement_rate: 8.7, categories: ["Dance", "Entertainment", "Fitness"], location: "Los Angeles, USA", is_verified: true, unlocked: false },
    { id: 20, username: "pet_parent_paul", full_name: "Paul Anderson", profile_pic_url: "/avatars/20.png", followers: 203000, engagement_rate: 6.8, categories: ["Pets", "Animals", "Lifestyle"], location: "Melbourne, Australia", is_verified: false, unlocked: true },
    { id: 21, username: "minimalist_marie", full_name: "Marie Dubois", profile_pic_url: "/avatars/21.png", followers: 145000, engagement_rate: 5.7, categories: ["Minimalism", "Lifestyle", "Design"], location: "Copenhagen, Denmark", is_verified: true, unlocked: false },
    { id: 22, username: "comedy_central_chris", full_name: "Chris Brown", profile_pic_url: "/avatars/22.png", followers: 567000, engagement_rate: 9.1, categories: ["Comedy", "Entertainment", "Social"], location: "Chicago, USA", is_verified: true, unlocked: true },
    { id: 23, username: "vintage_vibes_vera", full_name: "Vera Petrov", profile_pic_url: "/avatars/23.png", followers: 187000, engagement_rate: 4.3, categories: ["Vintage", "Fashion", "Antiques"], location: "Prague, Czech Republic", is_verified: false, unlocked: false },
    { id: 24, username: "sustainable_stella", full_name: "Stella Martinez", profile_pic_url: "/avatars/24.png", followers: 276000, engagement_rate: 6.5, categories: ["Sustainability", "Environment", "Lifestyle"], location: "Portland, USA", is_verified: true, unlocked: false },
    { id: 25, username: "language_learner_lily", full_name: "Lily Wang", profile_pic_url: "/avatars/25.png", followers: 98000, engagement_rate: 7.9, categories: ["Education", "Languages", "Culture"], location: "Beijing, China", is_verified: false, unlocked: true },
    { id: 26, username: "home_decor_henry", full_name: "Henry Taylor", profile_pic_url: "/avatars/26.png", followers: 334000, engagement_rate: 5.2, categories: ["Home Decor", "Design", "DIY"], location: "Stockholm, Sweden", is_verified: true, unlocked: false },
    { id: 27, username: "book_lover_bella", full_name: "Isabella Garcia", profile_pic_url: "/avatars/27.png", followers: 156000, engagement_rate: 6.4, categories: ["Books", "Literature", "Education"], location: "Buenos Aires, Argentina", is_verified: false, unlocked: false },
    { id: 28, username: "wine_enthusiast_will", full_name: "William Smith", profile_pic_url: "/avatars/28.png", followers: 223000, engagement_rate: 4.7, categories: ["Wine", "Food", "Travel"], location: "Bordeaux, France", is_verified: true, unlocked: true },
    { id: 29, username: "streetwear_sophie", full_name: "Sophie Kim", profile_pic_url: "/avatars/29.png", followers: 389000, engagement_rate: 7.6, categories: ["Streetwear", "Fashion", "Culture"], location: "Seoul, South Korea", is_verified: true, unlocked: false },
    { id: 30, username: "meditation_master_mark", full_name: "Mark Johnson", profile_pic_url: "/avatars/30.png", followers: 167000, engagement_rate: 5.8, categories: ["Meditation", "Wellness", "Spirituality"], location: "Bali, Indonesia", is_verified: false, unlocked: false },
    { id: 31, username: "fashion_week_flora", full_name: "Flora Anderson", profile_pic_url: "/avatars/31.png", followers: 512000, engagement_rate: 6.9, categories: ["Fashion", "Runway", "Style"], location: "New York, USA", is_verified: true, unlocked: true },
    { id: 32, username: "gadget_geek_gary", full_name: "Gary Wilson", profile_pic_url: "/avatars/32.png", followers: 245000, engagement_rate: 8.3, categories: ["Technology", "Gadgets", "Reviews"], location: "Austin, USA", is_verified: true, unlocked: false },
    { id: 33, username: "healthy_habits_hannah", full_name: "Hannah Davis", profile_pic_url: "/avatars/33.png", followers: 298000, engagement_rate: 5.6, categories: ["Health", "Nutrition", "Wellness"], location: "Toronto, Canada", is_verified: false, unlocked: false },
    { id: 34, username: "luxury_lifestyle_leo", full_name: "Leonardo Rossi", profile_pic_url: "/avatars/34.png", followers: 678000, engagement_rate: 4.1, categories: ["Luxury", "Lifestyle", "Travel"], location: "Monaco", is_verified: true, unlocked: true },
    { id: 35, username: "outdoor_explorer_oscar", full_name: "Oscar Miller", profile_pic_url: "/avatars/35.png", followers: 187000, engagement_rate: 7.4, categories: ["Outdoors", "Adventure", "Nature"], location: "Zurich, Switzerland", is_verified: false, unlocked: false },
    { id: 36, username: "diy_queen_quinn", full_name: "Quinn Thompson", profile_pic_url: "/avatars/36.png", followers: 234000, engagement_rate: 6.2, categories: ["DIY", "Crafts", "Home"], location: "Portland, USA", is_verified: true, unlocked: false },
    { id: 37, username: "fashion_blogger_felix", full_name: "Felix Schmidt", profile_pic_url: "/avatars/37.png", followers: 356000, engagement_rate: 5.3, categories: ["Fashion", "Blogging", "Style"], location: "Munich, Germany", is_verified: true, unlocked: true },
    { id: 38, username: "plant_parent_penny", full_name: "Penny Green", profile_pic_url: "/avatars/38.png", followers: 145000, engagement_rate: 8.0, categories: ["Plants", "Gardening", "Home"], location: "Amsterdam, Netherlands", is_verified: false, unlocked: false },
    { id: 39, username: "coffee_connoisseur_cole", full_name: "Cole Brown", profile_pic_url: "/avatars/39.png", followers: 278000, engagement_rate: 6.6, categories: ["Coffee", "Food", "Lifestyle"], location: "Seattle, USA", is_verified: true, unlocked: false },
    { id: 40, username: "beauty_guru_grace", full_name: "Grace Liu", profile_pic_url: "/avatars/40.png", followers: 487000, engagement_rate: 7.1, categories: ["Beauty", "Makeup", "Skincare"], location: "Shanghai, China", is_verified: true, unlocked: true },
    { id: 41, username: "travel_tales_tom", full_name: "Thomas Clark", profile_pic_url: "/avatars/41.png", followers: 312000, engagement_rate: 5.9, categories: ["Travel", "Adventure", "Culture"], location: "Dubai, UAE", is_verified: false, unlocked: false },
    { id: 42, username: "fitness_fanatic_faith", full_name: "Faith Johnson", profile_pic_url: "/avatars/42.png", followers: 198000, engagement_rate: 8.2, categories: ["Fitness", "Health", "Motivation"], location: "Miami, USA", is_verified: true, unlocked: false },
    { id: 43, username: "art_attack_adam", full_name: "Adam Martinez", profile_pic_url: "/avatars/43.png", followers: 167000, engagement_rate: 4.8, categories: ["Art", "Painting", "Design"], location: "Barcelona, Spain", is_verified: false, unlocked: true },
    { id: 44, username: "modern_mom_molly", full_name: "Molly Wilson", profile_pic_url: "/avatars/44.png", followers: 256000, engagement_rate: 6.3, categories: ["Parenting", "Lifestyle", "Family"], location: "London, UK", is_verified: true, unlocked: false },
    { id: 45, username: "crypto_curious_cathy", full_name: "Catherine Lee", profile_pic_url: "/avatars/45.png", followers: 134000, engagement_rate: 7.7, categories: ["Cryptocurrency", "Finance", "Technology"], location: "Singapore", is_verified: false, unlocked: false },
    { id: 46, username: "sneaker_head_steve", full_name: "Steven Davis", profile_pic_url: "/avatars/46.png", followers: 423000, engagement_rate: 8.5, categories: ["Sneakers", "Fashion", "Streetwear"], location: "Atlanta, USA", is_verified: true, unlocked: true },
    { id: 47, username: "zen_master_zoe", full_name: "Zoe Anderson", profile_pic_url: "/avatars/47.png", followers: 189000, engagement_rate: 5.4, categories: ["Mindfulness", "Wellness", "Meditation"], location: "San Diego, USA", is_verified: true, unlocked: false },
    { id: 48, username: "vintage_collector_victor", full_name: "Victor Petrov", profile_pic_url: "/avatars/48.png", followers: 167000, engagement_rate: 4.2, categories: ["Vintage", "Collectibles", "History"], location: "Prague, Czech Republic", is_verified: false, unlocked: false },
    { id: 49, username: "foodie_photographer_fran", full_name: "Francesca Romano", profile_pic_url: "/avatars/49.png", followers: 345000, engagement_rate: 6.8, categories: ["Food", "Photography", "Restaurants"], location: "Rome, Italy", is_verified: true, unlocked: true },
    { id: 50, username: "tech_startup_tyler", full_name: "Tyler Kim", profile_pic_url: "/avatars/50.png", followers: 98000, engagement_rate: 9.3, categories: ["Startups", "Technology", "Business"], location: "San Francisco, USA", is_verified: false, unlocked: false },
    { id: 51, username: "luxury_watches_walter", full_name: "Walter Schmidt", profile_pic_url: "/avatars/51.png", followers: 234000, engagement_rate: 3.9, categories: ["Watches", "Luxury", "Fashion"], location: "Geneva, Switzerland", is_verified: true, unlocked: false },
    { id: 52, username: "eco_warrior_emma", full_name: "Emma Green", profile_pic_url: "/avatars/52.png", followers: 278000, engagement_rate: 7.0, categories: ["Environment", "Sustainability", "Activism"], location: "Copenhagen, Denmark", is_verified: true, unlocked: true },
    { id: 53, username: "dance_instructor_derek", full_name: "Derek Johnson", profile_pic_url: "/avatars/53.png", followers: 156000, engagement_rate: 8.6, categories: ["Dance", "Fitness", "Teaching"], location: "New York, USA", is_verified: false, unlocked: false },
    { id: 54, username: "beauty_trends_beth", full_name: "Bethany Taylor", profile_pic_url: "/avatars/54.png", followers: 389000, engagement_rate: 5.7, categories: ["Beauty", "Trends", "Fashion"], location: "Los Angeles, USA", is_verified: true, unlocked: false },
    { id: 55, username: "home_chef_hector", full_name: "Hector Garcia", profile_pic_url: "/avatars/55.png", followers: 212000, engagement_rate: 6.4, categories: ["Cooking", "Recipes", "Food"], location: "Mexico City, Mexico", is_verified: false, unlocked: true },
    { id: 56, username: "fashion_stylist_stella", full_name: "Stella Wang", profile_pic_url: "/avatars/56.png", followers: 467000, engagement_rate: 5.1, categories: ["Fashion", "Styling", "Luxury"], location: "Hong Kong", is_verified: true, unlocked: false },
    { id: 57, username: "adventure_sports_alex", full_name: "Alex Turner", profile_pic_url: "/avatars/57.png", followers: 298000, engagement_rate: 7.8, categories: ["Adventure Sports", "Extreme", "Outdoors"], location: "Queenstown, New Zealand", is_verified: false, unlocked: false },
    { id: 58, username: "minimalist_design_mila", full_name: "Mila Andersson", profile_pic_url: "/avatars/58.png", followers: 178000, engagement_rate: 4.6, categories: ["Design", "Minimalism", "Architecture"], location: "Stockholm, Sweden", is_verified: true, unlocked: true },
    { id: 59, username: "street_food_sam", full_name: "Samuel Chen", profile_pic_url: "/avatars/59.png", followers: 345000, engagement_rate: 8.1, categories: ["Street Food", "Travel", "Culture"], location: "Bangkok, Thailand", is_verified: true, unlocked: false },
    { id: 60, username: "wellness_coach_wendy", full_name: "Wendy Martinez", profile_pic_url: "/avatars/60.png", followers: 156000, engagement_rate: 6.9, categories: ["Wellness", "Coaching", "Health"], location: "Austin, USA", is_verified: false, unlocked: false },
    { id: 61, username: "luxury_travel_lucas", full_name: "Lucas Rossi", profile_pic_url: "/avatars/61.png", followers: 523000, engagement_rate: 4.3, categories: ["Luxury Travel", "Hotels", "Lifestyle"], location: "Monte Carlo, Monaco", is_verified: true, unlocked: true },
    { id: 62, username: "craft_beer_carl", full_name: "Carl Anderson", profile_pic_url: "/avatars/62.png", followers: 189000, engagement_rate: 5.8, categories: ["Craft Beer", "Food", "Culture"], location: "Portland, USA", is_verified: false, unlocked: false },
    { id: 63, username: "fashion_week_fiona", full_name: "Fiona Liu", profile_pic_url: "/avatars/63.png", followers: 678000, engagement_rate: 6.2, categories: ["Fashion Week", "Runway", "Style"], location: "Paris, France", is_verified: true, unlocked: false },
    { id: 64, username: "outdoor_gear_ollie", full_name: "Oliver Smith", profile_pic_url: "/avatars/64.png", followers: 234000, engagement_rate: 7.5, categories: ["Outdoor Gear", "Hiking", "Adventure"], location: "Vancouver, Canada", is_verified: true, unlocked: true },
    { id: 65, username: "sustainable_fashion_sara", full_name: "Sara Johnson", profile_pic_url: "/avatars/65.png", followers: 298000, engagement_rate: 5.3, categories: ["Sustainable Fashion", "Ethics", "Style"], location: "Amsterdam, Netherlands", is_verified: false, unlocked: false },
    { id: 66, username: "tech_reviews_tony", full_name: "Anthony Davis", profile_pic_url: "/avatars/66.png", followers: 345000, engagement_rate: 8.7, categories: ["Tech Reviews", "Gadgets", "Innovation"], location: "Tokyo, Japan", is_verified: true, unlocked: false },
    { id: 67, username: "plant_based_pete", full_name: "Peter Green", profile_pic_url: "/avatars/67.png", followers: 167000, engagement_rate: 6.6, categories: ["Plant Based", "Nutrition", "Health"], location: "Los Angeles, USA", is_verified: false, unlocked: true },
    { id: 68, username: "interior_design_ida", full_name: "Ida Andersson", profile_pic_url: "/avatars/68.png", followers: 389000, engagement_rate: 4.9, categories: ["Interior Design", "Home", "Luxury"], location: "Copenhagen, Denmark", is_verified: true, unlocked: false },
    { id: 69, username: "music_producer_max", full_name: "Maximilian Schmidt", profile_pic_url: "/avatars/69.png", followers: 234000, engagement_rate: 7.2, categories: ["Music Production", "Electronic", "Art"], location: "Berlin, Germany", is_verified: true, unlocked: false },
    { id: 70, username: "vintage_fashion_vera", full_name: "Vera Petrov", profile_pic_url: "/avatars/70.png", followers: 178000, engagement_rate: 5.5, categories: ["Vintage Fashion", "Thrift", "Sustainability"], location: "Prague, Czech Republic", is_verified: false, unlocked: true },
    { id: 71, username: "crossfit_coach_chris", full_name: "Christina Brown", profile_pic_url: "/avatars/71.png", followers: 298000, engagement_rate: 8.4, categories: ["CrossFit", "Fitness", "Training"], location: "Sydney, Australia", is_verified: true, unlocked: false },
    { id: 72, username: "luxury_cars_leo", full_name: "Leonardo Ferrari", profile_pic_url: "/avatars/72.png", followers: 456000, engagement_rate: 6.1, categories: ["Luxury Cars", "Automotive", "Lifestyle"], location: "Milan, Italy", is_verified: true, unlocked: false },
    { id: 73, username: "meditation_guru_maya", full_name: "Maya Patel", profile_pic_url: "/avatars/73.png", followers: 189000, engagement_rate: 7.9, categories: ["Meditation", "Spirituality", "Wellness"], location: "Rishikesh, India", is_verified: false, unlocked: true },
    { id: 74, username: "street_art_sophia", full_name: "Sophia Martinez", profile_pic_url: "/avatars/74.png", followers: 234000, engagement_rate: 5.2, categories: ["Street Art", "Graffiti", "Culture"], location: "Barcelona, Spain", is_verified: true, unlocked: false },
    { id: 75, username: "gourmet_chef_gabriel", full_name: "Gabriel Dubois", profile_pic_url: "/avatars/75.png", followers: 367000, engagement_rate: 6.8, categories: ["Gourmet Cooking", "Fine Dining", "Culinary"], location: "Lyon, France", is_verified: true, unlocked: false },
    { id: 76, username: "sustainable_living_simon", full_name: "Simon Green", profile_pic_url: "/avatars/76.png", followers: 145000, engagement_rate: 4.7, categories: ["Sustainable Living", "Zero Waste", "Environment"], location: "Portland, USA", is_verified: false, unlocked: true },
    { id: 77, username: "fashion_model_mia", full_name: "Mia Rodriguez", profile_pic_url: "/avatars/77.png", followers: 578000, engagement_rate: 5.9, categories: ["Fashion Model", "Runway", "Beauty"], location: "New York, USA", is_verified: true, unlocked: false },
    { id: 78, username: "adventure_photographer_andy", full_name: "Andrew Wilson", profile_pic_url: "/avatars/78.png", followers: 298000, engagement_rate: 7.6, categories: ["Adventure Photography", "Travel", "Nature"], location: "Banff, Canada", is_verified: true, unlocked: false },
    { id: 79, username: "wellness_retreat_willow", full_name: "Willow Davis", profile_pic_url: "/avatars/79.png", followers: 167000, engagement_rate: 6.3, categories: ["Wellness Retreats", "Yoga", "Mindfulness"], location: "Tulum, Mexico", is_verified: false, unlocked: true },
    { id: 80, username: "luxury_lifestyle_liam", full_name: "Liam O'Connor", profile_pic_url: "/avatars/80.png", followers: 445000, engagement_rate: 4.1, categories: ["Luxury Lifestyle", "Travel", "Fashion"], location: "Dubai, UAE", is_verified: true, unlocked: false },
    { id: 81, username: "eco_fashion_eva", full_name: "Eva Andersson", profile_pic_url: "/avatars/81.png", followers: 234000, engagement_rate: 5.4, categories: ["Eco Fashion", "Sustainability", "Ethics"], location: "Stockholm, Sweden", is_verified: true, unlocked: false },
    { id: 82, username: "home_barista_henry", full_name: "Henry Kim", profile_pic_url: "/avatars/82.png", followers: 189000, engagement_rate: 8.0, categories: ["Coffee", "Barista", "Home Brewing"], location: "Seattle, USA", is_verified: false, unlocked: true },
    { id: 83, username: "fashion_entrepreneur_ella", full_name: "Ella Thompson", profile_pic_url: "/avatars/83.png", followers: 356000, engagement_rate: 6.7, categories: ["Fashion Business", "Entrepreneurship", "Style"], location: "London, UK", is_verified: true, unlocked: false },
    { id: 84, username: "outdoor_survival_oscar", full_name: "Oscar Nilsson", profile_pic_url: "/avatars/84.png", followers: 198000, engagement_rate: 7.3, categories: ["Survival", "Outdoors", "Adventure"], location: "Lapland, Sweden", is_verified: false, unlocked: false },
    { id: 85, username: "beauty_science_bella", full_name: "Isabella Chen", profile_pic_url: "/avatars/85.png", followers: 278000, engagement_rate: 5.8, categories: ["Beauty Science", "Skincare", "Research"], location: "Seoul, South Korea", is_verified: true, unlocked: true },
    { id: 86, username: "vintage_cars_vincent", full_name: "Vincent Rossi", profile_pic_url: "/avatars/86.png", followers: 234000, engagement_rate: 4.5, categories: ["Vintage Cars", "Classic", "Automotive"], location: "Monaco", is_verified: true, unlocked: false },
    { id: 87, username: "dance_fitness_diana", full_name: "Diana Lopez", profile_pic_url: "/avatars/87.png", followers: 345000, engagement_rate: 8.8, categories: ["Dance Fitness", "Zumba", "Health"], location: "Miami, USA", is_verified: false, unlocked: false },
    { id: 88, username: "artisan_bread_arthur", full_name: "Arthur Dubois", profile_pic_url: "/avatars/88.png", followers: 156000, engagement_rate: 6.2, categories: ["Artisan Bread", "Baking", "Food"], location: "Paris, France", is_verified: true, unlocked: true },
    { id: 89, username: "minimal_wardrobe_mila", full_name: "Mila Andersson", profile_pic_url: "/avatars/89.png", followers: 189000, engagement_rate: 5.1, categories: ["Minimal Wardrobe", "Fashion", "Sustainability"], location: "Copenhagen, Denmark", is_verified: false, unlocked: false },
    { id: 90, username: "tech_entrepreneur_theo", full_name: "Theodore Kim", profile_pic_url: "/avatars/90.png", followers: 298000, engagement_rate: 7.4, categories: ["Tech Entrepreneurship", "Startups", "Innovation"], location: "Silicon Valley, USA", is_verified: true, unlocked: false },
    { id: 91, username: "luxury_watches_lily", full_name: "Lily Schmidt", profile_pic_url: "/avatars/91.png", followers: 234000, engagement_rate: 4.2, categories: ["Luxury Watches", "Timepieces", "Fashion"], location: "Geneva, Switzerland", is_verified: true, unlocked: true },
    { id: 92, username: "plant_medicine_petra", full_name: "Petra Green", profile_pic_url: "/avatars/92.png", followers: 167000, engagement_rate: 6.9, categories: ["Plant Medicine", "Herbalism", "Wellness"], location: "Costa Rica", is_verified: false, unlocked: false },
    { id: 93, username: "street_photography_sam", full_name: "Samantha Lee", profile_pic_url: "/avatars/93.png", followers: 278000, engagement_rate: 8.2, categories: ["Street Photography", "Urban", "Art"], location: "Tokyo, Japan", is_verified: true, unlocked: false },
    { id: 94, username: "luxury_real_estate_ryan", full_name: "Ryan Martinez", profile_pic_url: "/avatars/94.png", followers: 345000, engagement_rate: 3.8, categories: ["Luxury Real Estate", "Architecture", "Lifestyle"], location: "Beverly Hills, USA", is_verified: true, unlocked: true },
    { id: 95, username: "organic_skincare_olivia", full_name: "Olivia Johnson", profile_pic_url: "/avatars/95.png", followers: 189000, engagement_rate: 7.1, categories: ["Organic Skincare", "Natural Beauty", "Wellness"], location: "Byron Bay, Australia", is_verified: false, unlocked: false },
    { id: 96, username: "fashion_history_felix", full_name: "Felix Wagner", profile_pic_url: "/avatars/96.png", followers: 134000, engagement_rate: 5.6, categories: ["Fashion History", "Vintage", "Culture"], location: "Vienna, Austria", is_verified: true, unlocked: false },
    { id: 97, username: "adventure_travel_anna", full_name: "Anna Petrov", profile_pic_url: "/avatars/97.png", followers: 456000, engagement_rate: 6.5, categories: ["Adventure Travel", "Backpacking", "Culture"], location: "Prague, Czech Republic", is_verified: true, unlocked: true },
    { id: 98, username: "home_automation_hugo", full_name: "Hugo Schmidt", profile_pic_url: "/avatars/98.png", followers: 198000, engagement_rate: 8.9, categories: ["Home Automation", "Smart Home", "Technology"], location: "Munich, Germany", is_verified: false, unlocked: false },
    { id: 99, username: "sustainable_beauty_sara", full_name: "Sara Nielsen", profile_pic_url: "/avatars/99.png", followers: 267000, engagement_rate: 5.9, categories: ["Sustainable Beauty", "Clean Beauty", "Environment"], location: "Copenhagen, Denmark", is_verified: true, unlocked: false },
    { id: 100, username: "luxury_fashion_lorenzo", full_name: "Lorenzo Ferrari", profile_pic_url: "/avatars/100.png", followers: 578000, engagement_rate: 4.4, categories: ["Luxury Fashion", "High Fashion", "Designer"], location: "Milan, Italy", is_verified: true, unlocked: true }
  ]

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
    if (selectedCreators.size === currentResults.length) {
      setSelectedCreators(new Set())
    } else {
      const newSelected = new Set(currentResults.map(creator => creator.id))
      setSelectedCreators(newSelected)
    }
  }

  const handleBulkUnlock = () => {
    const selectedCount = selectedCreators.size
    if (selectedCount > 0) {
      toast.success(`${selectedCount} creators unlocked successfully!`)
      setSelectedCreators(new Set())
      setIsBulkSelectMode(false)
    }
  }

  const handleUnlockCreator = (creator: any) => {
    setCreatorToUnlock(creator)
    setUnlockDialogOpen(true)
  }

  const confirmUnlockCreator = () => {
    if (creatorToUnlock) {
      toast.success(`${creatorToUnlock.full_name} has been activated!`)
      setUnlockDialogOpen(false)
      setCreatorToUnlock(null)
    }
  }

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = category === "all" || creator.categories.some(cat => cat.toLowerCase() === category.toLowerCase())
    const matchesLocation = location === "all" || creator.location.toLowerCase().includes(location.toLowerCase())
    const matchesFollowers = creator.followers >= minFollowers[0] && creator.followers <= maxFollowers[0]
    const matchesEngagement = creator.engagement_rate >= minEngagement[0] && creator.engagement_rate <= maxEngagement[0]
    
    return matchesSearch && matchesCategory && matchesLocation && matchesFollowers && matchesEngagement
  })

  // Pagination variables (must be after filteredCreators)
  const resultsPerPage = 12 // 3 columns × 4 rows
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
                <h1 className="text-3xl font-bold">Creator Discovery</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Star className="h-4 w-4 mr-2" />
                  Saved Creators
                </Button>
                <Button variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Bulk Analysis
                </Button>
              </div>
            </div>

            {/* Main Layout: 85% Main Content + 15% Creator Lists Sidebar */}
            <div className="flex gap-4">
              {/* Main Content Area - 85% width */}
              <div className="w-[85%] space-y-6">
                {/* Search Component */}
                <Card>
                  <CardHeader>
                    <CardDescription>Search and filter creators to find the perfect match for your campaign</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* All 5 elements in one row: 4 selectors with headers + search button */}
                    <div className="grid grid-cols-5 gap-3 w-full">
                    
                  {/* All elements with explicit width constraints */}
                  {/* Country Select with Flags */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-bold">Country</label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        <SelectItem value="uae">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🇦🇪</span>
                            <span>UAE</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="saudi">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🇸🇦</span>
                            <span>Saudi Arabia</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="kuwait">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🇰🇼</span>
                            <span>Kuwait</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="qatar">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🇶🇦</span>
                            <span>Qatar</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bahrain">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🇧🇭</span>
                            <span>Bahrain</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Select */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-bold">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="fashion">Fashion & Style</SelectItem>
                        <SelectItem value="beauty">Beauty & Skincare</SelectItem>
                        <SelectItem value="fitness">Fitness & Health</SelectItem>
                        <SelectItem value="food">Food & Cooking</SelectItem>
                        <SelectItem value="travel">Travel & Lifestyle</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="business">Business & Finance</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tier Select */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-bold">Tier</label>
                    <Select value={tier} onValueChange={setTier}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="nano">Nano (1K-10K)</SelectItem>
                        <SelectItem value="micro">Micro (10K-100K)</SelectItem>
                        <SelectItem value="mid">Mid-tier (100K-1M)</SelectItem>
                        <SelectItem value="macro">Macro (1M-10M)</SelectItem>
                        <SelectItem value="mega">Mega (10M+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Platform Drawer */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-bold">Platform</label>
                    <Drawer open={isPlatformDrawerOpen} onOpenChange={setIsPlatformDrawerOpen}>
                      <DrawerTrigger asChild>
                        <Button variant="outline" className="justify-between w-full font-normal">
                        <span>{platform === "all" ? "Select Platform" : platform === "tiktok" ? "TikTok" : platform === "instagram" ? "Instagram" : platform === "snapchat" ? "Snapchat" : "Select Platform"}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="h-[80vh]">
                      <DrawerHeader>
                        <DrawerTitle className="text-center text-2xl">Select Platform</DrawerTitle>
                      </DrawerHeader>
                      <div className="flex-1 p-8">
                        <div className="grid grid-cols-4 gap-4 h-full">
                          
                          {/* TikTok */}
                          <Card 
                            className={`cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center p-8 ${platform === "tiktok" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                            onClick={() => {
                              setPlatform("tiktok")
                              setIsPlatformDrawerOpen(false)
                            }}
                          >
                            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-4">
                              <span className="text-white text-3xl font-bold">T</span>
                            </div>
                            <h3 className="text-xl font-semibold">TikTok</h3>
                            <p className="text-sm text-muted-foreground text-center mt-2">Short-form video creators</p>
                          </Card>

                          {/* Instagram */}
                          <Card 
                            className={`cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center p-8 ${platform === "instagram" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                            onClick={() => {
                              setPlatform("instagram")
                              setIsPlatformDrawerOpen(false)
                            }}
                          >
                            <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                              <div className="w-8 h-8 border-2 border-white rounded-lg"></div>
                            </div>
                            <h3 className="text-xl font-semibold">Instagram</h3>
                            <p className="text-sm text-muted-foreground text-center mt-2">Photos, Stories & Reels</p>
                          </Card>

                          {/* Snapchat */}
                          <Card 
                            className={`cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center p-8 ${platform === "snapchat" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                            onClick={() => {
                              setPlatform("snapchat")
                              setIsPlatformDrawerOpen(false)
                            }}
                          >
                            <div className="w-16 h-16 bg-yellow-400 rounded-xl flex items-center justify-center mb-4">
                              <div className="w-8 h-8 bg-white rounded-full"></div>
                            </div>
                            <h3 className="text-xl font-semibold">Snapchat</h3>
                            <p className="text-sm text-muted-foreground text-center mt-2">Ephemeral content creators</p>
                          </Card>

                          {/* LinkedIn Coming Soon */}
                          <Card className="opacity-50 cursor-not-allowed flex flex-col items-center justify-center p-8 bg-muted/30 relative">
                            <Badge variant="secondary" className="absolute top-4 right-4 text-xs">Coming Soon</Badge>
                            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                              <span className="text-white text-2xl font-bold">in</span>
                            </div>
                            <h3 className="text-xl font-semibold">LinkedIn</h3>
                            <p className="text-sm text-muted-foreground text-center mt-2">Professional network creators</p>
                          </Card>

                        </div>
                      </div>
                      <DrawerFooter>
                        <DrawerClose asChild>
                          <Button variant="outline">Close</Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                  </div>

                    {/* Search Button */}
                    <div className="w-full flex items-end">
                      <Button 
                        onClick={() => {
                          setShowResults(true)
                          toast.success("Search completed! Found creators matching your criteria.")
                        }}
                        className="w-full h-16"
                        size="lg"
                      >
                        <Search className="h-5 w-5 mr-2" />
                        Search Creators
                      </Button>
                    </div>
                  </div>
                  </CardContent>
                </Card>

                {/* Results Section - Directly under search */}
                {showResults && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Search Results</CardTitle>
                        <CardDescription>
                          Found {filteredCreators.length} creators matching your criteria
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isBulkSelectMode ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setIsBulkSelectMode(!isBulkSelectMode)
                            if (isBulkSelectMode) {
                              setSelectedCreators(new Set())
                            }
                          }}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Bulk Select
                        </Button>
                        {isBulkSelectMode && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSelectAll}
                            >
                              {selectedCreators.size === currentResults.length ? "Deselect All" : "Select All"}
                            </Button>
                            {selectedCreators.size > 0 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleBulkUnlock}
                                >
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Unlock ({selectedCreators.size})
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toast.success(`${selectedCreators.size} creators added to list!`)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add to List ({selectedCreators.size})
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {currentResults.map((creator) => (
                        <Card 
                          key={creator.id} 
                          className={`relative overflow-hidden cursor-move hover:shadow-lg transition-shadow ${
                            selectedCreators.has(creator.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                          }`}
                          draggable={!isBulkSelectMode}
                          onDragStart={(e) => {
                            if (!isBulkSelectMode) {
                              setDraggedCreator(creator)
                              e.dataTransfer.effectAllowed = 'move'
                            }
                          }}
                          onDragEnd={() => setDraggedCreator(null)}
                        >
                          {isBulkSelectMode && (
                            <div className="absolute top-2 left-2 z-10">
                              <Checkbox
                                checked={selectedCreators.has(creator.id)}
                                onCheckedChange={() => handleCreatorSelection(creator.id)}
                                className="bg-white border-2"
                              />
                            </div>
                          )}
                          <CardHeader className="pb-3">
                            {/* Avatar */}
                            <div className="flex justify-center mb-3">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={creator.profile_pic_url} alt={creator.full_name} />
                                <AvatarFallback>
                                  {creator.full_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            </div>

                            {/* Name and Username */}
                            <div className="text-center space-y-1">
                              <div className="flex items-center justify-center gap-2">
                                <h3 className="font-semibold text-lg">{creator.full_name}</h3>
                                {creator.is_verified && (
                                  <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
                                    ✓
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                @{creator.username}
                              </p>
                            </div>

                            {/* Content Category Badges */}
                            <div className="flex flex-wrap justify-center gap-1 mt-3">
                              {creator.categories.slice(0, 3).map((category, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Followers and Engagement */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="text-center p-2 bg-muted rounded-md">
                                <div className="text-lg font-bold">{formatNumber(creator.followers)}</div>
                                <div className="text-xs text-muted-foreground">Followers</div>
                              </div>
                              <div className="text-center p-2 bg-muted rounded-md">
                                <div className="text-lg font-bold">{creator.engagement_rate}%</div>
                                <div className="text-xs text-muted-foreground">Engagement</div>
                              </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-center justify-center gap-2">
                              <ReactCountryFlag
                                countryCode={getCountryCode(creator.location)}
                                svg
                                style={{
                                  width: '16px',
                                  height: '12px',
                                }}
                              />
                              <span className="text-sm text-muted-foreground">
                                {creator.location}
                              </span>
                            </div>

                            {/* Action Button */}
                            <div className="pt-2">
                              {creator.unlocked ? (
                                <Button 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => router.push(`/analytics/${creator.username}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Analytics
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => handleUnlockCreator(creator)}
                                >
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Unlock Profile
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {filteredCreators.length === 0 && (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No creators found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search criteria or filters to discover more creators.
                        </p>
                      </div>
                    )}

                    {/* Pagination */}
                    {filteredCreators.length > 0 && totalPages > 1 && (
                      <div className="flex flex-col items-center gap-4 pt-6">
                        <div className="text-sm text-muted-foreground">
                          Showing {startIndex + 1}-{Math.min(endIndex, filteredCreators.length)} of {filteredCreators.length} creators
                        </div>
                        <div className="flex justify-center items-center gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                          >
                            First
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                          >
                            Previous
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            {(() => {
                              const maxVisiblePages = 5
                              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                              
                              if (endPage - startPage + 1 < maxVisiblePages) {
                                startPage = Math.max(1, endPage - maxVisiblePages + 1)
                              }
                              
                              const pages = []
                              
                              if (startPage > 1) {
                                pages.push(
                                  <Button key={1} variant="outline" size="sm" onClick={() => setCurrentPage(1)}>
                                    1
                                  </Button>
                                )
                                if (startPage > 2) {
                                  pages.push(<span key="start-ellipsis" className="px-2">...</span>)
                                }
                              }
                              
                              for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                  <Button
                                    key={i}
                                    variant={currentPage === i ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(i)}
                                    className={currentPage === i ? "bg-primary text-primary-foreground" : ""}
                                  >
                                    {i}
                                  </Button>
                                )
                              }
                              
                              if (endPage < totalPages) {
                                if (endPage < totalPages - 1) {
                                  pages.push(<span key="end-ellipsis" className="px-2">...</span>)
                                }
                                pages.push(
                                  <Button key={totalPages} variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}>
                                    {totalPages}
                                  </Button>
                                )
                              }
                              
                              return pages
                            })()}
                          </div>
                          
                          <Button 
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                          >
                            Next
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {filteredCreators.length > 0 && (
                      <div className="flex justify-center gap-4 pt-4">
                        <Button>
                          <Target className="h-4 w-4 mr-2" />
                          Create Campaign
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )}
              </div>

              {/* Creator Lists Sidebar - 15% width, sticky */}
              <div className="w-[15%]">
                <div className="sticky top-4 h-[calc(100vh-6rem)]">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3 flex-shrink-0">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4" />
                        Your Creator Lists
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-3">
                      <div className="space-y-2">
                        <div 
                          className="flex items-center justify-between p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors min-h-[60px] drop-zone"
                          data-list="summer-campaign"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                            if (draggedCreator) {
                              toast.success(`${draggedCreator.full_name} added to Summer Campaign 2024!`)
                            }
                          }}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Summer Campaign 2024</p>
                            <p className="text-xs text-muted-foreground">12 creators</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        <div 
                          className="flex items-center justify-between p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors min-h-[60px] drop-zone"
                          data-list="tech-reviewers"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                            if (draggedCreator) {
                              toast.success(`${draggedCreator.full_name} added to Tech Reviewers!`)
                            }
                          }}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Tech Reviewers</p>
                            <p className="text-xs text-muted-foreground">8 creators</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        <div 
                          className="flex items-center justify-between p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors min-h-[60px] drop-zone"
                          data-list="wishlist"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                            if (draggedCreator) {
                              toast.success(`${draggedCreator.full_name} added to Wishlist!`)
                            }
                          }}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Wishlist</p>
                            <p className="text-xs text-muted-foreground">24 creators</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button className="w-full h-8 mt-auto" variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Create New List
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Unlock Confirmation Dialog */}
      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activate Creator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {creatorToUnlock && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={creatorToUnlock.profile_pic_url} alt={creatorToUnlock.full_name} />
                  <AvatarFallback>
                    {creatorToUnlock.full_name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{creatorToUnlock.full_name}</h3>
                  <p className="text-sm text-muted-foreground">@{creatorToUnlock.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <ReactCountryFlag
                      countryCode={getCountryCode(creatorToUnlock.location)}
                      svg
                      style={{
                        width: '14px',
                        height: '10px',
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{creatorToUnlock.location}</span>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Would you like to activate this creator? This will unlock their full analytics and profile data.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setUnlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmUnlockCreator}>
              <Unlock className="h-4 w-4 mr-2" />
              Activate Creator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}