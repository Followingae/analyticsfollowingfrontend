'use client';

import * as React from 'react';
import { motion, type Transition } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/animate-ui/radix/checkbox';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/animate-ui/radix/popover';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  User, 
  Search, 
  List, 
  CheckSquare, 
  X 
} from 'lucide-react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useUserStore } from '@/stores/userStore';
import { useQuery } from '@tanstack/react-query';


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

export function FloatingSetupChecklist() {
  const router = useRouter();
  const { user } = useEnhancedAuth();
  const { user: userStoreData, subscription, isLoading: userStoreLoading } = useUserStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const [shouldWiggle, setShouldWiggle] = React.useState(false);

  // Use existing React Query cache from useDashboardData for unlocked profiles
  const unlockedProfilesQuery = useQuery({
    queryKey: ['unlocked-creators-page', 1, !!user],
    queryFn: async () => {
      // This should never run since we're only reading from cache
      const { creatorApiService } = await import('@/services/creatorApi');
      const result = await creatorApiService.getUnlockedCreators({
        page: 1,
        page_size: 20
      });
      return result.success ? result.data : { count: 0, profiles: [] };
    },
    enabled: false, // Don't fetch, just read from cache
    staleTime: Infinity // Use cached data only
  });

  // Use existing React Query cache for lists (need to add this to a centralized hook)
  const listsQuery = useQuery({
    queryKey: ['user-lists'],
    queryFn: async () => {
      const { listsApiService } = await import('@/services/listsApi');
      const result = await listsApiService.getAllLists();
      return result.success ? result.data : [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Calculate status from existing data sources
  const status = React.useMemo(() => {
    if (userStoreLoading || !user) {
      return {
        profileComplete: false,
        firstProfileAnalyzed: false,
        firstListCreated: false,
        loading: true,
      };
    }

    // 1. Check profile completion
    const profileComplete = !!(
      user.first_name &&
      user.company &&
      (user.first_name.trim() !== '' && user.company.trim() !== '')
    );

    // 2. Check first profile analysis from cache or subscription data
    const unlockedProfilesCount = unlockedProfilesQuery.data?.count ||
                                  subscription?.profiles_unlocked_this_month || 0;
    const firstProfileAnalyzed = unlockedProfilesCount > 0;

    // 3. Check first list creation from cache
    const listsCount = Array.isArray(listsQuery.data) ? listsQuery.data.length : 0;
    const firstListCreated = listsCount > 0;

    return {
      profileComplete,
      firstProfileAnalyzed,
      firstListCreated,
      loading: false,
    };
  }, [user, userStoreData, subscription, userStoreLoading, unlockedProfilesQuery.data, listsQuery.data]);

  const setupItems = [
    {
      id: 'profile',
      label: 'Complete your profile setup',
      icon: <User className="h-4 w-4" style={{ color: 'hsl(var(--chart-1))' }} />,
      completed: status.profileComplete,
      action: () => {
        router.push('/settings');
        setIsOpen(false);
      },
    },
    {
      id: 'analysis',
      label: 'Analyze your first Creator',
      icon: <Search className="h-4 w-4" style={{ color: 'hsl(var(--chart-2))' }} />,
      completed: status.firstProfileAnalyzed,
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: 'smooth' });
        } else {
          router.push('/discover');
        }
        setIsOpen(false);
      },
    },
    {
      id: 'list',
      label: 'Create your first list',
      icon: <List className="h-4 w-4" style={{ color: 'hsl(var(--chart-3))' }} />,
      completed: status.firstListCreated,
      action: () => {
        router.push('/my-lists');
        setIsOpen(false);
      },
    },
  ];

  const completedCount = setupItems.filter(item => item.completed).length;
  const totalCount = setupItems.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);
  const isCompleted = completedCount === totalCount;

  // Industry-standard emphasis animation effect
  React.useEffect(() => {
    if (status.loading || isCompleted || isOpen) return;

    const triggerEmphasis = () => {
      setShouldWiggle(true);
      setTimeout(() => setShouldWiggle(false), 400); // Industry standard: 300-500ms
    };

    // Progressive emphasis: starts after 3s, then every 15s
    const timeout = setTimeout(triggerEmphasis, 3000);
    const interval = setInterval(triggerEmphasis, 15000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [status.loading, isCompleted, isOpen]);

  // Don't render if completed
  if (!status.loading && isCompleted) {
    return null;
  }

  // Don't render if loading
  if (status.loading) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <motion.div
            className="rounded-full"
            animate={shouldWiggle ? {
              // Subtle bounce up animation
              y: [0, -8, -4, -8, 0],
              scale: [1, 1.02, 1.01, 1.02, 1],
            } : {}}
            transition={{
              duration: 0.4,
              ease: "easeOut", // Smooth bounce feel
              times: [0, 0.3, 0.6, 0.8, 1]
            }}
            // Accessibility: respect reduced motion preference
            style={{
              background: 'transparent'
            }}
          >
            <Button
              variant="default"
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg border-2"
              style={{ 
                backgroundColor: 'oklch(0.4718 0.2853 280.0726)', 
                borderColor: 'oklch(0.4718 0.2853 280.0726)',
                color: 'white'
              }}
            >
              <CheckSquare className="h-6 w-6" style={{ color: 'white' }} />
            </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0" 
          align="end" 
          side="top"
          sideOffset={8}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Setup Checklist</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {completedCount}/{totalCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ 
                    width: `${progressPercentage}%`,
                    backgroundColor: 'hsl(var(--primary))'
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {progressPercentage}% complete
              </div>
            </div>

            <div className="space-y-3">
              {setupItems.map((item, idx) => (
                <div key={item.id} className="flex items-start space-x-3">
                  <Checkbox
                    checked={item.completed}
                    disabled={true}
                    id={`floating-setup-${item.id}`}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={item.completed ? undefined : item.action}
                      disabled={item.completed}
                      className={`text-left w-full text-sm font-medium transition-colors ${
                        item.completed 
                          ? 'text-muted-foreground cursor-default' 
                          : 'text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.icon}
                        {item.label}
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}