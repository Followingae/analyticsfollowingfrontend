"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BoringAvatar } from "@/components/ui/boring-avatar"
import { Badge } from "@/components/ui/badge"

const AVATAR_VARIANTS = [
  { value: "beam", label: "Face Classic" },
  { value: "beam-1", label: "Face Modern" },
  { value: "beam-2", label: "Face Bold" },
  { value: "beam-3", label: "Face Soft" },
] as const

const BRAND_COLORS = ["#d3ff02", "hsl(var(--primary))", "#c9a7f9", "#0a1221"]

interface AvatarSelectionDialogProps {
  currentAvatarConfig?: {
    variant: string
    colorScheme: string
    seed?: string
  }
  userName: string
  onAvatarChange: (config: { variant: string; colorScheme: string; colors: string[]; seed?: string }) => void
  trigger?: React.ReactNode
}

export function AvatarSelectionDialog({
  currentAvatarConfig,
  userName,
  onAvatarChange,
  trigger
}: AvatarSelectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<string>(
    currentAvatarConfig?.variant || "beam"
  )
  const [avatarSeed, setAvatarSeed] = useState<string>(userName)

  const generateNewAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7))
  }

  const handleAvatarSelect = (variant: string) => {
    setSelectedVariant(variant)
    const avatarSeedForVariant = `${avatarSeed}-${variant}`
    onAvatarChange({
      variant: variant,
      colorScheme: "Brand Primary", 
      colors: BRAND_COLORS,
      seed: avatarSeedForVariant
    })
    setOpen(false)
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      Change Avatar
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
          <DialogDescription>
            Choose from 4 unique avatar styles or generate new variations. All avatars use your brand colors.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar Selection Grid */}
          <div className="grid grid-cols-4 gap-6">
            {AVATAR_VARIANTS.map((variant) => (
              <div 
                key={variant.value} 
                className="flex flex-col items-center space-y-3 cursor-pointer group"
                onClick={() => handleAvatarSelect(variant.value)}
              >
                <div className="p-4 rounded-lg border-2 transition-colors group-hover:border-primary group-hover:bg-primary/5">
                  <BoringAvatar
                    name={`${avatarSeed}-${variant.value}`}
                    size={100}
                    variant="beam"
                    colors={BRAND_COLORS}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Generate New Button */}
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={generateNewAvatar}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Generate New
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}