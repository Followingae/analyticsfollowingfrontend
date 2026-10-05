/**
 * Rule 2, made structural: never put text on top of a user-uploaded photograph.
 *
 * The reason is not taste. A creator's submission is an unknown image — it can be
 * white sand, a blown-out window, a busy flat-lay — so any text laid over it is
 * legible in the mockup and illegible in production, on somebody else's photo. The
 * usual patch is a dark scrim, which trades a legibility bug for permanently muddying
 * the one thing the brand opened the screen to look at.
 *
 * This exists in three places elsewhere in the app. The way to not add a fourth is not
 * to remember the rule; it is to make the mistake unrepresentable.
 *
 * So: `CreatorPhoto` takes NO children and NO overlay prop. The image element is the
 * only thing inside its frame. Everything you might want to say goes to `caption` and
 * `meta`, which render underneath, outside the frame, on a solid `bg-card` surface.
 * Putting a label over the image would mean editing this file, at which point the
 * comment you are reading is in the diff.
 */
import * as React from "react"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

type CreatorPhotoProps = {
  /**
   * Must be a cdn.following.ae URL. Instagram's own `scontent-*` hosts refuse
   * hotlinks with ERR_BLOCKED_BY_RESPONSE, so a raw IG URL renders as a broken box.
   */
  src: string | null | undefined
  alt: string
  /** The line under the image. Rendered below the frame, never on it. */
  caption?: React.ReactNode
  /** A second, quieter line under the caption — a date, a deliverable, a count. */
  meta?: React.ReactNode
  aspect?: "square" | "portrait" | "video"
  className?: string
  /** Standard React children are deliberately not accepted. */
  children?: never
}

const ASPECT: Record<NonNullable<CreatorPhotoProps["aspect"]>, string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  video: "aspect-video",
}

export function CreatorPhoto({
  src,
  alt,
  caption,
  meta,
  aspect = "square",
  className,
}: CreatorPhotoProps) {
  const [failed, setFailed] = React.useState(false)
  const showImage = Boolean(src) && !failed

  return (
    <figure
      className={cn(
        "bg-card overflow-hidden rounded-ds-surface border flex flex-col",
        className
      )}
    >
      {/* The frame. One child, and it is the picture. */}
      <div className={cn("bg-muted relative w-full", ASPECT[aspect])}>
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src as string}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground/40 absolute inset-0 grid place-items-center">
            <ImageOff className="size-6" aria-hidden />
            <span className="sr-only">No image</span>
          </div>
        )}
      </div>

      {/* Everything legible, on a solid surface, below the picture. */}
      {(caption || meta) && (
        <figcaption className="bg-card flex flex-col gap-0.5 px-3 py-2.5">
          {caption && <div className="text-ds-label truncate">{caption}</div>}
          {meta && <div className="text-ds-caption text-muted-foreground truncate">{meta}</div>}
        </figcaption>
      )}
    </figure>
  )
}
