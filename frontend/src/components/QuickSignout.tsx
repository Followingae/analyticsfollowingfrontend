"use client"

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { useRouter } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function QuickSignout({ className }: { className?: string }) {
  const { logout } = useEnhancedAuth()
  const router = useRouter()

  const handleSignout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignout}
            className={className}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Sign out</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}