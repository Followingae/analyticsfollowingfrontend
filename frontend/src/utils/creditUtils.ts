/**
 * Credit Utility Functions
 * Helper functions for credit-related operations, formatting, and business logic
 */

import { CreditBalance, PricingRule, CreditError } from '@/types'

/**
 * Format credit amount for display
 */
export function formatCredits(amount: number | null | undefined): string {
  // Handle null/undefined values
  if (amount == null) {
    return '0'
  }
  
  // Handle non-numeric values
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return '0'
  }
  
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`
  }
  return amount.toString()
}

/**
 * Get credit balance status
 */
export function getCreditBalanceStatus(balance: CreditBalance): {
  status: 'healthy' | 'low' | 'critical' | 'empty'
  color: string
  message: string
} {
  const percentage = balance.monthly_allowance > 0 
    ? (balance.current_balance / balance.monthly_allowance) * 100 
    : 0

  if (balance.current_balance === 0) {
    return {
      status: 'empty',
      color: 'text-red-600',
      message: 'No credits remaining'
    }
  }

  if (percentage <= 10) {
    return {
      status: 'critical',
      color: 'text-red-600',
      message: 'Critical - credits running low'
    }
  }

  if (percentage <= 25) {
    return {
      status: 'low',
      color: 'text-orange-600',
      message: 'Low credits - consider purchasing more'
    }
  }

  return {
    status: 'healthy',
    color: 'text-green-600',
    message: 'Sufficient credits available'
  }
}

/**
 * Calculate days until billing cycle reset
 */
export function getDaysUntilReset(billingCycleStart: string): number {
  const today = new Date()
  const billingDate = new Date(billingCycleStart)
  
  // Get next billing date
  const nextBilling = new Date(billingDate)
  nextBilling.setMonth(nextBilling.getMonth() + 1)
  
  // If next billing date has passed, move to the month after
  if (nextBilling <= today) {
    nextBilling.setMonth(nextBilling.getMonth() + 1)
  }
  
  const timeDiff = nextBilling.getTime() - today.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

/**
 * Check if user can perform an action based on balance and pricing
 */
export function canPerformAction(
  balance: CreditBalance,
  pricing: PricingRule,
  freeAllowanceUsed: number = 0
): {
  canPerform: boolean
  reason?: string
  usesFreeAllowance: boolean
  creditsRequired: number
} {
  const freeAllowanceRemaining = Math.max(0, pricing.free_allowance_per_month - freeAllowanceUsed)
  
  // Check if can use free allowance
  if (freeAllowanceRemaining > 0) {
    return {
      canPerform: true,
      usesFreeAllowance: true,
      creditsRequired: 0
    }
  }
  
  // Check if has enough credits
  if (balance.current_balance >= pricing.credits_per_action) {
    return {
      canPerform: true,
      usesFreeAllowance: false,
      creditsRequired: pricing.credits_per_action
    }
  }
  
  // Cannot perform action
  const needed = pricing.credits_per_action - balance.current_balance
  return {
    canPerform: false,
    reason: `Insufficient credits. Need ${needed} more credits.`,
    usesFreeAllowance: false,
    creditsRequired: pricing.credits_per_action
  }
}

/**
 * Parse 402 error response to get credit information
 */
export function parseCreditError(error: any): CreditError | null {
  try {
    if (error?.status === 402 || error?.data?.detail?.includes('credits')) {
      return {
        detail: error.data?.detail || error.message || 'Insufficient credits',
        headers: error.headers || error.data?.headers
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Get action type display name
 */
export function getActionDisplayName(actionType: string): string {
  const displayNames: Record<string, string> = {
    'influencer_unlock': 'Profile Analysis',
    'detailed_analytics': 'Detailed Analytics',
    'ai_insights': 'AI Insights',
    'profile_posts': 'Profile Posts'
  }
  
  return displayNames[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Get action type icon
 */
export function getActionIcon(actionType: string): string {
  const icons: Record<string, string> = {
    'influencer_unlock': '🔓',
    'detailed_analytics': '📊',
    'ai_insights': '🤖',
    'profile_posts': '📸'
  }
  
  return icons[actionType] || '⚡'
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercentage(used: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.max(0, (used / total) * 100))
}

/**
 * Format date for display
 */
export function formatCreditDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Get wallet status display information
 */
export function getWalletStatusInfo(status: CreditBalance['wallet_status']): {
  label: string
  color: string
  canUse: boolean
} {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        color: 'text-green-600',
        canUse: true
      }
    case 'locked':
      return {
        label: 'Locked',
        color: 'text-red-600',
        canUse: false
      }
    case 'suspended':
      return {
        label: 'Suspended',
        color: 'text-orange-600',
        canUse: false
      }
    default:
      return {
        label: 'Unknown',
        color: 'text-gray-600',
        canUse: false
      }
  }
}

/**
 * Calculate bulk discount if applicable
 */
export function calculateBulkDiscount(
  pricing: PricingRule,
  quantity: number
): {
  originalCost: number
  discountedCost: number
  savings: number
  discountPercentage: number
} {
  const originalCost = pricing.credits_per_action * quantity
  
  if (!pricing.bulk_discounts || pricing.bulk_discounts.length === 0) {
    return {
      originalCost,
      discountedCost: originalCost,
      savings: 0,
      discountPercentage: 0
    }
  }
  
  // Find the highest applicable discount
  let highestDiscount = 0
  for (const discount of pricing.bulk_discounts) {
    if (quantity >= discount.min_quantity && discount.discount_percentage > highestDiscount) {
      highestDiscount = discount.discount_percentage
    }
  }
  
  const discountAmount = (originalCost * highestDiscount) / 100
  const discountedCost = originalCost - discountAmount
  
  return {
    originalCost,
    discountedCost,
    savings: discountAmount,
    discountPercentage: highestDiscount
  }
}

/**
 * Validate credit amount
 */
export function validateCreditAmount(amount: number): {
  isValid: boolean
  error?: string
} {
  if (!Number.isFinite(amount)) {
    return {
      isValid: false,
      error: 'Invalid credit amount'
    }
  }
  
  if (amount < 0) {
    return {
      isValid: false,
      error: 'Credit amount cannot be negative'
    }
  }
  
  if (amount > 1000000) {
    return {
      isValid: false,
      error: 'Credit amount is too large'
    }
  }
  
  return { isValid: true }
}

/**
 * Get suggested top-up amounts based on current usage
 */
export function getSuggestedTopUpAmounts(
  currentBalance: number,
  monthlyUsage: number
): number[] {
  const baseAmounts = [100, 500, 1000, 2500, 5000, 10000]
  
  // If monthly usage is known, suggest amounts based on usage patterns
  if (monthlyUsage > 0) {
    const monthlyAmount = Math.ceil(monthlyUsage / 100) * 100 // Round up to nearest 100
    const twoMonthAmount = monthlyAmount * 2
    const threeMonthAmount = monthlyAmount * 3
    
    return [monthlyAmount, twoMonthAmount, threeMonthAmount, ...baseAmounts]
      .filter((amount, index, arr) => arr.indexOf(amount) === index) // Remove duplicates
      .sort((a, b) => a - b) // Sort ascending
      .slice(0, 6) // Limit to 6 suggestions
  }
  
  return baseAmounts
}