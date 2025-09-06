// utils/subscriptionUtils.ts

export type SubscriptionTier = 'free' | 'standard' | 'premium' | 'enterprise'

export interface SubscriptionLimits {
  profiles: number
  emails: number
  posts: number
  teamMembers: number
  price: number
  topupDiscount?: number
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    profiles: 5,
    emails: 0,
    posts: 0, 
    teamMembers: 1,
    price: 0
  },
  standard: {
    profiles: 500,
    emails: 250,
    posts: 125,
    teamMembers: 2,
    price: 199
  },
  premium: {
    profiles: 2000,
    emails: 800,
    posts: 300,
    teamMembers: 5,
    price: 499,
    topupDiscount: 20
  },
  enterprise: {
    profiles: 2000, // Same as premium unless specified otherwise
    emails: 800,
    posts: 300,
    teamMembers: 5,
    price: 499,
    topupDiscount: 20
  }
}

/**
 * Get subscription limits for a given tier
 */
export function getSubscriptionLimits(tier: string | undefined): SubscriptionLimits {
  const normalizedTier = normalizeTierName(tier)
  return SUBSCRIPTION_LIMITS[normalizedTier] || SUBSCRIPTION_LIMITS.free
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
 * Calculate remaining profile unlocks based on subscription tier and usage
 */
export function calculateRemainingProfiles(
  subscriptionTier: string | undefined,
  profilesUsed: number
): {
  remaining: number
  limit: number
  tier: SubscriptionTier
  tierDisplay: string
} {
  const tier = normalizeTierName(subscriptionTier)
  const limits = SUBSCRIPTION_LIMITS[tier]
  const remaining = Math.max(0, limits.profiles - profilesUsed)
  
  return {
    remaining,
    limit: limits.profiles,
    tier,
    tierDisplay: getTierDisplayName(subscriptionTier)
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
    resetDate
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