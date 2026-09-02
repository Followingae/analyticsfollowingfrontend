// utils/subscriptionUtils.ts
//
// Tier names and cycle dates. NOT a second limits table.
//
// This file used to carry its own SUBSCRIPTION_LIMITS, which was the fourth
// disagreeing copy of what a tier gets. Two things were wrong with it beyond
// the duplication:
//
//   * it advertised `emails: 200` on Standard and `emails: 500` on Premium.
//     There is no email allowance anywhere in the backend. `email_unlock` was
//     removed from app/models/teams.py ACTION_CREDIT_COSTS because it was never
//     charged, and there is no contact data to unlock in the first place.
//   * it called getPlanAmount() at MODULE SCOPE, which runs at import time,
//     before hydrateBillingCurrency() can be handed the currency the server
//     charges in. That is the exact mechanism that quoted USD prices to a
//     business billing in AED.
//
// Limits now come from PLAN_LIMITS in src/config/planPricing.ts, which mirrors
// PLANS in app/core/plans.py. Prices are not in this file at all.
import { getPlanLimits, unlockGatesForTier } from '@/config/planPricing'

export type SubscriptionTier = 'free' | 'standard' | 'premium' | 'enterprise'

export interface SubscriptionLimits {
  /** Unlocks the plan FUNDS. See the two gates in src/config/planPricing.ts. */
  profiles: number
  /** The ceiling on unlocks in a month, topped-up credits included. */
  profileCap: number
  /** Post analyses a month. 0 means NOT METERED, not "none allowed". */
  posts: number
  teamMembers: number
}

/**
 * Get subscription limits for a given tier.
 *
 * Read from the one table, so this can no longer drift from what the server
 * enforces. For a signed-in account prefer the live billing status, which
 * carries the account's own row.
 */
export function getSubscriptionLimits(tier: string | undefined): SubscriptionLimits {
  const normalizedTier = normalizeTierName(tier)
  const limits = getPlanLimits(normalizedTier)
  return {
    profiles: limits.includedUnlocks,
    profileCap: limits.unlockCap,
    posts: limits.monthlyPosts,
    teamMembers: limits.seats,
  }
}

/**
 * Normalize tier names from backend to our standard format
 */
export function normalizeTierName(tier: string | undefined): SubscriptionTier {
  if (!tier) return 'free'

  const lowerTier = tier.toLowerCase()

  switch (lowerTier) {
    case 'free':
    case 'brand_free':
      return 'free'
    case 'standard':
    case 'brand_standard':
      return 'standard'
    case 'premium':
    case 'brand_premium':
      return 'premium'
    case 'enterprise':
    case 'brand_enterprise':
      return 'enterprise'
    default:
      return 'free'
  }
}

/**
 * Get display name for subscription tier
 */
export function getTierDisplayName(tier: string | undefined): string {
  const normalizedTier = normalizeTierName(tier)

  switch (normalizedTier) {
    case 'free':
      return 'Free'
    case 'standard':
      return 'Standard'
    case 'premium':
      return 'Premium'
    case 'enterprise':
      return 'Enterprise'
    default:
      return 'Free'
  }
}

/**
 * Remaining profile unlocks on the plan itself.
 *
 * `limit` is what the plan FUNDS, which is the number a customer can spend
 * without buying anything. `cap` is the separate count gate: the ceiling in a
 * month even with topped-up credits. On Free and Standard they are the same
 * number, so top-ups buy no extra unlocks at all; on Premium the cap is double
 * the included figure. Showing the cap as though it were the allowance would
 * promise 2,000 unlocks to someone whose plan pays for 1,000.
 */
export function calculateRemainingProfiles(
  subscriptionTier: string | undefined,
  profilesUsed: number
): {
  remaining: number
  limit: number
  cap: number
  /** Unlocks reachable only by buying credits. 0 means top-ups buy nothing. */
  headroom: number
  tier: SubscriptionTier
  tierDisplay: string
} {
  const tier = normalizeTierName(subscriptionTier)
  const gates = unlockGatesForTier(tier)
  const limit = gates.included ?? 0
  const remaining = Math.max(0, limit - profilesUsed)

  return {
    remaining,
    limit,
    cap: gates.cap ?? limit,
    headroom: gates.headroom ?? 0,
    tier,
    tierDisplay: getTierDisplayName(subscriptionTier),
  }
}

/**
 * Get next billing cycle date (simplified - assumes monthly billing on 1st of month)
 * In production, this would come from your subscription service
 */
export function getNextBillingDate(): Date {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth
}

/**
 * Get time until next billing cycle resets
 */
export function getTimeUntilReset(): {
  days: number
  hours: number
  minutes: number
  resetDate: Date
} {
  const now = new Date()
  const resetDate = getNextBillingDate()
  const timeDiff = resetDate.getTime() - now.getTime()

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

  return {
    days,
    hours,
    minutes,
    resetDate,
  }
}

/**
 * Format reset time for display
 */
export function formatResetTime(): string {
  const { days, hours, minutes } = getTimeUntilReset()

  if (days > 0) {
    return `Resets in ${days}d ${hours}h`
  } else if (hours > 0) {
    return `Resets in ${hours}h ${minutes}m`
  } else {
    return `Resets in ${minutes}m`
  }
}
