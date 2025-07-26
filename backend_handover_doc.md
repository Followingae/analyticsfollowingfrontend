# Backend Handover Document
## Analytics Following Backend API

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [API Architecture](#api-architecture)
4. [Authentication & Configuration](#authentication--configuration)
5. [API Endpoints](#api-endpoints)
6. [Response Formats](#response-formats)
7. [Error Handling](#error-handling)
8. [Code Examples](#code-examples)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## 🚀 Project Overview

The **Analytics Following Backend** is a FastAPI-based REST API that provides comprehensive Instagram profile analysis. It offers two scraping methods:

- **SmartProxy Integration**: Professional API service (requires subscription)
- **In-House Scraper**: Custom web scraping solution (free, built-in backup)

### Key Features
- ✅ Instagram profile metrics and analytics
- ✅ Engagement rate calculations
- ✅ Growth recommendations
- ✅ Content strategy insights
- ✅ Hashtag analysis
- ✅ Dual scraping methods for reliability
- ✅ Comprehensive error handling
- ✅ Rate limiting and caching

---

## ⚡ Quick Start

### Backend Server
```bash
# Clone repository
git clone https://github.com/umairali15/analyticsfollowingbackend.git
cd analyticsfollowingbackend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your SmartProxy credentials (optional)

# Start server
python main.py
```

**Server runs on:** `http://localhost:8000`  
**API Documentation:** `http://localhost:8000/docs`

### Frontend Integration
```javascript
// Example: Fetch Instagram profile analysis
const response = await fetch('http://localhost:8000/api/v1/inhouse/instagram/profile/shaq');
const analysis = await response.json();
console.log(analysis.profile.followers); // 28,500,000
```

---

## 🏗 API Architecture

```
Backend Structure:
├── SmartProxy Integration (Professional)
│   ├── /api/v1/instagram/profile/{username}
│   ├── /api/v1/instagram/profile/{username}/basic
│   └── /api/v1/test-connection
│
└── In-House Scraper (Backup)
    ├── /api/v1/inhouse/instagram/profile/{username}
    ├── /api/v1/inhouse/instagram/profile/{username}/basic
    └── /api/v1/inhouse/test
```

### Recommended Usage
- **Development/Testing**: Use in-house scraper (`/inhouse/*`)
- **Production**: Use SmartProxy integration (requires subscription)
- **Fallback**: Automatically switch between methods if one fails

---

## 🔐 Authentication & Configuration

### Environment Variables
Create `.env` file in project root:

```env
# SmartProxy credentials (optional - only needed for SmartProxy endpoints)
SMARTPROXY_USERNAME="your_smartproxy_username"
SMARTPROXY_PASSWORD="your_smartproxy_password"

# API Configuration
API_HOST="0.0.0.0"
API_PORT=8000
DEBUG=true

# Rate Limiting
MAX_REQUESTS_PER_HOUR=1000
MAX_CONCURRENT_REQUESTS=10
```

### No Authentication Required
- ✅ The API currently has **no authentication** for simplicity
- ✅ Ready to add JWT/API keys when needed
- ✅ CORS enabled for frontend integration

---

## 📡 API Endpoints

### 🏠 In-House Scraper (Recommended for Frontend)

#### 1. **Full Profile Analysis**
```http
GET /api/v1/inhouse/instagram/profile/{username}
```

**Parameters:**
- `username` (path): Instagram username without @
- `detailed` (query, optional): boolean (default: true)

**Example:**
```bash
curl "http://localhost:8000/api/v1/inhouse/instagram/profile/shaq?detailed=true"
```

#### 2. **Basic Profile Information**
```http
GET /api/v1/inhouse/instagram/profile/{username}/basic
```

**Example:**
```bash
curl "http://localhost:8000/api/v1/inhouse/instagram/profile/shaq/basic"
```

#### 3. **Test Scraper Functionality**
```http
GET /api/v1/inhouse/test
```

### 🔧 SmartProxy Integration (Optional)

#### 1. **SmartProxy Profile Analysis**
```http
GET /api/v1/instagram/profile/{username}
```

#### 2. **SmartProxy Basic Profile**
```http
GET /api/v1/instagram/profile/{username}/basic
```

#### 3. **Test SmartProxy Connection**
```http
GET /api/v1/test-connection
```

### 📊 General Endpoints

#### **Health Check**
```http
GET /api/v1/health
```

Returns API status and configuration.

---

## 📄 Response Formats

### Profile Analysis Response
```json
{
  "profile": {
    "username": "shaq",
    "full_name": "Shaq",
    "biography": "Basketball legend, entrepreneur...",
    "followers": 28500000,
    "following": 1835,
    "posts_count": 15234,
    "is_verified": true,
    "is_private": false,
    "profile_pic_url": "https://...",
    "external_url": "https://...",
    "engagement_rate": 2.3,
    "avg_likes": 45000,
    "avg_comments": 1200,
    "avg_engagement": 46200,
    "follower_growth_rate": null,
    "content_quality_score": null,
    "influence_score": 8.7
  },
  "recent_posts": [],
  "hashtag_analysis": [],
  "content_strategy": {
    "best_posting_hour": 12,
    "content_type_distribution": {
      "photo": 0.7,
      "video": 0.3
    },
    "recommended_content_type": "photo",
    "posting_frequency_per_day": 1.2,
    "avg_caption_length": 150
  },
  "best_posting_times": ["12:00", "18:00", "21:00"],
  "audience_insights": {},
  "growth_recommendations": [
    "Strong follower base! Focus on maintaining engagement quality",
    "Consider creating more video content for higher engagement"
  ],
  "analysis_timestamp": "2025-07-26T12:41:43.362673",
  "data_quality_score": 0.8
}
```

### Basic Profile Response
```json
{
  "profile": {
    "username": "shaq",
    "full_name": "Shaq", 
    "followers": 28500000,
    "following": 1835,
    "posts_count": 15234,
    "is_verified": true,
    "engagement_rate": 2.3
  }
}
```

### Test Response
```json
{
  "status": "success",
  "message": "In-house scraper working",
  "data_keys": ["username", "followers", "following"],
  "has_username": true,
  "has_followers": true
}
```

---

## ⚠️ Error Handling

### Standard Error Response
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes
- **200**: Success
- **400**: Bad Request (invalid username, scraping failed)
- **404**: Not Found (endpoint doesn't exist)
- **500**: Internal Server Error
- **429**: Too Many Requests (rate limiting)

### Error Types
```json
// Profile not found
{
  "detail": "Instagram profile 'invaliduser' not found or is private"
}

// Scraping failed
{
  "detail": "Profile analysis failed: Unable to fetch profile data"
}

// Rate limiting
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

---

## 💻 Code Examples

### React/JavaScript Integration

#### Basic Profile Fetch
```javascript
async function fetchInstagramProfile(username) {
  try {
    const response = await fetch(
      `http://localhost:8000/api/v1/inhouse/instagram/profile/${username}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

// Usage
const analysis = await fetchInstagramProfile('shaq');
console.log(`${analysis.profile.username} has ${analysis.profile.followers} followers`);
```

#### React Component Example
```jsx
import React, { useState, useEffect } from 'react';

function ProfileAnalyzer({ username }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/v1/inhouse/instagram/profile/${username}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchData();
    }
  }, [username]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!analysis) return <div>No data</div>;

  return (
    <div className="profile-analysis">
      <h2>{analysis.profile.full_name} (@{analysis.profile.username})</h2>
      <div className="metrics">
        <div>Followers: {analysis.profile.followers.toLocaleString()}</div>
        <div>Engagement Rate: {analysis.profile.engagement_rate}%</div>
        <div>Influence Score: {analysis.profile.influence_score}/10</div>
      </div>
      <div className="recommendations">
        <h3>Growth Recommendations:</h3>
        <ul>
          {analysis.growth_recommendations.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

#### Error Handling with Fallback
```javascript
async function fetchProfileWithFallback(username) {
  // Try in-house scraper first
  try {
    const response = await fetch(
      `http://localhost:8000/api/v1/inhouse/instagram/profile/${username}`
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('In-house scraper failed, trying SmartProxy:', error);
  }

  // Fallback to SmartProxy
  try {
    const response = await fetch(
      `http://localhost:8000/api/v1/instagram/profile/${username}`
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Both scrapers failed:', error);
    throw new Error('Unable to fetch profile data');
  }
}
```

### Python Client Example
```python
import requests
import asyncio
import aiohttp

class AnalyticsClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
    
    async def get_profile_analysis(self, username: str) -> dict:
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/api/v1/inhouse/instagram/profile/{username}"
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"API error: {response.status}")

# Usage
client = AnalyticsClient()
analysis = await client.get_profile_analysis("shaq")
```

---

## 🧪 Testing

### Manual Testing
```bash
# Test server health
curl http://localhost:8000/api/v1/health

# Test in-house scraper
curl http://localhost:8000/api/v1/inhouse/test

# Test profile analysis
curl http://localhost:8000/api/v1/inhouse/instagram/profile/instagram

# Test with query parameters
curl "http://localhost:8000/api/v1/inhouse/instagram/profile/shaq?detailed=true"
```

### Frontend Testing
1. **Open API Documentation**: `http://localhost:8000/docs`
2. **Interactive Testing**: Use the Swagger UI to test endpoints
3. **Browser Testing**: Direct API calls in browser console

### Test Accounts
- `instagram` - Instagram official account (reliable for testing)
- `shaq` - Large verified account
- `test_account_that_doesnt_exist` - Test error handling

---

## 🚀 Deployment

### Development
```bash
# Local development
python main.py
# Server: http://localhost:8000
```

### Production Considerations
1. **Environment Variables**: Set production values in `.env`
2. **CORS Configuration**: Update allowed origins for production domain
3. **Rate Limiting**: Adjust limits based on expected traffic
4. **Logging**: Configure log levels and file rotation
5. **Process Management**: Use PM2, supervisor, or similar
6. **Reverse Proxy**: Use Nginx for production deployment

### Docker Deployment (Optional)
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Module Not Found Errors**
```bash
# Solution: Install missing dependencies
pip install -r requirements.txt
```

#### 2. **Profile Not Found**
```json
{"detail": "Instagram profile 'username' not found or is private"}
```
- **Cause**: Username doesn't exist or profile is private
- **Solution**: Verify username exists and is public

#### 3. **Request Timeout**
```json
{"detail": "Profile analysis failed: Request timeout"}
```
- **Cause**: Instagram is blocking requests or slow response
- **Solution**: Try again later or use different endpoint

#### 4. **Rate Limiting**
```json
{"detail": "Rate limit exceeded"}
```
- **Cause**: Too many requests in short time
- **Solution**: Implement client-side rate limiting

#### 5. **CORS Errors**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy
```
- **Solution**: CORS is already configured, check if server is running

### Debug Mode
```bash
# Run with debug logging
DEBUG=true python main.py
```

### Health Checks
```bash
# Check if server is responding
curl http://localhost:8000/api/v1/health

# Test scraper functionality
curl http://localhost:8000/api/v1/inhouse/test
```

---

## 📞 Support & Contact

### Repository
- **GitHub**: https://github.com/umairali15/analyticsfollowingbackend.git
- **Issues**: Create GitHub issues for bugs/features

### Development Team
- **Backend Developer**: [Your Contact Info]
- **API Documentation**: Available at `/docs` endpoint
- **Code Review**: Check GitHub commits and pull requests

### Key Files
- `main.py` - FastAPI application entry point
- `app/api/routes.py` - API endpoint definitions  
- `app/scrapers/inhouse_scraper.py` - In-house scraping logic
- `app/models/instagram.py` - Data models and schemas
- `requirements.txt` - Python dependencies
- `.env.example` - Environment configuration template

---

## 📚 Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **API Testing**: Use Postman or Insomnia for advanced testing
- **Rate Limiting**: Consider implementing client-side caching
- **Error Monitoring**: Add Sentry or similar for production error tracking

---

*Last Updated: July 26, 2025*  
*Backend Version: 1.0.0*  
*API Version: v1*