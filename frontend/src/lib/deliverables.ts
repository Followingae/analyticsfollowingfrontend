/**
 * What can be booked from a creator, on which platform. The one list, mirroring
 * app/core/deliverables.py on the backend.
 *
 * Instagram keeps its original keys (`reel`, `post`, ...) so every stored price and
 * proposal line still means what it meant. A package (`pkg_<id>`) or a one-off deal
 * (`deal_<hex>`) is one line with its own name, contents and price, booked whole.
 * `video`, `bundle` and `monthly` were retired on 2026-10-22: nobody had priced one.
 */

export type Platform = "instagram" | "tiktok" | "youtube"

export type DeliverableKey =
  | "reel" | "post" | "story" | "carousel"
  | "tiktok_video" | "tiktok_story"
  | "youtube_video" | "youtube_short"

export interface DeliverableSpec {
  key: DeliverableKey
  platform: Platform
  /** Short label, read under a platform heading: "Reel", "Video", "Short". */
  label: string
}

export const PLATFORMS: Platform[] = ["instagram", "tiktok", "youtube"]

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
}

export const DELIVERABLE_SPECS: DeliverableSpec[] = [
  { key: "reel", platform: "instagram", label: "Reel" },
  { key: "post", platform: "instagram", label: "Post" },
  { key: "story", platform: "instagram", label: "Story" },
  { key: "carousel", platform: "instagram", label: "Carousel" },
  { key: "tiktok_video", platform: "tiktok", label: "Video" },
  { key: "tiktok_story", platform: "tiktok", label: "Story" },
  { key: "youtube_video", platform: "youtube", label: "Long video" },
  { key: "youtube_short", platform: "youtube", label: "Short" },
]

export const DELIVERABLE_KEYS: DeliverableKey[] = DELIVERABLE_SPECS.map((d) => d.key)

const SPEC_BY_KEY = Object.fromEntries(DELIVERABLE_SPECS.map((d) => [d.key, d])) as Record<string, DeliverableSpec>

export const isBundleKey = (key?: string | null) =>
  !!key && (key.startsWith("pkg_") || key.startsWith("deal_"))

export const platformOf = (key?: string | null): Platform | null => (key && SPEC_BY_KEY[key]?.platform) || null

export interface LineLike {
  type: string
  quantity?: number
  name?: string | null
  includes?: { type: string; quantity?: number }[] | null
}

/** "Reel", "TikTok video", "YouTube short", or a package's own name. */
export function describeKey(key: string): string {
  const spec = SPEC_BY_KEY[key]
  if (!spec) return key.replace(/_/g, " ")
  return spec.platform === "instagram" ? spec.label : `${PLATFORM_LABEL[spec.platform]} ${spec.label.toLowerCase()}`
}

export function describeLine(line: LineLike): string {
  if (isBundleKey(line.type)) return line.name || "Package"
  const q = line.quantity && line.quantity > 1 ? `${line.quantity} × ` : ""
  return q + describeKey(line.type)
}

/** What a package contains, in words: "Reel + TikTok video + 2 × YouTube short". */
export function describeIncludes(includes?: LineLike["includes"]): string {
  return (includes || [])
    .map((i) => (i.quantity && i.quantity > 1 ? `${i.quantity} × ` : "") + describeKey(i.type))
    .join(" + ")
}

/** The platforms a line touches, for icons. */
export function platformsOfLine(line: LineLike): Platform[] {
  const keys = isBundleKey(line.type) ? (line.includes || []).map((i) => i.type) : [line.type]
  const out: Platform[] = []
  for (const k of keys) {
    const p = platformOf(k)
    if (p && !out.includes(p)) out.push(p)
  }
  return out
}

/** Instagram always; TikTok / YouTube once a handle is saved. */
export function platformsOfCreator(c: { tiktok_username?: string | null; youtube_handle?: string | null }): Platform[] {
  const out: Platform[] = ["instagram"]
  if (c.tiktok_username) out.push("tiktok")
  if (c.youtube_handle) out.push("youtube")
  return out
}

export const tiktokUrl = (h?: string | null) => (h ? `https://www.tiktok.com/@${h}` : null)
export const youtubeUrl = (h?: string | null) => (h ? `https://www.youtube.com/${h}` : null)
