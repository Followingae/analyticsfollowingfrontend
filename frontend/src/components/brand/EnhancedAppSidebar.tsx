"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconTarget,
  IconCreditCard,
  IconCompass,
  IconList,
  IconFileText,
} from "@tabler/icons-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { FeatureGate } from "@/components/FeatureGate"
import { CreditGate } from "@/components/CreditGate"
import { SubscriptionGate } from "@/components/SubscriptionGate"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Crown, Coins, Lock } from "lucide-react"

function ThemeLogo() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <Image 
        src="/followinglogo.svg" 
        alt="Following Logo" 
        width={128} 
        height={40}
        className="object-contain w-28 h-10"
      />
    )
  }
  
  const isDark = resolvedTheme === 'dark' || theme === 'dark'
  const logoSrc = isDark ? "/Following Logo Dark Mode.svg" : "/followinglogo.svg"
  
  return (
    <Image 
      src={logoSrc}
      alt="Following Logo" 
      width={128} 
      height={40}
      className="object-contain w-28 h-10"
    />
  )
}

export function EnhancedAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading, hasRole, checkSubscriptionGate } = useEnhancedAuth()

  // Dynamic user data
  const dynamicUser = React.useMemo(() => {
    if (!user) return null
    
    const getDisplayName = () => {
      if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`
      }
      if (user.full_name) {
        return user.full_name
      }
      if (user.first_name) {
        return user.first_name
      }
      return null
    }

    return {
      name: getDisplayName(),
      email: user.email,
      avatar: user.profile_picture_url || null,
      avatar_config: user.avatar_config,
    }
  }, [user])

  // Get tier-specific data
  const getTierInfo = () => {
    if (!user) return { name: 'Free', color: 'bg-gray-500' }
    
    switch (user.role) {
      case 'brand_enterprise':
        return { name: 'Enterprise', color: 'bg-gradient-to-r from-purple-600 to-blue-600' }
      case 'brand_premium':
        return { name: 'Premium', color: 'bg-gradient-to-r from-orange-500 to-pink-600' }
      case 'brand_standard':
        return { name: 'Standard', color: 'bg-blue-500' }
      case 'brand_free':
      default:
        return { name: 'Free', color: 'bg-gray-500' }
    }
  }

  const tierInfo = getTierInfo()

  // Base navigation items with feature requirements
  const getNavigationData = () => {
    const searchAnalytics = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
        available: true
      },
      {
        title: "Discovery",
        url: "/discover",
        icon: IconCompass,
        available: true
      },
      {
        title: "Creators",
        url: "/creators",
        icon: IconUsers,
        available: true
      },
    ]

    const management = [
      {
        title: "Campaigns",
        url: "/campaigns",
        icon: IconTarget,
        available: true
      },
      {
        title: "Lists",
        url: "/my-lists",
        icon: IconList,
        available: true
      },
      {
        title: "Proposals",
        url: "/proposals",
        icon: IconFileText,
        available: true,
        requiresTier: 'brand_standard'
      },
    ]

    const premium = [
      {
        title: "Advanced Analytics",
        url: "/analytics/advanced",
        icon: IconChartBar,
        available: hasRole('brand_premium') || hasRole('brand_enterprise'),
        requiresTier: 'brand_premium',
        feature: 'advanced_analytics'
      },
      {
        title: "API Dashboard",
        url: "/api",
        icon: IconSearch,
        available: hasRole('brand_premium') || hasRole('brand_enterprise'),
        requiresTier: 'brand_premium',
        feature: 'api_access'
      },
    ]

    const more = [
      {
        title: "Billing",
        url: "/billing",
        icon: IconCreditCard,
        available: true
      },
      {
        title: "Settings",
        url: "/settings",
        icon: IconSettings,
        available: true
      },
      {
        title: "Help & Support",
        url: "#",
        icon: IconHelp,
        available: true
      },
    ]

    return { searchAnalytics, management, premium, more }
  }

  const data = getNavigationData()

  const NavItemWithGate = ({ item }: { item: any }) => {
    if (!item.requiresTier && !item.feature) {
      return <NavMain items={[item]} />
    }

    if (item.requiresTier) {
      return (
        <SubscriptionGate 
          requiredTier={item.requiresTier}
          feature={item.feature}
          fallback={
            <div className="relative">
              <NavMain items={[{ ...item, url: '#' }]} />
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Requires {item.requiresTier.replace('brand_', '')}</span>
                </div>
              </div>
            </div>
          }
        >
          <NavMain items={[item]} />
        </SubscriptionGate>
      )
    }

    return (
      <FeatureGate 
        feature={item.feature}
        fallback={
          <div className="relative">
            <NavMain items={[{ ...item, url: '#' }]} />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Crown className="w-3 h-3" />
                <span>Premium</span>
              </div>
            </div>
          </div>
        }
      >
        <NavMain items={[item]} />
      </FeatureGate>
    )
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className="flex items-center">
                <ThemeLogo />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Subscription Tier Display */}
        {user && (
          <div className="px-2 py-1">
            <div className={`rounded-lg p-2 text-white text-center ${tierInfo.color}`}>
              <div className="flex items-center justify-center gap-1">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medium">{tierInfo.name} Plan</span>
              </div>
              {user.role === 'brand_free' && (
                <p className="text-xs opacity-90 mt-1">
                  5 searches remaining
                </p>
              )}
              {(user.role === 'brand_standard' || user.role === 'brand_premium') && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Coins className="w-3 h-3" />
                  <span className="text-xs">150 credits</span>
                </div>
              )}
            </div>
            {user.role === 'brand_free' && (
              <Button 
                size="sm" 
                className="w-full mt-2 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
              >
                <Crown className="w-3 h-3 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        {/* Quick Search Button with Credit Gate */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <CreditGate 
                  action="quick_search" 
                  cost={5}
                  showTopUp={false}
                  fallback={
                    <Button 
                      variant="outline" 
                      className="w-full justify-start opacity-50"
                      disabled
                    >
                      <IconSearch className="size-4" />
                      Quick Search
                      <Badge variant="outline" className="ml-auto text-xs">
                        5 credits
                      </Badge>
                    </Button>
                  }
                >
                  <Button 
                    variant="default" 
                    className="w-full justify-start bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                  >
                    <IconSearch className="size-4" />
                    Quick Search
                  </Button>
                </CreditGate>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Search & Analytics Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Search & Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.searchAnalytics} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-1">
              {data.management.map((item, index) => (
                <NavItemWithGate key={index} item={item} />
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Premium Features Section */}
        {(hasRole('brand_premium') || hasRole('brand_enterprise') || hasRole('brand_standard')) && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-orange-500" />
              Premium Features
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-1">
                {data.premium.map((item, index) => (
                  <NavItemWithGate key={index} item={item} />
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* More Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.more} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {!isLoading && dynamicUser && dynamicUser.name && (
          <NavUser 
            key={`nav-user-${JSON.stringify(user?.avatar_config) || 'default'}`}
            user={dynamicUser} 
          />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}