// EXAMPLE: User Profile Card
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/avatar-upload';
import { useUserProfile } from '@/hooks/use-avatar';

export function UserProfileCard() {
  const { data: profile } = useUserProfile();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <UserAvatar size="lg" fallbackText={profile?.user.username} />
          <div>
            <h3 className="font-semibold">{profile?.user.full_name}</h3>
            <p className="text-muted-foreground">@{profile?.user.username}</p>
            {profile?.meta.avatar_priority === 'custom' && (
              <Badge variant="secondary" className="mt-1">
                Custom Avatar
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}