/**
 * Role-Based Content Display Component
 * Shows or hides content based on user permissions
 */

'use client';

import { useUserStore } from '@/stores/userStore';
import { hasPermission, isInternalUser } from '@/utils/operationsAccess';

interface RoleBasedContentProps {
  children: React.ReactNode;
  permission?: string;
  internalOnly?: boolean;
  fallback?: React.ReactNode;
}

export function RoleBasedContent({
  children,
  permission,
  internalOnly = false,
  fallback = null
}: RoleBasedContentProps) {
  const user = useUserStore(state => state.user);

  // Check internal-only access
  if (internalOnly && !isInternalUser(user)) {
    return <>{fallback}</>;
  }

  // Check specific permission
  if (permission && !hasPermission(user, permission as any)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience wrapper for internal-only content
export function InternalOnly({
  children,
  fallback
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleBasedContent internalOnly={true} fallback={fallback}>
      {children}
    </RoleBasedContent>
  );
}

// Convenience wrapper for client-safe content
export function ClientSafe({
  children,
  internalVersion,
  clientVersion
}: {
  children?: React.ReactNode;
  internalVersion?: React.ReactNode;
  clientVersion?: React.ReactNode;
}) {
  const user = useUserStore(state => state.user);
  const internal = isInternalUser(user);

  if (internalVersion && clientVersion) {
    return <>{internal ? internalVersion : clientVersion}</>;
  }

  return <>{children}</>;
}