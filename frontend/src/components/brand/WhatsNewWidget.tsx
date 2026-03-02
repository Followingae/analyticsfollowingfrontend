'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger,
} from '@/components/ui/disclosure'
import { Badge } from '@/components/ui/badge'

interface NotificationCard {
  id: string
  title: string
  subtitle: string
  description: string
  count: number
  loading: boolean
  navigateTo: string
  cta: string
  image: string
}

export function WhatsNewWidget() {
  const router = useRouter()

  const [sharedListsCount, setSharedListsCount] = useState(0)
  const [proposalsCount, setProposalsCount] = useState(0)
  const [analyticsCount, setAnalyticsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [openCards, setOpenCards] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true)

      const results = await Promise.allSettled([
        (async () => {
          const { fetchWithAuth } = await import('@/utils/apiInterceptor')
          const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
          const res = await fetchWithAuth(
            `${API_CONFIG.BASE_URL}${ENDPOINTS.influencerDatabase.sharedForUser}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }
          )
          if (!res.ok) return 0
          const json = await res.json()
          const shares = json?.data?.shares || json?.shares || json?.data || []
          return Array.isArray(shares) ? shares.length : 0
        })(),

        (async () => {
          const { fetchWithAuth } = await import('@/utils/apiInterceptor')
          const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
          const res = await fetchWithAuth(
            `${API_CONFIG.BASE_URL}${ENDPOINTS.campaigns.proposals}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }
          )
          if (!res.ok) return 0
          const json = await res.json()
          const proposals = json?.data?.proposals || json?.proposals || json?.data || []
          return Array.isArray(proposals)
            ? proposals.filter((p: any) => p.status === 'pending' || p.status === 'sent').length
            : 0
        })(),

        (async () => {
          const { fetchWithAuth } = await import('@/utils/apiInterceptor')
          const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
          const res = await fetchWithAuth(
            `${API_CONFIG.BASE_URL}${ENDPOINTS.auth.unlockedProfiles}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }
          )
          if (!res.ok) return 0
          const json = await res.json()
          const profiles = json?.data?.profiles || json?.profiles || json?.data || []
          return Array.isArray(profiles) ? profiles.length : 0
        })(),
      ])

      setSharedListsCount(results[0].status === 'fulfilled' ? results[0].value : 0)
      setProposalsCount(results[1].status === 'fulfilled' ? results[1].value : 0)
      setAnalyticsCount(results[2].status === 'fulfilled' ? results[2].value : 0)
      setLoading(false)
    }

    fetchCounts()
  }, [])

  const toggleCard = (id: string) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const cards: NotificationCard[] = [
    {
      id: 'shared-lists',
      title: 'New Shared Lists',
      subtitle: 'From Following',
      description:
        sharedListsCount > 0
          ? `${sharedListsCount} new influencer list${sharedListsCount !== 1 ? 's' : ''} shared with you by our team. Browse curated creators ready for your campaigns.`
          : 'No new shared lists. Curated influencer lists from our team will appear here.',
      count: sharedListsCount,
      loading,
      navigateTo: '/my-lists?tab=shared',
      cta: 'View Shared Lists',
      image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&h=400&fit=crop&q=80',
    },
    {
      id: 'proposals',
      title: 'New Proposals',
      subtitle: 'Campaign Invites',
      description:
        proposalsCount > 0
          ? `${proposalsCount} new proposal${proposalsCount !== 1 ? 's' : ''} received. Review campaign briefs and select influencers for upcoming collaborations.`
          : 'No new proposals. Campaign proposals and invitations will appear here.',
      count: proposalsCount,
      loading,
      navigateTo: '/campaigns',
      cta: 'View Proposals',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=80',
    },
    {
      id: 'analytics',
      title: 'Analytics Ready',
      subtitle: 'Creator Insights',
      description:
        analyticsCount > 0
          ? `${analyticsCount} creator profile${analyticsCount !== 1 ? 's' : ''} with completed analytics. Explore detailed engagement data and AI-powered insights.`
          : 'No analytics ready yet. Completed creator analyses will appear here.',
      count: analyticsCount,
      loading,
      navigateTo: '/creators',
      cta: 'View Analytics',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80',
    },
  ]

  const imageVariants = {
    collapsed: { scale: 1, filter: 'blur(0px)' },
    expanded: { scale: 1.1, filter: 'blur(3px)' },
  }

  const contentVariants = {
    collapsed: { opacity: 0, y: 0 },
    expanded: { opacity: 1, y: 0 },
  }

  const transition = {
    type: 'spring' as const,
    stiffness: 26.7,
    damping: 4.1,
    mass: 0.2,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const isOpen = openCards[card.id] || false

        return (
          <div
            key={card.id}
            className="relative h-[300px] w-full overflow-hidden rounded-xl"
          >
            <div
              onClick={() => toggleCard(card.id)}
              className="cursor-pointer h-full"
            >
              <motion.img
                src={card.image}
                alt={card.title}
                className="pointer-events-none h-full w-full select-none object-cover"
                animate={isOpen ? 'expanded' : 'collapsed'}
                variants={imageVariants}
                transition={transition}
              />
              {/* Count badge */}
              {!card.loading && card.count > 0 && (
                <div className="absolute top-3 right-3">
                  <Badge
                    variant="default"
                    className="h-6 min-w-6 px-2 text-xs font-semibold shadow-lg"
                  >
                    {card.count}
                  </Badge>
                </div>
              )}
              {card.loading && (
                <div className="absolute top-3 right-3">
                  <div className="h-6 w-8 animate-pulse rounded-full bg-white/30 backdrop-blur-sm" />
                </div>
              )}
            </div>
            <Disclosure
              onOpenChange={() => toggleCard(card.id)}
              open={isOpen}
              className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-zinc-900/95 px-4 pt-2 backdrop-blur-sm dark:bg-zinc-50/95"
              variants={contentVariants}
              transition={transition}
            >
              <DisclosureTrigger>
                <div className="w-full pb-2 text-left">
                  <p className="text-[14px] font-semibold text-white dark:text-zinc-900">
                    {card.title}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {card.subtitle}
                  </p>
                </div>
              </DisclosureTrigger>
              <DisclosureContent>
                <div className="flex flex-col pb-4 text-[13px] text-zinc-300 dark:text-zinc-600">
                  <p className="leading-relaxed">{card.description}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(card.navigateTo)
                    }}
                    className="mt-3 w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-sm text-zinc-50 transition-colors duration-200 hover:bg-zinc-700 dark:border-zinc-300 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    {card.cta}
                  </button>
                </div>
              </DisclosureContent>
            </Disclosure>
          </div>
        )
      })}
    </div>
  )
}
