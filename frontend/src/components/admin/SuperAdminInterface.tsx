'use client'

import { useState } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { UserManagementDashboard } from '@/components/admin/UserManagementDashboard'
import { FinancialDashboard } from '@/components/admin/FinancialDashboard'
import { ProposalDashboard } from '@/components/admin/ProposalDashboard'
import { SystemMonitorDashboard } from '@/components/admin/SystemMonitorDashboard'
import { InfluencerDashboard } from '@/components/admin/InfluencerDashboard'

export type AdminView = 
  | 'dashboard'
  | 'users'
  | 'finance'
  | 'proposals'
  | 'system'
  | 'influencers'
  | 'analytics'
  | 'settings'

export function SuperAdminInterface() {
  const { user } = useEnhancedAuth()
  const [currentView, setCurrentView] = useState<AdminView>('dashboard')

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard />
      case 'users':
        return <UserManagementDashboard />
      case 'finance':
        return <FinancialDashboard />
      case 'proposals':
        return <ProposalDashboard />
      case 'system':
        return <SystemMonitorDashboard />
      case 'influencers':
        return <InfluencerDashboard />
      case 'analytics':
        return <div className="p-6">Analytics Dashboard - Coming Soon</div>
      case 'settings':
        return <div className="p-6">System Settings - Coming Soon</div>
      default:
        return <AdminDashboard />
    }
  }

  return (
    <AdminLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
    </AdminLayout>
  )
}