'use client'

// This component has been completely replaced with ModernAnalyticsDashboard
// Import and use the new beautiful analytics dashboard instead
import { ModernAnalyticsDashboard } from './ModernAnalyticsDashboard'

interface ComprehensiveAnalyticsDashboardProps {
  username: string
}

/**
 * ComprehensiveAnalyticsDashboard - Now replaced with beautiful ModernAnalyticsDashboard
 * 
 * This component now simply forwards to the new modern, user-friendly analytics dashboard
 * designed specifically for marketing managers and brand owners.
 * 
 * Key improvements in the new dashboard:
 * - User-friendly 4-tab structure: Profile, Audience, Engagement, Posting
 * - Marketing-friendly language (no technical "10-model AI" branding)
 * - Beautiful shadcn charts and components throughout
 * - Real API data integration with proper error handling
 * - Responsive design optimized for business users
 */
export function ComprehensiveAnalyticsDashboard({ username }: ComprehensiveAnalyticsDashboardProps) {
  // Use the new modern analytics dashboard instead
  return <ModernAnalyticsDashboard username={username} />
}