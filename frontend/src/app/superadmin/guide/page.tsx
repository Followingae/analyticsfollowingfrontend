'use client'

import { useState, useMemo, useRef } from 'react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  BookOpen,
  Search,
  Building2,
  Users,
  Database,
  FileText,
  Clapperboard,
  Smartphone,
  CreditCard,
  Settings,
  Briefcase,
  ChevronRight,
  ExternalLink,
  ArrowUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

/* -------------------------------------------------------------------------- */
/*  Section data                                                               */
/* -------------------------------------------------------------------------- */

interface GuideStep {
  text: string
}

interface GuideSubSection {
  title: string
  description: string
  steps: GuideStep[]
}

interface GuideSection {
  id: string
  icon: React.ReactNode
  color: string        // tailwind bg color for the icon badge
  textColor: string    // tailwind text color for the icon
  title: string
  tagline: string
  path: string
  subsections: GuideSubSection[]
}

const sections: GuideSection[] = [
  /* 1 ---- Client Management ------------------------------------------------ */
  {
    id: 'clients',
    icon: <Building2 className="h-5 w-5" />,
    color: 'bg-blue-500/15',
    textColor: 'text-blue-500',
    title: 'Client Management',
    tagline: 'View, manage, and track every client relationship in one place.',
    path: '/superadmin/clients',
    subsections: [
      {
        title: 'Client Directory',
        description:
          'All clients appear as a visual grid of cards showing company logos, names, and industries. Use the search bar to find clients by name and the industry dropdown to filter by vertical.',
        steps: [
          { text: 'Navigate to Clients in the sidebar.' },
          { text: 'Browse the grid or use the search bar at the top to find a client by name.' },
          { text: 'Use the Industry filter dropdown to narrow results (e.g., F&B, Fashion, Tech).' },
          { text: 'Click any client card to open their full profile.' },
        ],
      },
      {
        title: 'Scope Tab',
        description:
          'The Scope tab shows every project for this client in a data table. Columns include project name, status, budget (AED), payment status, carry-forward amount, and report status. Payment status and report status are inline-editable -- click the cell to change it directly without leaving the page.',
        steps: [
          { text: 'Go to Clients and select a client.' },
          { text: 'Open the Scope tab.' },
          { text: 'View all projects, their statuses, budgets, and payment info.' },
          { text: 'Click a Payment Status or Report Status cell to edit it inline.' },
          { text: 'Changes save automatically.' },
        ],
      },
      {
        title: 'Campaigns Tab',
        description:
          'Lists every campaign tied to this client across all types: Influencer, UGC, Cashback, Paid Deal, and Barter. Click any campaign to navigate to its detail page.',
        steps: [
          { text: 'Open a client profile and click the Campaigns tab.' },
          { text: 'Review all campaigns grouped by type.' },
          { text: 'Click a campaign row to open its full detail page.' },
        ],
      },
      {
        title: 'Proposals Tab',
        description:
          'Shows all proposals that have been created and sent to this client, along with their current status (Draft, Sent, In Review, Approved, Rejected).',
        steps: [
          { text: 'Open a client profile and click the Proposals tab.' },
          { text: 'View proposal statuses and totals at a glance.' },
          { text: 'Click a proposal to navigate to its detail page.' },
        ],
      },
      {
        title: 'Barter & Events Tab',
        description:
          'Tracks barter arrangements and event enrollments for this client. View event names, enrolled influencers, attendance status, and barter value.',
        steps: [
          { text: 'Open a client profile and click the Barter & Events tab.' },
          { text: 'View event enrollments and attendance records.' },
          { text: 'Track barter deliverables and their completion status.' },
        ],
      },
      {
        title: 'UGC Tab',
        description:
          'Displays all UGC concepts and videos across this client\'s campaigns. Includes a budget consumed summary showing how much of the allocated UGC budget has been spent.',
        steps: [
          { text: 'Open a client profile and click the UGC tab.' },
          { text: 'Review all concepts with their approval status.' },
          { text: 'View video deliverables and production status.' },
          { text: 'Check the budget consumed summary at the top.' },
        ],
      },
      {
        title: 'Finance Tab',
        description:
          'A financial overview for this client. Shows total budget, amount paid, outstanding balance, payment status breakdown, and carry-forward values from previous campaigns.',
        steps: [
          { text: 'Open a client profile and click the Finance tab.' },
          { text: 'Review the budget overview cards at the top.' },
          { text: 'Check payment status breakdown (Paid, Pending, Overdue).' },
          { text: 'View carry-forward values from previous periods.' },
        ],
      },
      {
        title: 'Activity Tab',
        description:
          'A chronological timeline of every action and change made on this client\'s account. Useful for auditing who changed what and when.',
        steps: [
          { text: 'Open a client profile and click the Activity tab.' },
          { text: 'Scroll through the timeline of actions.' },
          { text: 'Each entry shows the action, user who performed it, and timestamp.' },
        ],
      },
      {
        title: 'Export Excel',
        description:
          'Download a formatted .xlsx spreadsheet containing three tabs: Scope (all projects), UGC Concepts, and Videos. Useful for sharing client summaries externally.',
        steps: [
          { text: 'Open a client profile.' },
          { text: 'Click the Export Excel button (usually in the top-right area).' },
          { text: 'The file downloads with three pre-formatted tabs.' },
        ],
      },
    ],
  },

  /* 2 ---- User Management -------------------------------------------------- */
  {
    id: 'users',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-violet-500/15',
    textColor: 'text-violet-500',
    title: 'User Management',
    tagline: 'Create brand accounts, manage credentials, and control access.',
    path: '/admin/users',
    subsections: [
      {
        title: 'User Directory',
        description:
          'View all platform users in a searchable, filterable table. Each row shows the user\'s name, email, role, subscription plan, status, and credit balance.',
        steps: [
          { text: 'Navigate to User Management in the sidebar.' },
          { text: 'Use the search bar to find users by name or email.' },
          { text: 'Filter by status (Active, Suspended, Pending, Deactivated).' },
          { text: 'Filter by role and subscription plan.' },
        ],
      },
      {
        title: 'Create a New Brand Account',
        description:
          'When you create a new user, you also create their Client entity. Set company name, logo URL, and industry -- this becomes the Client card visible in Client Management. A Team is automatically created for the new user.',
        steps: [
          { text: 'Click the Create User button at the top of the Users page.' },
          { text: 'Fill in user details: name, email, password.' },
          { text: 'Set the company name -- this becomes the Client name.' },
          { text: 'Upload or paste a company logo URL.' },
          { text: 'Select the industry vertical.' },
          { text: 'Choose a subscription plan (Free, Standard, Premium).' },
          { text: 'Submit. The user, team, and client are all created together.' },
        ],
      },
      {
        title: 'Edit & Manage Users',
        description:
          'Modify existing user accounts. You can adjust their credit balance, change subscription plans, suspend or reactivate accounts, and update personal details.',
        steps: [
          { text: 'Find the user in the directory and click their row.' },
          { text: 'Edit any field: name, email, role, subscription plan.' },
          { text: 'Adjust credits by entering a new balance or delta.' },
          { text: 'Toggle account status between Active, Suspended, or Deactivated.' },
          { text: 'Save changes.' },
        ],
      },
    ],
  },

  /* 3 ---- Influencer Database ---------------------------------------------- */
  {
    id: 'influencers',
    icon: <Database className="h-5 w-5" />,
    color: 'bg-pink-500/15',
    textColor: 'text-pink-500',
    title: 'Influencer Database',
    tagline: 'Master CRM with pricing, tags, and bulk operations for every influencer.',
    path: '/superadmin/influencers',
    subsections: [
      {
        title: 'Browsing & Searching',
        description:
          'The database supports two view modes: Table view for dense data and Card view for a visual layout. Search by name or handle, sort by any column, filter by tags or tier, and paginate through results.',
        steps: [
          { text: 'Navigate to Influencer Database in the sidebar.' },
          { text: 'Toggle between Table view and Card view using the view switcher.' },
          { text: 'Use the search bar to find influencers by name or Instagram handle.' },
          { text: 'Sort by clicking column headers (followers, engagement rate, tier, etc.).' },
          { text: 'Use filters to narrow by tag, tier, or status.' },
        ],
      },
      {
        title: 'Adding Influencers',
        description:
          'Add influencers individually via the form or in bulk via Excel import. Each influencer record includes cost and sell pricing per deliverable type (post, story, reel, carousel, video, bundle, monthly), all stored in AED.',
        steps: [
          { text: 'Click Add Influencer to open the single-add form.' },
          { text: 'Enter Instagram handle, name, tier, and tags.' },
          { text: 'Set cost pricing (what you pay) and sell pricing (what the client pays) per deliverable type in AED.' },
          { text: 'For bulk import: click Bulk Import, download the Excel template, fill it in, and upload.' },
        ],
      },
      {
        title: 'Bulk Operations',
        description:
          'Select multiple influencers using the checkboxes, then apply bulk actions: update pricing for all selected, add or remove tags in batch, or export the selection.',
        steps: [
          { text: 'Check the boxes next to the influencers you want to update.' },
          { text: 'Click Bulk Actions in the toolbar that appears.' },
          { text: 'Choose an action: Bulk Pricing Update, Bulk Tag Management, or Export.' },
          { text: 'For pricing: enter the new rates per deliverable type and confirm.' },
          { text: 'For tags: add or remove tags from all selected influencers at once.' },
        ],
      },
      {
        title: 'Influencer Detail View',
        description:
          'Click any influencer to see their full profile: pricing breakdown, analytics summary, engagement metrics, internal notes, and tag assignments.',
        steps: [
          { text: 'Click an influencer name or row to open their detail view.' },
          { text: 'Review cost and sell pricing per deliverable type.' },
          { text: 'View analytics: followers, engagement rate, audience demographics.' },
          { text: 'Add or edit internal notes for coordination.' },
          { text: 'Manage tags and tier assignment.' },
        ],
      },
    ],
  },

  /* 4 ---- Proposals -------------------------------------------------------- */
  {
    id: 'proposals',
    icon: <FileText className="h-5 w-5" />,
    color: 'bg-amber-500/15',
    textColor: 'text-amber-500',
    title: 'Proposals',
    tagline: 'Create and track influencer proposals with margin analysis.',
    path: '/superadmin/proposals',
    subsections: [
      {
        title: 'Creating a Proposal',
        description:
          'Build proposals for brand clients with curated influencer lists. Select influencers from the master database, set custom sell pricing per influencer (overriding defaults if needed), and add deliverable assignments.',
        steps: [
          { text: 'Navigate to Proposals in the sidebar.' },
          { text: 'Click Create Proposal.' },
          { text: 'Select the target client (brand) from the dropdown.' },
          { text: 'Add influencers from the master database to the proposal.' },
          { text: 'For each influencer, review or override the sell pricing per deliverable.' },
          { text: 'Assign deliverable types and quantities.' },
          { text: 'Save the proposal as a Draft.' },
        ],
      },
      {
        title: 'Proposal Lifecycle',
        description:
          'Proposals move through a defined workflow: Draft, Sent, In Review, and finally Approved or Rejected. You can track each proposal\'s status and see when clients last interacted with it.',
        steps: [
          { text: 'After creating, click Send to move the proposal from Draft to Sent.' },
          { text: 'The client receives access and the status changes to In Review when they open it.' },
          { text: 'Monitor the proposals table for status updates.' },
          { text: 'Final states: Approved (client accepted) or Rejected (client declined).' },
        ],
      },
      {
        title: 'Margin Analysis',
        description:
          'Each proposal includes a margin analysis view. Compare sell pricing (what the client pays) against cost pricing (what you pay the influencer) to see profit margins per influencer and per proposal.',
        steps: [
          { text: 'Open a proposal detail page.' },
          { text: 'Review the financial summary showing total sell, total cost, and margin.' },
          { text: 'View per-influencer margin breakdowns.' },
          { text: 'Adjust custom sell pricing if margins need optimization.' },
        ],
      },
    ],
  },

  /* 5 ---- Operations ------------------------------------------------------- */
  {
    id: 'operations',
    icon: <Briefcase className="h-5 w-5" />,
    color: 'bg-emerald-500/15',
    textColor: 'text-emerald-500',
    title: 'Operations',
    tagline: 'Campaign execution, deliverable tracking, and production scheduling.',
    path: '/ops/campaigns',
    subsections: [
      {
        title: 'Deliverable Tracking',
        description:
          'Every deliverable follows a 12-state workflow: Idea, Briefing, Drafting, Internal Review, Client Review, Approved, In Production, Scheduled, Posted, Live, Reporting, and Archived. Move deliverables through states to track progress.',
        steps: [
          { text: 'Navigate to Operations in the sidebar.' },
          { text: 'Select a campaign to view its workstreams.' },
          { text: 'Each deliverable shows its current state and assigned creator.' },
          { text: 'Click a deliverable to change its state or view its history.' },
          { text: 'Use the board or list view to track deliverables across states.' },
        ],
      },
      {
        title: 'Concept Approval Workflow',
        description:
          'Concepts go through an approval process with separate internal and client-facing versions. Internal concepts are reviewed by the team before the client version is shared.',
        steps: [
          { text: 'Create a concept within a campaign workstream.' },
          { text: 'Upload the internal version for team review.' },
          { text: 'Once approved internally, create the client-facing version.' },
          { text: 'Share with the client for review and approval.' },
        ],
      },
      {
        title: 'Production Batch Scheduling',
        description:
          'Schedule production shoots in batches. Group multiple creators and deliverables into a single production day for efficiency.',
        steps: [
          { text: 'Open a campaign and navigate to Production.' },
          { text: 'Create a new production batch with a date and location.' },
          { text: 'Assign creators and their deliverables to the batch.' },
          { text: 'Track batch status and completion.' },
        ],
      },
      {
        title: 'Event & Activation Management',
        description:
          'Manage events and activations with barter tracking. Track which influencers are attending, their barter arrangements, and post-event deliverable completion.',
        steps: [
          { text: 'Create an event or activation within the operations module.' },
          { text: 'Enroll influencers and set barter terms.' },
          { text: 'Track attendance on event day.' },
          { text: 'Follow up on post-event deliverable completion.' },
        ],
      },
      {
        title: 'Creator Assignment & Payouts',
        description:
          'Assign creators to campaigns, track their participation status, and manage payout records. See who has been paid and who has outstanding balances.',
        steps: [
          { text: 'Open a campaign and go to the Creators section.' },
          { text: 'Assign influencers from the database.' },
          { text: 'Track status: Active, Cancelled, Unresponsive, No Show, Carried Forward.' },
          { text: 'Record payouts as they are processed.' },
        ],
      },
      {
        title: 'Activity Audit Trail',
        description:
          'Every action in the operations module is logged. View a chronological audit trail of changes, approvals, status transitions, and user actions.',
        steps: [
          { text: 'Open any campaign or deliverable.' },
          { text: 'Click the Activity tab to view the full audit trail.' },
          { text: 'Each entry shows the action, who performed it, and when.' },
        ],
      },
    ],
  },

  /* 6 ---- Following App ---------------------------------------------------- */
  {
    id: 'following-app',
    icon: <Smartphone className="h-5 w-5" />,
    color: 'bg-cyan-500/15',
    textColor: 'text-cyan-500',
    title: 'Following App',
    tagline: 'Manage the influencer cashback platform, merchants, and withdrawals.',
    path: '/superadmin/fa',
    subsections: [
      {
        title: 'Members',
        description:
          'Review and manage influencer applications to the Following App. Approve or reject applicants, view fraud scores, and monitor active members.',
        steps: [
          { text: 'Navigate to Following App > Members in the sidebar.' },
          { text: 'View pending applications at the top.' },
          { text: 'Review each applicant\'s profile, social metrics, and fraud score.' },
          { text: 'Approve or reject applications with an optional note.' },
          { text: 'Search and filter active members.' },
        ],
      },
      {
        title: 'Merchants',
        description:
          'Create and manage merchant/brand partners that participate in the cashback program. Set commission rates and track merchant performance.',
        steps: [
          { text: 'Navigate to Following App > Merchants.' },
          { text: 'Click Create Merchant to add a new brand partner.' },
          { text: 'Enter merchant details: name, logo, category, commission structure.' },
          { text: 'Manage existing merchants: edit details, activate/deactivate.' },
        ],
      },
      {
        title: 'Campaigns',
        description:
          'Create and manage cashback campaigns, paid deals, and barter campaigns within the Following App ecosystem.',
        steps: [
          { text: 'Navigate to Following App > Campaigns.' },
          { text: 'Click Create Campaign and select the type: Cashback, Paid Deal, or Barter.' },
          { text: 'Configure campaign parameters: budget, dates, eligible influencers, requirements.' },
          { text: 'Launch the campaign and monitor participation.' },
        ],
      },
      {
        title: 'Deliverables',
        description:
          'Review and verify content submissions from influencers. Check that deliverables meet campaign requirements before approving.',
        steps: [
          { text: 'Navigate to Following App > Deliverables.' },
          { text: 'View pending submissions awaiting review.' },
          { text: 'Click a submission to review the content (posts, stories, reels).' },
          { text: 'Approve or reject with feedback.' },
        ],
      },
      {
        title: 'Withdrawals',
        description:
          'Process influencer cashback withdrawal requests. Review pending withdrawals, verify amounts, and approve or decline.',
        steps: [
          { text: 'Navigate to Following App > Withdrawals.' },
          { text: 'View pending withdrawal requests with amounts and member details.' },
          { text: 'Verify the withdrawal amount against the member\'s available balance.' },
          { text: 'Approve to process payment or decline with a reason.' },
        ],
      },
    ],
  },

  /* 7 ---- Campaigns -------------------------------------------------------- */
  {
    id: 'campaigns',
    icon: <Clapperboard className="h-5 w-5" />,
    color: 'bg-orange-500/15',
    textColor: 'text-orange-500',
    title: 'Campaigns',
    tagline: 'Create and manage campaigns on behalf of clients with full budget tracking.',
    path: '/ops/campaigns',
    subsections: [
      {
        title: 'Creating Campaigns for Clients',
        description:
          'Superadmins can create campaigns on behalf of any client. Choose the campaign type: Influencer (post tracking), UGC (content production), Cashback, Paid Deal, or Barter. Each type has its own workflow.',
        steps: [
          { text: 'Navigate to Operations > Campaigns.' },
          { text: 'Click Create Campaign.' },
          { text: 'Select the client this campaign belongs to.' },
          { text: 'Choose the campaign type.' },
          { text: 'Set campaign name, dates, and budget (AED).' },
          { text: 'Save and begin adding creators or content.' },
        ],
      },
      {
        title: 'Budget & Spend Tracking',
        description:
          'Each campaign tracks its budget and actual spend in AED. View how much has been allocated, spent, and what remains.',
        steps: [
          { text: 'Open a campaign detail page.' },
          { text: 'View budget summary cards showing total budget, spent, and remaining.' },
          { text: 'Track individual line items contributing to spend.' },
        ],
      },
      {
        title: 'Managing Campaign Creators',
        description:
          'Add influencers to campaigns and track their status. Statuses include: Active, Cancelled, Unresponsive, No Show, and Carried Forward. Edit creator details like ethnicity, visit date/time, ticket serial, and FOC products.',
        steps: [
          { text: 'Open a campaign and go to the Creators section.' },
          { text: 'Click Add Creator to assign influencers from the database.' },
          { text: 'Set each creator\'s status as the campaign progresses.' },
          { text: 'Edit creator details: ethnicity, visit date/time, ticket serial, FOC products.' },
          { text: 'For cancelled or no-show creators, record the reason.' },
        ],
      },
      {
        title: 'Carry-Forward',
        description:
          'When an influencer needs to be moved from one campaign to another (e.g., scheduling conflict), use the carry-forward feature. Record the reason and monetary value being carried forward.',
        steps: [
          { text: 'Open the campaign and find the creator to carry forward.' },
          { text: 'Change their status to Carried Forward.' },
          { text: 'Enter the carry-forward reason and AED value.' },
          { text: 'The carry-forward amount appears in the client\'s Finance tab.' },
        ],
      },
    ],
  },

  /* 8 ---- Billing ---------------------------------------------------------- */
  {
    id: 'billing',
    icon: <CreditCard className="h-5 w-5" />,
    color: 'bg-green-500/15',
    textColor: 'text-green-500',
    title: 'Billing',
    tagline: 'Subscription management, credit adjustments, and payment history.',
    path: '/admin/billing',
    subsections: [
      {
        title: 'Subscription Management',
        description:
          'View and manage user subscriptions. See which plan each user is on (Free, Standard at $199/mo, Premium at $499/mo), their billing cycle, and renewal dates.',
        steps: [
          { text: 'Navigate to Billing in the sidebar.' },
          { text: 'View the subscription overview showing all active subscriptions.' },
          { text: 'Filter by plan type to see all Premium or Standard users.' },
          { text: 'Click a user to modify their subscription.' },
        ],
      },
      {
        title: 'Credit Adjustments',
        description:
          'Manually adjust credit balances for users. Credits are used for profile unlocks (25 credits), post analytics (5 credits), discovery (1 credit), campaign analysis (10 credits), and bulk exports (50 credits).',
        steps: [
          { text: 'Find the user whose credits you want to adjust.' },
          { text: 'Click Adjust Credits.' },
          { text: 'Enter the adjustment amount (positive to add, negative to deduct).' },
          { text: 'Add a note explaining the adjustment reason.' },
          { text: 'Confirm the adjustment.' },
        ],
      },
      {
        title: 'Payment History',
        description:
          'View the complete payment history for all users. See transaction dates, amounts, payment methods, and statuses.',
        steps: [
          { text: 'Navigate to the Payment History section within Billing.' },
          { text: 'Search by user name or email.' },
          { text: 'Filter by date range or payment status.' },
          { text: 'Export payment records if needed.' },
        ],
      },
    ],
  },

  /* 9 ---- System ----------------------------------------------------------- */
  {
    id: 'system',
    icon: <Settings className="h-5 w-5" />,
    color: 'bg-slate-500/15',
    textColor: 'text-slate-500',
    title: 'System',
    tagline: 'Platform health, security settings, access control, and configuration.',
    path: '/superadmin/system',
    subsections: [
      {
        title: 'Analytics',
        description:
          'Platform health and performance metrics. Monitor API response times, active user counts, error rates, and system resource usage.',
        steps: [
          { text: 'Navigate to System > Analytics.' },
          { text: 'View real-time dashboard showing platform health indicators.' },
          { text: 'Check API performance metrics and error rates.' },
          { text: 'Monitor active user counts and usage patterns.' },
        ],
      },
      {
        title: 'Credits Management',
        description:
          'System-wide credit management. View total credits in circulation, set default credit allocations per plan tier, and monitor credit consumption trends.',
        steps: [
          { text: 'Navigate to System > Credits.' },
          { text: 'View total credits across all user wallets.' },
          { text: 'Review credit consumption trends over time.' },
          { text: 'Adjust default credit allocations per subscription tier.' },
        ],
      },
      {
        title: 'Currency Configuration',
        description:
          'Configure AED-related settings for the platform. All influencer pricing and campaign budgets use AED as the operational currency.',
        steps: [
          { text: 'Navigate to System > Currency.' },
          { text: 'Review current AED configuration settings.' },
          { text: 'Update exchange rates or display settings if needed.' },
        ],
      },
      {
        title: 'Security',
        description:
          'Platform security settings including authentication policies, session management, and security audit configurations.',
        steps: [
          { text: 'Navigate to System > Security.' },
          { text: 'Review current authentication policies.' },
          { text: 'Configure session timeout durations.' },
          { text: 'View recent security events and alerts.' },
        ],
      },
      {
        title: 'Access Control',
        description:
          'Manage roles and permissions across the platform. Define what each role can access and modify.',
        steps: [
          { text: 'Navigate to System > Access Control.' },
          { text: 'View all defined roles and their permissions.' },
          { text: 'Edit role permissions as needed.' },
          { text: 'Assign or change user roles.' },
        ],
      },
      {
        title: 'Activity Logs',
        description:
          'System-wide audit trail. Every significant action on the platform is logged here with timestamps, user identifiers, and action details.',
        steps: [
          { text: 'Navigate to System > Activity Logs.' },
          { text: 'Search logs by user, action type, or date range.' },
          { text: 'Export logs for compliance or review.' },
        ],
      },
      {
        title: 'Notifications',
        description:
          'Manage system notifications. Configure which events trigger notifications, notification channels, and recipient groups.',
        steps: [
          { text: 'Navigate to System > Notifications.' },
          { text: 'View current notification rules.' },
          { text: 'Create or edit notification triggers.' },
          { text: 'Configure notification channels and recipients.' },
        ],
      },
      {
        title: 'Settings',
        description:
          'General system configuration and feature flags. Toggle platform features on or off, configure default behaviors, and manage environment settings.',
        steps: [
          { text: 'Navigate to System > Settings.' },
          { text: 'Review current feature flags and their states.' },
          { text: 'Toggle features on or off for the entire platform.' },
          { text: 'Update default configuration values.' },
        ],
      },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function SuperadminGuidePage() {
  const [search, setSearch] = useState('')
  const topRef = useRef<HTMLDivElement>(null)

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections
    const q = search.toLowerCase()
    return sections.filter((s) => {
      // match section-level
      if (
        s.title.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.path.toLowerCase().includes(q)
      )
        return true
      // match any subsection
      return s.subsections.some(
        (sub) =>
          sub.title.toLowerCase().includes(q) ||
          sub.description.toLowerCase().includes(q) ||
          sub.steps.some((st) => st.text.toLowerCase().includes(q))
      )
    })
  }, [search])

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <SuperadminLayout>
      <div ref={topRef} className="mx-auto w-full max-w-5xl space-y-8">
        {/* ---- Header ---- */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Platform Guide
              </h1>
              <p className="text-sm text-muted-foreground">
                Everything you need to know to manage the platform
              </p>
            </div>
          </div>
        </div>

        {/* ---- Search ---- */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search the guide... (e.g. &quot;carry-forward&quot;, &quot;bulk pricing&quot;, &quot;withdrawals&quot;)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* ---- Quick Jump ---- */}
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-block"
            >
              <Badge
                variant="outline"
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  filteredSections.find((fs) => fs.id === s.id)
                    ? ''
                    : 'opacity-40'
                }`}
              >
                <span className={`mr-1.5 ${s.textColor}`}>
                  {s.icon}
                </span>
                {s.title}
              </Badge>
            </a>
          ))}
        </div>

        <Separator />

        {/* ---- Sections ---- */}
        {filteredSections.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No sections match your search. Try a different term.
              </p>
            </CardContent>
          </Card>
        )}

        <Accordion
          type="multiple"
          defaultValue={sections.map((s) => s.id)}
          className="space-y-4"
        >
          {filteredSections.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-24">
              <Card className="overflow-hidden border">
                <AccordionItem value={section.id} className="border-0">
                  <AccordionTrigger className="px-6 py-5 hover:no-underline">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.color}`}
                      >
                        <span className={section.textColor}>
                          {section.icon}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold">
                            {section.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="hidden text-[10px] sm:inline-flex"
                          >
                            {section.path}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                          {section.tagline}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-5">
                      {section.subsections.map((sub, idx) => (
                        <div key={idx} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <ChevronRight
                              className={`h-4 w-4 ${section.textColor}`}
                            />
                            <h3 className="text-sm font-semibold">
                              {sub.title}
                            </h3>
                          </div>

                          <div className="rounded-lg bg-muted/40 p-4">
                            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                              {sub.description}
                            </p>
                            <ol className="space-y-2">
                              {sub.steps.map((step, sIdx) => (
                                <li
                                  key={sIdx}
                                  className="flex items-start gap-3 text-sm"
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${section.color} ${section.textColor}`}
                                  >
                                    {sIdx + 1}
                                  </span>
                                  <span className="leading-relaxed">
                                    {step.text}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          {idx < section.subsections.length - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            </div>
          ))}
        </Accordion>

        {/* ---- Back to top ---- */}
        <div className="flex justify-center pb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToTop}
            className="gap-2"
          >
            <ArrowUp className="h-4 w-4" />
            Back to top
          </Button>
        </div>
      </div>
    </SuperadminLayout>
  )
}
