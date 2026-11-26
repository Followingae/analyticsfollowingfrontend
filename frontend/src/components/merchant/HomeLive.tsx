'use client'

/**
 * The home while the campaign is live: six tiles, one screen.
 */
import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DropoutNotice } from './DropoutNotice'
import { merchantApi, tierFor, type MerchantHomeData } from '@/services/merchantApi'
import { useInvalidateMerchant } from '@/hooks/useMerchantHome'
import { ShellHeader } from './MerchantShell'
import { StatusPill, greetingWord, todayLine } from './bits'
import { TrialTile, CampaignTile, NeedsYouTile, VisitsTile, ContentTile, CreatorsTile } from './tiles'

export function HomeLive({ data }: { data: MerchantHomeData }) {
  const invalidate = useInvalidateMerchant()
  const [switching, setSwitching] = useState(false)
  const campaign = data.campaign
  const tier = campaign?.value_per_creator_aed != null ? tierFor(data.trial.programme, campaign.value_per_creator_aed) : null
  const mode = data.settings?.creator_approval_mode || campaign?.creator_approval_mode || 'manual'
  // The home read has no dropouts; the campaign read does, and shares its cache with the campaign page.
  const full = useQuery({ queryKey: ['merchant', 'campaign'], queryFn: merchantApi.campaign, retry: 0 })

  const switchMode = async () => {
    setSwitching(true)
    try {
      await merchantApi.saveSettings({ creator_approval_mode: mode === 'manual' ? 'auto' : 'manual' })
      await invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not save')
    } finally {
      setSwitching(false)
    }
  }

  const paused = campaign?.status === 'paused'

  return (
    <>
      <ShellHeader
        kicker={todayLine()}
        lead={`${greetingWord()},`}
        accent={data.merchant.name}
        right={
          <>
            <StatusPill tone={paused ? 'draft' : 'live'}>{paused ? 'Campaign paused' : 'Campaign live'}</StatusPill>
            <Link
              href="/merchant/campaign"
              className="inline-flex h-[34px] items-center rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
            >
              View campaign
            </Link>
          </>
        }
      />

      <DropoutNotice dropouts={full.data?.dropouts} manual={mode === 'manual' && !!campaign && ['active', 'paused'].includes(campaign.status)} href="/merchant/campaign#applications" />

      <section
        aria-label="Overview"
        className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 lg:[&>*]:min-h-0"
      >
        <TrialTile trial={data.trial} className="lg:col-span-4" />
        {campaign ? <CampaignTile campaign={campaign} tier={tier} className="lg:col-span-5" /> : null}
        <NeedsYouTile items={data.needs_you || []} approvalMode={mode} onSwitchMode={switchMode} switching={switching} className="lg:col-span-3" />
        <VisitsTile visits={data.visits} className="lg:col-span-4" />
        <ContentTile content={data.content} className="lg:col-span-5" />
        <CreatorsTile creators={data.creators || []} className="lg:col-span-3" />
      </section>
    </>
  )
}
