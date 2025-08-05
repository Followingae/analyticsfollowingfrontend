// EXAMPLE: Profile Settings Page
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useUserProfile } from '@/hooks/use-avatar';

export function ProfileSettingsPage() {
  const { data: profile } = useUserProfile();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <AvatarUpload size="xl" />
            <div className="text-center">
              <h3 className="font-semibold">{profile?.user.full_name}</h3>
              <p className="text-muted-foreground">{profile?.user.email}</p>
            </div>
          </div>

          {/* Avatar Status Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Avatar Status</h4>
            <p className="text-sm text-muted-foreground">
              {profile?.avatar.has_custom_avatar
                ? `Custom avatar uploaded on ${new Date(profile.avatar.uploaded_at).toLocaleDateString()}`
                : 'Using Instagram profile picture as avatar'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}