"use client"

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer'

// Use default system fonts - more reliable than external font loading

// Clean, modern styles focused on readability
const styles = StyleSheet.create({
  // Page layout
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },

  // Typography
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 24,
    color: '#111827',
  },
  body: {
    fontSize: 10,
    marginBottom: 4,
    color: '#374151',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottom: '1 solid #e5e7eb',
  },
  brandLogo: {
    width: 40,
    height: 40,
    marginRight: 16,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
  },

  // Grid layouts
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f9fafb',
    border: '1 solid #e5e7eb',
    borderRadius: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 8,
    color: '#6b7280',
  },

  // Posts grid
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  postCard: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    border: '1 solid #e5e7eb',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  postImage: {
    width: '100%',
    height: 120,
    borderRadius: 4,
    marginBottom: 8,
  },
  postCreator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profilePic: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
  },
  postMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#6b7280',
  },

  // Charts and data visualization
  chartContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 4,
  },
  dataLabel: {
    fontSize: 9,
    color: '#374151',
  },
  dataValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
  },

  // Page break prevention
  section: {
    breakInside: 'avoid',
    marginBottom: 24,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 8,
  },
})

// Format numbers like the frontend
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

// Interface matching exactly what the frontend sends
interface CleanCampaignPDFData {
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
    avgEngagementRate: number
    totalInteractions: number
    totalVideoViews: number
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
  // Enhanced with embedded images
  images?: {
    logo?: string
    creatorProfiles?: Record<string, string>
    postThumbnails?: Record<string, string>
  }
}

export const CleanCampaignPDFDocument: React.FC<{ data: CleanCampaignPDFData }> = ({ data }) => {
  const { campaign, stats, posts = [], creators = [], audience, images } = data

  return (
    <Document title={`${campaign.name} - Campaign Report`}>
      {/* Page 1: Campaign Stats */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {images?.logo && (
            <PDFImage style={styles.brandLogo} src={images.logo} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{campaign.name}</Text>
            <Text style={styles.body}>{campaign.brand_name} • {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</Text>
          </View>
        </View>

        {/* Campaign Stats Section */}
        <Text style={styles.subtitle}>Campaign Stats</Text>

        {/* Primary Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{stats?.totalCreators || campaign?.creators_count || 0}</Text>
              <Text style={styles.metricLabel}>Total Creators</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{campaign?.posts_count || stats?.totalPosts || 0}</Text>
              <Text style={styles.metricLabel}>Total Posts</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatNumber(stats?.totalFollowers || 0)}</Text>
              <Text style={styles.metricLabel}>Total Followers</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatNumber(stats?.totalReach || 0)}</Text>
              <Text style={styles.metricLabel}>Estimated Reach</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {campaign?.engagement_rate !== undefined
                  ? `${Math.min(campaign.engagement_rate, 100).toFixed(2)}%`
                  : stats?.overallEngagementRate
                  ? `${Math.min(stats.overallEngagementRate, 100).toFixed(2)}%`
                  : '0.0%'}
              </Text>
              <Text style={styles.metricLabel}>Engagement Rate</Text>
            </View>
          </View>
        </View>

        {/* Engagement Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engagement Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatNumber(stats?.totalComments || 0)}</Text>
              <Text style={styles.metricLabel}>Total Comments</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatNumber(stats?.totalLikes || 0)}</Text>
              <Text style={styles.metricLabel}>Total Likes</Text>
            </View>
          </View>
        </View>

        {/* Collaboration Metrics (if available) */}
        {stats && (stats.collaborationRate || 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collaboration Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{stats.collaborationRate?.toFixed(1) || '0.0'}%</Text>
                <Text style={styles.metricLabel}>Collaboration Rate</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{stats.collaborationPosts || 0}</Text>
                <Text style={styles.metricLabel}>Collaboration Posts</Text>
              </View>
            </View>
          </View>
        )}

        {/* Post Type Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Post Type Distribution</Text>
          <View style={styles.chartContainer}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Static Posts</Text>
              <Text style={styles.dataValue}>{stats?.postTypeBreakdown.static || 0}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Reels</Text>
              <Text style={styles.dataValue}>{stats?.postTypeBreakdown.reels || 0}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Stories</Text>
              <Text style={styles.dataValue}>{stats?.postTypeBreakdown.story || 0}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated with Following Analytics</Text>
          <Text>{new Date().toLocaleDateString()}</Text>
        </View>
      </Page>

      {/* Page 2: Audience Data */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.subtitle}>Audience</Text>

        {posts.length === 0 ? (
          <View style={styles.section}>
            <Text style={styles.body}>No audience data available yet.</Text>
            <Text style={styles.body}>Add posts to your campaign to see audience insights.</Text>
          </View>
        ) : (
          <>
            {/* Top Demographics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Demographics</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {audience?.gender_split ?
                      Object.entries(audience.gender_split)
                        .reduce((prev, [gender, percentage]) =>
                          percentage > (prev.percentage || 0) ? { gender, percentage } : prev,
                          { gender: 'N/A', percentage: 0 }
                        ).gender : 'N/A'}
                  </Text>
                  <Text style={styles.metricLabel}>Top Gender</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {audience?.age_groups ?
                      Object.entries(audience.age_groups)
                        .reduce((prev, [age, percentage]) =>
                          percentage > (prev.percentage || 0) ? { age, percentage } : prev,
                          { age: 'N/A', percentage: 0 }
                        ).age : 'N/A'}
                  </Text>
                  <Text style={styles.metricLabel}>Top Age Group</Text>
                </View>
              </View>
            </View>

            {/* Geographic Distribution */}
            {audience?.top_countries && audience.top_countries.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Geographic Distribution</Text>
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Top Countries</Text>
                  {audience.top_countries.slice(0, 5).map((country, index) => (
                    <View key={index} style={styles.dataRow}>
                      <Text style={styles.dataLabel}>{country.country}</Text>
                      <Text style={styles.dataValue}>{country.percentage.toFixed(1)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Age Distribution */}
            {audience?.age_groups && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Age Distribution</Text>
                <View style={styles.chartContainer}>
                  {Object.entries(audience.age_groups)
                    .sort(([a], [b]) => {
                      const aNum = parseInt(a.split('-')[0])
                      const bNum = parseInt(b.split('-')[0])
                      return aNum - bNum
                    })
                    .map(([age, percentage]) => (
                      <View key={age} style={styles.dataRow}>
                        <Text style={styles.dataLabel}>{age} years</Text>
                        <Text style={styles.dataValue}>{(percentage * 100).toFixed(1)}%</Text>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Gender Distribution */}
            {audience?.gender_split && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gender Distribution</Text>
                <View style={styles.chartContainer}>
                  {Object.entries(audience.gender_split).map(([gender, percentage]) => (
                    <View key={gender} style={styles.dataRow}>
                      <Text style={styles.dataLabel}>{gender}</Text>
                      <Text style={styles.dataValue}>{(percentage * 100).toFixed(1)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Audience Interests */}
            {audience?.interests && Object.keys(audience.interests).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Audience Interests</Text>
                <View style={styles.chartContainer}>
                  {Object.entries(audience.interests)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([interest, percentage]) => (
                      <View key={interest} style={styles.dataRow}>
                        <Text style={styles.dataLabel}>{interest}</Text>
                        <Text style={styles.dataValue}>{(percentage * 100).toFixed(1)}%</Text>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated with Following Analytics</Text>
          <Text>Page 2 of 3</Text>
        </View>
      </Page>

      {/* Page 3: Posts */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.subtitle}>Campaign Posts</Text>
        <Text style={styles.body}>{posts.length} {posts.length === 1 ? "post" : "posts"} in this campaign</Text>

        {posts.length === 0 ? (
          <View style={styles.section}>
            <Text style={styles.body}>No posts yet</Text>
            <Text style={styles.body}>Start adding posts to track campaign performance</Text>
          </View>
        ) : (
          <View style={styles.postsGrid}>
            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                {/* Post Image */}
                {images?.postThumbnails?.[post.id] && (
                  <PDFImage
                    style={styles.postImage}
                    src={images.postThumbnails[post.id]}
                  />
                )}

                {/* Creator Info */}
                <View style={styles.postCreator}>
                  {images?.creatorProfiles?.[post.creator_username] && (
                    <PDFImage
                      style={styles.profilePic}
                      src={images.creatorProfiles[post.creator_username]}
                    />
                  )}
                  <View>
                    <Text style={styles.creatorName}>{post.creator_full_name}</Text>
                    <Text style={[styles.body, { fontSize: 8 }]}>@{post.creator_username}</Text>
                  </View>
                </View>

                {/* Post Metrics */}
                <View style={styles.postMetrics}>
                  <Text>{formatNumber(post.likes)} likes</Text>
                  <Text>{formatNumber(post.comments)} comments</Text>
                  {post.views > 0 && <Text>{formatNumber(post.views)} views</Text>}
                </View>
                <Text style={[styles.body, { fontSize: 8, marginTop: 4 }]}>
                  {post.engagementRate.toFixed(2)}% engagement
                </Text>

                {/* Caption Preview */}
                {post.caption && (
                  <Text style={[styles.body, { fontSize: 8, marginTop: 4, maxLines: 2 }]}>
                    {post.caption.length > 80 ? `${post.caption.substring(0, 80)}...` : post.caption}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated with Following Analytics</Text>
          <Text>Page 3 of 3</Text>
        </View>
      </Page>
    </Document>
  )
}

export default CleanCampaignPDFDocument