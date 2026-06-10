/**
 * Operations — campaign execution pages.
 *
 * One console, role-aware shell: operators see these pages inside the
 * superadmin sidebar/header (module-gated "operations"); brand clients —
 * who get a read-only client view of their campaigns — keep their own brand
 * shell. The standalone "Operations OS" chrome + duplicate Toaster are gone
 * (the root layout already mounts a global Toaster).
 */

'use client';

import { Loader2 } from 'lucide-react';
import { OperationsProvider } from '@/contexts/OperationsContext';
import ProtectedOperationsRoute from '@/components/operations/ProtectedOperationsRoute';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { BrandUserInterface } from '@/components/brand/BrandUserInterface';
import { AuthGuard } from '@/components/AuthGuard';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

export default function OperationsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useEnhancedAuth();
  const role = (user?.role || '').toLowerCase();
  const isOperator = role === 'super_admin' || role === 'superadmin' || role === 'admin';

  const inner = (
    <ProtectedOperationsRoute>
      <OperationsProvider>
        {children}
      </OperationsProvider>
    </ProtectedOperationsRoute>
  );

  // Don't flash the wrong shell while the role resolves.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return isOperator ? (
    <SuperadminLayout>{inner}</SuperadminLayout>
  ) : (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>{inner}</BrandUserInterface>
    </AuthGuard>
  );
}
