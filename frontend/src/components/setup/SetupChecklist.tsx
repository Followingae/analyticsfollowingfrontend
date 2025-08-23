'use client';

import * as React from 'react';
import { motion, type Transition } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/animate-ui/radix/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, User, Search, List, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listsApiService } from '@/services/listsApi';
import { instagramApiService } from '@/services/instagramApi';

interface ChecklistStatus {
  profileComplete: boolean;
  firstProfileAnalyzed: boolean;
  firstListCreated: boolean;
  loading: boolean;
}

const getPathAnimate = (isChecked: boolean) => ({
  pathLength: isChecked ? 1 : 0,
  opacity: isChecked ? 1 : 0,
});

const getPathTransition = (isChecked: boolean): Transition => ({
  pathLength: { duration: 1, ease: 'easeInOut' },
  opacity: {
    duration: 0.01,
    delay: isChecked ? 0 : 1,
  },
});

export function SetupChecklist() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = React.useState<ChecklistStatus>({
    profileComplete: false,
    firstProfileAnalyzed: false,
    firstListCreated: false,
    loading: true,
  });

  // Load checklist status
  React.useEffect(() => {
    const loadChecklistStatus = async () => {
      if (!user) {
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // 1. Check profile completion
        const profileComplete = !!(
          user.first_name && 
          user.company && 
          (user.first_name.trim() !== '' && user.company.trim() !== '')
        );

        // 2. Check first profile analysis (using service method)
        let firstProfileAnalyzed = false;
        try {
          console.log('🔍 Checklist: Calling instagramApiService.getUnlockedProfiles()');
          const unlockedResult = await instagramApiService.getUnlockedProfiles(1, 5);
          
          console.log('🔍 Checklist: Service result:', unlockedResult);
          
          if (unlockedResult.success && unlockedResult.data) {
            const profileCount = unlockedResult.data.profiles?.length || 0;
            console.log('🔍 Checklist: Profile count from service:', profileCount);
            console.log('🔍 Checklist: Profiles array:', unlockedResult.data.profiles);
            firstProfileAnalyzed = profileCount > 0;
          } else {
            console.log('🔍 Checklist: Service failed or no data:', unlockedResult.error);
          }
        } catch (error) {
          console.error('🔍 Checklist: Could not check profile analysis status:', error);
        }

        // 3. Check first list creation
        let firstListCreated = false;
        try {
          const listsResult = await listsApiService.getAllLists();
          if (listsResult.success && listsResult.data) {
            firstListCreated = listsResult.data.length > 0;
          }
        } catch (error) {
          console.log('Could not check lists status');
        }

        setStatus({
          profileComplete,
          firstProfileAnalyzed,
          firstListCreated,
          loading: false,
        });

      } catch (error) {
        console.error('Failed to load checklist status:', error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    loadChecklistStatus();

    // Set up interval to recheck status when user returns to dashboard
    const interval = setInterval(loadChecklistStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Refresh status when user navigates back to dashboard
  React.useEffect(() => {
    const handleFocus = () => {
      if (!status.loading) {
        // Reload status when window gets focus (user returns from other pages)
        setStatus(prev => ({ ...prev, loading: true }));
        setTimeout(() => {
          if (user) {
            loadChecklistStatus();
          }
        }, 500);
      }
    };

    const loadChecklistStatus = async () => {
      if (!user) return;

      try {
        const profileComplete = !!(user.first_name && user.company && 
          (user.first_name.trim() !== '' && user.company.trim() !== ''));

        let firstProfileAnalyzed = false;
        try {
          const unlockedResult = await instagramApiService.getUnlockedProfiles(1, 5);
          if (unlockedResult.success && unlockedResult.data) {
            const profileCount = unlockedResult.data.profiles?.length || 0;
            firstProfileAnalyzed = profileCount > 0;
          }
        } catch (error) {
          console.log('Could not check profile analysis status');
        }

        let firstListCreated = false;
        try {
          const listsResult = await listsApiService.getAllLists();
          if (listsResult.success && listsResult.data) {
            firstListCreated = listsResult.data.length > 0;
          }
        } catch (error) {
          console.log('Could not check lists status');
        }

        setStatus({
          profileComplete,
          firstProfileAnalyzed,
          firstListCreated,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to refresh checklist status:', error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, status.loading]);

  const setupItems = [
    {
      id: 'profile',
      label: 'Complete your profile setup',
      icon: <User className="h-4 w-4" />,
      completed: status.profileComplete,
      action: () => router.push('/settings'),
    },
    {
      id: 'analysis',
      label: 'Analyze your first Creator',
      icon: <Search className="h-4 w-4" />,
      completed: status.firstProfileAnalyzed,
      action: () => {
        // Focus the search input on the current page
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: 'smooth' });
        } else {
          router.push('/discover');
        }
      },
    },
    {
      id: 'list',
      label: 'Create your first list',
      icon: <List className="h-4 w-4" />,
      completed: status.firstListCreated,
      action: () => router.push('/my-lists'),
    },
  ];

  const completedCount = setupItems.filter(item => item.completed).length;
  const totalCount = setupItems.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  if (status.loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading checklist...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Setup Checklist</span>
          <div className="text-sm text-muted-foreground">
            {completedCount}/{totalCount}
          </div>
        </CardTitle>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500 ease-in-out" 
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: '#5100f3'
            }}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {progressPercentage}% complete
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {setupItems.map((item, idx) => (
          <div key={item.id} className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={item.completed}
                disabled={true}
                id={`setup-${item.id}`}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <button
                    onClick={item.completed ? undefined : item.action}
                    disabled={item.completed}
                    className={`text-left w-full text-sm font-medium transition-colors ${
                      item.completed 
                        ? 'text-muted-foreground cursor-default' 
                        : 'text-[#5100f3] hover:text-[#5100f3]/80 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </div>
                  </button>
                  <motion.svg
                    width="100%"
                    height="20"
                    viewBox="0 0 300 20"
                    className="absolute left-0 top-0 pointer-events-none z-10"
                  >
                    <motion.path
                      d="M 5 10 s 70 -5 85 -5 s 70 5 85 5 s 70 -5 85 -5 s 40 5 55 5"
                      vectorEffect="non-scaling-stroke"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeMiterlimit={10}
                      fill="none"
                      initial={false}
                      animate={getPathAnimate(item.completed)}
                      transition={getPathTransition(item.completed)}
                      className="stroke-muted-foreground"
                    />
                  </motion.svg>
                </div>
              </div>
            </div>
            {idx !== setupItems.length - 1 && (
              <div className="border-t border-muted" />
            )}
          </div>
        ))}
        
        {completedCount === totalCount && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg border"
            style={{ 
              backgroundColor: '#5100f3', 
              borderColor: '#5100f3',
              color: 'white'
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Perfect! Setup complete 🎉</span>
            </div>
            <p className="text-xs opacity-90 mt-1">
              You're ready to unlock the full power of analytics!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}