'use client'

/**
 * A cover for a campaign that has no photograph.
 *
 * Archived campaigns mostly predate us collecting artwork, and chasing sixteen images so a
 * grid stops looking broken is the wrong trade. So the cover is generated: a few very soft
 * colour fields under a heavy blur, with the campaign's own name set large across it.
 *
 * Two rules make it work rather than look like a placeholder.
 *
 * It is DETERMINISTIC. The same campaign gets the same cover on every render, every device,
 * forever — the seed is its id. A card whose colours changed on reload would read as a bug,
 * and the wall of them would never settle into something you recognise at a glance.
 *
 * It is STATIC. No animation, no gradient drift. This sits in a grid of twenty; anything
 * moving turns a campaign list into a screensaver.
 */
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

/* FNV-1a. Small, fast, and stable across engines — Math.random or Date would break the
   determinism the whole idea rests on. */
function hash(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/* Palettes are picked, not generated. Random hues produce mud about a third of the time,
   and this has to be right every time without anyone reviewing it. Each is three hues that
   hold together under blur, over a near-black ground so white type is always legible. */
const PALETTES: [number, number, number][] = [
  [265, 320, 210], // violet · magenta · blue
  [155, 190, 250], // green · teal · indigo
  [25, 350, 300],  // amber · rose · purple
  [200, 165, 265], // cyan · emerald · violet
  [340, 15, 45],   // pink · red · orange
  [225, 265, 195], // blue · violet · teal
  [95, 160, 205],  // lime · green · cyan
  [285, 240, 330], // purple · blue · magenta
]

export function GeneratedCover({
  seed, title, subtitle, className, titleClassName,
}: {
  seed: string
  title: string
  subtitle?: string | null
  className?: string
  titleClassName?: string
}) {
  const blobs = useMemo(() => {
    const h = hash(seed)
    const hues = PALETTES[h % PALETTES.length]
    /* Different slices of the same hash drive position and size, so two campaigns sharing a
       palette still look nothing alike. */
    return hues.map((hue, i) => {
      const s = hash(seed + ':' + i)
      return {
        hue,
        x: 10 + ((s >>> 3) % 80),
        y: 5 + ((s >>> 11) % 80),
        size: 58 + ((s >>> 19) % 46),
        light: 52 + ((s >>> 25) % 16),
      }
    })
  }, [seed])

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-neutral-950', className)}>
      {/* The colour, blurred hard enough that the shapes never read as shapes. Scaled past
          the frame so the blur has no visible edge to feather against. */}
      <div className="absolute -inset-[35%] blur-[46px]" aria-hidden>
        {blobs.map((b, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}%`,
              height: `${b.size}%`,
              background: `hsl(${b.hue} 85% ${b.light}%)`,
              opacity: i === 0 ? 0.85 : 0.6,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* Type sits on its own scrim rather than trusting the blur underneath: the palettes
          run light, and a bright blob behind a descender would eat the word. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" aria-hidden />

      <div className="absolute inset-0 flex flex-col justify-end p-4">
        {subtitle && (
          <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
            {subtitle}
          </span>
        )}
        <h3
          className={cn(
            'line-clamp-3 text-[17px] font-bold leading-[1.15] tracking-[-0.025em] text-white',
            '[text-shadow:0_1px_12px_rgba(0,0,0,0.5)]',
            titleClassName,
          )}
        >
          {title}
        </h3>
      </div>
    </div>
  )
}
