/**
 * The page shell for the Run module.
 *
 * This file used to define a second six-step spacing scale, in numbers that did not
 * match the first one, under a docstring claiming to be the only one. So did
 * `ui2/tokens.css`. Two files, each certain it was the single source of truth, four
 * pixels apart at three of the six steps.
 *
 * The scale in `ui2/tokens.css` wins, because it is CSS: it generates real Tailwind
 * utilities (`gap-ds-3`, `p-ds-4`) that a class list can use, where this file could
 * only ever hand out a number for someone to interpolate. Nothing consumed the
 * numbers here, so they are gone rather than aliased.
 *
 *   ds-1   4px   glued      an icon to its label
 *   ds-2   8px   paired     a figure and the caption naming it
 *   ds-3  16px   grouped    rows in one list, fields in one set
 *   ds-4  24px   separated  one stat from the next
 *   ds-5  40px   sectioned  a genuinely different subject
 *   ds-6  64px   banded     page-level bands
 *
 * The two constants below are the same pixels they have always been, written in
 * those steps. Radii come from `rounded-ds-*` in the same file and never appear as
 * literals.
 *
 * One caveat worth knowing before you reach for a `ds-` spacing class inside a
 * shared component: tailwind-merge does not recognise `p-ds-4` as a padding
 * utility, so a caller passing `p-4` gets both classes rather than winning. Use
 * them in page and layout code, where nothing merges over the top; use stock
 * Tailwind inside anything that takes a `className`.
 */

/** The page shell every Run screen sits in. One place, so all five agree. */
export const PAGE_SHELL =
  "mx-auto w-full max-w-[1400px] px-ds-3 py-ds-4 md:px-ds-4 md:py-ds-5"

/** Vertical rhythm between a page's major blocks. */
export const PAGE_STACK = "flex flex-col gap-ds-4 md:gap-ds-5"
