'use client'

import { useState, useMemo } from 'react'
import {
  BookOpen,
  Search,
  LayoutDashboard,
  Megaphone,
  FileText,
  Send,
  Compass,
  BarChart3,
  ListChecks,
  Receipt,
  Settings,
  Coins,
  ArrowRight,
  Sparkles,
  Users,
  Eye,
  Heart,
  MessageSquare,
  TrendingUp,
  Download,
  Filter,
  Plus,
  Video,
  Image,
  Clapperboard,
  Wallet,
  Crown,
  Share2,
  FolderOpen,
  Bell,
  UserCog,
  Globe,
  Lightbulb,
  Zap,
  ChevronRight,
  Star,
  Tag,
  ClipboardList,
  LayoutGrid,
  Archive,
} from 'lucide-react'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface GuideSection {
  id: string
  icon: React.ReactNode
  iconBg: string
  title: string
  tagline: string
  keywords: string[]
  content: React.ReactNode
}

/* -------------------------------------------------------------------------- */
/*  Reusable small components                                                  */
/* -------------------------------------------------------------------------- */

function NavPath({ path }: { path: string }) {
  return (
    <Badge variant="secondary" className="font-mono text-xs tracking-tight">
      {path}
    </Badge>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-purple-200 bg-purple-50/60 dark:border-purple-900/40 dark:bg-purple-950/20 mt-3">
      <CardContent className="flex items-start gap-3 py-3 px-4">
        <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
        <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">{children}</p>
      </CardContent>
    </Card>
  )
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 mt-3">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {i + 1}
          </span>
          <span className="text-sm text-muted-foreground leading-relaxed pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  )
}

function FeatureBullets({ items }: { items: { icon: React.ReactNode; text: string }[] }) {
  return (
    <ul className="space-y-2 mt-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-muted-foreground">{item.icon}</span>
          <span className="text-sm text-muted-foreground leading-relaxed">{item.text}</span>
        </li>
      ))}
    </ul>
  )
}

function CreditRow({ action, cost }: { action: string; cost: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 text-sm">
      <span className="text-foreground">{action}</span>
      <Badge variant="outline" className="font-mono">{cost}</Badge>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Section data                                                               */
/* -------------------------------------------------------------------------- */

function useSections(): GuideSection[] {
  return [
    /* ---- 1. Dashboard ---- */
    {
      id: 'dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      title: 'Dashboard',
      tagline: 'Your command centre -- see everything at a glance.',
      keywords: ['dashboard', 'overview', 'stats', 'home', 'credits', 'notifications'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Dashboard is the first page you see after logging in. It gives you a real-time snapshot of your account activity, campaign performance, and credit usage.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Navigate to</span>
            <NavPath path="/dashboard" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">What you will find</h4>
          <FeatureBullets
            items={[
              { icon: <BarChart3 className="h-4 w-4" />, text: 'Quick stats showing your total campaigns, active influencers, and engagement metrics.' },
              { icon: <Megaphone className="h-4 w-4" />, text: 'Recent campaigns with their current status so you can jump straight in.' },
              { icon: <Bell className="h-4 w-4" />, text: 'Pending actions and notifications -- proposal reviews, content approvals, and more.' },
              { icon: <Coins className="h-4 w-4" />, text: 'Credit balance and monthly usage summary so you always know where you stand.' },
            ]}
          />
          <Tip>Your credit balance is also always visible in the top header bar on every page.</Tip>
        </div>
      ),
    },

    /* ---- 2. Campaigns ---- */
    {
      id: 'campaigns',
      icon: <Megaphone className="h-5 w-5" />,
      iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
      title: 'Campaigns',
      tagline: 'Manage all your influencer, UGC, cashback, and barter campaigns.',
      keywords: ['campaigns', 'influencer', 'ugc', 'cashback', 'barter', 'paid deal', 'create', 'filter', 'search', 'proposals', 'scope', 'archive'],
      content: (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Campaigns hub is where every campaign lives. You can view, filter, and manage campaigns across all types from one unified interface.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Navigate to</span>
            <NavPath path="/campaigns" />
          </div>

          {/* All Campaigns Tab */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-orange-500" /> All Campaigns Tab
            </h4>
            <FeatureBullets
              items={[
                { icon: <Eye className="h-4 w-4" />, text: 'View every campaign -- Influencer, UGC, Cashback, Paid Deal, and Barter -- in one unified list.' },
                { icon: <Filter className="h-4 w-4" />, text: 'Filter by campaign type and status to find exactly what you need.' },
                { icon: <Search className="h-4 w-4" />, text: 'Search campaigns by name for quick access.' },
                { icon: <ChevronRight className="h-4 w-4" />, text: 'Click any campaign to view its details, posts, creators, and analytics.' },
                { icon: <Plus className="h-4 w-4" />, text: 'Your account manager creates campaigns for you via proposals.' },
              ]}
            />
          </div>

          <Separator />

          {/* Proposals Tab */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-orange-500" /> Proposals Tab
            </h4>
            <p className="text-sm text-muted-foreground">
              View proposals sent to you by the Following team. Accept, reject, or request more influencers. See full details in the Proposals section below.
            </p>
          </div>

          <Separator />

          {/* Scope Tab */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-orange-500" /> Scope Tab
            </h4>
            <p className="text-sm text-muted-foreground">
              A read-only overview of all your projects. See each project's status, total budget (AED), payment status, and report delivery status at a glance.
            </p>
          </div>

          <Separator />

          {/* Archive Tab */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Archive className="h-4 w-4 text-orange-500" /> Archive Tab
            </h4>
            <p className="text-sm text-muted-foreground">
              Browse completed and archived campaigns. All historical data and reports remain accessible here.
            </p>
          </div>

          <Tip>
            Use the type filter to quickly isolate, for example, only your UGC campaigns. Combined with the search bar this makes managing dozens of campaigns effortless.
          </Tip>
        </div>
      ),
    },

    /* ---- 3. Campaign Detail Pages ---- */
    {
      id: 'campaign-details',
      icon: <FileText className="h-5 w-5" />,
      iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
      title: 'Campaign Detail Pages',
      tagline: 'Deep-dive into posts, influencers, UGC content, and deliverables.',
      keywords: ['posts', 'influencers', 'ugc', 'content', 'sentiment', 'engagement', 'export', 'approve', 'reject', 'concepts', 'videos', 'schedule', 'models', 'deliverables', 'brief'],
      content: (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            When you click into a campaign you unlock detailed sub-pages. Each one focuses on a different aspect of the campaign.
          </p>

          {/* Posts */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Image className="h-4 w-4 text-rose-500" /> Posts Page
            </h4>
            <FeatureBullets
              items={[
                { icon: <Heart className="h-4 w-4" />, text: 'View all Instagram posts in the campaign with engagement metrics -- likes, comments, views, and engagement rate.' },
                { icon: <Sparkles className="h-4 w-4" />, text: 'AI-powered content analysis: sentiment scoring, content categorisation, and language detection for every post.' },
                { icon: <Download className="h-4 w-4" />, text: 'Export post data as CSV or JSON for your own reporting.' },
              ]}
            />
          </div>

          <Separator />

          {/* Influencers */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-rose-500" /> Influencers Page
            </h4>
            <p className="text-sm text-muted-foreground">
              View and select the influencers assigned to your campaign. See their profiles, audience stats, and engagement rates.
            </p>
          </div>

          <Separator />

          {/* UGC */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Video className="h-4 w-4 text-rose-500" /> UGC Page
            </h4>
            <p className="text-sm text-muted-foreground">
              Manage UGC (User-Generated Content) campaigns with five dedicated tabs:
            </p>
            <StepList
              steps={[
                'Overview -- Campaign summary with key metrics and status.',
                'Models -- View and manage the content creators (models) assigned to this campaign.',
                'Concepts -- Review creative concepts. Approve or reject each concept.',
                'Videos -- View video deliverables with budget tracking (AED consumed per video), video dimensions, and posting status.',
                'Schedule -- See the content calendar and posting timeline.',
              ]}
            />
          </div>

          <Separator />

          {/* Content */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clapperboard className="h-4 w-4 text-rose-500" /> Content Page
            </h4>
            <p className="text-sm text-muted-foreground">
              Review content briefs and approve or reject deliverables before they go live. This is your quality gate.
            </p>
          </div>

          <Tip>
            You can export post analytics from any campaign at any time. The export includes AI analysis data alongside raw engagement numbers.
          </Tip>
        </div>
      ),
    },

    /* ---- 4. Proposals ---- */
    {
      id: 'proposals',
      icon: <Send className="h-5 w-5" />,
      iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
      title: 'Proposals',
      tagline: 'Review curated influencer lists from the Following team.',
      keywords: ['proposals', 'accept', 'reject', 'influencers', 'deliverables', 'pricing', 'AED', 'ai snapshot', 'sentiment', 'authenticity', 'post', 'story', 'reel', 'carousel', 'video', 'bundle'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Proposals are curated influencer packages prepared by the Following team specifically for your brand. Each proposal includes handpicked creators with engagement data and pricing.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Navigate to</span>
            <NavPath path="/campaigns" />
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <NavPath path="Proposals tab" />
          </div>

          <h4 className="text-sm font-semibold text-foreground">How proposals work</h4>
          <StepList
            steps={[
              'You receive a proposal notification. Open it from the Proposals tab in Campaigns.',
              'Browse the curated influencer list. Each creator shows their profile, follower count, engagement rate, and pricing in AED.',
              'Select the influencers you want for your campaign by clicking on their cards.',
              'Choose deliverable types per influencer: post, story, reel, carousel, video, bundle, or monthly.',
              'Review the AI Snapshot panel -- it provides authenticity analysis and sentiment insights for the proposed creators.',
              'Accept the proposal to automatically create a campaign, or request more influencers if you need a larger pool.',
            ]}
          />

          <h4 className="text-sm font-semibold text-foreground mt-4">Proposal statuses</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200">Draft</Badge>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200">Sent</Badge>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200">In Review</Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200">Approved</Badge>
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200">Rejected</Badge>
            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200">More Requested</Badge>
          </div>

          <Tip>
            When you accept a proposal, a campaign is automatically created with all your selected influencers and deliverables pre-configured. No manual setup needed.
          </Tip>
        </div>
      ),
    },

    /* ---- 5. Creator Discovery ---- */
    {
      id: 'discovery',
      icon: <Compass className="h-5 w-5" />,
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
      title: 'Creator Discovery',
      tagline: 'Find and unlock Instagram creators with AI-powered insights.',
      keywords: ['discover', 'discovery', 'search', 'creators', 'instagram', 'unlock', 'credits', 'ai', 'sentiment', 'language', 'category'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Discover Instagram creators by searching for their username. The platform analyses their profile and returns comprehensive, AI-powered analytics.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Navigate to</span>
            <NavPath path="/discover" />
          </div>

          <h4 className="text-sm font-semibold text-foreground">How to discover a creator</h4>
          <StepList
            steps={[
              'Go to the Discover page and type an Instagram username into the search bar.',
              'Browse the search results. You will see a preview with follower count, engagement rate, and content highlights.',
              'To access the full analytics, unlock the creator profile (costs 25 credits). Unlocking grants you 30 days of access.',
              'Once unlocked, view AI-powered insights: sentiment analysis, language detection, content categorisation, audience demographics, and more.',
            ]}
          />

          <h4 className="text-sm font-semibold text-foreground mt-4">AI-powered insights include</h4>
          <FeatureBullets
            items={[
              { icon: <Sparkles className="h-4 w-4" />, text: 'Sentiment analysis -- understand the emotional tone of a creator\'s content.' },
              { icon: <Globe className="h-4 w-4" />, text: 'Language detection -- know what language(s) a creator posts in.' },
              { icon: <Tag className="h-4 w-4" />, text: 'Content categorisation -- automatically classifies content into niches (fashion, food, travel, etc.).' },
              { icon: <TrendingUp className="h-4 w-4" />, text: 'Engagement analysis -- real engagement rates calculated from actual post performance.' },
            ]}
          />

          <Tip>
            Unlocking a creator gives you 30 days of access. During that window you can revisit their analytics as many times as you like without spending additional credits.
          </Tip>
        </div>
      ),
    },

    /* ---- 6. Creator Analytics ---- */
    {
      id: 'creator-analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
      title: 'Creator Analytics',
      tagline: 'Deep performance data for individual creators.',
      keywords: ['creator analytics', 'performance', 'demographics', 'audience', 'engagement', 'export', 'pdf', 'csv', 'json', 'post-level'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Once you have unlocked a creator, you can access their full analytics page. This is your most detailed view of any creator on the platform.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Navigate to</span>
            <NavPath path="/creator-analytics/[username]" />
          </div>

          <h4 className="text-sm font-semibold text-foreground">What you get</h4>
          <FeatureBullets
            items={[
              { icon: <TrendingUp className="h-4 w-4" />, text: 'Performance metrics -- follower growth, engagement rate trends, and posting frequency.' },
              { icon: <Users className="h-4 w-4" />, text: 'Audience demographics -- age, gender, and location breakdowns (AI-estimated with confidence labels).' },
              { icon: <Star className="h-4 w-4" />, text: 'Content quality scoring -- visual analysis of production quality and brand safety.' },
              { icon: <MessageSquare className="h-4 w-4" />, text: 'Post-level engagement analysis -- likes, comments, and views for every recent post.' },
              { icon: <Download className="h-4 w-4" />, text: 'Export analytics reports in PDF, CSV, or JSON format for offline use.' },
            ]}
          />

          <Tip>
            The Creator Analytics page is the same page you land on when you unlock a creator from Discovery. You can also navigate directly using the URL if you know the username.
          </Tip>
        </div>
      ),
    },

    /* ---- 7. My Lists ---- */
    {
      id: 'my-lists',
      icon: <ListChecks className="h-5 w-5" />,
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
      title: 'My Lists',
      tagline: 'Organise influencers into custom, shareable collections.',
      keywords: ['lists', 'collections', 'organise', 'organize', 'curate', 'share', 'team', 'influencers', 'niche'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            My Lists lets you create custom collections of influencers. Use lists to shortlist creators for upcoming campaigns, organise by niche, or keep favourites handy.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Navigate to</span>
            <NavPath path="/my-lists" />
          </div>

          <h4 className="text-sm font-semibold text-foreground">Features</h4>
          <FeatureBullets
            items={[
              { icon: <Plus className="h-4 w-4" />, text: 'Create new lists with custom names and descriptions.' },
              { icon: <FolderOpen className="h-4 w-4" />, text: 'Organise creators by campaign, niche, region, or any criteria you choose.' },
              { icon: <Share2 className="h-4 w-4" />, text: 'Share lists with team members so everyone stays aligned.' },
              { icon: <Eye className="h-4 w-4" />, text: 'View shared influencer collections from your team.' },
            ]}
          />

          <Tip>
            Lists are a great way to prepare for proposal reviews. Create a "Wishlist" and add creators you find in Discovery -- then reference it when the Following team sends proposals.
          </Tip>
        </div>
      ),
    },

    /* ---- 8. Billing ---- */
    {
      id: 'billing',
      icon: <Receipt className="h-5 w-5" />,
      iconBg: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
      title: 'Billing',
      tagline: 'Subscriptions, invoices, and cashback pool management.',
      keywords: ['billing', 'subscription', 'invoices', 'payment', 'plan', 'free', 'standard', 'premium', 'cashback', 'pool', 'AED', 'credits'],
      content: (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Billing page gives you full visibility into your subscription, payment history, and cashback pool balance.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Navigate to</span>
            <NavPath path="/billing" />
          </div>

          {/* Subscription Tab */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Crown className="h-4 w-4 text-green-500" /> Subscription Tab
            </h4>
            <p className="text-sm text-muted-foreground">
              View your current plan, credit balance, and usage meters. Compare plans to see what upgrading unlocks.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <Card className="border-muted">
                <CardContent className="py-3 px-4 text-center">
                  <p className="text-xs text-muted-foreground">Free</p>
                  <p className="text-lg font-bold">0 AED/mo</p>
                  <p className="text-xs text-muted-foreground">1 user &middot; 5 profiles/mo</p>
                </CardContent>
              </Card>
              <Card className="border-purple-300 dark:border-purple-700 ring-1 ring-purple-200 dark:ring-purple-800">
                <CardContent className="py-3 px-4 text-center">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Standard</p>
                  <p className="text-lg font-bold">730 AED/mo</p>
                  <p className="text-xs text-muted-foreground">2 users &middot; 500 profiles/mo</p>
                </CardContent>
              </Card>
              <Card className="border-muted">
                <CardContent className="py-3 px-4 text-center">
                  <p className="text-xs text-muted-foreground">Premium</p>
                  <p className="text-lg font-bold">1,830 AED/mo</p>
                  <p className="text-xs text-muted-foreground">5 users &middot; 2,000 profiles/mo</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Invoices Tab */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-green-500" /> Invoices Tab
            </h4>
            <p className="text-sm text-muted-foreground">
              Download invoice PDFs and review your complete payment history. Each invoice includes a breakdown of charges.
            </p>
          </div>

          <Separator />

          {/* Cashback Pool Tab */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-500" /> Cashback Pool Tab
            </h4>
            <p className="text-sm text-muted-foreground">
              Manage your cashback pool balance for Following App campaigns. View all transactions, top-ups, and disbursements.
            </p>
          </div>

          <Tip>
            You can manage payment methods and upgrade your subscription directly from the Billing page. Upgrades take effect immediately and credits are prorated.
          </Tip>
        </div>
      ),
    },

    /* ---- 9. Settings ---- */
    {
      id: 'settings',
      icon: <Settings className="h-5 w-5" />,
      iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      title: 'Settings',
      tagline: 'Profile, notifications, and team management.',
      keywords: ['settings', 'profile', 'preferences', 'notifications', 'team', 'invite', 'members', 'roles', 'account'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Configure your account, notification preferences, and manage your team from the Settings page.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Navigate to</span>
            <NavPath path="/settings" />
          </div>

          <h4 className="text-sm font-semibold text-foreground">Available settings</h4>
          <FeatureBullets
            items={[
              { icon: <UserCog className="h-4 w-4" />, text: 'Account profile -- update your name, company, avatar, and contact details.' },
              { icon: <Bell className="h-4 w-4" />, text: 'Notification preferences -- choose which alerts you receive (email, in-app, or both).' },
              { icon: <Users className="h-4 w-4" />, text: 'Team management -- invite team members, assign roles, and manage access permissions.' },
            ]}
          />

          <Tip>
            Your team size is determined by your subscription plan. Standard allows 2 members and Premium allows up to 5.
          </Tip>
        </div>
      ),
    },

    /* ---- 10. Credits System ---- */
    {
      id: 'credits',
      icon: <Coins className="h-5 w-5" />,
      iconBg: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
      title: 'Credits System',
      tagline: 'Understand how credits power your platform actions.',
      keywords: ['credits', 'cost', 'pricing', 'unlock', 'profile', 'post analytics', 'discovery', 'export', 'bulk', 'balance', 'monthly', 'refresh'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Credits are the currency of the Following Analytics platform. Every analytics action consumes credits from your monthly allowance.
          </p>

          <h4 className="text-sm font-semibold text-foreground">Credit costs</h4>
          <div className="space-y-2 mt-2">
            <CreditRow action="Profile unlock (30-day access)" cost="25 credits" />
            <CreditRow action="Post analytics" cost="5 credits" />
            <CreditRow action="Discovery page view" cost="1 credit" />
            <CreditRow action="Campaign analysis" cost="10 credits" />
            <CreditRow action="Bulk export" cost="50 credits" />
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-4">How credits work</h4>
          <StepList
            steps={[
              'Your credit balance is shown in the header bar on every page.',
              'Credits are consumed automatically when you perform an action (e.g., unlocking a profile).',
              'Credits refresh monthly based on your subscription plan.',
              'Unused credits do not roll over to the next month.',
            ]}
          />

          <h4 className="text-sm font-semibold text-foreground mt-4">Monthly credit allowance by plan</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <Card className="border-muted">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-muted-foreground">Free</p>
                <p className="text-xl font-bold text-foreground">125</p>
                <p className="text-xs text-muted-foreground">credits/month</p>
              </CardContent>
            </Card>
            <Card className="border-purple-300 dark:border-purple-700">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Standard</p>
                <p className="text-xl font-bold text-foreground">8,750</p>
                <p className="text-xs text-muted-foreground">credits/month</p>
              </CardContent>
            </Card>
            <Card className="border-muted">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-muted-foreground">Premium</p>
                <p className="text-xl font-bold text-foreground">25,000</p>
                <p className="text-xs text-muted-foreground">credits/month</p>
              </CardContent>
            </Card>
          </div>

          <Tip>
            Once you unlock a creator, you have 30 days of unlimited access to their analytics. Plan your unlocks strategically to get the most out of your credits.
          </Tip>
        </div>
      ),
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*  Getting Started cards                                                      */
/* -------------------------------------------------------------------------- */

function GettingStartedCards() {
  const cards = [
    {
      icon: <Megaphone className="h-6 w-6" />,
      iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
      title: 'Your Campaigns',
      description: 'Visit the Campaigns page to view active campaigns and track performance. Your account manager will set up campaigns for you via proposals.',
      path: '/campaigns',
    },
    {
      icon: <Compass className="h-6 w-6" />,
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
      title: 'Discover Creators',
      description: 'Search for Instagram creators on the Discover page. Unlock profiles to access AI-powered analytics.',
      path: '/discover',
    },
    {
      icon: <Send className="h-6 w-6" />,
      iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
      title: 'Review Proposals',
      description: 'Check the Proposals tab in Campaigns for curated influencer lists from the Following team.',
      path: '/campaigns',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="group relative overflow-hidden border-muted hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-default"
        >
          <CardHeader className="pb-2">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg} mb-2`}>
              {card.icon}
            </div>
            <CardTitle className="text-base">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              {card.description}
            </CardDescription>
            <div className="flex items-center gap-1.5 mt-3">
              <NavPath path={card.path} />
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main Page Component                                                        */
/* -------------------------------------------------------------------------- */

export default function GuidePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState<string[]>([])
  const sections = useSections()

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections
    const query = searchQuery.toLowerCase().trim()
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.tagline.toLowerCase().includes(query) ||
        s.keywords.some((k) => k.includes(query))
    )
  }, [searchQuery, sections])

  // Auto-open all matching sections when searching
  const effectiveOpenItems = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredSections.map((s) => s.id)
    }
    return openItems
  }, [searchQuery, filteredSections, openItems])

  function handleValueChange(value: string[]) {
    if (!searchQuery.trim()) {
      setOpenItems(value)
    }
  }

  return (
    <BrandUserInterface>
        <div className="flex-1 p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-4xl space-y-8">

            {/* ---- Page Header ---- */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">User Guide</h1>
                  <p className="text-sm text-muted-foreground">
                    Everything you need to get the most out of Following Analytics
                  </p>
                </div>
              </div>
            </div>

            {/* ---- Search ---- */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search the guide... (e.g. campaigns, credits, proposals)"
                className="pl-10 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* ---- Getting Started ---- */}
            {!searchQuery.trim() && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Getting Started</h2>
                </div>
                <p className="text-sm text-muted-foreground -mt-2">
                  New to the platform? Start with one of these three actions.
                </p>
                <GettingStartedCards />
              </div>
            )}

            {/* ---- Accordion Sections ---- */}
            <div className="space-y-3">
              {!searchQuery.trim() && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Feature Guide</h2>
                </div>
              )}

              {filteredSections.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No sections match your search</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Try different keywords or clear the search</p>
                  </CardContent>
                </Card>
              )}

              <Accordion
                type="multiple"
                value={effectiveOpenItems}
                onValueChange={handleValueChange}
                className="space-y-2"
              >
                {filteredSections.map((section) => (
                  <AccordionItem
                    key={section.id}
                    value={section.id}
                    className="border rounded-lg px-4 data-[state=open]:bg-muted/30 transition-colors"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${section.iconBg}`}>
                          {section.icon}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-foreground leading-none mb-1">{section.title}</p>
                          <p className="text-xs text-muted-foreground font-normal leading-snug">{section.tagline}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 pl-11">
                      {section.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* ---- Footer ---- */}
            <Separator />
            <div className="text-center pb-8">
              <p className="text-xs text-muted-foreground">
                Need more help? Contact the Following team at{' '}
                <span className="font-medium text-foreground">support@following.ae</span>
              </p>
            </div>
          </div>
        </div>
    </BrandUserInterface>
  )
}
