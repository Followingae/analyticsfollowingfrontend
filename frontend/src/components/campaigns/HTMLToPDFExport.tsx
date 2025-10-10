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

// Format numbers like frontend
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

// Generate HTML template for PDF
const generateCampaignHTML = (data: CampaignPDFData): string => {
  const { campaign, stats, posts = [], creators = [], audience } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${campaign.name} - Campaign Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
        }

        .page {
            padding: 40px;
            min-height: 100vh;
            page-break-after: always;
        }

        .page:last-child {
            page-break-after: avoid;
        }

        .header {
            display: flex;
            align-items: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }

        .brand-logo {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            margin-right: 20px;
            object-fit: cover;
        }

        .header-text h1 {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #000;
        }

        .header-text p {
            color: #6b7280;
            font-size: 16px;
        }

        .section-title {
            font-size: 24px;
            font-weight: bold;
            margin: 32px 0 20px 0;
            color: #111827;
        }

        .subsection-title {
            font-size: 18px;
            font-weight: bold;
            margin: 24px 0 16px 0;
            color: #374151;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }

        .metric-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }

        .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 4px;
        }

        .metric-label {
            font-size: 14px;
            color: #6b7280;
        }

        .posts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .post-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            background: white;
        }

        .post-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            background: #f3f4f6;
        }

        .post-content {
            padding: 16px;
        }

        .post-creator {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }

        .creator-pic {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            margin-right: 12px;
            object-fit: cover;
        }

        .creator-name {
            font-weight: bold;
            font-size: 14px;
        }

        .creator-username {
            color: #6b7280;
            font-size: 12px;
        }

        .post-metrics {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 8px;
        }

        .post-caption {
            font-size: 12px;
            color: #374151;
            line-height: 1.4;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }

        .data-table th,
        .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }

        .data-table th {
            background: #f9fafb;
            font-weight: bold;
            color: #374151;
        }

        .footer {
            position: fixed;
            bottom: 20px;
            left: 40px;
            right: 40px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }

        @media print {
            .page {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>

<!-- Page 1: Campaign Stats -->
<div class="page">
    <div class="header">
        ${campaign.brand_logo_url ? `<img src="${campaign.brand_logo_url}" alt="Brand Logo" class="brand-logo">` : ''}
        <div class="header-text">
            <h1>${campaign.name}</h1>
            <p>${campaign.brand_name} • ${campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</p>
        </div>
    </div>

    <div class="section-title">Campaign Stats</div>

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
    <div class="subsection-title">Collaboration Metrics</div>
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
    ` : ''}

    <div class="subsection-title">Post Type Distribution</div>
    <table class="data-table">
        <tr>
            <th>Post Type</th>
            <th>Count</th>
        </tr>
        <tr>
            <td>Static Posts</td>
            <td>${stats?.postTypeBreakdown.static || 0}</td>
        </tr>
        <tr>
            <td>Reels</td>
            <td>${stats?.postTypeBreakdown.reels || 0}</td>
        </tr>
        <tr>
            <td>Stories</td>
            <td>${stats?.postTypeBreakdown.story || 0}</td>
        </tr>
    </table>
</div>

<!-- Page 2: Audience -->
<div class="page">
    <div class="section-title">Audience</div>

    ${posts.length === 0 ? `
    <p>No audience data available yet. Add posts to your campaign to see audience insights.</p>
    ` : `
    <div class="subsection-title">Top Demographics</div>
    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value">${audience?.gender_split ?
                Object.entries(audience.gender_split)
                    .reduce((prev, [gender, percentage]) =>
                        percentage > (prev.percentage || 0) ? { gender, percentage } : prev,
                        { gender: 'N/A', percentage: 0 }
                    ).gender : 'N/A'}</div>
            <div class="metric-label">Top Gender</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${audience?.age_groups ?
                Object.entries(audience.age_groups)
                    .reduce((prev, [age, percentage]) =>
                        percentage > (prev.percentage || 0) ? { age, percentage } : prev,
                        { age: 'N/A', percentage: 0 }
                    ).age : 'N/A'}</div>
            <div class="metric-label">Top Age Group</div>
        </div>
    </div>

    ${audience?.top_countries && audience.top_countries.length > 0 ? `
    <div class="subsection-title">Geographic Distribution</div>
    <table class="data-table">
        <tr>
            <th>Country</th>
            <th>Percentage</th>
        </tr>
        ${audience.top_countries.slice(0, 10).map(country => `
        <tr>
            <td>${country.country}</td>
            <td>${country.percentage.toFixed(1)}%</td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${audience?.age_groups ? `
    <div class="subsection-title">Age Distribution</div>
    <table class="data-table">
        <tr>
            <th>Age Group</th>
            <th>Percentage</th>
        </tr>
        ${Object.entries(audience.age_groups)
            .sort(([a], [b]) => {
                const aNum = parseInt(a.split('-')[0])
                const bNum = parseInt(b.split('-')[0])
                return aNum - bNum
            })
            .map(([age, percentage]) => `
        <tr>
            <td>${age} years</td>
            <td>${(percentage * 100).toFixed(1)}%</td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${audience?.gender_split ? `
    <div class="subsection-title">Gender Distribution</div>
    <table class="data-table">
        <tr>
            <th>Gender</th>
            <th>Percentage</th>
        </tr>
        ${Object.entries(audience.gender_split).map(([gender, percentage]) => `
        <tr>
            <td>${gender}</td>
            <td>${(percentage * 100).toFixed(1)}%</td>
        </tr>
        `).join('')}
    </table>
    ` : ''}
    `}
</div>

<!-- Page 3: Posts -->
<div class="page">
    <div class="section-title">Campaign Posts</div>
    <p>${posts.length} ${posts.length === 1 ? "post" : "posts"} in this campaign</p>

    ${posts.length === 0 ? `
    <p>No posts yet. Start adding posts to track campaign performance.</p>
    ` : `
    <div class="posts-grid">
        ${posts.map((post) => `
        <div class="post-card">
            ${post.thumbnail ? `<img src="${post.thumbnail}" alt="Post" class="post-image">` : '<div class="post-image"></div>'}
            <div class="post-content">
                <div class="post-creator">
                    ${post.creator_profile_pic_url ? `<img src="${post.creator_profile_pic_url}" alt="Creator" class="creator-pic">` : '<div class="creator-pic"></div>'}
                    <div>
                        <div class="creator-name">${post.creator_full_name}</div>
                        <div class="creator-username">@${post.creator_username}</div>
                    </div>
                </div>
                <div class="post-metrics">
                    <span>${formatNumber(post.likes)} likes</span>
                    <span>${formatNumber(post.comments)} comments</span>
                    ${post.views > 0 ? `<span>${formatNumber(post.views)} views</span>` : ''}
                </div>
                <div class="post-caption">
                    ${post.engagementRate.toFixed(2)}% engagement
                    ${post.caption ? `<br><br>${post.caption.length > 100 ? `${post.caption.substring(0, 100)}...` : post.caption}` : ''}
                </div>
            </div>
        </div>
        `).join('')}
    </div>
    `}
</div>

<div class="footer">
    Generated with Following Analytics | ${new Date().toLocaleDateString()}
</div>

</body>
</html>
`
}

// Export button component
interface HTMLToPDFExportButtonProps {
  data: CampaignPDFData
  className?: string
}

export const HTMLToPDFExportButton: React.FC<HTMLToPDFExportButtonProps> = ({ data, className = "" }) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExport = async () => {
    try {
      setIsGenerating(true)
      console.log('🚀 Generating PDF from HTML...')

      // Generate HTML content
      const htmlContent = generateCampaignHTML(data)

      // Create a new window with the HTML content
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Failed to open print window')
      }

      // Write HTML content
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Wait for images to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 1000)
      }

      console.log('✅ PDF generation initiated!')

    } catch (error) {
      console.error('❌ Failed to generate PDF:', error)
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
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  )
}

export default HTMLToPDFExportButton