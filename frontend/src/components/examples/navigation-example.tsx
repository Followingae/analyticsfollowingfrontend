// EXAMPLE: Navigation Bar
'use client';

import { UserAvatar } from '@/components/ui/avatar-upload';

export function NavigationBar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">MyApp</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <UserAvatar size="sm" fallbackText="JD" />
      </div>
    </nav>
  );
}