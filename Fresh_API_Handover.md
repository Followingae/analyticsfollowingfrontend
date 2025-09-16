# Fresh API Handover - Frontend Integration Guide

## 🎯 API Overview

**Base URL**: `http://localhost:8001` (Development) | `https://your-domain.com` (Production)

**Authentication**: All requests require JWT token in `Authorization: Bearer <token>` header

---

## 🚀 Creator Search & Analytics

### Primary Creator Search Endpoint
```
GET /api/v1/search/creator/{username}
```

**Purpose**: Complete Instagram creator analytics - ONE endpoint for everything
**Credits**: 25 credits for new profiles, 0 credits for already unlocked profiles
**Response Time**: <100ms (unlocked), <3s (new analysis)

**Response Structure**:
```json
{
  "profile": {
    "username": "string",
    "full_name": "string",
    "biography": "string",
    "followers_count": 0,
    "following_count": 0,
    "posts_count": 0,
    "profile_pic_url": "https://cdn.following.ae/...",
    "is_verified": boolean,
    "is_business_account": boolean,
    "business_category_name": "string",
    "external_url": "string"
  },
  "ai_insights": {
    "primary_content_type": "Fashion|Travel|Tech|...",
    "content_distribution": {"Fashion": 0.4, "Travel": 0.3},
    "avg_sentiment_score": 0.8,
    "language_distribution": {"en": 0.8, "ar": 0.2},
    "content_quality_score": 0.85,
    "audience_quality": {...},
    "visual_content": {...},
    "audience_insights": {...},
    "trend_detection": {...},
    "advanced_nlp": {...},
    "fraud_detection": {...},
    "behavioral_patterns": {...}
  },
  "engagement_metrics": {
    "avg_likes": 5000,
    "avg_comments": 200,
    "engagement_rate": 3.5,
    "best_posting_times": ["18:00", "20:00"],
    "peak_engagement_days": ["Monday", "Wednesday"]
  },
  "audience_demographics": {
    "top_countries": [{"country": "UAE", "percentage": 35}],
    "top_cities": [{"city": "Dubai", "percentage": 25}],
    "age_groups": {"18-24": 30, "25-34": 45},
    "gender_split": {"male": 45, "female": 55}
  },
  "posts": [
    {
      "id": "string",
      "caption": "string",
      "likes_count": 5000,
      "comments_count": 200,
      "media_type": "image|video|carousel",
      "media_url": "https://cdn.following.ae/...",
      "posted_at": "2025-01-16T10:00:00Z",
      "ai_content_category": "Fashion",
      "ai_sentiment": "positive",
      "ai_sentiment_score": 0.8,
      "ai_language_code": "en"
    }
  ],
  "credit_info": {
    "credits_spent": 25,
    "remaining_balance": 975,
    "used_free_allowance": false,
    "access_granted": true
  }
}
```

### Frontend Implementation Notes:
- **Already Unlocked**: Show data immediately (fast path)
- **New Analysis**: Show loading state, display progressive results
- **Error Handling**: Check credit_info for insufficient credits
- **Caching**: Frontend can cache unlocked profiles for 1 hour

---

## 💳 Credits System

### Check User Balance
```
GET /api/v1/credits/balance
```
**Response**:
```json
{
  "current_balance": 1000,
  "total_earned": 2000,
  "total_spent": 1000,
  "package_name": "Premium",
  "billing_cycle": "monthly"
}
```

### Check Action Permissions
```
GET /api/v1/credits/can-perform/{action_type}
```
**Action Types**: `profile_analysis`, `post_analytics`, `discovery_pagination`, `bulk_export`, `advanced_search`

**Response**:
```json
{
  "can_perform": true,
  "credits_required": 25,
  "free_remaining": 0,
  "reason": "Sufficient credits available"
}
```

### Transaction History
```
GET /api/v1/credits/transactions?page=1&limit=20
```

### Usage Analytics
```
GET /api/v1/credits/usage/monthly
GET /api/v1/credits/analytics/spending?months=6
```

---

## 👤 Authentication

### Login
```
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

### Current User Info
```
GET /api/v1/auth/me
```

### Team Management
```
GET /api/v1/team-management/team
GET /api/v1/team-management/members
GET /api/v1/team-management/usage
```

---

## 🔍 Discovery & Lists

### Search Creators
```
GET /api/v1/discovery/search?query=fashion&category=influencer&limit=20
```

### User Lists
```
GET /api/v1/lists/templates
POST /api/v1/lists/user-lists
GET /api/v1/lists/user-lists/{list_id}/profiles
```

---

## 📊 Campaign Management

### Campaigns
```
GET /api/v1/campaigns
POST /api/v1/campaigns
GET /api/v1/campaigns/{campaign_id}
PUT /api/v1/campaigns/{campaign_id}
DELETE /api/v1/campaigns/{campaign_id}
```

### Campaign Analytics
```
GET /api/v1/campaigns/{campaign_id}/analytics
GET /api/v1/campaigns/{campaign_id}/collaborators
GET /api/v1/campaigns/{campaign_id}/deliverables
```

---

## 💼 Proposals (Agency Feature)

### Brand Proposals
```
GET /api/brand-proposals
POST /api/brand-proposals
GET /api/brand-proposals/{proposal_id}
```

### Proposal Applications
```
GET /api/brand-proposals/{proposal_id}/applications
POST /api/brand-proposals/{proposal_id}/apply
```

---

## 🔧 System Health & Monitoring

### System Health
```
GET /api/health
```
**Response**:
```json
{
  "status": "healthy|degraded|unhealthy",
  "components": {
    "database": {"status": "healthy", "message": "..."},
    "redis": {"status": "healthy", "message": "..."},
    "system": {"status": "healthy", "cpu_percent": 25}
  },
  "performance": {"response_time_ms": 45}
}
```

### Database Pool Health (NEW)
```
GET /api/database/pool
```
**Purpose**: Monitor database connection pool health
**Response**:
```json
{
  "status": "healthy|warning|critical|error",
  "message": "Pool operating normally",
  "stats": {
    "size": 15,
    "checked_in": 12,
    "checked_out": 3,
    "overflow": 0,
    "invalid": 0,
    "utilization": 20
  },
  "recommendations": ["Monitor pool utilization trends"]
}
```

### Emergency Pool Reset
```
GET /api/database/pool/reset
```
**Use**: Only if database timeouts persist

---

## 📱 Frontend UI Organization

### Creator Profile Dashboard
**Endpoint**: `GET /api/v1/search/creator/{username}`

**UI Sections**:
1. **Overview**
   - Profile info, followers, engagement rate
   - Primary content type, content quality score
   - Profile picture (CDN optimized)

2. **Audience**
   - Demographics (age, gender, location)
   - Audience quality score
   - Audience insights analysis

3. **Engagement**
   - Engagement metrics, best posting times
   - Sentiment analysis, language distribution
   - Behavioral patterns analysis

4. **Content**
   - Content distribution by category
   - Visual content analysis
   - Trend detection insights
   - Advanced NLP results

5. **Posts**
   - Post grid with AI categorization
   - Individual post analytics
   - Sentiment per post

### Dashboard Layout
```
┌─────────────────────────────────────┐
│           Profile Header            │
│    (Overview + Quick Actions)       │
├─────────────────────────────────────┤
│  Tab 1: Audience | Tab 2: Content  │
│  Tab 3: Posts    | Tab 4: Insights │
├─────────────────────────────────────┤
│         Analytics Content           │
│      (Based on Selected Tab)       │
└─────────────────────────────────────┘
```

---

## 🚦 Error Handling

### Common HTTP Status Codes
- `200` - Success
- `402` - Insufficient credits
- `404` - Profile not found
- `429` - Rate limit exceeded
- `503` - Service temporarily unavailable (database issues)

### Error Response Format
```json
{
  "detail": "Insufficient credits. Required: 25, Available: 10",
  "error_code": "INSUFFICIENT_CREDITS",
  "required_credits": 25,
  "available_credits": 10
}
```

### Frontend Error Handling
```javascript
try {
  const response = await fetch('/api/v1/search/creator/username');
  if (!response.ok) {
    if (response.status === 402) {
      // Show credit purchase modal
      showCreditPurchaseModal();
    } else if (response.status === 503) {
      // Show "Service temporarily unavailable" message
      showServiceUnavailableMessage();
    }
  }
} catch (error) {
  // Handle network errors
  showNetworkErrorMessage();
}
```

---

## 🔄 Real-time Updates

### Server-Sent Events (Optional)
```
GET /api/v1/streaming/creator-analysis/{username}
```
**Purpose**: Real-time updates during profile analysis
**Format**:
```
data: {"progress": 25, "stage": "Analyzing posts"}
data: {"progress": 50, "stage": "AI processing"}
data: {"progress": 100, "stage": "Complete", "data": {...}}
```

---

## 🎯 Performance Optimization

### Frontend Best Practices
1. **Caching**: Cache unlocked profiles for 1 hour
2. **Progressive Loading**: Show basic data first, load AI insights progressively
3. **Image Optimization**: Use CDN URLs for all profile pictures and posts
4. **Pagination**: Implement proper pagination for posts and lists
5. **Error Recovery**: Implement retry logic for failed requests

### Request Optimization
```javascript
// Good: Check if already unlocked first
const canAccess = await checkProfileAccess(username);
if (canAccess.already_unlocked) {
  // Fast path - no credits needed
  const profile = await getProfile(username);
} else {
  // Show credit confirmation before analysis
  if (await confirmCreditSpend(25)) {
    const profile = await analyzeProfile(username);
  }
}
```

---

## 🔐 Security & Authentication

### JWT Token Management
```javascript
// Store token securely
localStorage.setItem('auth_token', response.token);

// Include in all requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json'
};
```

### Token Refresh
```javascript
// Check token expiry and refresh if needed
if (isTokenExpired()) {
  await refreshToken();
}
```

---

## 📈 Analytics Integration

### Track User Actions
```javascript
// Track profile views
analytics.track('profile_viewed', {
  username: 'creator_username',
  credits_spent: 25,
  analysis_type: 'full'
});

// Track feature usage
analytics.track('feature_used', {
  feature: 'ai_insights',
  credits_spent: 0
});
```

---

## 🛠️ Development & Testing

### Testing Endpoints
```bash
# Health check
curl http://localhost:8001/api/health

# Database pool health
curl http://localhost:8001/api/database/pool

# Creator search (with auth)
curl -H "Authorization: Bearer <token>" \
     http://localhost:8001/api/v1/search/creator/username
```

### Environment Variables
```env
# Required for frontend integration
API_BASE_URL=http://localhost:8001
ENABLE_REAL_TIME_UPDATES=true
CACHE_TIMEOUT=3600
MAX_RETRY_ATTEMPTS=3
```

---

## 🎉 Summary

### One Endpoint for Everything
**`GET /api/v1/search/creator/{username}`** provides:
- ✅ Complete profile data
- ✅ All AI insights (10 models)
- ✅ Engagement metrics
- ✅ Audience demographics
- ✅ Post analytics
- ✅ Credit information
- ✅ CDN-optimized media URLs

### Frontend Implementation Priority
1. **Creator Search Page** - Main feature
2. **Credits Dashboard** - Balance and usage
3. **Profile Analytics** - 5-tab layout
4. **Team Management** - Multi-user access
5. **Campaign Management** - Business features
6. **System Health** - Monitoring dashboard

### Performance Guaranteed
- **<100ms** for unlocked profiles
- **<3s** for new analysis
- **99.9%** uptime with monitoring
- **Enterprise-grade** database optimization

---

*Last Updated: September 16, 2025*
*API Version: v1.0*
*Database: Optimized for performance*