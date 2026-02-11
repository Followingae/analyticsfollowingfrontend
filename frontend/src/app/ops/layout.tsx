/**
 * Operations OS - Main Layout
 * Handles navigation and access control for operations module with proper role-based access
 */

'use client';

import { OperationsProvider } from '@/contexts/OperationsContext';
import ProtectedOperationsRoute from '@/components/operations/ProtectedOperationsRoute';
import { Toaster } from 'sonner';

export default function OperationsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedOperationsRoute>
      <OperationsProvider>
        <div className="min-h-screen bg-background">
          <Toaster position="top-right" />
          {children}
        </div>
      </OperationsProvider>
    </ProtectedOperationsRoute>
  );
}