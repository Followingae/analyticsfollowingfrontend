'use client'

import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { SuperadminProposalsDashboard } from './superadmin/SuperadminProposalsDashboard'
import { BrandProposalsDashboard } from './brand/BrandProposalsDashboard'
import { AuthGuard } from '@/components/AuthGuard'

/**
 * Role-based Proposals Router Component
 * Routes users to appropriate proposals dashboard based on their role
 */
export function ProposalsRouter() {
  const { user } = useEnhancedAuth()

  if (!user) {
    return (
      <AuthGuard requireAuth={true}>
        <div>Loading...</div>
      </AuthGuard>
    )
  }

  // Superadmin/Admin users see full proposal management dashboard
  if (user.role === 'super_admin' || user.role === 'admin') {
    return (
      <AuthGuard requireAuth={true} requireSuperAdmin={true}>
        <SuperadminProposalsDashboard />
      </AuthGuard>
    )
  }

  // Brand users see simplified proposals view (no sensitive pricing data)
  if (user.role.startsWith('brand_')) {
    return (
      <AuthGuard requireAuth={true}>
        <BrandProposalsDashboard />
      </AuthGuard>
    )
  }

  // Fallback for unknown roles
  return (
    <AuthGuard requireAuth={true}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Not Available</h2>
          <p className="text-muted-foreground">
            Proposals feature is not available for your account type.
          </p>
        </div>
      </div>
    </AuthGuard>
  )
}