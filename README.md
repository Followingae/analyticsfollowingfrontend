# Following - Instagram Analytics Platform Frontend

A comprehensive Next.js frontend application for Instagram analytics with AI-powered insights, SmartProxy integration, and professional dashboard components.

## 🚀 Features

### ✅ Completed Features

1. **Profile Search & Analysis**
   - Real-time Instagram profile search
   - Enhanced search with username validation
   - SmartProxy and in-house scraper integration
   - Comprehensive profile metrics display
   - Batch analysis for multiple profiles

2. **Discovery Module**
   - Hashtag-based creator discovery
   - Advanced filtering by follower count and engagement
   - Trending niches showcase
   - Creator profile cards with key metrics

3. **Advanced Analytics Dashboard**
   - 9 specialized analytics modules:
     - Executive Summary Dashboard
     - AI Sentiment Analysis
     - Performance Analytics
     - Engagement Deep Dive
     - Content Strategy Intelligence
     - Audience Quality Analysis
     - Growth & Competitive Intelligence
     - Posts Performance Matrix
     - AI-Powered Optimization

4. **Hashtag Analysis**
   - Single hashtag deep-dive analysis
   - Hashtag opportunity discovery
   - Difficulty-based filtering
   - Pre-curated hashtag sets for different niches

5. **AI-Powered Sentiment Analysis**
   - Multi-dimensional sentiment scoring
   - Confidence level calculations
   - Weighted analysis across multiple factors
   - Actionable insights generation

## 🛠 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Chart.js, ApexCharts, Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks
- **API Integration**: Custom service layer for backend communication

## 📦 Project Structure

```
frontend/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx           # Main application page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── badge.tsx
│   │   └── tabs/             # Main application tabs
│   │       ├── ProfileSearchTab.tsx
│   │       ├── DiscoveryTab.tsx
│   │       ├── AnalyticsTab.tsx
│   │       └── HashtagsTab.tsx
│   ├── services/
│   │   └── api.ts            # Backend API service layer
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── lib/
│       └── utils.ts          # Utility functions
├── .env.local               # Environment variables
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── package.json           # Dependencies and scripts
```

## 🔧 Installation & Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Update .env.local with your backend URL
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## 🔗 Backend Integration

The frontend is designed to integrate with the Analytics Following Backend:

### API Endpoints Used

1. **Profile Analysis**
   - `GET /api/v1/inhouse/instagram/profile/{username}` - In-house scraper
   - `GET /api/v1/instagram/profile/{username}` - SmartProxy integration
   - `GET /api/v1/inhouse/instagram/profile/{username}/basic` - Basic profile data

2. **Discovery & Search**
   - `POST /api/v1/discovery/hashtags` - Hashtag-based discovery
   - `POST /api/v1/batch/analysis` - Batch profile analysis

3. **Analytics & Insights**
   - `GET /api/v1/hashtags/{hashtag}/analysis` - Hashtag analysis
   - `GET /api/v1/health` - Health check

### SmartProxy Integration Points

The frontend leverages SmartProxy through the backend for:
- Professional Instagram profile data
- High-quality engagement metrics
- Reliable content performance data
- Advanced analytics calculations

## 📊 Features Overview

### Profile Search Tab
- **Enhanced Search Interface**: Username validation and real-time feedback
- **Dual API Support**: SmartProxy (premium) and in-house scraper (backup)
- **Comprehensive Metrics**: Followers, engagement rate, influence score
- **Batch Analysis**: Compare up to 10 profiles simultaneously
- **Growth Recommendations**: AI-generated suggestions for profile improvement

### Discovery Tab
- **Hashtag Discovery**: Find creators using specific hashtags
- **Advanced Filters**: Follower count, engagement rate, niche filtering
- **Trending Niches**: Pre-curated trending categories
- **Creator Cards**: Visual profile summaries with key metrics

### Analytics Tab
- **9 Specialized Modules**: Comprehensive analytics dashboard
- **Executive Summary**: 6 KPI metrics with trend indicators
- **AI Sentiment Analysis**: Multi-dimensional sentiment scoring
- **Performance Analytics**: Detailed engagement and content metrics
- **Module Navigation**: Easy switching between different analysis views

### Hashtags Tab
- **Single Hashtag Analysis**: Deep-dive into hashtag performance
- **Opportunity Discovery**: Find high-opportunity, low-competition hashtags
- **Difficulty Filtering**: Easy, medium, hard categorization
- **Strategy Tips**: Best practices and recommendations
- **Quick Hashtag Sets**: Pre-curated combinations for different niches

## 🎨 Design System

### Color Palette
- **Primary**: Purple gradient (`#6C5FFC` to `#88a9ef`)
- **Accent Colors**: Blue, Green, Orange, Red for metrics
- **Status Colors**: Success, Warning, Error indicators
- **Neutral**: Gray scale for text and backgrounds

### Components
- **Cards**: Elevated design with shadow and rounded corners
- **Buttons**: Multiple variants (primary, secondary, outline, ghost)
- **Inputs**: Enhanced styling with validation feedback
- **Badges**: Status and category indicators
- **Tabs**: Clean navigation with icons and descriptions

## 📱 Responsive Design

The application is fully responsive with:
- **Mobile-first approach**: Optimized for mobile devices
- **Tablet optimization**: Adaptive layouts for medium screens
- **Desktop enhancement**: Full feature utilization on large screens
- **Grid systems**: CSS Grid and Flexbox for flexible layouts

## 🔒 Security & Performance

- **Image Optimization**: Next.js Image component with proper domain configuration
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: Progressive loading with skeleton screens
- **Caching**: Efficient API request caching and management

## 🚀 Getting Started

1. **Start the Backend**: Ensure the Analytics Following Backend is running on `http://localhost:8000`
2. **Configure Environment**: Update `.env.local` with correct API base URL
3. **Launch Frontend**: Run `npm run dev` and navigate to `http://localhost:3000`
4. **Explore Features**: Use the tab navigation to explore different modules

## 📈 Future Enhancements

- **Real-time Data**: WebSocket integration for live updates
- **Advanced Charts**: More sophisticated data visualizations
- **Export Features**: PDF/CSV export capabilities
- **User Authentication**: Login system and user management
- **Saved Analyses**: Bookmark and save favorite profiles
- **Comparison Tools**: Side-by-side profile comparisons

## 🤝 Contributing

This frontend application follows modern React/Next.js best practices:
- Component-based architecture
- TypeScript for type safety
- Modular CSS with Tailwind
- Reusable UI components with shadcn/ui
- Clean API service layer
- Comprehensive error handling

---

**Built with ❤️ using Next.js 15, TypeScript, and shadcn/ui**