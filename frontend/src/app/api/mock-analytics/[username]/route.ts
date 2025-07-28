import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = params.username

  // Mock analytics data for testing
  const mockData = {
    profile: {
      username: username,
      full_name: `${username.charAt(0).toUpperCase() + username.slice(1)} Creator`,
      biography: `Professional content creator and influencer. Sharing authentic moments and inspiring content daily. #${username}`,
      followers: Math.floor(Math.random() * 1000000) + 100000,
      following: Math.floor(Math.random() * 1000) + 200,
      posts_count: Math.floor(Math.random() * 2000) + 500,
      is_verified: Math.random() > 0.5,
      is_private: false,
      profile_pic_url: `/avatars/0${Math.floor(Math.random() * 24) + 1}.png`,
      external_url: `https://linktr.ee/${username}`,
      engagement_rate: Math.round((Math.random() * 8 + 2) * 10) / 10,
      avg_likes: Math.floor(Math.random() * 50000) + 10000,
      avg_comments: Math.floor(Math.random() * 5000) + 1000,
      avg_engagement: Math.floor(Math.random() * 55000) + 11000,
      content_quality_score: Math.round((Math.random() * 4 + 6) * 10) / 10,
      influence_score: Math.round((Math.random() * 4 + 6) * 10) / 10,
      follower_growth_rate: Math.round((Math.random() * 10 + 2) * 10) / 10
    },
    engagement_metrics: {
      like_rate: Math.round((Math.random() * 3 + 1) * 100) / 100,
      comment_rate: Math.round((Math.random() * 1 + 0.2) * 100) / 100,
      save_rate: Math.round((Math.random() * 0.5 + 0.1) * 100) / 100,
      share_rate: Math.round((Math.random() * 0.3 + 0.05) * 100) / 100,
      reach_rate: Math.round((Math.random() * 15 + 5) * 10) / 10
    },
    audience_insights: {
      primary_age_group: ["18-24", "25-34", "35-44", "45-54"][Math.floor(Math.random() * 4)],
      gender_split: {
        female: Math.floor(Math.random() * 40) + 30,
        male: Math.floor(Math.random() * 40) + 30
      },
      top_locations: ["United States", "United Kingdom", "Canada", "Australia", "Germany"].slice(0, 3),
      activity_times: ["09:00-11:00", "14:00-16:00", "19:00-21:00", "20:00-22:00"].slice(0, 3),
      interests: ["lifestyle", "fashion", "technology", "entertainment", "fitness", "food"].slice(0, 4)
    },
    competitor_analysis: {
      similar_accounts: [`similar_${username}_1`, `similar_${username}_2`],
      competitive_score: Math.round((Math.random() * 4 + 6) * 10) / 10,
      market_position: ["Market Leader", "Growing Player", "Niche Expert", "Rising Star"][Math.floor(Math.random() * 4)],
      growth_opportunities: [
        "Increase posting frequency during peak hours",
        "Collaborate with similar creators in your niche",
        "Experiment with new content formats like Reels"
      ]
    },
    content_performance: {
      top_performing_content_types: ["Photos", "Videos", "Carousels", "Reels"].slice(0, 3),
      optimal_posting_frequency: ["1-2 times per day", "3-5 times per week", "Daily posting"][Math.floor(Math.random() * 3)],
      content_themes: ["Behind the scenes", "Educational content", "User-generated content", "Trending topics"].slice(0, 3),
      hashtag_effectiveness: {
        trending: Math.round((Math.random() * 3 + 7) * 10) / 10,
        niche: Math.round((Math.random() * 3 + 6) * 10) / 10,
        branded: Math.round((Math.random() * 3 + 5) * 10) / 10
      }
    },
    content_strategy: {
      primary_content_pillars: ["Educational", "Entertainment", "Behind-the-scenes", "Inspirational"].slice(0, 3),
      posting_schedule: {
        monday: ["09:00", "18:00"],
        tuesday: ["10:00", "19:00"],
        wednesday: ["09:00", "18:00"],
        thursday: ["10:00", "19:00"],
        friday: ["09:00", "17:00"],
        saturday: ["11:00", "16:00"],
        sunday: ["12:00", "18:00"]
      },
      content_mix: {
        photos: Math.floor(Math.random() * 20) + 30,
        videos: Math.floor(Math.random() * 20) + 25,
        carousels: Math.floor(Math.random() * 15) + 15,
        reels: Math.floor(Math.random() * 15) + 10
      },
      hashtag_strategy: {
        trending_hashtags: 3,
        niche_hashtags: 15,
        branded_hashtags: 2,
        location_hashtags: 2
      },
      engagement_tactics: [
        "Ask questions in captions",
        "Use polls in stories",
        "Respond to comments quickly",
        "Share user-generated content",
        "Post consistently at optimal times"
      ]
    },
    best_posting_times: ["07:00", "12:00", "17:00", "20:00"],
    growth_recommendations: [
      `📈 Great engagement rate! Consider posting more consistently to boost growth`,
      `💎 Your content quality is strong - focus on expanding your reach`,
      `🗂️ Consider organizing your content with highlights and story categories`,
      `🤝 Collaborate with other creators in your niche for cross-promotion`
    ],
    analysis_timestamp: new Date().toISOString(),
    data_quality_score: 0.95,
    scraping_method: "mock_testing"
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  return NextResponse.json(mockData)
}