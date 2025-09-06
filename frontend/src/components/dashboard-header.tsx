"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  CircleUser,
  Menu,
  Package2,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { creditsApiService } from "@/services/creditsApi"
import { CreditBalance } from "@/types"
import { formatCredits, getCreditBalanceStatus } from "@/utils/creditUtils"

interface DashboardHeaderProps {
  currentPage?: string
}

export function DashboardHeader({ currentPage = "Dashboard" }: DashboardHeaderProps) {
  const isActive = (page: string) => currentPage === page
  const router = useRouter()
  
  // Credit balance state
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Load credit balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const result = await creditsApiService.getBalance()
        if (result.success && result.data) {
          setCreditBalance(result.data)
        }
      } catch (error) {

      } finally {
        setLoading(false)
      }
    }

    loadBalance()
    
    // Set up periodic refresh every 5 minutes
    const interval = setInterval(loadBalance, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Handle credit badge click
  const handleCreditClick = () => {
    router.push('/billing')
  }

  // Get credit badge styling based on status
  const getCreditBadgeProps = () => {
    if (loading) {
      return {
        className: "bg-muted text-muted-foreground",
        text: "Loading..."
      }
    }

    if (!creditBalance) {
      return {
        className: "bg-muted text-muted-foreground",
        text: "No data"
      }
    }

    const status = getCreditBalanceStatus(creditBalance)
    const creditText = `${formatCredits(creditBalance.current_balance)} credits`
    
    switch (status.status) {
      case 'critical':
      case 'empty':
        return {
          className: "bg-destructive/10 text-destructive animate-pulse",
          text: creditText
        }
      case 'low':
        return {
          className: "bg-warning/10 text-warning",
          text: creditText
        }
      case 'healthy':
      default:
        return {
          className: "bg-success/10 text-success",
          text: creditText
        }
    }
  }

  const creditBadgeProps = getCreditBadgeProps()
  
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Package2 className="h-6 w-6" />
          <span className="sr-only">Analytics Following</span>
        </a>
        <a
          href="/"
          className={`transition-colors hover:text-foreground ${
            isActive("Dashboard") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          Dashboard
        </a>
        <a
          href="/discover"
          className={`transition-colors hover:text-foreground ${
            isActive("Discover") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          Discover
        </a>
        <a
          href="/creators"
          className={`transition-colors hover:text-foreground ${
            isActive("Creators") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          Creators
        </a>
        <a
          href="/campaigns"
          className={`transition-colors hover:text-foreground ${
            isActive("Campaigns") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          Campaigns
        </a>
        <a
          href="/billing"
          className={`transition-colors hover:text-foreground ${
            isActive("Billing") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          Billing
        </a>
        <a
          href="/settings"
          className={`transition-colors hover:text-foreground ${
            isActive("Settings") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          Settings
        </a>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <a
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Package2 className="h-6 w-6" />
              <span className="sr-only">Analytics Following</span>
            </a>
            <a href="/" className={isActive("Dashboard") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}>
              Dashboard
            </a>
            <a
              href="/discover"
              className={isActive("Discover") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
            >
              Discover
            </a>
            <a
              href="/creators"
              className={isActive("Creators") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
            >
              Creators
            </a>
            <a
              href="/campaigns"
              className={isActive("Campaigns") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
            >
              Campaigns
            </a>
            <a
              href="/billing"
              className={isActive("Billing") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
            >
              Billing
            </a>
            <a
              href="/settings"
              className={isActive("Settings") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
            >
              Settings
            </a>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search creators, campaigns..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              data-search-input
            />
          </div>
        </form>
        <Badge 
          variant="secondary" 
          className={`${creditBadgeProps.className} cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={handleCreditClick}
        >
          {creditBadgeProps.text}
        </Badge>
        <Button variant="outline" size="icon">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}