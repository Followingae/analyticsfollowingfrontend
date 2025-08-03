# Frontend Team Handover Document
## Instagram Analytics Backend API Changes

**Date:** July 31, 2025  
**Backend Version:** Production Ready (Post-Audit)  
**Migration Status:** Complete

---

## Executive Summary

The backend has undergone a comprehensive audit and cleanup. All obsolete/fake APIs have been removed, and only production-ready endpoints with real Decodo integration remain. The database now stores ALL 80+ Decodo datapoints with proper security (RLS) implementation.

---

## 🚨 CRITICAL CHANGES - ACTION REQUIRED

### **Removed APIs (No Longer Available)**
These endpoints have been **completely removed** and will return 404 errors:

#### **Fake AI/ML Endpoints (REMOVED)**
```
❌ DELETE /ai/analyze-engagement/{username}
❌ DELETE /ai/predict-growth/{username}  
❌ DELETE /ai/content-optimization/{username}
❌ DELETE /ai/audience-insights/{username}
❌ DELETE /ai/competitor-analysis/{username}
❌ DELETE /ai/hashtag-strategy/{username}
❌ DELETE /ai/influencer-matching
❌ DELETE /ai/brand-safety-score/{username}
❌ DELETE /ai/roi-prediction
```

#### **Obsolete V2 Endpoints (REMOVED)**
```
❌ DELETE /v2/instagram/profile/{username}
❌ DELETE /v2/instagram/detailed-analysis/{username}
❌ DELETE /v2/instagram/comprehensive/{username}
```

#### **Old In-House Endpoints (REMOVED)**
```
❌ DELETE /api/v1/inhouse/instagram/profile/{username}
❌ DELETE /api/v1/inhouse/instagram/profile/{username}/basic
❌ DELETE /api/v1/inhouse/test
```

#### **Duplicate/Redundant Endpoints (REMOVED)**  
```
❌ DELETE /instagram/analyze/{username}
❌ DELETE /instagram/quick-profile/{username}
❌ DELETE /instagram/basic-info/{username}
```

---

## ✅ PRODUCTION READY ENDPOINTS

### **Primary Profile Analysis**
```http
GET /instagram/profile/{username}
```
**Status:** ✅ MAIN ENDPOINT - USE THIS  
**Data Source:** Real Decodo API with ALL 80+ datapoints  
**Response:** Complete profile with analytics, posts, demographics  
**Security:** Requires authentication, grants 30-day access

**Response Structure:**
```json
{
  "profile": {
    "username": "string",
    "full_name": "string", 
    "followers": 123456,
    "engagement_rate": 4.2,
    "influence_score": 8.5,
    "is_verified": true,
    "business_category_name": "Creator",
    "profile_images": [...],
    "profile_thumbnails": [...]
    // + 70 more Decodo fields
  },
  "posts": [...],
  "analytics": {...},
  "demographics": {...}
}
```

### **User Management**
```http
POST /auth/register          ✅ User registration
POST /auth/login            ✅ User authentication  
GET  /auth/me               ✅ Current user profile
PUT  /auth/profile          ✅ Update user profile
```

### **User Data & History**
```http
GET /user/profile-access     ✅ User's unlocked profiles (30-day access)
GET /user/search-history     ✅ User's search history
GET /user/favorites         ✅ User's favorite profiles
POST /user/favorites        ✅ Add profile to favorites
DELETE /user/favorites/{id}  ✅ Remove from favorites
```

### **Campaign Management** 
```http
GET  /campaigns             ✅ User's campaigns
POST /campaigns             ✅ Create campaign
GET  /campaigns/{id}        ✅ Get campaign details
PUT  /campaigns/{id}        ✅ Update campaign
DELETE /campaigns/{id}      ✅ Delete campaign
POST /campaigns/{id}/profiles ✅ Add profile to campaign
DELETE /campaigns/{id}/profiles/{profile_id} ✅ Remove from campaign
```

### **System Endpoints**
```http
GET /health                 ✅ Health check
GET /metrics               ✅ System metrics (admin only)
```

---

## 🔑 AUTHENTICATION CHANGES

### **Required Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **User Registration/Login**
- **Supabase Integration:** All auth now uses Supabase RLS
- **JWT Required:** All profile access requires valid JWT
- **30-Day Access:** Profile unlocks last 30 days automatically

---

## 📊 DATABASE SCHEMA CHANGES

### **Complete Profile Data (80+ Fields)**
The main profile endpoint now returns ALL Decodo datapoints:

**Core Info:** username, full_name, biography, external_url  
**Statistics:** followers_count, following_count, posts_count  
**Business:** business_category_name, business_email, business_phone  
**Features:** has_ar_effects, has_clips, has_guides, has_channel  
**AI Fields:** ai_agent_type, ai_agent_owner_username  
**Privacy:** country_block, is_embeds_disabled, hide_like_and_view_counts  
**Verification:** is_verified, is_verified_by_mv4b  
**Media:** profile_images[], profile_thumbnails[]  
**Analytics:** engagement_rate, influence_score, content_quality_score  

### **New Tables Available**
- **profiles** - Complete Instagram profiles with all Decodo data
- **posts** - All posts with engagement metrics and media
- **user_profile_access** - 30-day access tracking  
- **campaigns** - User campaigns for competitor tracking
- **audience_demographics** - Enhanced demographic data
- **creator_metadata** - Extracted creator information

---

## 📋 **Complete Response Schema**

### **Main Profile Object (Updated)**
```typescript
interface InstagramProfile {
  // Core Profile Information
  username: string;
  full_name: string;
  biography: string;
  external_url: string;
  profile_pic_url: string;
  profile_pic_url_hd: string;
  
  // Statistics (ALL from Decodo)
  followers_count: number;
  following_count: number;
  posts_count: number;
  mutual_followers_count: number;
  highlight_reel_count: number;
  
  // Account Status
  is_verified: boolean;
  is_private: boolean;
  is_business_account: boolean;
  is_professional_account: boolean;
  
  // Business Information (NEW!)
  business_category_name: string;
  business_email: string;
  business_phone_number: string;
  
  // Features (NEW!)
  has_ar_effects: boolean;
  has_clips: boolean;
  has_guides: boolean;
  has_channel: boolean;
  
  // AI & Special Features (NEW!)
  ai_agent_type: string;
  ai_agent_owner_username: string;
  transparency_label: string;
  
  // Analytics (Enhanced)
  engagement_rate: number;
  avg_likes: number;
  avg_comments: number;
  influence_score: number;
  content_quality_score: number;
  
  // Media Storage (NEW!)
  profile_images: Array<{url: string, type: string, size: string}>;
  profile_thumbnails: Array<{url: string, width: number, height: number}>;
  
  // Data Management
  data_quality_score: number;
  last_refreshed: string;
  refresh_count: number;
```

### **Post Data (NEW!)**
```typescript
interface InstagramPost {
  instagram_post_id: string;
  shortcode: string;
  media_type: string;            // "GraphImage", "GraphVideo", "GraphSidecar"
  is_video: boolean;
  display_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  taken_at_timestamp: number;
  posted_at: string;
  hashtags: string[];
  mentions: string[];
  post_images: Array<{url: string, width: number, height: number}>;
  post_thumbnails: Array<{url: string, width: number, height: number}>;
}
```

### **Demographics Data (NEW!)**
```typescript
interface AudienceDemographics {
  gender_distribution: {female: number, male: number};
  age_distribution: {"18-24": number, "25-34": number, ...};
  location_distribution: {"Dubai": number, "USA": number, ...};
  sample_size: number;
  confidence_score: number;
  analysis_method: string;
}
```

### **Campaign Data (NEW!)**
```typescript
interface Campaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;              // "active", "paused", "completed"
  budget: number;
  target_audience: object;
  campaign_goals: object;
}
```

---

## 🔄 MIGRATION GUIDE

### **Step 1: Update API Calls**
Replace removed endpoints with main endpoint:

```javascript
// ❌ OLD (will fail)
const response = await fetch('/ai/analyze-engagement/username');
const response = await fetch('/v2/instagram/profile/username');
const response = await fetch('/api/v1/inhouse/instagram/profile/username');

// ✅ NEW (use this)
const response = await fetch('/instagram/profile/username', {
  headers: {
    'Authorization': `Bearer ${jwt_token}`,
    'Content-Type': 'application/json'
  }
});
```

### **Step 2: Update Response Parsing**
The main endpoint returns comprehensive data:

```javascript
// ✅ NEW response structure
const data = await response.json();
const profile = data.profile;        // Main profile data
const posts = data.posts;           // Recent posts array  
const analytics = data.analytics;   // Engagement metrics
const demographics = data.demographics; // Audience data
```

### **Step 3: Handle Authentication**
```javascript
// Check if user has access to profile
if (data.has_access) {
  // User has 30-day access, show full data
  displayFullProfile(data);
} else {
  // Show limited preview, prompt for unlock
  displayPreview(data.profile);
}
```

### **Step 4: Update Error Handling**
```javascript
try {
  const response = await fetch('/instagram/profile/username', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.status === 404) {
    // Profile not found or API removed
    handleProfileNotFound();
  } else if (response.status === 401) {
    // Authentication required
    redirectToLogin();
  } else if (response.status === 403) {
    // No access, show unlock option
    showUnlockPrompt();
  }
} catch (error) {
  handleNetworkError(error);
}
```

---

## 📈 NEW FEATURES AVAILABLE

### **Campaign Management UI**
Build campaign tracking interface using:
```http
GET /campaigns              # List user's campaigns
POST /campaigns             # Create new campaign  
GET /campaigns/{id}         # Get campaign with tracked profiles
```

### **Enhanced Profile Images**
Access multiple image formats:
```json
{
  "profile_images": [
    {"url": "https://...", "type": "standard", "size": "medium"},
    {"url": "https://...", "type": "hd", "size": "large"}
  ],
  "profile_thumbnails": [
    {"url": "https://...", "width": 150, "height": 150}
  ]
}
```

### **30-Day Access System**
Show access status in UI:
```json
{
  "has_access": true,
  "access_expires_at": "2025-08-30T12:00:00Z",
  "access_method": "search"
}
```

---

## 🐛 COMMON MIGRATION ISSUES

### **Issue 1: 404 Errors on Old Endpoints**
**Problem:** Calling removed AI/ML endpoints  
**Solution:** Replace with `/instagram/profile/{username}`

### **Issue 2: Missing Authentication**
**Problem:** 401 Unauthorized errors  
**Solution:** Include JWT token in Authorization header

### **Issue 3: Different Response Structure** 
**Problem:** Frontend expects old response format  
**Solution:** Update response parsing to use new comprehensive structure

### **Issue 4: Missing Profile Access**
**Problem:** Limited data returned  
**Solution:** Check `has_access` field, implement unlock flow

---

## 📞 SUPPORT & TESTING

### **Test Endpoints**
```http
GET /health                 # Verify backend is running
GET /instagram/profile/cristiano  # Test with public profile
```

### **Expected Response Times**
- Profile fetch: 2-8 seconds (includes Decodo API call)
- Cached data: < 500ms
- User data: < 200ms

### **Rate Limits**
- Profile searches: 10 per minute per user
- General API: 100 requests per minute per user

### **Support Contacts**
- **Backend Issues:** Check server logs and database
- **API Questions:** Reference this document
- **Database Issues:** Verify RLS policies are working

---

## 📋 CHECKLIST FOR FRONTEND TEAM

- [ ] Remove all calls to deleted AI/ML endpoints
- [ ] Remove all calls to deleted v2 endpoints  
- [ ] Remove all calls to old /api/v1/inhouse endpoints
- [ ] Update main profile fetching to use `/instagram/profile/{username}`
- [ ] Add JWT authentication to all API calls
- [ ] Update response parsing for new comprehensive data structure
- [ ] Implement 30-day access system UI
- [ ] Add campaign management interface (optional)
- [ ] Update error handling for new status codes
- [ ] Test authentication flow end-to-end
- [ ] Verify profile images/thumbnails display correctly

---

## 🎯 NEXT DEVELOPMENT PRIORITIES

1. **Campaign Management UI** - Full interface for tracking competitors
2. **Advanced Analytics Dashboard** - Leverage all 80+ Decodo datapoints  
3. **Enhanced Image Gallery** - Use profile_images and post_images arrays
4. **Demographic Visualizations** - Charts from audience_demographics table
5. **Real-time Profile Updates** - Refresh system for active profiles

---

## 🔧 **Frontend Implementation Guide**

### **Updated Error Handling**
```typescript
try {
  const response = await fetch('/instagram/profile/username', {
    headers: {
      'Authorization': `Bearer ${jwt_token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  
  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      redirectToLogin();
    } else if (response.status === 403) {
      // Show unlock prompt
      showUnlockPrompt(username);
    } else {
      throw new Error(data.detail || 'Analysis failed');
    }
  }
  
  return data;
} catch (error) {
  console.error('Profile analysis error:', error);
  // Show user-friendly error message
}
```

### **Access Status Handling**
```typescript
const displayProfile = (data) => {
  if (data.has_access) {
    // Show full profile with all data
    showFullProfile(data.profile, data.posts, data.demographics);
  } else {
    // Show preview with unlock button
    showProfilePreview(data.profile);
    showUnlockButton(data.profile.username);
  }
};
```

### **Image URL Handling (Enhanced)**
```typescript
// Use enhanced image arrays
const getProfileImage = (profile) => {
  const images = profile.profile_images || [];
  const hdImage = images.find(img => img.type === 'hd');
  const standardImage = images.find(img => img.type === 'standard');
  
  return hdImage?.url || standardImage?.url || profile.profile_pic_url || '/default-avatar.png';
};

// For post images
const getPostImage = (post) => {
  const images = post.post_images || [];
  return images[0]?.url || post.display_url || '/placeholder-post.png';
};
```

---

## 📊 **Updated Dashboard Recommendations**

### **Main Profile Card**
- Profile image (HD when available), name, username, verification badge
- Follower count, following count, posts count (all real data from Decodo)
- Engagement rate with visual indicator
- Influence score and content quality score with progress bars
- Business category and AI agent type (if applicable)

### **Enhanced Analytics Section**
- All 80+ Decodo datapoints visualized
- Real engagement metrics from actual posts
- Demographics charts (when user has access)
- Content performance based on actual post data

### **Campaign Section (NEW!)**
- Create and manage campaigns
- Add profiles to campaigns for tracking
- Compare profiles within campaigns
- Track competitor performance over time

---

*This document reflects the current production-ready state of the backend after comprehensive audit and cleanup. All endpoints listed are fully functional with real Decodo integration.*