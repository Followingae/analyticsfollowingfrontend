"use client"

/**
 * Full-screen viewer for a handful of screenshots, flipped through one at a time.
 *
 * Built for creator insights screenshots, which are tall phone captures: the image is fitted
 * to the height of the screen rather than the width, so the number at the bottom of the
 * screenshot is never below the fold. Arrow keys, swipe and the thumbnail strip all move
 * between them; Escape closes.
 */
import { useCallback, useEffect, useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function ScreenshotLightbox({
  images, open, onOpenChange, startAt = 0, title, subtitle,
}: {
  images: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  startAt?: number
  title: string
  subtitle?: string
}) {
  const [[index, direction], setPage] = useState<[number, number]>([startAt, 0])
  const count = images.length

  // Every open starts where it was asked to, not where the last viewing left off.
  useEffect(() => { if (open) setPage([Math.min(startAt, Math.max(count - 1, 0)), 0]) }, [open, startAt, count])

  const go = useCallback((step: number) => {
    if (count < 2) return
    setPage(([i]) => [(i + step + count) % count, step])
  }, [count])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1) }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, go])

  // The neighbours are fetched ahead of time so the next one is there when it is asked for.
  useEffect(() => {
    if (!open || count < 2) return
    for (const i of [index + 1, index - 1]) {
      const img = new Image()
      img.src = images[(i + count) % count]
    }
  }, [open, index, images, count])

  if (!count) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[60] flex flex-col text-white outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          aria-describedby={undefined}
        >
          <div className="flex items-center gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-[15px] font-semibold tracking-[-0.01em]">
                {title}
              </DialogPrimitive.Title>
              {subtitle && <p className="truncate text-xs text-white/55">{subtitle}</p>}
            </div>
            {count > 1 && (
              <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tabular-nums text-white/80">
                {index + 1} / {count}
              </span>
            )}
            <DialogPrimitive.Close
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white",
                count > 1 ? "" : "ml-auto",
              )}
              aria-label="Close"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-4 sm:px-20"
            onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false) }}
          >
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.img
                key={index}
                src={images[index]}
                alt={`${title}, ${index + 1} of ${count}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * 60, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: direction * -60, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 32, opacity: { duration: 0.18 } }}
                drag={count > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
                  if (info.offset.x < -80 || info.velocity.x < -500) go(1)
                  else if (info.offset.x > 80 || info.velocity.x > 500) go(-1)
                }}
                draggable={false}
                className="max-h-full max-w-full cursor-grab select-none rounded-2xl object-contain shadow-2xl shadow-black/50 ring-1 ring-white/10 active:cursor-grabbing"
              />
            </AnimatePresence>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:scale-105 hover:bg-white/20 sm:grid"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next"
                  className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:scale-105 hover:bg-white/20 sm:grid"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          {count > 1 && (
            <div className="flex justify-center gap-2 px-4 pb-5 sm:pb-6">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPage([i, i > index ? 1 : -1])}
                  aria-label={`Screenshot ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "h-16 w-11 overflow-hidden rounded-lg ring-2 transition",
                    i === index ? "opacity-100 ring-white" : "opacity-45 ring-transparent hover:opacity-80",
                  )}
                >
                  <img src={src} alt="" className="size-full object-cover object-top" />
                </button>
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
