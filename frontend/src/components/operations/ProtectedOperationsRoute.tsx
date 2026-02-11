/**
 * Protected Route Wrapper for Operations OS
 * Enforces role-based access control at the route level
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import { checkOperationsAccess, hasPermission } from '@/utils/operationsAccess';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';

interface ProtectedOperationsRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackUrl?: string;
}

export default function ProtectedOperationsRoute({
  children,
  requiredPermission,
  fallbackUrl = '/dashboard'
}: ProtectedOperationsRouteProps) {
  const router = useRouter();
  const user = useUserStore(state => state.user);
  const isLoading = useUserStore(state => state.isLoading);

  useEffect(() => {
    // Wait for user data to load
    if (isLoading) return;

    // Check if user has access to Operations OS
    if (!checkOperationsAccess(user)) {
      toast.error('You do not have access to Operations OS');
      router.push(fallbackUrl);
      return;
    }

    // Check specific permission if required
    if (requiredPermission && !hasPermission(user, requiredPermission as any)) {
      toast.error('You do not have permission to view this page');
      router.push('/ops/campaigns'); // Redirect to campaigns list
      return;
    }
  }, [user, isLoading, requiredPermission, router, fallbackUrl]);

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state if no access
  if (!user || !checkOperationsAccess(user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access the Operations OS.
            Please contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => router.push(fallbackUrl)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check specific permission
  if (requiredPermission && !hasPermission(user, requiredPermission as any)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="rounded-full bg-warning/10 p-4">
            <Lock className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-semibold">Permission Required</h1>
          <p className="text-muted-foreground">
            You do not have the required permission to view this page.
            This feature is only available to authorized users.
          </p>
          <button
            onClick={() => router.push('/ops/campaigns')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
}