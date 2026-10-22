import { Instagram, Youtube } from "lucide-react"
import type { Platform } from "@/lib/deliverables"

/** Lucide has no TikTok mark, so this is the note glyph drawn in the same stroke style. */
export function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 4 4V3c.5 2.5 2.5 4.5 5 5" />
    </svg>
  )
}

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  if (platform === "tiktok") return <TikTokGlyph className={className} />
  if (platform === "youtube") return <Youtube className={className} aria-hidden="true" />
  return <Instagram className={className} aria-hidden="true" />
}
