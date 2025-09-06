import Avatar from "boring-avatars"

export interface BoringAvatarProps {
  name: string
  size?: number
  variant?: "marble" | "beam" | "pixel" | "sunset" | "ring" | "bauhaus"
  colors?: string[]
  square?: boolean
}

export function BoringAvatar({ 
  name, 
  size = 40, 
  variant = "beam", 
  colors = ["#d3ff02", "hsl(var(--primary))", "#c9a7f9", "#0a1221"],
  square = false 
}: BoringAvatarProps) {
  return (
    <Avatar
      size={size}
      name={name}
      variant={variant}
      colors={colors}
      square={square}
    />
  )
}