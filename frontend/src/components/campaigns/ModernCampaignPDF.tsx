"use client"

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
  Font,
} from '@react-pdf/renderer'

// Register Inter fonts
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-300-normal.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf',
      fontWeight: 600,
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf',
      fontWeight: 700,
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-900-normal.ttf',
      fontWeight: 900,
    },
  ],
})

// Modern color system
const colors = {
  primary: '#5100f3',
  dark: '#1a1a1a',
  gray: {
    900: '#111111',
    800: '#1f1f1f',
    700: '#2e2e2e',
    600: '#525252',
    500: '#737373',
    400: '#a3a3a3',
    300: '#d4d4d4',
    200: '#e5e5e5',
    100: '#f5f5f5',
    50: '#fafafa',
  },
  white: '#ffffff',
  success: '#10b981',
  gradient: {
    start: '#d4fc79',
    end: '#96e6a1',
  }
}

// Modern typography system
const typography = {
  hero: { fontSize: 56, fontWeight: 900, letterSpacing: -2.5 },
  h1: { fontSize: 40, fontWeight: 700, letterSpacing: -1.8 },
  h2: { fontSize: 32, fontWeight: 700, letterSpacing: -1.2 },
  h3: { fontSize: 24, fontWeight: 600, letterSpacing: -0.8 },
  h4: { fontSize: 18, fontWeight: 600, letterSpacing: -0.4 },
  body: { fontSize: 12, fontWeight: 400, letterSpacing: 0 },
  bodyLarge: { fontSize: 14, fontWeight: 400, letterSpacing: 0 },
  caption: { fontSize: 10, fontWeight: 400, letterSpacing: 0.2 },
  micro: { fontSize: 8, fontWeight: 500, letterSpacing: 0.3 },
}

// Modern Pentagram-inspired styles
const styles = StyleSheet.create({
  // Base page
  page: {
    fontFamily: 'Inter',
    backgroundColor: colors.white,
    color: colors.dark,
  },

  // Modern cover page
  coverPage: {
    backgroundColor: colors.white,
    padding: 0,
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100%',
  },

  // Hero section with gradient
  heroSection: {
    background: `linear-gradient(120deg, ${colors.gradient.start} 0%, ${colors.gradient.end} 100%)`,
    backgroundColor: colors.gradient.end,
    padding: 80,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70%',
    position: 'relative',
  },

  heroContent: {
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 600,
  },

  brandLogo: {
    width: 120,
    height: 40,
    marginBottom: 60,
    objectFit: 'contain',
  },

  heroTitle: {
    ...typography.hero,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 20,
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },

  heroSubtitle: {
    ...typography.h4,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.9,
  },

  heroMeta: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.8,
  },

  // Cover stats section
  coverStats: {
    position: 'absolute',
    bottom: 80,
    left: 80,
    right: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  coverStatCard: {
    alignItems: 'center',
    flex: 1,
  },

  coverStatValue: {
    ...typography.h1,
    color: colors.white,
    fontWeight: 900,
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
  },

  coverStatLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },

  // Content pages
  contentPage: {
    padding: 60,
    backgroundColor: colors.white,
  },

  // Modern header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 60,
    paddingBottom: 30,
    borderBottom: `2px solid ${colors.gray[100]}`,
  },

  headerContent: {
    flex: 1,
  },

  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },

  headerLogo: {
    width: 80,
    height: 26,
    objectFit: 'contain',
  },

  headerTitle: {
    ...typography.h1,
    color: colors.dark,
    fontWeight: 900,
    letterSpacing: -1,
    marginBottom: 8,
  },

  headerSubtitle: {
    ...typography.bodyLarge,
    color: colors.gray[500],
    fontWeight: 400,
  },

  // Full-width sections
  fullWidthSection: {
    width: '100%',
    marginBottom: 50,
  },

  sectionTitle: {
    ...typography.h2,
    color: colors.dark,
    marginBottom: 40,
    fontWeight: 700,
    paddingBottom: 16,
    borderBottom: `4px solid ${colors.primary}`,
    display: 'inline-block',
  },

  sectionSubtitle: {
    ...typography.bodyLarge,
    color: colors.gray[600],
    marginBottom: 40,
    fontWeight: 400,
  },

  // Modern grid system
  modernGrid: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 40,
  },

  gridColumn: {
    flex: 1,
    minWidth: 0,
  },

  twoColumnGrid: {
    flexDirection: 'row',
    gap: 60,
    marginBottom: 50,
  },

  threeColumnGrid: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 40,
  },

  fourColumnGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },

  // Modern metric cards
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    flex: 1,
    minWidth: 160,
    border: `1px solid ${colors.gray[100]}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },

  metricCardPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 32,
    flex: 1,
    minWidth: 160,
    boxShadow: '0 12px 40px rgba(81, 0, 243, 0.25)',
  },

  metricLabel: {
    ...typography.caption,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },

  metricLabelWhite: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },

  metricValue: {
    ...typography.h1,
    color: colors.dark,
    fontWeight: 900,
    letterSpacing: -1,
  },

  metricValueWhite: {
    ...typography.h1,
    color: colors.white,
    fontWeight: 900,
    letterSpacing: -1,
  },

  metricDescription: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Data visualization
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    border: `1px solid ${colors.gray[100]}`,
    padding: 32,
    marginBottom: 32,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
  },

  chartTitle: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: 24,
    fontWeight: 700,
  },

  // Table design
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottom: `1px solid ${colors.gray[100]}`,
    minHeight: 56,
  },

  tableRowHeader: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginBottom: 8,
  },

  tableCell: {
    ...typography.body,
    color: colors.dark,
    flex: 1,
  },

  tableCellNumber: {
    ...typography.body,
    color: colors.gray[600],
    fontWeight: 600,
    textAlign: 'center',
    width: 40,
  },

  tableCellPercentage: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 700,
    textAlign: 'right',
    width: 80,
  },

  // Creator cards
  creatorCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    border: `1px solid ${colors.gray[100]}`,
    padding: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
  },

  creatorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    objectFit: 'cover',
    border: `3px solid ${colors.gray[100]}`,
  },

  creatorAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    border: `3px solid ${colors.gray[100]}`,
  },

  creatorAvatarText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: 700,
  },

  creatorInfo: {
    flex: 1,
  },

  creatorName: {
    ...typography.h4,
    color: colors.dark,
    marginBottom: 4,
    fontWeight: 600,
  },

  creatorHandle: {
    ...typography.body,
    color: colors.gray[500],
    marginBottom: 12,
  },

  creatorStats: {
    flexDirection: 'row',
    gap: 32,
  },

  creatorStat: {
    alignItems: 'flex-start',
  },

  creatorStatValue: {
    ...typography.body,
    color: colors.dark,
    fontWeight: 700,
  },

  creatorStatLabel: {
    ...typography.caption,
    color: colors.gray[500],
  },

  // Post cards
  postCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    border: `1px solid ${colors.gray[100]}`,
    overflow: 'hidden',
    marginBottom: 32,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
  },

  postImage: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
  },

  postImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  postImageIcon: {
    fontSize: 40,
    color: colors.gray[400],
  },

  postContent: {
    padding: 24,
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },

  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    objectFit: 'cover',
  },

  postAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  postAvatarText: {
    ...typography.micro,
    color: colors.white,
    fontWeight: 700,
  },

  postCreator: {
    flex: 1,
  },

  postCreatorName: {
    ...typography.body,
    color: colors.dark,
    fontWeight: 600,
  },

  postCreatorHandle: {
    ...typography.caption,
    color: colors.gray[500],
  },

  postCaption: {
    ...typography.body,
    color: colors.gray[700],
    lineHeight: 1.5,
    marginBottom: 16,
  },

  postMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTop: `1px solid ${colors.gray[100]}`,
  },

  postMetric: {
    alignItems: 'center',
  },

  postMetricValue: {
    ...typography.body,
    color: colors.dark,
    fontWeight: 700,
  },

  postMetricLabel: {
    ...typography.caption,
    color: colors.gray[500],
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTop: `1px solid ${colors.gray[100]}`,
  },

  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  footerLogo: {
    width: 60,
    height: 20,
    objectFit: 'contain',
  },

  footerText: {
    ...typography.caption,
    color: colors.gray[400],
  },

  pageNumber: {
    ...typography.caption,
    color: colors.gray[400],
    fontWeight: 600,
  },
})

// Types
interface ModernCampaignPDFData {
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
  aiInsights?: any
  images?: {
    logo?: string
    creatorProfiles?: Record<string, string>
    postThumbnails?: Record<string, string>
  }
}

// Utility functions
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const formatPercentage = (num: number): string => {
  return `${(num * 100).toFixed(2)}%`
}

// Main PDF Document Component
export const ModernCampaignPDFDocument: React.FC<{ data: ModernCampaignPDFData }> = ({ data }) => {
  const { campaign, stats, creators = [], posts = [], aiInsights, images } = data

  return (
    <Document>
      {/* MODERN COVER PAGE */}
      <Page size="A4" orientation="landscape" style={styles.coverPage}>
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            {images?.logo && (
              <PDFImage src={images.logo} style={styles.brandLogo} />
            )}

            <Text style={styles.heroTitle}>
              Campaign Performance Report
            </Text>

            <Text style={styles.heroTitle}>
              {campaign.name}
            </Text>

            <Text style={styles.heroSubtitle}>
              {campaign.brand_name}
            </Text>

            <Text style={styles.heroMeta}>
              {new Date(campaign.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>

          <View style={styles.coverStats}>
            <View style={styles.coverStatCard}>
              <Text style={styles.coverStatValue}>
                {formatNumber(stats?.totalReach || 0)}
              </Text>
              <Text style={styles.coverStatLabel}>TOTAL REACH</Text>
            </View>

            <View style={styles.coverStatCard}>
              <Text style={styles.coverStatValue}>
                {((stats?.avgEngagementRate || 0) * 100).toFixed(2)}%
              </Text>
              <Text style={styles.coverStatLabel}>ENGAGEMENT RATE</Text>
            </View>

            <View style={styles.coverStatCard}>
              <Text style={styles.coverStatValue}>{stats?.totalCreators || 0}</Text>
              <Text style={styles.coverStatLabel}>CREATORS</Text>
            </View>

            <View style={styles.coverStatCard}>
              <Text style={styles.coverStatValue}>{stats?.totalPosts || 0}</Text>
              <Text style={styles.coverStatLabel}>POSTS</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* EXECUTIVE SUMMARY PAGE */}
      <Page size="A4" orientation="landscape" style={[styles.page, styles.contentPage]}>
        <View style={styles.pageHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerBrand}>
              {images?.logo && (
                <PDFImage src={images.logo} style={styles.headerLogo} />
              )}
            </View>
            <Text style={styles.headerTitle}>Executive Summary</Text>
            <Text style={styles.headerSubtitle}>
              {campaign.name} • {campaign.brand_name}
            </Text>
          </View>
        </View>

        {/* Key Performance Metrics */}
        <View style={styles.fullWidthSection}>
          <Text style={styles.sectionTitle}>Key Performance Metrics</Text>

          <View style={styles.fourColumnGrid}>
            <View style={styles.metricCardPrimary}>
              <Text style={styles.metricLabelWhite}>ENGAGEMENT RATE</Text>
              <Text style={styles.metricValueWhite}>
                {((stats?.avgEngagementRate || 0) * 100).toFixed(2)}%
              </Text>
              <Text style={styles.metricLabelWhite}>Campaign average</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL REACH</Text>
              <Text style={styles.metricValue}>
                {formatNumber(stats?.totalReach || 0)}
              </Text>
              <Text style={styles.metricDescription}>Unique users</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL INTERACTIONS</Text>
              <Text style={styles.metricValue}>
                {formatNumber(stats?.totalInteractions || 0)}
              </Text>
              <Text style={styles.metricDescription}>Likes & comments</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>VIDEO VIEWS</Text>
              <Text style={styles.metricValue}>
                {formatNumber(stats?.totalVideoViews || 0)}
              </Text>
              <Text style={styles.metricDescription}>Reel plays</Text>
            </View>
          </View>
        </View>

        {/* Campaign Performance Breakdown */}
        <View style={styles.fullWidthSection}>
          <Text style={styles.sectionTitle}>Campaign Performance Breakdown</Text>

          <View style={styles.fourColumnGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL CREATORS</Text>
              <Text style={styles.metricValue}>{stats?.totalCreators || 0}</Text>
              <Text style={styles.metricDescription}>Active participants</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>CONTENT PIECES</Text>
              <Text style={styles.metricValue}>{stats?.totalPosts || 0}</Text>
              <Text style={styles.metricDescription}>Posts & reels</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>AVG. FOLLOWERS</Text>
              <Text style={styles.metricValue}>
                {formatNumber(creators.reduce((sum, c) => sum + c.followers_count, 0) / (creators.length || 1))}
              </Text>
              <Text style={styles.metricDescription}>Per creator</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>AVG. ENGAGEMENT</Text>
              <Text style={styles.metricValue}>
                {formatNumber((stats?.totalInteractions || 0) / (stats?.totalPosts || 1))}
              </Text>
              <Text style={styles.metricDescription}>Per post</Text>
            </View>
          </View>
        </View>

        {/* AI-Powered Insights */}
        {aiInsights && (
          <View style={styles.fullWidthSection}>
            <Text style={styles.sectionTitle}>AI-Powered Insights</Text>

            <View style={styles.fourColumnGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>DOMINANT SENTIMENT</Text>
                <Text style={styles.metricValue}>
                  {aiInsights.content_insights?.dominant_sentiment?.toUpperCase() || 'NEUTRAL'}
                </Text>
                <Text style={styles.metricDescription}>Content sentiment</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>VISUAL QUALITY</Text>
                <Text style={styles.metricValue}>
                  {aiInsights.content_insights?.avg_visual_quality?.toFixed(1) || '0.0'}/10
                </Text>
                <Text style={styles.metricDescription}>Aesthetic score</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>VIRAL POTENTIAL</Text>
                <Text style={styles.metricValue}>
                  {((aiInsights.content_insights?.viral_potential || 0) * 100).toFixed(0)}%
                </Text>
                <Text style={styles.metricDescription}>Virality score</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>AUTHENTICITY</Text>
                <Text style={styles.metricValue}>
                  {((aiInsights.content_insights?.avg_authenticity || 0) * 100).toFixed(1)}%
                </Text>
                <Text style={styles.metricDescription}>Content authenticity</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            {images?.logo && (
              <PDFImage src={images.logo} style={styles.footerLogo} />
            )}
            <Text style={styles.footerText}>© 2024 Following Analytics Platform</Text>
          </View>
          <Text style={styles.pageNumber}>Page 1</Text>
        </View>
      </Page>

      {/* Add more pages here... */}
    </Document>
  )
}

export default ModernCampaignPDFDocument