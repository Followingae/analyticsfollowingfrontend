'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  FileText,
  DollarSign,
  Megaphone,
  Plus,
  Settings,
  Users,
  Target
} from "lucide-react"

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin/proposals',
    icon: BarChart3,
    description: 'Metrics & insights'
  },
  {
    name: 'Create',
    href: '/admin/proposals/create',
    icon: Plus,
    description: 'New proposal'
  },
  {
    name: 'Pricing',
    href: '/admin/proposals/pricing',
    icon: DollarSign,
    description: 'Influencer rates'
  },
  {
    name: 'Campaigns',
    href: '/admin/proposals/campaigns',
    icon: Megaphone,
    description: 'Public invites'
  },
  {
    name: 'Discovery',
    href: '/admin/proposals/discovery',
    icon: Target,
    description: 'Find creators'
  }
]

interface ProposalsNavigationProps {
  className?: string
  compact?: boolean
}

export function ProposalsNavigation({ className, compact = false }: ProposalsNavigationProps) {
  const pathname = usePathname()

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Proposals Module</h2>
          <p className="text-sm text-muted-foreground">Comprehensive proposal management system</p>
        </div>
        <Badge variant="secondary">Superadmin</Badge>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted/50'
              }`}>
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  {!compact && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                {isActive && (
                  <div className="h-2 w-2 bg-primary-foreground rounded-full" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Quick Actions */}
      <div className="mt-8 p-4 bg-muted/30 rounded-lg">
        <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Button size="sm" className="w-full justify-start" asChild>
            <Link href="/admin/proposals/create">
              <Plus className="h-4 w-4 mr-2" />
              New Proposal
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start" asChild>
            <Link href="/admin/proposals/campaigns">
              <Megaphone className="h-4 w-4 mr-2" />
              New Campaign
            </Link>
          </Button>
          <Button size="sm" variant="ghost" className="w-full justify-start" asChild>
            <Link href="/admin/proposals/pricing">
              <Settings className="h-4 w-4 mr-2" />
              Manage Pricing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}