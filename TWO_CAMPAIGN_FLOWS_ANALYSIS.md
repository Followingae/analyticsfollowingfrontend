# Two Campaign Flows - Complete Analysis & Action Plan

**Date:** January 11, 2025

---

## 🎯 THE TWO DISTINCT FLOWS

### **FLOW 1: USER Creates Campaign (Simple Post Tracking)**
**User Journey:**
1. User creates campaign with name, brand, dates
2. User adds Instagram post URLs manually
3. System fetches post analytics automatically
4. User views campaign-wise aggregated reports

**Key Characteristics:**
- ✅ **NO influencer selection workflow**
- ✅ **NO content approval workflow**
- ✅ **NO superadmin involvement**
- ✅ **Simple post analytics aggregation**
- ✅ User has full control, self-service

**Status:** ✅ **ALREADY BUILT!**

---

### **FLOW 2: SUPERADMIN Creates Proposal for User (Full Workflow)**
**User Journey:**
1. Superadmin creates proposal with suggested influencers
2. User receives proposal notification
3. User reviews and selects influencers from suggestions
4. Superadmin locks selected influencers
5. Influencers submit content
6. User approves/rejects content
7. Approved content goes live
8. Campaign analytics and final report

**Key Characteristics:**
- ✅ Influencer selection from curated list
- ✅ Content approval workflow
- ✅ Multi-stage campaign lifecycle
- ✅ Superadmin manages the process
- ✅ Campaign created FROM approved proposal

**Status:** ⚠️ **PARTIALLY BUILT** - Needs completion

---

## 📋 BACKEND API REQUIREMENTS ANALYSIS

### **FLOW 1 APIs** ✅ **COMPLETE**

All required APIs exist:

```
✅ POST /api/v1/campaigns/                      - Create campaign
✅ GET  /api/v1/campaigns/                      - List user's campaigns
✅ GET  /api/v1/campaigns/{id}                  - Get campaign details
✅ PATCH /api/v1/campaigns/{id}                 - Update campaign
✅ DELETE /api/v1/campaigns/{id}                - Archive campaign

✅ POST /api/v1/campaigns/{id}/posts            - Add Instagram post URL
✅ GET  /api/v1/campaigns/{id}/posts            - List campaign posts with analytics
✅ DELETE /api/v1/campaigns/{id}/posts/{post_id} - Remove post

✅ GET  /api/v1/campaigns/{id}/analytics        - Campaign analytics (7d/30d/90d)
✅ POST /api/v1/campaigns/{id}/reports/generate - Generate PDF/Excel report

✅ GET  /api/v1/campaigns/overview              - Dashboard overview with trends
```

**Verdict:** ✅ **Backend is complete for Flow 1**

---

### **FLOW 2 APIs** ⚠️ **NEEDS VERIFICATION**

Required APIs for the full proposal workflow:

```
🟡 GET  /api/v1/campaigns/proposals             - List proposals sent to user
🟡 GET  /api/v1/campaigns/proposals/{id}        - Get proposal details + suggested influencers
🟡 PUT  /api/v1/campaigns/proposals/{id}/influencers - User selects influencers
🟡 POST /api/v1/campaigns/proposals/{id}/approve     - Approve proposal → Creates campaign
🟡 POST /api/v1/campaigns/proposals/{id}/reject      - Reject proposal

❓ GET  /api/v1/campaigns/{id}/content          - List submitted content for approval
❓ POST /api/v1/campaigns/{id}/content/{content_id}/approve - Approve content
❓ POST /api/v1/campaigns/{id}/content/{content_id}/reject  - Reject content

❓ GET  /api/v1/campaigns/{id}/influencers      - List locked influencers in campaign
❓ GET  /api/v1/campaigns/{id}/stages           - Get current workflow stage status
```

**Questions for Backend:**
1. ❓ Are the 5 proposal endpoints (`/api/v1/campaigns/proposals/*`) live?
2. ❓ Do we have content approval endpoints (`/content/{id}/approve|reject`)?
3. ❓ How do we track campaign stages (proposal → content → live → report)?
4. ❓ When user approves proposal, does it auto-create campaign and link it?

---

## 🎨 FRONTEND STATUS

### **FLOW 1 Frontend** ✅ **COMPLETE**

**Files:**
- ✅ `frontend/src/app/campaigns/new/page.tsx` - Create campaign form (API call uncommented)
- ✅ `frontend/src/app/campaigns/[id]/page-old.tsx` - Campaign detail with post management
- ✅ `frontend/src/components/campaigns/PostCard.tsx` - Post analytics display
- ✅ `frontend/src/components/campaigns/CampaignPostAnalytics.tsx` - Aggregated analytics
- ✅ `frontend/src/components/campaigns/CompleteCampaignPDF.tsx` - PDF export
- ✅ `frontend/src/services/campaignApiComplete.ts` - All API methods

**What Works:**
1. ✅ Create campaign with brand name, dates, budget, tags
2. ✅ Add Instagram post URLs (with validation)
3. ✅ Automatic post analytics fetching
4. ✅ Campaign-wise aggregated metrics
5. ✅ Post grid with engagement stats
6. ✅ PDF report generation
7. ✅ Campaign dashboard with trends

**User Experience:**
```
User clicks "New Campaign"
  → Fills form (name, brand, dates)
  → Clicks "Create Campaign"
  → Campaign created
  → User adds post URLs one by one
  → System fetches post analytics
  → User views aggregated campaign metrics
  → User exports PDF report
```

**Verdict:** ✅ **Flow 1 is production-ready!**

---

### **FLOW 2 Frontend** ⚠️ **PARTIALLY COMPLETE**

**Existing Files:**
- ✅ `frontend/src/app/campaigns/[id]/page.tsx` - Multi-stage campaign view
- ✅ `frontend/src/components/campaigns/unified/InfluencerSelectionV3.tsx` - Influencer selection UI
- ⚠️ `frontend/src/components/campaigns/unified/ProposalsTab.tsx` - Proposals list (NOT using new API)
- ❓ Content approval UI (needs verification)

**What's Built:**
1. ✅ Workflow stages UI (proposal → content → live → report)
2. ✅ Influencer selection grid with checkboxes
3. ✅ Mock proposal data display
4. ⚠️ NOT connected to real proposal APIs

**What's Missing:**
1. ❌ Proposals list using `/api/v1/campaigns/proposals`
2. ❌ Proposal detail page with influencer selection
3. ❌ Approve/reject proposal buttons
4. ❌ Content submission approval UI
5. ❌ Locked influencers display
6. ❌ Stage transition logic

**Current Problem:**
- `page.tsx` uses **MOCK DATA** for campaigns 1, 2, 3
- `ProposalsTab.tsx` doesn't call the real API
- No routing for proposal detail view
- No API integration for influencer selection

---

## 🚀 ACTION PLAN

### **IMMEDIATE: Verify Backend Readiness**

**Question to Backend Team:**
```
Are these 5 proposal endpoints LIVE and working?

1. GET  /api/v1/campaigns/proposals
2. GET  /api/v1/campaigns/proposals/{id}
3. PUT  /api/v1/campaigns/proposals/{id}/influencers
4. POST /api/v1/campaigns/proposals/{id}/approve
5. POST /api/v1/campaigns/proposals/{id}/reject

Also:
- Do we have content approval endpoints?
- How do we track campaign workflow stages?
- What happens when user approves a proposal?
```

---

### **Frontend Changes Required**

#### **1. Update ProposalsTab Component** (High Priority)
**File:** `frontend/src/components/campaigns/unified/ProposalsTab.tsx`

**Changes:**
```typescript
// BEFORE (current):
- Uses mock data
- No real API calls

// AFTER (required):
import { campaignApi } from '@/services/campaignApiComplete'

const fetchProposals = async () => {
  const response = await campaignApi.listProposals({
    status: 'sent',
    limit: 50
  })

  if (response.success && response.data) {
    setProposals(response.data.proposals)
  }
}
```

**UI Updates:**
- Display proposals with status badges
- Show "New Proposal" notification badge
- Show influencer count and budget
- Add "View Details" button that routes to `/campaigns/proposals/{id}`

---

#### **2. Create Proposal Detail Page** (High Priority)
**New File:** `frontend/src/app/campaigns/proposals/[id]/page.tsx`

**Features:**
```typescript
- Fetch proposal details: campaignApi.getProposalDetails(id)
- Display:
  ✅ Proposal title, campaign name, budget
  ✅ Superadmin notes
  ✅ Suggested influencers grid with checkboxes
  ✅ Expected metrics (reach, engagement)
  ✅ Selection summary

- Actions:
  ✅ Select/deselect influencers (checkboxes)
  ✅ Update selection: campaignApi.selectInfluencers(id, { selected_influencer_ids })
  ✅ "Approve" button → campaignApi.approveProposal(id, data)
  ✅ "Reject" button → Modal for reason → campaignApi.rejectProposal(id, { reason })

- After approval:
  ✅ Redirect to new campaign: /campaigns/{campaign_id}
```

---

#### **3. Fix Campaign Detail Page Routing** (High Priority)
**File:** `frontend/src/app/campaigns/[id]/page.tsx`

**Current Issue:**
- Uses mock data based on campaignId === "1" | "2" | "3"
- Doesn't fetch real campaign data

**Required Fix:**
```typescript
// REMOVE mock data logic
// REPLACE WITH:

const fetchCampaignData = async () => {
  const { campaignApi } = await import('@/services/campaignApiComplete')

  const response = await campaignApi.getCampaignDetails(campaignId)

  if (response.success && response.data) {
    setCampaign(response.data)

    // Determine which tab to show based on campaign.created_by
    if (response.data.created_by === 'user') {
      // FLOW 1: Show simple post analytics view (page-old.tsx logic)
      setActiveTab('posts')
    } else if (response.data.created_by === 'superadmin' && response.data.proposal_id) {
      // FLOW 2: Show proposal workflow view
      setActiveTab('workflow')
    }
  }
}
```

**Key Logic:**
```typescript
// Detect which flow based on campaign data:
if (campaign.created_by === 'user' && !campaign.proposal_id) {
  // FLOW 1: Simple campaign
  // Show: Overview, Posts, Analytics tabs
  // Use: page-old.tsx components

} else if (campaign.created_by === 'superadmin' && campaign.proposal_id) {
  // FLOW 2: Proposal-based campaign
  // Show: Workflow, Influencers, Content Approval, Analytics tabs
  // Use: current page.tsx components
}
```

---

#### **4. Unified Campaign Detail Router** (Recommended)
**File:** `frontend/src/app/campaigns/[id]/page.tsx`

**New Architecture:**
```typescript
export default function CampaignDetailPage() {
  const [campaign, setCampaign] = useState(null)
  const [flowType, setFlowType] = useState<'simple' | 'proposal' | null>(null)

  useEffect(() => {
    fetchCampaign()
  }, [])

  const fetchCampaign = async () => {
    const response = await campaignApi.getCampaignDetails(campaignId)
    setCampaign(response.data)

    // Determine flow type
    const isProposalFlow = response.data.created_by === 'superadmin' && response.data.proposal_id
    setFlowType(isProposalFlow ? 'proposal' : 'simple')
  }

  if (!campaign) return <Skeleton />

  // Route to appropriate view
  if (flowType === 'simple') {
    return <SimpleCampaignView campaign={campaign} />  // From page-old.tsx
  } else {
    return <ProposalCampaignView campaign={campaign} /> // Current page.tsx logic
  }
}
```

---

### **5. Content Approval UI** (If Backend Has Endpoints)

**New File:** `frontend/src/app/campaigns/[id]/content/page.tsx`

**Features:**
- List submitted content items
- Preview content (image/video)
- Approve/reject buttons
- Rejection reason modal
- Real-time status updates

**API Calls:**
```typescript
GET  /api/v1/campaigns/{id}/content
POST /api/v1/campaigns/{id}/content/{content_id}/approve
POST /api/v1/campaigns/{id}/content/{content_id}/reject
```

---

## 📊 SUMMARY

### **What's Already Working** ✅
- Flow 1 (User-created campaigns) is **100% complete**
- All CRUD APIs integrated
- Post management working
- Analytics and reporting working
- Create campaign form sending real API calls

### **What Needs Work** ⚠️
- ProposalsTab needs to call real API
- Proposal detail page needs creation
- Campaign detail page needs flow detection logic
- Content approval UI needs creation (if backend has endpoints)

### **Backend Verification Needed** ❓
1. Are proposal endpoints live?
2. Are content approval endpoints available?
3. How are campaign stages tracked?
4. What happens on proposal approval?

---

## 🎯 NEXT STEPS (Prioritized)

1. **IMMEDIATE:** Ask backend team about proposal endpoint status
2. **HIGH:** Update ProposalsTab to use `campaignApi.listProposals()`
3. **HIGH:** Create proposal detail page with influencer selection
4. **HIGH:** Add flow detection logic to campaign detail page
5. **MEDIUM:** Create content approval UI (if backend ready)
6. **LOW:** Polish and testing

---

**Status:** Ready for backend verification and frontend implementation
**Estimated Work:** 4-6 hours after backend confirmation
**Last Updated:** January 11, 2025
