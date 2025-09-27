# Following - Instagram Analytics Platform

## Project Overview
Professional Instagram Analytics Platform with AI-powered insights, SmartProxy integration, and comprehensive social media analytics. Built with Next.js 14, TypeScript, Tailwind CSS, and modern React patterns.

## Architecture

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with OKLCH color system
- **UI Components**: Shadcn/ui + Custom components
- **State Management**: 
  - Zustand for global client state
  - React Query for server state management
  - Context API for auth and notifications
- **Icons**: Lucide React
- **Charts**: Recharts
- **Fonts**: Inter (sans) + AED (custom local font)

### Key Directories
```
frontend/src/
├── app/                    # Next.js App Router pages
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui base components
│   ├── brand/            # Brand-specific components
│   ├── chart-*/          # Chart components
│   └── providers/        # Context providers
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── stores/               # Zustand stores
├── utils/                # Utility functions
└── fonts/                # Local font files
```

## Design System

### Color System (OKLCH-based)
Our design system uses modern OKLCH color space for better perceptual uniformity and HDR display support:

#### Light Mode
- **Primary**: `oklch(0.45 0.224 264)` (#5100f3)
- **Background**: `oklch(1 0 0)` (white)
- **Card**: `oklch(0.98 0 0)` (near-white)
- **Muted**: `oklch(0.96 0 0)`
- **Border**: `oklch(0.92 0 0)`

#### Dark Mode  
- **Primary**: `oklch(0.65 0.224 264)` (lighter purple)
- **Background**: `oklch(0.09 0 0)` (very dark)
- **Card**: `oklch(0.11 0 0)` (dark card)
- **Muted**: `oklch(0.14 0 0)`
- **Border**: `oklch(0.18 0 0)`

### Typography
- **Headings**: Inter font with tight letter spacing
- **Body**: Inter with normal spacing
- **Brand**: AED custom font for special branding elements
- **Responsive scaling**: Fluid typography with clamp() functions

### Shadows & Effects
- **Glass morphism**: backdrop-blur with subtle transparency
- **Elevation system**: 4-level shadow hierarchy
- **Smooth animations**: 200ms ease-out transitions
- **Hover states**: Scale and color transitions

## State Management Architecture

### Global User Store (Zustand)
**File**: `src/stores/userStore.ts`

Single source of truth for user data, subscription, and team information:
- **Single API Call**: `/api/v1/auth/dashboard`
- **TypeScript Interfaces**: User, Subscription, Team, DashboardStats
- **Computed Selectors**: Subscription helpers, remaining credits
- **Optimistic Updates**: Local state updates with server sync

### Server State (React Query)
**File**: `src/hooks/useDashboardData.ts`

Centralized dashboard data fetching with intelligent caching:
- **Request Deduplication**: Prevents duplicate API calls
- **5-minute Stale Time**: Reduces unnecessary requests
- **Background Refetch**: Keeps data fresh when tab is active
- **Error Handling**: Graceful fallbacks and retry logic

### Request Caching System
**File**: `src/utils/requestCache.ts`

Promise-based caching to eliminate duplicate requests:
- **TTL-based Cache**: 5-minute default expiration
- **Promise Deduplication**: Same requests return same promise
- **Memory Management**: Automatic cleanup of expired entries

## Component Architecture

### Dashboard Components
- **BrandDashboardContent**: Main dashboard with sequential loading animations
- **ChartProfileAnalysisV2**: Dynamic subscription limits with real-time data
- **ChartRemainingCreditsV2**: Credits display with billing cycle reset timer
- **MetricCard**: Reusable analytics card component
- **SmartDiscovery**: AI-powered creator discovery interface

### UI Components (Shadcn/ui based)
- **Card, Button, Input**: Base UI primitives
- **Avatar**: User profile images with fallback initials
- **Skeleton**: Loading state components
- **Toaster**: Notification system with Sonner

### Provider Hierarchy
```typescript
QueryProvider
  ThemeProvider (light/dark mode)
    AuthProvider (legacy auth context)
      EnhancedAuthProvider (enhanced auth features)
        UserStoreProvider (bridges auth with Zustand)
          NotificationProvider (toast notifications)
            App Components
```

## Authentication & Authorization

### Multi-tier Architecture
- **AuthContext**: Basic authentication state
- **EnhancedAuthContext**: Role-based permissions and premium checks
- **UserStoreProvider**: Bridges auth with global Zustand store

### Subscription Tiers
Dynamic subscription system with tier-based limits:
- **Free**: 5 profile unlocks/month
- **Standard**: 500 profile unlocks/month  
- **Premium**: 2000 profile unlocks/month
- **Enterprise**: 2000 profile unlocks/month + team features

### Role System
- **free, standard, premium, enterprise**: Subscription-based roles
- **admin, superadmin**: Administrative roles with elevated permissions

## API Integration

### Dashboard API Structure
Single endpoint providing complete user context:
```typescript
GET /api/v1/auth/dashboard
Response: {
  user: User,           // User profile and settings
  subscription: Subscription, // Limits and usage
  team: Team,          // Team subscription info
  stats: DashboardStats // Usage statistics
}
```

### Error Handling
- **API Interceptor**: Automatic token refresh and error handling
- **Graceful Degradation**: UI remains functional during API failures
- **User Feedback**: Toast notifications for success/error states

### Base URL Configuration
- **Production**: `https://api.analyticsfollowing.com`
- **Development**: `http://localhost:8000`

### ⚠️ CRITICAL ROUTING ISSUE
**ISSUE**: Frontend was calling `/api/v1/api/v1/auth/login` (duplicate prefix)
**SOLUTION**: Frontend must call `/api/v1/auth/login` (single prefix)

## Definitive API Endpoints

### 🚀 Core Creator Search Endpoints (Primary Integration)

#### **GET /api/v1/search/creator/{username}**
- **PURPOSE**: Main creator search endpoint with complete 5-section analytics
- **AUTHENTICATION**: Required (Bearer token)
- **CREDITS**: Charges based on unlock status
- **RESPONSE**: Complete creator analytics with AI insights

#### **GET /api/v1/instagram/profile/{username}**
- **PURPOSE**: Instagram profile analysis with AI insights
- **AUTHENTICATION**: Required
- **CREDITS**: Uses credit gate for influencer unlock

#### **GET /api/v1/instagram/profile/{username}/posts**
- **PURPOSE**: Get paginated posts with AI analysis
- **AUTHENTICATION**: Required
- **QUERY PARAMS**: `limit`, `offset`

#### **GET /api/v1/instagram/profile/{username}/ai-status**
- **PURPOSE**: Check AI analysis status for a profile
- **AUTHENTICATION**: Required

### 🔐 Authentication & User Management

#### **POST /api/v1/auth/register**
- **BODY**: `{ email, password, full_name }`
- **RESPONSE**: User data + JWT tokens

#### **POST /api/v1/auth/login**
- **BODY**: `{ email, password }`
- **RESPONSE**: JWT tokens + user data

#### **POST /api/v1/auth/logout**
- **AUTHENTICATION**: Required

#### **POST /api/v1/auth/refresh**
- **BODY**: `{ refresh_token }`
- **RESPONSE**: New access token

#### **GET /api/v1/auth/me**
- **AUTHENTICATION**: Required
- **RESPONSE**: Complete user data

#### **GET /api/v1/auth/dashboard**
- **AUTHENTICATION**: Required
- **RESPONSE**: Credits, usage, subscription info

#### **GET /api/v1/auth/unlocked-profiles**
- **AUTHENTICATION**: Required
- **RESPONSE**: List of unlocked Instagram profiles

#### **GET /api/v1/auth/search-history**
- **AUTHENTICATION**: Required
- **RESPONSE**: Recent searches with timestamps

### 💳 Credits & Billing System

#### **GET /api/v1/credits/balance**
- **AUTHENTICATION**: Required
- **RESPONSE**: Current credits + billing cycle info

#### **GET /api/v1/credits/total-plan-credits**
- **AUTHENTICATION**: Required
- **RESPONSE**: Monthly allowances by action type

#### **GET /api/v1/credits/wallet/summary**
- **AUTHENTICATION**: Required
- **RESPONSE**: Balance, transactions, billing details

#### **GET /api/v1/credits/dashboard**
- **AUTHENTICATION**: Required
- **RESPONSE**: Complete credit analytics

#### **GET /api/v1/credits/transactions**
- **AUTHENTICATION**: Required
- **QUERY PARAMS**: `limit`, `offset`, `action_type`

#### **GET /api/v1/credits/usage/monthly**
- **AUTHENTICATION**: Required
- **RESPONSE**: Usage by action type

#### **GET /api/v1/credits/can-perform/{action_type}**
- **AUTHENTICATION**: Required
- **RESPONSE**: Permission + cost info

#### **GET /api/v1/credits/pricing**
- **AUTHENTICATION**: Required
- **RESPONSE**: Action costs + free allowances

#### **POST /api/v1/credits/top-up/estimate**
- **AUTHENTICATION**: Required
- **BODY**: `{ credits_needed }`

### 👥 Team Management

#### **GET /api/v1/teams/members**
- **AUTHENTICATION**: Required
- **RESPONSE**: List of team members with roles

#### **POST /api/v1/teams/invite**
- **AUTHENTICATION**: Required (Admin only)
- **BODY**: `{ email, role }`

#### **GET /api/v1/teams/invitations**
- **AUTHENTICATION**: Required

#### **PUT /api/v1/teams/invitations/{token}/accept**
- **AUTHENTICATION**: Required

#### **DELETE /api/v1/teams/members/{user_id}**
- **AUTHENTICATION**: Required (Admin only)

#### **GET /api/v1/teams/overview**
- **AUTHENTICATION**: Required
- **RESPONSE**: Team stats, usage, members

### 📋 User Lists & Organization

#### **GET /api/v1/lists**
- **AUTHENTICATION**: Required
- **RESPONSE**: List of saved creator lists

#### **POST /api/v1/lists**
- **AUTHENTICATION**: Required
- **BODY**: `{ name, description, template_id? }`

#### **GET /api/v1/lists/{list_id}**
- **AUTHENTICATION**: Required
- **RESPONSE**: List with items and metadata

#### **PUT /api/v1/lists/{list_id}**
- **AUTHENTICATION**: Required
- **BODY**: `{ name?, description? }`

#### **DELETE /api/v1/lists/{list_id}**
- **AUTHENTICATION**: Required

#### **POST /api/v1/lists/{list_id}/items**
- **AUTHENTICATION**: Required
- **BODY**: `{ profile_id, notes? }`

#### **DELETE /api/v1/lists/{list_id}/items/{item_id}**
- **AUTHENTICATION**: Required

#### **POST /api/v1/lists/{list_id}/duplicate**
- **AUTHENTICATION**: Required

#### **GET /api/v1/lists/templates**
- **RESPONSE**: Available list templates

#### **GET /api/v1/lists/available-profiles**
- **AUTHENTICATION**: Required
- **RESPONSE**: Unlocked profiles for list creation

### 💰 Stripe Subscription Management

#### **POST /api/v1/stripe/create-customer**
- **AUTHENTICATION**: Required
- **BODY**: User payment details

#### **GET /api/v1/stripe/portal-url**
- **AUTHENTICATION**: Required
- **RESPONSE**: Stripe portal redirect URL

#### **GET /api/v1/stripe/status**
- **AUTHENTICATION**: Required
- **RESPONSE**: Current subscription details

#### **GET /api/v1/stripe/config**
- **RESPONSE**: Public Stripe keys

#### **POST /api/v1/stripe/webhooks/stripe**
- **AUTHENTICATION**: Stripe signature
- **BODY**: Stripe webhook payload

### 🎯 Settings & Preferences

#### **GET /api/v1/settings/user**
- **AUTHENTICATION**: Required
- **RESPONSE**: User preferences

#### **PUT /api/v1/settings/user**
- **AUTHENTICATION**: Required
- **BODY**: Settings object

### 🔧 System Health & Monitoring

#### **GET /api/health**
- **RESPONSE**: Overall system status

#### **GET /api/metrics**
- **RESPONSE**: Performance data

#### **GET /api/database/schema-check**
- **RESPONSE**: Schema health status

#### **GET /api/v1/status/comprehensive**
- **AUTHENTICATION**: Required
- **RESPONSE**: Detailed system diagnostics

### 📊 Frontend Integration Guidelines

#### ✅ Essential Endpoints for MVP
1. **Authentication**: `/api/v1/auth/login`, `/api/v1/auth/me`
2. **Creator Search**: `/api/v1/search/creator/{username}`
3. **Credits**: `/api/v1/credits/balance`, `/api/v1/credits/dashboard`
4. **User Lists**: `/api/v1/lists`, `/api/v1/lists/{list_id}`

#### ⚠️ Error Handling Standards
- **401**: Token expired → Redirect to login
- **403**: Insufficient credits → Show top-up options
- **429**: Rate limited → Show retry message
- **500**: Server error → Show error page

#### 💡 Performance Optimization Rules
- Use `/api/v1/search/creator/{username}` for complete analytics
- Cache user data from `/api/v1/auth/me`
- Implement progressive loading for large lists
- Use pagination for transaction history

### 🚨 Deprecated Endpoints (DO NOT USE)
- `/api/v1/api/v1/simple/creator/system/stats` (duplicate prefix)
- `/api/v1/api/v1/simple/creator/unlocked` (duplicate prefix)

## Performance Optimizations

### API Call Reduction
- **Before**: 15+ duplicate calls on login
- **After**: 4-5 coordinated calls with caching
- **Method**: Request deduplication + React Query optimization

### Loading States
- **Sequential Animations**: Staggered component loading for smooth UX
- **Skeleton Components**: Maintain layout during loading
- **Optimistic Updates**: Immediate UI feedback with server sync

### Bundle Optimization
- **Dynamic Imports**: Code splitting for route-based chunks
- **Tree Shaking**: Eliminate unused code
- **Font Optimization**: Local fonts with display swap

## Development Workflow

### Code Standards
- **TypeScript**: Strict mode with comprehensive type safety
- **ESLint**: Code quality and consistency rules
- **Prettier**: Automated code formatting
- **Component Patterns**: Consistent prop interfaces and error boundaries

### Development Server Policy
- **IMPORTANT**: Never start development servers (`npm run dev`, `npm start`, etc.) for testing purposes
- The user will always test the application themselves
- Focus on code fixes and provide clear instructions on what was changed
- Only make code changes and explain the fixes

### Testing Strategy
- **Component Testing**: Jest + React Testing Library
- **E2E Testing**: Playwright for critical user flows
- **Type Safety**: TypeScript compilation as first-line testing

### Build & Deployment
- **Next.js Build**: Static generation + server-side rendering
- **Asset Optimization**: Image optimization and compression
- **CDN Integration**: Optimized asset delivery

## Recent Major Changes

### API Call Optimization (Performance Fix)
- Eliminated 15+ duplicate API calls on login
- Implemented centralized dashboard data fetching
- Added request deduplication cache system
- Optimized React Query settings for better caching

### New Dashboard API Integration
- Migrated to single source of truth API structure
- Implemented global Zustand store for user state
- Created V2 components using new state management
- Eliminated fallback logic and hardcoded values

### Design System Implementation
- Comprehensive OKLCH-based color system for light/dark modes
- Enhanced typography with fluid scaling
- Modern shadow system with glass morphism effects
- Accessibility improvements with proper contrast ratios

## Current Focus Areas

1. **Design System Rollout**: Updating all components to use new OKLCH variables
2. **Dark Mode Compatibility**: Ensuring consistent theming across all pages
3. **Performance Monitoring**: Tracking API call efficiency and load times
4. **User Experience**: Sequential loading animations and micro-interactions

## Known Technical Debt

1. **Legacy Auth Migration**: Gradual migration from multiple auth contexts to unified store
2. **Component Consistency**: Some older components still use individual API calls
3. **Type Definitions**: Some components have loose typing that could be improved
4. **Testing Coverage**: E2E tests need expansion for new dashboard features

## Future Roadmap

1. **Mobile Optimization**: Enhanced responsive design for mobile analytics
2. **Real-time Updates**: WebSocket integration for live data updates
3. **Advanced Analytics**: More sophisticated chart components and data visualization
4. **Team Features**: Enhanced collaboration tools for enterprise users