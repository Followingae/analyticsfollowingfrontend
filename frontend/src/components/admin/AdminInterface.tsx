'use client'

import { useState } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { UserManagementDashboard } from '@/components/admin/UserManagementDashboard'
import { ProposalDashboard } from '@/components/admin/ProposalDashboard'
import { AdminView } from './SuperAdminInterface'

export function AdminInterface() {
  const { user, hasPermission } = useEnhancedAuth()
  const [currentView, setCurrentView] = useState<AdminView>('dashboard')

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard />
      
      case 'users':
        if (hasPermission('can_view_all_users')) {
          return <UserManagementDashboard />
        }
        return <div className="p-6">Access denied to user management</div>
      
      case 'proposals':
        if (hasPermission('can_view_all_proposals')) {
          return <ProposalDashboard />
        }
        return <div className="p-6">Access denied to proposal management</div>
      
      case 'finance':
      case 'system':
      case 'influencers':
        return <div className="p-6">This feature is not available for your role</div>
      
      default:
        return <AdminDashboard />
    }
  }

  return (
    <AdminLayout 
      currentView={currentView} 
      onViewChange={setCurrentView}
      limitedAccess={true}
    >
      {renderContent()}
    </AdminLayout>
  )
}