"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BoringAvatar } from "@/components/ui/boring-avatar"
import { cn } from "@/lib/utils"
interface UserAvatarProps {
  user?: {
    full_name?: string
    first_name?: string
    last_name?: string
    email?: string
    profile_picture_url?: string
    avatar_config?: {
      variant: string
      colorScheme: string
      colors: string[]
      seed?: string
    }
  }
  size?: number
  className?: string
  fallbackText?: string
  showBoringAvatar?: boolean
}
export function UserAvatar({
  user,
  size = 40,
  className,
  fallbackText,
  showBoringAvatar = true
}: UserAvatarProps) {
  // Get user name for boring-avatars seed
  const getUserName = () => {
    if (user?.full_name) return user.full_name
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`
    if (user?.first_name) return user.first_name
    if (user?.email) return user.email
    return fallbackText || "User"
  }
  // Get user initials for fallback
  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`
    }
    if (user?.full_name) {
      const names = user.full_name.split(' ')
      return names.length > 1 ? `${names[0][0]}${names[names.length-1][0]}` : names[0][0]
    }
    if (user?.first_name) {
      return user.first_name[0]
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return fallbackText?.[0]?.toUpperCase() || "U"
  }
  const userName = getUserName()
  const userInitials = getUserInitials()
  // If user has a custom profile picture, use it
  if (user?.profile_picture_url) {
    return (
      <Avatar className={cn("", className)} style={{ width: size, height: size }}>
        <AvatarImage src={user.profile_picture_url} alt={userName} />
        <AvatarFallback className="text-sm font-medium">
          {userInitials}
        </AvatarFallback>
      </Avatar>
    )
  }
  // Use boring-avatars
  if (showBoringAvatar) {
    const avatarConfig = user?.avatar_config
    return (
      <div className={cn("rounded-full overflow-hidden", className)}>
        <BoringAvatar
          name={avatarConfig?.seed || userName}
          size={size}
          variant="beam"
          colors={["#d3ff02", "#5100f3", "#c9a7f9", "#0a1221"]}
        />
      </div>
    )
  }
  // Fallback to regular avatar with initials
  return (
    <Avatar className={cn("", className)} style={{ width: size, height: size }}>
      <AvatarFallback className="text-sm font-medium">
        {userInitials}
      </AvatarFallback>
    </Avatar>
  )
}