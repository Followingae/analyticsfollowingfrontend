/**
 * The one spacing scale for the Run module.
 *
 * The audit that prompted this wave found nine different ad-hoc spacing values on a
 * single page. The cure is not discipline, it is a short list: six steps, and nothing
 * between them. Every gap, pad and stack in this module is one of these six.
 *
 * These are Tailwind's own spacing values, so `gap-3` and `SPACE.snug` are the same
 * 12px — the scale is a restriction on which ones get used, not a new set of numbers.
 * It lives here rather than in `ui2/tokens.css` because that file is shared with the
 * rest of the component set and this is a module-level convention.
 *
 *   tight   4px   inside a control — icon to its label
 *   snug    8px   between two lines of the same thought
 *   base   12px   between fields in a group, cells in a row
 *   roomy  16px   between cards in a grid, rows in a list
 *   section 24px  between one panel and the next
 *   page   40px   above and below a page's major blocks
 *
 * Radii never appear as literals; they come from `rounded-ds-*` in `ui2/tokens.css`.
 */
export const SPACE = {
  tight: 1,
  snug: 2,
  base: 3,
  roomy: 4,
  section: 6,
  page: 10,
} as const

/** The page shell every Run screen sits in. One place, so all five agree. */
export const PAGE_SHELL = "mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-10"

/** Vertical rhythm between a page's major blocks. */
export const PAGE_STACK = "flex flex-col gap-6 md:gap-10"
