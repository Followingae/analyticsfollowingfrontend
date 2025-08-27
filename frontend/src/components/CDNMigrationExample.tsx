"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileAvatar, CDNImage } from '@/components/ui/cdn-image'
import { CDNProcessingStatus, CDNStatusBanner } from '@/components/ui/cdn-processing-status'
import { useProfileWithCDN } from '@/hooks/useCDNMedia'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

/**
 * Example component demonstrating the CDN migration
 * Shows before/after comparison and proper usage
 */
interface CDNMigrationExampleProps {
  username?: string
}

export function CDNMigrationExample({ username = "example" }: CDNMigrationExampleProps) {
  const { data: profileData, isLoading, error, refetch } = useProfileWithCDN(username)

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">CDN Migration Example</h2>
        <p className="text-muted-foreground">
          Demonstrating the new CDN system vs legacy Instagram URLs
        </p>
      </div>

      {/* Status Banner */}
      {profileData?.profile?.id && (
        <CDNStatusBanner profileId={profileData.profile.id} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* OLD WAY (Legacy) */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              ❌ OLD WAY (Deprecated)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">Legacy Issues:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Instagram URLs expire</li>
                <li>• Requires CORS proxy (corsproxy.io)</li>
                <li>• Slow loading (no CDN)</li>
                <li>• Large image sizes</li>
                <li>• No fallback system</li>
              </ul>
            </div>
            
            {/* Legacy image implementation */}
            <div className="space-y-2">
              <code className="text-xs bg-gray-100 p-2 rounded block">
                {`// ❌ OLD: Direct Instagram URL\n<img src="https://scontent-dfw5-1.cdninstagram.com/..." />`}
              </code>
              
              {/* Show broken image placeholder */}
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-500">Broken</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW WAY (CDN) */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              ✅ NEW WAY (CDN)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">CDN Benefits:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Permanent URLs (never expire)</li>
                <li>• Sub-150ms loading via Cloudflare</li>
                <li>• Optimized WebP images</li>
                <li>• Multiple sizes (256px + 512px)</li>
                <li>• Smart fallback system</li>
              </ul>
            </div>

            {/* New CDN implementation */}
            <div className="space-y-2">
              <code className="text-xs bg-gray-100 p-2 rounded block">
                {`// ✅ NEW: CDN with fallbacks\n<ProfileAvatar profile={profile} cdnMedia={cdnMedia} />`}
              </code>

              {profileData?.profile && (
                <ProfileAvatar
                  profile={profileData.profile}
                  cdnMedia={profileData.cdnMedia}
                  size="large"
                  showProcessing={true}
                  className="border-2 border-green-200"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      {profileData?.profile?.id && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <CDNProcessingStatus 
              profileId={profileData.profile.id}
              variant="detailed"
            />
          </CardContent>
        </Card>
      )}

      {/* Migration Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Completed:</h4>
              <ul className="space-y-1 text-green-700">
                <li>• CDN media service created</li>
                <li>• React hooks implemented</li>
                <li>• Image components updated</li>
                <li>• Processing status indicators</li>
                <li>• Legacy code deprecated</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">🔄 Next Steps:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Update all profile components</li>
                <li>• Remove corsproxy environment vars</li>
                <li>• Test with real API endpoints</li>
                <li>• Deploy and monitor</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Debug Info
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Refetch
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-40">
              {JSON.stringify({
                loading: isLoading,
                error: error?.message,
                hasCDNData: !!profileData?.cdnMedia,
                profileId: profileData?.profile?.id,
                cdnAvailable: profileData?.cdnMedia?.avatar?.available,
                processing: profileData?.cdnMedia?.processing
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}