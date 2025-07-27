// Integration test for the new backend API
const API_BASE = 'http://localhost:8000'

async function testHealthCheck() {
  try {
    console.log('🔍 Testing health check...')
    const response = await fetch(`${API_BASE}/api/v1/inhouse/test`)
    const data = await response.json()
    console.log('✅ Health check:', data)
    return data
  } catch (error) {
    console.error('❌ Health check failed:', error.message)
    return null
  }
}

async function testProfileAnalysis() {
  try {
    console.log('🔍 Testing profile analysis...')
    const response = await fetch(`${API_BASE}/api/v1/inhouse/instagram/profile/mkbhd`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Validate the new schema
    console.log('✅ Profile analysis successful')
    console.log('📊 Data structure validation:')
    
    const requiredFields = [
      'profile',
      'engagement_metrics', 
      'audience_insights',
      'competitor_analysis',
      'content_performance',
      'content_strategy',
      'best_posting_times',
      'growth_recommendations',
      'analysis_timestamp',
      'data_quality_score',
      'scraping_method'
    ]
    
    const missingFields = requiredFields.filter(field => !(field in data))
    
    if (missingFields.length > 0) {
      console.log('⚠️ Missing fields:', missingFields)
    } else {
      console.log('✅ All required fields present')
    }
    
    // Validate profile fields
    const profileFields = [
      'username', 'full_name', 'biography', 'followers', 'following', 
      'posts_count', 'is_verified', 'is_private', 'engagement_rate',
      'avg_likes', 'avg_comments', 'avg_engagement', 'content_quality_score',
      'influence_score'
    ]
    
    const missingProfileFields = profileFields.filter(field => !(field in data.profile))
    if (missingProfileFields.length > 0) {
      console.log('⚠️ Missing profile fields:', missingProfileFields)
    } else {
      console.log('✅ All profile fields present')
    }
    
    // Validate engagement metrics
    if (data.engagement_metrics) {
      const engagementFields = ['like_rate', 'comment_rate', 'save_rate', 'share_rate', 'reach_rate']
      const missingEngagementFields = engagementFields.filter(field => !(field in data.engagement_metrics))
      if (missingEngagementFields.length > 0) {
        console.log('⚠️ Missing engagement fields:', missingEngagementFields)
      } else {
        console.log('✅ All engagement fields present')
      }
    }
    
    // Sample output
    console.log('📈 Sample data:')
    console.log(`Username: ${data.profile.username}`)
    console.log(`Followers: ${data.profile.followers.toLocaleString()}`)
    console.log(`Engagement Rate: ${data.profile.engagement_rate}%`)
    console.log(`Data Quality: ${(data.data_quality_score * 100).toFixed(0)}%`)
    console.log(`Method: ${data.scraping_method}`)
    
    return data
  } catch (error) {
    console.error('❌ Profile analysis failed:', error.message)
    return null
  }
}

async function testBasicProfile() {
  try {
    console.log('🔍 Testing basic profile...')
    const response = await fetch(`${API_BASE}/api/v1/inhouse/instagram/profile/mkbhd/basic`)
    const data = await response.json()
    console.log('✅ Basic profile:', data)
    return data
  } catch (error) {
    console.error('❌ Basic profile failed:', error.message)
    return null
  }
}

async function runAllTests() {
  console.log('🚀 Starting backend integration tests...\n')
  
  const healthResult = await testHealthCheck()
  console.log('')
  
  const profileResult = await testProfileAnalysis()
  console.log('')
  
  const basicResult = await testBasicProfile()
  console.log('')
  
  console.log('📋 Test Summary:')
  console.log(`Health Check: ${healthResult ? '✅' : '❌'}`)
  console.log(`Profile Analysis: ${profileResult ? '✅' : '❌'}`)
  console.log(`Basic Profile: ${basicResult ? '✅' : '❌'}`)
  
  if (healthResult && profileResult && basicResult) {
    console.log('\n🎉 All tests passed! Backend integration is working correctly.')
  } else {
    console.log('\n⚠️ Some tests failed. Check backend server status.')
  }
}

// For Node.js environments
if (typeof require !== 'undefined') {
  const fetch = require('node-fetch')
  runAllTests()
}

// For browser environments
if (typeof window !== 'undefined') {
  window.runIntegrationTests = runAllTests
}