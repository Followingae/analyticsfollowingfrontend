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

// Colors
const colors = {
  primary: '#5100f3',
  dark: '#1a1a1a',
  gray: {
    900: '#111111',
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

// Typography
const typography = {
  hero: { fontSize: 48, fontWeight: 900, letterSpacing: -2 },
  h1: { fontSize: 36, fontWeight: 700, letterSpacing: -1.5 },
  h2: { fontSize: 28, fontWeight: 700, letterSpacing: -1 },
  h3: { fontSize: 20, fontWeight: 600, letterSpacing: -0.5 },
  h4: { fontSize: 16, fontWeight: 600 },
  body: { fontSize: 11, fontWeight: 400 },
  bodyLarge: { fontSize: 13, fontWeight: 400 },
  caption: { fontSize: 9, fontWeight: 400 },
  micro: { fontSize: 8, fontWeight: 500 },
}

// Professional PDF styles with proper spacing and page breaks
const styles = StyleSheet.create({
  // Base page - Optimized for 16:9 landscape
  page: {
    fontFamily: 'Inter',
    backgroundColor: colors.white,
    color: colors.dark,
    padding: 30,
    paddingTop: 20,
    paddingBottom: 60,
    fontSize: 11,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },

  // Cover page - Pentagram-inspired bold design
  coverPage: {
    backgroundColor: colors.white,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },

  // Hero section - Bold asymmetric layout
  heroSection: {
    backgroundColor: colors.white,
    flex: 1,
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
  },

  // Left column - Content area
  heroLeftColumn: {
    width: '60%',
    padding: 80,
    paddingRight: 40,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    zIndex: 2,
  },

  // Right column - Visual accent
  heroRightColumn: {
    width: '40%',
    backgroundColor: colors.primary,
    position: 'relative',
    overflow: 'hidden',
  },

  // Geometric accent elements
  geometricAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${colors.primary} 0%, #6d3df0 100%)`,
  },

  brandLogoHero: {
    width: 240,
    height: 80,
    marginBottom: 60,
    objectFit: 'contain',
  },

  heroOverline: {
    ...typography.caption,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 3,
    fontWeight: 700,
    marginBottom: 16,
    fontSize: 10,
  },

  heroTitle: {
    fontSize: 72,
    fontWeight: 900,
    color: colors.dark,
    lineHeight: 0.85,
    marginBottom: 24,
    letterSpacing: -3,
  },

  heroSubtitle: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.gray[700],
    lineHeight: 1.1,
    marginBottom: 32,
    letterSpacing: -1,
  },

  heroMeta: {
    ...typography.h4,
    color: colors.gray[500],
    marginBottom: 60,
    fontWeight: 500,
  },

  // Cover stats - Modern grid
  coverStats: {
    display: 'flex',
    flexDirection: 'row',
    gap: 0,
    width: '100%',
  },

  coverStatCard: {
    flex: 1,
    padding: 0,
    marginRight: 32,
  },

  coverStatValue: {
    fontSize: 64,
    fontWeight: 900,
    color: colors.dark,
    lineHeight: 0.8,
    marginBottom: 8,
    letterSpacing: -2,
  },

  coverStatLabel: {
    ...typography.caption,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 600,
    fontSize: 9,
  },

  // Accent text on right panel
  rightPanelContent: {
    position: 'absolute',
    bottom: 80,
    left: 40,
    right: 40,
    color: colors.white,
  },

  rightPanelTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 16,
    letterSpacing: -1,
    opacity: 0.9,
  },

  rightPanelText: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    lineHeight: 1.4,
  },

  // Page header - Compact for more content space
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: `2px solid ${colors.gray[100]}`,
    minHeight: 50,
  },

  headerContent: {
    flex: 1,
  },

  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  headerLogo: {
    width: 100,
    height: 33,
    objectFit: 'contain',
  },

  headerTitle: {
    ...typography.h1,
    color: colors.dark,
    marginBottom: 4,
  },

  headerSubtitle: {
    ...typography.bodyLarge,
    color: colors.gray[500],
  },

  // Content container - Fixed height to prevent overflow
  contentContainer: {
    flex: 1,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
  },

  // Section styles - Constrained height
  section: {
    marginBottom: 16,
    width: '100%',
    maxHeight: '50%',
  },

  sectionTitle: {
    ...typography.h2,
    color: colors.dark,
    marginBottom: 12,
    paddingBottom: 4,
    borderBottom: `3px solid ${colors.primary}`,
  },

  sectionSubtitle: {
    ...typography.bodyLarge,
    color: colors.gray[600],
    marginBottom: 12,
  },

  // Grid layouts - Compact
  fourColumnGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
    width: '100%',
    maxHeight: '140px',
    flexWrap: 'nowrap',
  },

  twoColumnGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    width: '100%',
  },

  threeColumnGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    width: '100%',
  },

  gridColumn: {
    flex: 1,
  },

  // Metric cards - Compact sizing
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: 10,
    flex: 1,
    minWidth: 100,
    maxWidth: 180,
    maxHeight: 120,
    border: `1px solid ${colors.gray[100]}`,
    overflow: 'hidden',
  },

  metricCardPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    padding: 10,
    flex: 1,
    minWidth: 100,
    maxWidth: 180,
    maxHeight: 120,
    overflow: 'hidden',
  },

  metricLabel: {
    ...typography.caption,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontSize: 8,
  },

  metricLabelWhite: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontSize: 8,
  },

  metricValue: {
    ...typography.h3,
    color: colors.dark,
    fontWeight: 900,
    marginBottom: 4,
  },

  metricValueWhite: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 900,
    marginBottom: 4,
  },

  metricDescription: {
    ...typography.caption,
    color: colors.gray[500],
    fontSize: 8,
  },

  metricDescriptionWhite: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.7,
    fontSize: 8,
  },

  // Creator cards - Left-aligned 20 per page (5 columns x 4 rows)
  creatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    width: '100%',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },

  creatorCard: {
    backgroundColor: colors.white,
    borderRadius: 6,
    border: `1px solid ${colors.gray[100]}`,
    padding: 6,
    width: '18.8%', // 5 columns with small gaps - reduced to prevent overflow
    height: 85, // Fixed height instead of percentage
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },

  creatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    objectFit: 'cover',
    marginBottom: 3,
    border: `1px solid ${colors.gray[100]}`,
  },

  creatorAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },

  creatorAvatarText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 700,
    fontSize: 8,
  },

  creatorInfo: {
    alignItems: 'center',
    width: '100%',
  },

  creatorName: {
    ...typography.caption,
    color: colors.dark,
    marginBottom: 2,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: 700,
    lineHeight: 1.1,
  },

  creatorHandle: {
    ...typography.micro,
    color: colors.gray[500],
    marginBottom: 3,
    textAlign: 'center',
    fontSize: 6,
    lineHeight: 1.1,
  },

  creatorStats: {
    alignItems: 'center',
  },

  creatorStat: {
    alignItems: 'center',
  },

  creatorStatValue: {
    ...typography.micro,
    color: colors.dark,
    fontWeight: 700,
    fontSize: 7,
    textAlign: 'center',
    lineHeight: 1.1,
  },

  creatorStatLabel: {
    ...typography.micro,
    color: colors.gray[500],
    fontSize: 5,
    textAlign: 'center',
    lineHeight: 1.1,
  },

  // Post cards - Left-aligned 6 per page (3 columns x 2 rows)
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },

  postCard: {
    backgroundColor: colors.white,
    borderRadius: 6,
    border: `1px solid ${colors.gray[100]}`,
    overflow: 'hidden',
    width: '31.5%', // 3 columns with small gaps - reduced to prevent overflow
    height: 280, // Fixed height for 4:5 portrait ratio + content
    marginBottom: 6,
  },

  postImage: {
    width: '100%',
    height: 200, // 4:5 portrait ratio: for 160px width = 200px height (160 × 5/4)
    objectFit: 'cover',
  },

  postImagePlaceholder: {
    width: '100%',
    height: 200, // 4:5 portrait ratio: for 160px width = 200px height
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  postImageIcon: {
    fontSize: 20,
    color: colors.gray[400],
  },

  postContent: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },

  postAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    objectFit: 'cover',
  },

  postAvatarFallback: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  postAvatarText: {
    ...typography.micro,
    color: colors.white,
    fontWeight: 700,
    fontSize: 5,
  },

  postCreator: {
    flex: 1,
  },

  postCreatorName: {
    ...typography.caption,
    color: colors.dark,
    fontWeight: 600,
    fontSize: 7,
  },

  postCreatorHandle: {
    ...typography.micro,
    color: colors.gray[500],
    fontSize: 6,
  },

  postCaption: {
    ...typography.micro,
    color: colors.gray[700],
    lineHeight: 1.3,
    marginBottom: 8,
    fontSize: 7,
    flex: 1,
  },

  postMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTop: `1px solid ${colors.gray[100]}`,
    marginTop: 'auto',
  },

  postMetric: {
    alignItems: 'center',
  },

  postMetricValue: {
    ...typography.micro,
    color: colors.dark,
    fontWeight: 600,
    fontSize: 6,
  },

  postMetricLabel: {
    ...typography.micro,
    color: colors.gray[500],
    fontSize: 5,
  },

  // Table styles - Compact for better fit
  table: {
    marginBottom: 12,
    maxHeight: 140, // Prevent overflow
    overflow: 'hidden',
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottom: `1px solid ${colors.gray[100]}`,
    minHeight: 28,
  },

  tableCell: {
    ...typography.body,
    color: colors.dark,
    flex: 1,
    fontSize: 11,
    fontWeight: 500,
  },

  tableCellCenter: {
    ...typography.body,
    color: colors.gray[600],
    textAlign: 'center',
    width: 30,
    fontSize: 10,
    fontWeight: 600,
  },

  tableCellRight: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 700,
    textAlign: 'right',
    width: 60,
    fontSize: 11,
  },

  // Data containers - Compact
  dataContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    border: `1px solid ${colors.gray[100]}`,
    padding: 10,
    marginBottom: 10,
    width: '100%',
    maxHeight: 200, // Prevent overflow
    overflow: 'hidden',
  },

  dataTitle: {
    ...typography.h4,
    color: colors.dark,
    marginBottom: 12,
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: -0.25,
  },

  // Footer - Fixed positioning for 16:9 landscape
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTop: `1px solid ${colors.gray[100]}`,
    height: 30,
  },

  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  footerLogo: {
    width: 80,
    height: 26,
    objectFit: 'contain',
  },

  footerText: {
    ...typography.caption,
    color: colors.gray[400],
    fontSize: 8,
  },

  pageNumber: {
    ...typography.caption,
    color: colors.gray[400],
    fontWeight: 600,
    fontSize: 8,
  },
})

// Types
interface CompleteCampaignPDFData {
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

const cleanText = (text: string | null | undefined, maxLength: number = 200, addEllipsis: boolean = true): string => {
  if (!text) return ''
  try {
    let cleanedText = text
      .replace(/\u00A0/g, ' ')
      .replace(/[\u2000-\u206F]/g, ' ')
      .replace(/[\u2E00-\u2E7F]/g, '')
      .replace(/[\uD800-\uDFFF]/g, '')
      .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (cleanedText.length <= maxLength) {
      return cleanedText
    }

    if (addEllipsis) {
      // Find the last space before maxLength to avoid cutting words
      const truncated = cleanedText.substring(0, maxLength - 3)
      const lastSpace = truncated.lastIndexOf(' ')

      // If there's a space, cut at the space, otherwise cut at maxLength-3
      const cutPoint = lastSpace > 0 ? lastSpace : maxLength - 3
      return cleanedText.substring(0, cutPoint) + '...'
    }

    return cleanedText.substring(0, maxLength)
  } catch (error) {
    const fallback = String(text)
    const fallbackLength = Math.min(maxLength, 100)
    return fallback.length <= fallbackLength ? fallback :
           (addEllipsis ? fallback.substring(0, fallbackLength - 3) + '...' : fallback.substring(0, fallbackLength))
  }
}

const filterValidCities = (cities: Record<string, number>) => {
  if (!cities || Object.keys(cities).length === 0) {
    return [['No data available', 0]]
  }

  // First pass: get cities with basic validation
  const basicFiltered = Object.entries(cities).filter(([city, percentage]) => {
    return city &&
      city.trim().length > 0 &&
      city.trim().length < 50 &&
      city !== 'Edited' &&
      city !== 'null' &&
      city !== 'undefined' &&
      !city.match(/^[A-Z]{1,3}$/) &&
      typeof percentage === 'number' &&
      percentage > 0 &&
      percentage <= 100
  })

  // Second pass: remove obvious invalid entries but be less aggressive
  const cleanFiltered = basicFiltered.filter(([city]) => {
    const cityLower = city.toLowerCase()
    return !cityLower.includes('recalling') &&
           !cityLower.includes('operation') &&
           !cityLower.includes('1914') &&
           !cityLower.includes('internment')
  })

  // If we have good entries, return them
  if (cleanFiltered.length >= 3) {
    return cleanFiltered.slice(0, 5)
  }

  // If we don't have enough clean entries, fall back to basic filtered
  if (basicFiltered.length >= 3) {
    return basicFiltered.slice(0, 5)
  }

  // Last resort: return any available entries or placeholder
  const anyEntries = Object.entries(cities)
    .filter(([city, percentage]) => city && city.trim().length > 0 && typeof percentage === 'number')
    .slice(0, 3)

  return anyEntries.length > 0 ? anyEntries : [['Data not available', 0]]
}

// Main PDF Document Component
export const CompleteCampaignPDFDocument: React.FC<{ data: CompleteCampaignPDFData }> = ({ data }) => {
  const { campaign, stats, creators = [], posts = [], aiInsights, images } = data

  // Calculate creator pages (20 per page: 5 columns x 4 rows)
  const creatorsPerPage = 20
  const creatorPages = creators.length > 0 ? Math.ceil(creators.length / creatorsPerPage) : 0

  // Calculate post pages (6 per page: 3 columns x 2 rows)
  const postsPerPage = 6
  const postPages = posts.length > 0 ? Math.ceil(posts.length / postsPerPage) : 0

  return (
    <Document>
      {/* COVER PAGE - Bold Pentagram-Inspired Design */}
      <Page size="A4" orientation="landscape" style={styles.coverPage}>
        <View style={styles.heroSection}>
          {/* Left Column - Main Content */}
          <View style={styles.heroLeftColumn}>
            {images?.logo ? (
              <PDFImage src={images.logo} style={styles.brandLogoHero} />
            ) : (
              <Text style={{fontSize: 32, fontWeight: 900, marginBottom: 60}}>Following</Text>
            )}

            <Text style={styles.heroOverline}>
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

            {/* Key Metrics Grid */}
            <View style={styles.coverStats}>
              <View style={styles.coverStatCard}>
                <Text style={styles.coverStatValue}>
                  {formatNumber(stats?.totalReach || 0)}
                </Text>
                <Text style={styles.coverStatLabel}>TOTAL REACH</Text>
              </View>

              <View style={styles.coverStatCard}>
                <Text style={styles.coverStatValue}>
                  {((stats?.avgEngagementRate || 0) * 100).toFixed(1)}%
                </Text>
                <Text style={styles.coverStatLabel}>ENGAGEMENT</Text>
              </View>
            </View>
          </View>

          {/* Right Column - Visual Accent */}
          <View style={styles.heroRightColumn}>
            <View style={styles.geometricAccent} />

            <View style={styles.rightPanelContent}>
              <Text style={styles.rightPanelTitle}>
                Data-Driven Insights
              </Text>
              <Text style={styles.rightPanelText}>
                Comprehensive analytics covering {stats?.totalCreators || 0} creators, {stats?.totalPosts || 0} posts, and {formatNumber(stats?.totalReach || 0)} total reach across social platforms.
              </Text>
            </View>
          </View>
        </View>
      </Page>

      {/* EXECUTIVE SUMMARY PAGE */}
      <Page size="A4" orientation="landscape" style={styles.page}>
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

        <View style={styles.contentContainer}>
          {/* Key Performance Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Performance Metrics</Text>

            <View style={styles.fourColumnGrid}>
              <View style={styles.metricCardPrimary}>
                <Text style={styles.metricLabelWhite}>ENGAGEMENT RATE</Text>
                <Text style={styles.metricValueWhite}>
                  {stats?.avgEngagementRate && stats.avgEngagementRate > 0
                    ? (stats.avgEngagementRate * 100).toFixed(2) + '%'
                    : '0.00%'
                  }
                </Text>
                <Text style={styles.metricDescriptionWhite}>Campaign average</Text>
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
          <View style={styles.section}>
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
                  {creators.length > 0
                    ? formatNumber(Math.round(creators.reduce((sum, c) => sum + c.followers_count, 0) / creators.length))
                    : '0'
                  }
                </Text>
                <Text style={styles.metricDescription}>Per creator</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>AVG. ENGAGEMENT</Text>
                <Text style={styles.metricValue}>
                  {stats?.totalPosts && stats.totalPosts > 0
                    ? formatNumber(Math.round((stats?.totalInteractions || 0) / stats.totalPosts))
                    : '0'
                  }
                </Text>
                <Text style={styles.metricDescription}>Per post</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            {images?.logo ? (
              <PDFImage src={images.logo} style={styles.footerLogo} />
            ) : (
              <Text style={{...styles.footerText, fontSize: 12, fontWeight: 600}}>Following</Text>
            )}
            <Text style={styles.footerText}>© 2024 Following Analytics Platform</Text>
          </View>
          <Text style={styles.pageNumber}>Page 1</Text>
        </View>
      </Page>

      {/* AI INSIGHTS PAGE */}
      {aiInsights && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.pageHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerBrand}>
                {images?.logo ? (
                  <PDFImage src={images.logo} style={styles.headerLogo} />
                ) : (
                  <Text style={{...styles.headerTitle, fontSize: 18}}>Following</Text>
                )}
              </View>
              <Text style={styles.headerTitle}>AI-Powered Insights</Text>
              <Text style={styles.headerSubtitle}>Content Analysis & Performance Predictions</Text>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Content Intelligence</Text>

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
          </View>

          <View style={styles.footer}>
            <View style={styles.footerBrand}>
              {images?.logo && (
                <PDFImage src={images.logo} style={styles.footerLogo} />
              )}
              <Text style={styles.footerText}>© 2024 Following Analytics Platform</Text>
            </View>
            <Text style={styles.pageNumber}>Page 1.5</Text>
          </View>
        </Page>
      )}

      {/* AUDIENCE ANALYTICS PAGE */}
      {aiInsights && aiInsights.audience_insights?.available && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.pageHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerBrand}>
                {images?.logo ? (
                  <PDFImage src={images.logo} style={styles.headerLogo} />
                ) : (
                  <Text style={{...styles.headerTitle, fontSize: 18}}>Following</Text>
                )}
              </View>
              <Text style={styles.headerTitle}>Audience Analytics</Text>
              <Text style={styles.headerSubtitle}>Demographic and Geographic Insights</Text>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.twoColumnGrid}>
              {/* Demographics Column */}
              <View style={styles.gridColumn}>
                <Text style={styles.sectionTitle}>Demographics</Text>

                {/* Age Distribution */}
                {aiInsights.audience_insights.demographic_insights?.estimated_age_groups && (
                  <View style={styles.dataContainer}>
                    <Text style={styles.dataTitle}>Age Distribution</Text>
                    <View style={styles.table}>
                      {Object.entries(aiInsights.audience_insights.demographic_insights.estimated_age_groups)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([age, percentage], index) => (
                          <View key={age} style={styles.tableRow}>
                            <Text style={styles.tableCell}>{age} years</Text>
                            <Text style={styles.tableCellRight}>
                              {typeof percentage === 'number' && percentage > 0
                                ? (percentage * 100).toFixed(1) + '%'
                                : '0.0%'
                              }
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                )}

                {/* Gender Distribution */}
                {aiInsights.audience_insights.demographic_insights?.estimated_gender_split && (
                  <View style={styles.dataContainer}>
                    <Text style={styles.dataTitle}>Gender Distribution</Text>
                    <View style={styles.twoColumnGrid}>
                      {Object.entries(aiInsights.audience_insights.demographic_insights.estimated_gender_split)
                        .filter(([gender]) => {
                          const g = gender.toLowerCase()
                          return g === 'male' || g === 'female' || g === 'man' || g === 'woman'
                        })
                        .map(([gender, percentage]) => {
                          const genderLower = gender.toLowerCase()
                          const displayName = (genderLower === 'female' || genderLower === 'woman') ? 'FEMALE' : 'MALE'
                          return (
                            <View key={gender} style={styles.metricCard}>
                              <Text style={styles.metricLabel}>{displayName}</Text>
                              <Text style={styles.metricValue}>
                                {typeof percentage === 'number' && percentage > 0
                                  ? (percentage * 100).toFixed(1) + '%'
                                  : '0.0%'
                                }
                              </Text>
                            </View>
                          )
                        })}
                    </View>
                  </View>
                )}
              </View>

              {/* Geographic Column */}
              <View style={styles.gridColumn}>
                <Text style={styles.sectionTitle}>Geographic Reach</Text>

                {/* Top Countries */}
                {aiInsights.audience_insights.geographic_analysis?.top_countries && (
                  <View style={styles.dataContainer}>
                    <Text style={styles.dataTitle}>Top Countries</Text>
                    <View style={styles.table}>
                      {Object.entries(aiInsights.audience_insights.geographic_analysis.top_countries)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([country, percentage], index) => (
                          <View key={country} style={styles.tableRow}>
                            <Text style={styles.tableCellCenter}>{index + 1}</Text>
                            <Text style={styles.tableCell}>{cleanText(country, 25)}</Text>
                            <Text style={styles.tableCellRight}>
                              {typeof percentage === 'number' && percentage > 0
                                ? percentage.toFixed(1) + '%'
                                : '0.0%'
                              }
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                )}

                {/* Top Cities */}
                {aiInsights.audience_insights.geographic_analysis?.top_cities && (
                  <View style={styles.dataContainer}>
                    <Text style={styles.dataTitle}>Top Cities</Text>
                    <View style={styles.table}>
                      {filterValidCities(aiInsights.audience_insights.geographic_analysis.top_cities)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 3) // Limit to 3 entries to prevent overflow
                        .map(([city, percentage], index) => (
                          <View key={city} style={styles.tableRow}>
                            <Text style={styles.tableCellCenter}>{index + 1}</Text>
                            <Text style={styles.tableCell}>{cleanText(city, 20)}</Text>
                            <Text style={styles.tableCellRight}>
                              {typeof percentage === 'number' && percentage > 0
                                ? percentage.toFixed(1) + '%'
                                : '0.0%'
                              }
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerBrand}>
              {images?.logo && (
                <PDFImage src={images.logo} style={styles.footerLogo} />
              )}
              <Text style={styles.footerText}>© 2024 Following Analytics Platform</Text>
            </View>
            <Text style={styles.pageNumber}>Page 2</Text>
          </View>
        </Page>
      )}

      {/* CREATOR PERFORMANCE PAGES (20 per page) */}
      {creators.length > 0 && Array.from({ length: creatorPages }).map((_, pageIndex) => (
        <Page key={`creators-${pageIndex}`} size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.pageHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerBrand}>
                {images?.logo ? (
                  <PDFImage src={images.logo} style={styles.headerLogo} />
                ) : (
                  <Text style={{...styles.headerTitle, fontSize: 18}}>Following</Text>
                )}
              </View>
              <Text style={styles.headerTitle}>Participating Creators</Text>
              <Text style={styles.headerSubtitle}>
                {pageIndex === 0 ? 'Campaign Contributors' : `Creators (Page ${pageIndex + 1})`}
              </Text>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.creatorsGrid}>
              {creators
                .slice(pageIndex * creatorsPerPage, (pageIndex + 1) * creatorsPerPage)
                .map((creator) => (
                  <View key={creator.username} style={styles.creatorCard}>
                    {images?.creatorProfiles?.[creator.username] ? (
                      <PDFImage
                        style={styles.creatorAvatar}
                        src={images.creatorProfiles[creator.username]}
                      />
                    ) : (
                      <View style={styles.creatorAvatarFallback}>
                        <Text style={styles.creatorAvatarText}>
                          {creator.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.creatorInfo}>
                      <Text style={styles.creatorName}>{cleanText(creator.full_name, 20)}</Text>
                      <Text style={styles.creatorHandle}>@{creator.username}</Text>
                      <View style={styles.creatorStats}>
                        <Text style={styles.creatorStatValue}>{formatNumber(creator.followers_count)}</Text>
                        <Text style={styles.creatorStatLabel}>followers</Text>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerBrand}>
              {images?.logo && (
                <PDFImage src={images.logo} style={styles.footerLogo} />
              )}
              <Text style={styles.footerText}>© 2024 Following Analytics Platform</Text>
            </View>
            <Text style={styles.pageNumber}>Page {3 + pageIndex}</Text>
          </View>
        </Page>
      ))}

      {/* CONTENT PERFORMANCE PAGES (6 per page) */}
      {posts.length > 0 && Array.from({ length: postPages }).map((_, pageIndex) => (
        <Page key={`posts-${pageIndex}`} size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.pageHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerBrand}>
                {images?.logo ? (
                  <PDFImage src={images.logo} style={styles.headerLogo} />
                ) : (
                  <Text style={{...styles.headerTitle, fontSize: 18}}>Following</Text>
                )}
              </View>
              <Text style={styles.headerTitle}>Posts from this Campaign</Text>
              <Text style={styles.headerSubtitle}>
                {pageIndex === 0 ? 'Campaign Content' : `Posts (Page ${pageIndex + 1})`}
              </Text>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.postsGrid}>
              {posts
                .slice(pageIndex * postsPerPage, (pageIndex + 1) * postsPerPage)
                .map((post) => (
                  <View key={post.id} style={styles.postCard}>
                    {images?.postThumbnails?.[post.id] ? (
                      <PDFImage
                        style={styles.postImage}
                        src={images.postThumbnails[post.id]}
                      />
                    ) : (
                      <View style={styles.postImagePlaceholder}>
                        <Text style={styles.postImageIcon}>
                          {post.type === 'reel' ? '📹' : '📷'}
                        </Text>
                      </View>
                    )}

                    <View style={styles.postContent}>
                      <View style={styles.postHeader}>
                        {images?.creatorProfiles?.[post.creator_username] ? (
                          <PDFImage
                            style={styles.postAvatar}
                            src={images.creatorProfiles[post.creator_username]}
                          />
                        ) : (
                          <View style={styles.postAvatarFallback}>
                            <Text style={styles.postAvatarText}>
                              {post.creator_full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.postCreator}>
                          <Text style={styles.postCreatorName}>{cleanText(post.creator_full_name, 15)}</Text>
                          <Text style={styles.postCreatorHandle}>@{post.creator_username}</Text>
                        </View>
                      </View>

                      {post.caption && (
                        <Text style={styles.postCaption}>
                          {cleanText(post.caption, 120)}
                        </Text>
                      )}

                      <View style={styles.postMetrics}>
                        <View style={styles.postMetric}>
                          <Text style={styles.postMetricValue}>{formatNumber(post.likes)}</Text>
                          <Text style={styles.postMetricLabel}>likes</Text>
                        </View>
                        <View style={styles.postMetric}>
                          <Text style={styles.postMetricValue}>{formatNumber(post.comments)}</Text>
                          <Text style={styles.postMetricLabel}>comments</Text>
                        </View>
                        <View style={styles.postMetric}>
                          <Text style={styles.postMetricValue}>
                            {((post.engagementRate || 0) * 100).toFixed(1)}%
                          </Text>
                          <Text style={styles.postMetricLabel}>eng. rate</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerBrand}>
              {images?.logo && (
                <PDFImage src={images.logo} style={styles.footerLogo} />
              )}
              <Text style={styles.footerText}>© 2024 Following Analytics Platform</Text>
            </View>
            <Text style={styles.pageNumber}>Page {3 + creatorPages + pageIndex}</Text>
          </View>
        </Page>
      ))}
    </Document>
  )
}

export default CompleteCampaignPDFDocument