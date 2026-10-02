/**
 * One place that decides what plan a brand is on.
 *
 * Why this exists. The dashboard and the top bar each derived the plan name on their own,
 * and they disagreed on screen: the header printed "Premium" while the page printed
 * "Standard", for the same customer, at the same moment. The header was falling back to
 * `user.role` ("brand_premium") whenever the team context failed to load, and a role is not
 * a purchase. The page was falling back to the literal string "Free".
 *
 * Both fallbacks broke the same rule: never print something the server did not say. A plan
 * name is the answer to "what am I paying for", so guessing at it is worse than admitting we
 * do not know yet.
 *
 * `null` means we do not know. Callers render UNKNOWN, never a tier name.
 */

const PLAN_TIER_LABELS: Record<string, string> = {
  free: 'Free',
  standard: 'Standard',
  premium: 'Premium',
  enterprise: 'Enterprise',
}

/**
 * Turn whatever the server called the tier into a label, or `null` when there is nothing to
 * turn. Never infers a tier from a role, and never substitutes a default.
 */
export function planTierLabel(tier?: string | null): string | null {
  if (tier == null) return null
  const raw = String(tier).trim()
  if (!raw) return null
  const known = PLAN_TIER_LABELS[raw.toLowerCase()]
  if (known) return known
  // An unrecognised tier is still the server's own word for it, so it is shown as sent
  // rather than replaced by a guess.
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}
