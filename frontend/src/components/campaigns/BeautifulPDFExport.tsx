"use client"

import React, { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Types for campaign data
interface CampaignPDFData {
  campaign: {
    id: string
    name: string
    brand_name: string
    brand_logo_url?: string
    status: string
    created_at: string
    engagement_rate?: number
    posts_count?: number
    creators_count?: number
    total_reach?: number
  }
  stats?: {
    totalCreators: number
    totalPosts: number
    totalReach: number
    totalFollowers: number
    overallEngagementRate: number
    totalComments: number
    totalLikes: number
    postTypeBreakdown: {
      static: number
      reels: number
      carousel?: number
      story: number
    }
    collaborationRate?: number
    collaborationPosts?: number
  }
  creators?: Array<{
    username: string
    full_name: string
    followers_count: number
    posts_in_campaign: number
    avg_engagement_rate: number
    profile_pic_url?: string
  }>
  posts?: Array<{
    id: string
    thumbnail?: string
    type: 'static' | 'reel'
    caption?: string
    views: number
    likes: number
    comments: number
    engagementRate: number
    creator_username: string
    creator_full_name: string
    creator_profile_pic_url?: string
  }>
  audience?: {
    age_groups?: Record<string, number>
    gender_split?: Record<string, number>
    top_countries?: Array<{ country: string; percentage: number }>
    top_cities?: Array<{ city: string; percentage: number }>
    interests?: Record<string, number>
  }
  aiInsights?: any
}

// Format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// Beautiful HTML template
const generateBeautifulHTML = (data: CampaignPDFData): string => {
  const { campaign, stats, posts = [], creators = [], audience } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${campaign.name} - Campaign Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f8fafc;
        }

        .page {
            padding: 20px;
            min-height: 100vh;
            page-break-after: always;
            page-break-inside: avoid;
            background: white;
            margin: 0;
            max-width: 100%;
            border-radius: 0;
            box-shadow: none;
            display: flex;
            flex-direction: column;
        }

        .page:last-child {
            page-break-after: avoid;
        }

        /* STUNNING HEADER */
        .header {
            background: linear-gradient(135deg, #5100f3 0%, #7c3aed 50%, #a855f7 100%);
            padding: 20px;
            border-radius: 12px;
            color: white;
            margin-bottom: 24px;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -30%;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            border-radius: 50%;
        }

        .header::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -20%;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
            border-radius: 50%;
        }

        .header-content {
            display: flex;
            align-items: center;
            position: relative;
            z-index: 2;
        }

        .brand-logo {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            margin-right: 16px;
            object-fit: cover;
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .header-text h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 4px;
            letter-spacing: -0.02em;
        }

        .header-text p {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 500;
        }

        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 12px;
            backdrop-filter: blur(10px);
        }

        /* BEAUTIFUL SECTIONS */
        .section-title {
            font-size: 20px;
            font-weight: 700;
            margin: 20px 0 16px 0;
            color: #111827;
            position: relative;
            padding-left: 16px;
        }

        .section-title::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 8px;
            height: 48px;
            background: linear-gradient(135deg, #5100f3 0%, #7c3aed 100%);
            border-radius: 4px;
        }

        .subsection-title {
            font-size: 16px;
            font-weight: 600;
            margin: 16px 0 12px 0;
            color: #374151;
            padding-bottom: 6px;
            border-bottom: 2px solid #e5e7eb;
        }

        /* GORGEOUS METRICS GRID */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }

        .metric-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 8px;
            padding: 16px;
            position: relative;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            overflow: hidden;
        }

        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #5100f3, #7c3aed, #a855f7, #c084fc);
        }

        .metric-value {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 4px;
            letter-spacing: -0.02em;
        }

        .metric-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        /* STUNNING POSTS GRID */
        .posts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin-top: 16px;
        }

        .post-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid #f1f5f9;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .post-image {
            width: 100%;
            height: 160px;
            object-fit: cover;
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        }

        .post-content {
            padding: 16px;
        }

        .post-creator {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding: 16px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 16px;
        }

        .creator-pic {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            margin-right: 16px;
            object-fit: cover;
            border: 3px solid #e2e8f0;
        }

        .creator-name {
            font-weight: 700;
            font-size: 16px;
            color: #111827;
            margin-bottom: 2px;
        }

        .creator-username {
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
        }

        .post-metrics {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding: 12px 16px;
            background: #f8fafc;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
        }

        .engagement-badge {
            background: linear-gradient(135deg, #5100f3 0%, #7c3aed 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.05em;
        }

        .post-caption {
            font-size: 14px;
            color: #374151;
            line-height: 1.6;
            background: #fafbfc;
            padding: 16px;
            border-radius: 12px;
            border-left: 4px solid #e5e7eb;
        }

        /* ELEGANT TABLES */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            background: white;
        }

        .data-table th {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: white;
            padding: 20px;
            text-align: left;
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .data-table td {
            padding: 18px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-weight: 500;
            color: #1f2937;
        }

        .data-table tr:nth-child(even) {
            background: #f8fafc;
        }

        .data-table tr:hover {
            background: #f1f5f9;
        }

        /* COLLABORATION HIGHLIGHT */
        .collaboration-section {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            border-radius: 20px;
            padding: 32px;
            margin: 32px 0;
        }

        .collaboration-section .subsection-title {
            color: #92400e;
            border-bottom-color: #f59e0b;
        }

        /* NO DATA STATE */
        .no-data {
            text-align: center;
            padding: 80px 40px;
            color: #6b7280;
            font-style: italic;
            background: #f9fafb;
            border-radius: 16px;
            border: 2px dashed #d1d5db;
        }

        /* FOOTER */
        .footer {
            margin-top: 60px;
            text-align: center;
            padding: 24px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 16px;
            border: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
        }

        @media print {
            body {
                background: white;
                font-size: 12px;
            }
            .page {
                margin: 0;
                padding: 15px;
                box-shadow: none;
                border-radius: 0;
                page-break-inside: avoid;
            }
            .header {
                margin-bottom: 20px;
            }
            .section-title {
                margin: 15px 0 10px 0;
                font-size: 18px;
            }
            .subsection-title {
                margin: 12px 0 8px 0;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>

<!-- Page 1: Campaign Stats -->
<div class="page">
    <div class="header">
        <div class="header-content">
            ${campaign.brand_logo_url ? `<img src="${campaign.brand_logo_url}" alt="Brand Logo" class="brand-logo">` : ''}
            <div class="header-text">
                <h1>${campaign.name}</h1>
                <p>${campaign.brand_name}</p>
                <span class="status-badge">${campaign.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : 'Draft'}</span>
            </div>
        </div>
    </div>

    <div class="section-title">📊 Campaign Stats</div>

    <div class="subsection-title">Primary Metrics</div>
    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value">${stats?.totalCreators || campaign?.creators_count || 0}</div>
            <div class="metric-label">Total Creators</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${campaign?.posts_count || stats?.totalPosts || 0}</div>
            <div class="metric-label">Total Posts</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${formatNumber(stats?.totalFollowers || 0)}</div>
            <div class="metric-label">Total Followers</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${formatNumber(stats?.totalReach || 0)}</div>
            <div class="metric-label">Estimated Reach</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${campaign?.engagement_rate !== undefined
                ? `${Math.min(campaign.engagement_rate, 100).toFixed(2)}%`
                : stats?.overallEngagementRate
                ? `${Math.min(stats.overallEngagementRate, 100).toFixed(2)}%`
                : '0.0%'}</div>
            <div class="metric-label">Engagement Rate</div>
        </div>
    </div>

    <div class="subsection-title">Engagement Metrics</div>
    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value">${formatNumber(stats?.totalComments || 0)}</div>
            <div class="metric-label">Total Comments</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${formatNumber(stats?.totalLikes || 0)}</div>
            <div class="metric-label">Total Likes</div>
        </div>
    </div>

    ${stats && (stats.collaborationRate || 0) > 0 ? `
    <div class="collaboration-section">
        <div class="subsection-title">🤝 Collaboration Metrics</div>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${stats.collaborationRate?.toFixed(1) || '0.0'}%</div>
                <div class="metric-label">Collaboration Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${stats.collaborationPosts || 0}</div>
                <div class="metric-label">Collaboration Posts</div>
            </div>
        </div>
    </div>
    ` : ''}

    <div class="subsection-title">Post Type Distribution</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Post Type</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>📷 Static Posts</td>
                <td>${stats?.postTypeBreakdown.static || 0}</td>
                <td>${stats ? ((stats.postTypeBreakdown.static / (stats.totalPosts || 1)) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
                <td>🎥 Reels</td>
                <td>${stats?.postTypeBreakdown.reels || 0}</td>
                <td>${stats ? ((stats.postTypeBreakdown.reels / (stats.totalPosts || 1)) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
                <td>📖 Stories</td>
                <td>${stats?.postTypeBreakdown.story || 0}</td>
                <td>${stats ? ((stats.postTypeBreakdown.story / (stats.totalPosts || 1)) * 100).toFixed(1) : 0}%</td>
            </tr>
        </tbody>
    </table>

    ${data.aiInsights && data.aiInsights.total_posts > 0 ? `
    <!-- AI CONTENT INTELLIGENCE SECTION -->
    <div class="section-title">🤖 AI Content Intelligence</div>

    <!-- Content Quality & Authenticity -->
    ${data.aiInsights.audience_quality?.available || data.aiInsights.visual_content?.available || data.aiInsights.fraud_detection?.available ? `
    <div class="subsection-title">Content Quality & Authenticity</div>
    <div class="metrics-grid">
        ${data.aiInsights.audience_quality?.available ? `
        <div class="metric-card">
            <div class="metric-value">${data.aiInsights.audience_quality.average_authenticity?.toFixed(1)}%</div>
            <div class="metric-label">Authenticity Score</div>
            <span style="background: ${data.aiInsights.audience_quality.quality_rating === "high" ? "#22c55e" : data.aiInsights.audience_quality.quality_rating === "medium" ? "#f59e0b" : "#ef4444"}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-top: 8px; display: inline-block;">
                ${data.aiInsights.audience_quality.quality_rating?.toUpperCase()}
            </span>
        </div>
        ` : ''}
        ${data.aiInsights.visual_content?.available ? `
        <div class="metric-card">
            <div class="metric-value">${data.aiInsights.visual_content.aesthetic_score?.toFixed(1)}</div>
            <div class="metric-label">Visual Quality</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                Professional: ${data.aiInsights.visual_content.professional_quality_score?.toFixed(1)}
            </div>
        </div>
        ` : ''}
        ${data.aiInsights.fraud_detection?.available ? `
        <div class="metric-card">
            <div class="metric-value">${(100 - (data.aiInsights.fraud_detection.average_fraud_score || 0)).toFixed(0)}%</div>
            <div class="metric-label">Trust Level</div>
            <span style="background: ${data.aiInsights.fraud_detection.overall_trust_level === "high" ? "#22c55e" : data.aiInsights.fraud_detection.overall_trust_level === "medium" ? "#f59e0b" : "#ef4444"}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-top: 8px; display: inline-block;">
                ${data.aiInsights.fraud_detection.overall_trust_level?.toUpperCase()}
            </span>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <!-- Sentiment Analysis -->
    ${data.aiInsights.sentiment_analysis?.available && data.aiInsights.sentiment_analysis?.distribution ? `
    <div class="subsection-title">Sentiment Analysis</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Sentiment</th>
                <th>Percentage</th>
                <th>Distribution</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>😊 Positive</td>
                <td>${data.aiInsights.sentiment_analysis.distribution.positive.toFixed(1)}%</td>
                <td>
                    <div style="background: #e5e7eb; border-radius: 4px; height: 8px; width: 100px;">
                        <div style="background: #22c55e; height: 8px; border-radius: 4px; width: ${data.aiInsights.sentiment_analysis.distribution.positive}%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td>😐 Neutral</td>
                <td>${data.aiInsights.sentiment_analysis.distribution.neutral.toFixed(1)}%</td>
                <td>
                    <div style="background: #e5e7eb; border-radius: 4px; height: 8px; width: 100px;">
                        <div style="background: #3b82f6; height: 8px; border-radius: 4px; width: ${data.aiInsights.sentiment_analysis.distribution.neutral}%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td>😞 Negative</td>
                <td>${data.aiInsights.sentiment_analysis.distribution.negative.toFixed(1)}%</td>
                <td>
                    <div style="background: #e5e7eb; border-radius: 4px; height: 8px; width: 100px;">
                        <div style="background: #ef4444; height: 8px; border-radius: 4px; width: ${data.aiInsights.sentiment_analysis.distribution.negative}%;"></div>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
    <p style="margin-top: 16px; font-weight: 600;">
        <strong>Dominant Sentiment:</strong> <span style="text-transform: capitalize;">${data.aiInsights.sentiment_analysis.dominant_sentiment}</span>
    </p>
    ` : ''}

    <!-- Content Categories -->
    ${data.aiInsights.category_classification?.available && data.aiInsights.category_classification?.top_categories ? `
    <div class="subsection-title">Content Categories</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Category</th>
                <th>Percentage</th>
                <th>Distribution</th>
            </tr>
        </thead>
        <tbody>
            ${data.aiInsights.category_classification.top_categories.slice(0, 5).map(cat => `
            <tr>
                <td style="text-transform: capitalize;">${cat.category}</td>
                <td>${cat.percentage.toFixed(1)}%</td>
                <td>
                    <div style="background: #e5e7eb; border-radius: 4px; height: 8px; width: 100px;">
                        <div style="background: #5100f3; height: 8px; border-radius: 4px; width: ${cat.percentage}%;"></div>
                    </div>
                </td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}

    <!-- Additional AI Metrics -->
    <div class="subsection-title">Advanced AI Metrics</div>
    <div class="metrics-grid">
        ${data.aiInsights.trend_detection?.available ? `
        <div class="metric-card">
            <div class="metric-value">${data.aiInsights.trend_detection.average_viral_potential?.toFixed(1)}/100</div>
            <div class="metric-label">Viral Potential</div>
            <span style="background: ${data.aiInsights.trend_detection.viral_rating === "high" ? "#22c55e" : data.aiInsights.trend_detection.viral_rating === "medium" ? "#f59e0b" : "#ef4444"}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-top: 8px; display: inline-block;">
                ${data.aiInsights.trend_detection.viral_rating?.toUpperCase()}
            </span>
        </div>
        ` : ''}
        ${data.aiInsights.advanced_nlp?.available ? `
        <div class="metric-card">
            <div class="metric-value">${data.aiInsights.advanced_nlp.average_word_count?.toFixed(0)} words</div>
            <div class="metric-label">Content Depth</div>
            <span style="background: #6b7280; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-top: 8px; display: inline-block;">
                ${data.aiInsights.advanced_nlp.content_depth?.toUpperCase()}
            </span>
        </div>
        <div class="metric-card">
            <div class="metric-value">${data.aiInsights.advanced_nlp.total_brand_mentions || 0}</div>
            <div class="metric-label">Brand Mentions</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                Avg. ${data.aiInsights.advanced_nlp.average_hashtags?.toFixed(0)} hashtags
            </div>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="footer">
        Generated with Following Analytics • ${new Date().toLocaleDateString()} • Professional Campaign Report
    </div>
</div>

<!-- Page 2: Audience -->
<div class="page">
    <div class="section-title">👥 Audience Analytics</div>

    ${!data.aiInsights?.audience_insights?.available ? `
    <div class="no-data">
        <h3>No audience data available yet</h3>
        <p>Add posts to your campaign to see detailed audience insights and demographics.</p>
    </div>
    ` : `
    <!-- USING AI INSIGHTS AUDIENCE DATA -->

    <!-- Top Demographics from AI Insights -->
    <div class="subsection-title">Top Demographics</div>
    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value">${data.aiInsights.audience_insights?.demographic_insights?.estimated_gender_split ?
                (() => {
                    const genderData = Object.entries(data.aiInsights.audience_insights.demographic_insights.estimated_gender_split)
                        .filter(([gender]) => gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female')
                    const malePercentage = (genderData.find(([g]) => g.toLowerCase() === 'male')?.[1] || 0) * 100
                    const femalePercentage = (genderData.find(([g]) => g.toLowerCase() === 'female')?.[1] || 0) * 100
                    return malePercentage > femalePercentage ? 'Male' : 'Female'
                })() : 'N/A'}</div>
            <div class="metric-label">Top Gender</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${data.aiInsights.audience_insights?.demographic_insights?.estimated_age_groups ?
                Object.entries(data.aiInsights.audience_insights.demographic_insights.estimated_age_groups)
                    .reduce((prev, [age, percentage]) =>
                        percentage > (prev.percentage || 0) ? { age, percentage } : prev,
                        { age: 'N/A', percentage: 0 }
                    ).age : 'N/A'}</div>
            <div class="metric-label">Top Age Group</div>
        </div>
    </div>

    <!-- Geographic Distribution from AI Insights -->
    ${data.aiInsights.audience_insights?.geographic_analysis?.top_countries ? `
    <div class="subsection-title">🌍 Audience Geographic Distribution</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Country</th>
                <th>Percentage</th>
                <th>Reach Impact</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(data.aiInsights.audience_insights.geographic_analysis.top_countries)
                .filter(([, percentage]) => percentage >= 5)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([country, percentage]) => `
            <tr>
                <td>${country}</td>
                <td>${percentage.toFixed(1)}%</td>
                <td>${formatNumber(Math.round((stats?.totalReach || 0) * (percentage / 100)))}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}

    <!-- Age Distribution from AI Insights -->
    ${data.aiInsights.audience_insights?.demographic_insights?.estimated_age_groups ? `
    <div class="subsection-title">📊 Audience Age Distribution</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Age Group</th>
                <th>Percentage</th>
                <th>Estimated Audience</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(data.aiInsights.audience_insights.demographic_insights.estimated_age_groups)
                .sort(([a], [b]) => {
                    const aNum = parseInt(a.split('-')[0])
                    const bNum = parseInt(b.split('-')[0])
                    return aNum - bNum
                })
                .map(([age, percentage]) => `
            <tr>
                <td>${age} years</td>
                <td>${(percentage * 100).toFixed(1)}%</td>
                <td>${formatNumber(Math.round((stats?.totalReach || 0) * percentage))}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}

    <!-- Gender Distribution from AI Insights -->
    ${data.aiInsights.audience_insights?.demographic_insights?.estimated_gender_split ? `
    <div class="subsection-title">⚧ Audience Gender</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Gender</th>
                <th>Percentage</th>
                <th>Estimated Reach</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(data.aiInsights.audience_insights.demographic_insights.estimated_gender_split)
                .filter(([gender]) => gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female')
                .map(([gender, percentage]) => `
            <tr>
                <td>${gender}</td>
                <td>${(percentage * 100).toFixed(0)}%</td>
                <td>${formatNumber(Math.round((stats?.totalReach || 0) * percentage))}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}

    <!-- Audience Interests from AI Insights -->
    ${data.aiInsights.audience_insights?.audience_interests?.interest_distribution ? `
    <div class="subsection-title">💡 Audience Interests</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Interest</th>
                <th>Percentage</th>
                <th>Distribution</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(data.aiInsights.audience_insights.audience_interests.interest_distribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([interest, percentage]) => `
            <tr>
                <td style="text-transform: capitalize;">${interest}</td>
                <td>${(percentage * 100).toFixed(1)}%</td>
                <td>
                    <div style="background: #e5e7eb; border-radius: 4px; height: 8px; width: 100px;">
                        <div style="background: #5100f3; height: 8px; border-radius: 4px; width: ${percentage * 100}%;"></div>
                    </div>
                </td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}
    `}

    <div class="footer">
        Generated with Following Analytics • Page 2 of 3 • Audience Insights Report
    </div>
</div>

<!-- Page 3: Posts -->
<div class="page">
    <div class="section-title">📱 Campaign Posts</div>
    <p style="font-size: 18px; color: #6b7280; margin-bottom: 32px;">
        <strong>${posts.length}</strong> ${posts.length === 1 ? "post" : "posts"} in this campaign
    </p>

    ${posts.length === 0 ? `
    <div class="no-data">
        <h3>No posts yet</h3>
        <p>Start adding posts to track campaign performance and engagement metrics.</p>
    </div>
    ` : `
    <div class="posts-grid">
        ${posts.map((post) => `
        <div class="post-card">
            ${post.thumbnail ? `<img src="${post.thumbnail}" alt="Post" class="post-image" style="display: block;">` : '<div class="post-image" style="background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px;">📷 No Image</div>'}
            <div class="post-content">
                <div class="post-creator">
                    ${post.creator_profile_pic_url ? `<img src="${post.creator_profile_pic_url}" alt="Creator" class="creator-pic">` : '<div class="creator-pic" style="background: #e5e7eb;"></div>'}
                    <div>
                        <div class="creator-name">${post.creator_full_name}</div>
                        <div class="creator-username">@${post.creator_username}</div>
                    </div>
                </div>
                <div class="post-metrics">
                    <span>❤️ ${formatNumber(post.likes)} likes</span>
                    <span>💬 ${formatNumber(post.comments)} comments</span>
                    ${post.views > 0 ? `<span>👁️ ${formatNumber(post.views)} views</span>` : ''}
                    <span class="engagement-badge">${post.engagementRate.toFixed(2)}%</span>
                </div>
                ${post.caption ? `
                <div class="post-caption">
                    ${post.caption.length > 120 ? `${post.caption.substring(0, 120)}...` : post.caption}
                </div>
                ` : ''}
            </div>
        </div>
        `).join('')}
    </div>
    `}

    <div class="footer">
        Generated with Following Analytics • Page 3 of 3 • Posts Performance Report
    </div>
</div>

</body>
</html>
`
}

// Beautiful Export Button
interface BeautifulPDFExportProps {
  data: CampaignPDFData
  className?: string
}

export const BeautifulPDFExportButton: React.FC<BeautifulPDFExportProps> = ({ data, className = "" }) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExport = async () => {
    try {
      setIsGenerating(true)
      console.log('🎨 Generating BEAUTIFUL PDF...')

      const htmlContent = generateBeautifulHTML(data)

      const printWindow = window.open('', '_blank', 'width=1200,height=800')
      if (!printWindow) {
        throw new Error('Failed to open print window')
      }

      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Wait for everything to load
      printWindow.onload = () => {
        // Wait for images to load
        const images = printWindow.document.querySelectorAll('img')
        let loadedImages = 0
        const totalImages = images.length

        if (totalImages === 0) {
          // No images, print immediately
          setTimeout(() => printWindow.print(), 1000)
          return
        }

        const checkAllLoaded = () => {
          loadedImages++
          if (loadedImages >= totalImages) {
            // All images loaded, wait a bit more then print
            setTimeout(() => printWindow.print(), 1000)
          }
        }

        // Add load listeners to all images
        images.forEach(img => {
          if (img.complete) {
            checkAllLoaded()
          } else {
            img.onload = checkAllLoaded
            img.onerror = checkAllLoaded // Count failed images as loaded
          }
        })

        // Fallback timeout in case images don't load
        setTimeout(() => {
          console.log('📄 Timeout reached, printing anyway...')
          printWindow.print()
        }, 5000)
      }

      console.log('✨ Beautiful PDF ready!')
    } catch (error) {
      console.error('❌ PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      className={className}
      disabled={isGenerating}
      onClick={handleExport}
    >
      {isGenerating ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating Beautiful PDF...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export Beautiful PDF
        </>
      )}
    </Button>
  )
}

export default BeautifulPDFExportButton