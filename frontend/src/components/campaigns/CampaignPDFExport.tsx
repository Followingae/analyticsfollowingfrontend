"use client"

import React, { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CleanCampaignPDFDocument } from './CleanCampaignPDF'

// Types for campaign data - Updated to match CompleteCampaignPDF structure
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
}

// Enhanced data structure with preloaded images
interface EnhancedCampaignPDFData extends CampaignPDFData {
  images?: {
    logo?: string
    creatorProfiles?: Record<string, string>
    postThumbnails?: Record<string, string>
  }
}

// Get absolute URL for images with fallback
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return `https://cdn.following.ae${url}`
  return `https://cdn.following.ae/${url}`
}

// Convert WebP to PNG using Canvas
const convertWebPToPNG = async (blob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          console.log('🔄 Converted WebP to PNG, size:', pngBlob.size)
          resolve(pngBlob)
        } else {
          reject(new Error('Failed to convert to PNG'))
        }
      }, 'image/png', 0.9)
    }

    img.onerror = () => reject(new Error('Failed to load image for conversion'))
    img.src = URL.createObjectURL(blob)
  })
}

// Convert image to base64 for @react-pdf/renderer - PROPER IMPLEMENTATION
const imageToBase64 = async (url: string): Promise<string> => {
  try {
    console.log('🖼️ Converting image to base64:', url)

    // For our CDN images, try a simple fetch first
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    })

    if (!response.ok) {
      console.error(`❌ Failed to fetch image: ${response.status}`)
      return ''
    }

    const blob = await response.blob()
    if (blob.size === 0) {
      console.warn('⚠️ Empty image blob')
      return ''
    }

    // Convert to base64
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => {
        console.error('❌ FileReader error')
        resolve('')
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('❌ Image conversion failed:', error)
    return ''
  }
}

// Use the brand logo directly from campaign data
const getBrandLogo = (logoUrl?: string): string => {
  if (!logoUrl) {
    console.log('📋 No brand logo available')
    return ''
  }

  console.log('📋 Using brand logo URL directly:', logoUrl)
  return logoUrl
}

// Export button component with modern styling
interface ExportButtonProps {
  data: CampaignPDFData
  className?: string
}

export const CampaignPDFExportButton: React.FC<ExportButtonProps> = ({ data, className }) => {
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleExport = async () => {
    setIsGenerating(true)
    try {
      console.log('🚀 Starting PDF export with image preloading...')

      // Preload all images first
      const images: { logo?: string; creatorProfiles?: Record<string, string>; postThumbnails?: Record<string, string> } = {}

      // Note: Logo will be added later if brand_logo_url is available

      // EMBED IMAGES FROM OUR CDN - These should work since they're our own images!
      console.log('📥 Downloading and embedding images from our CDN...')

      // Use creator profile image URLs directly
      console.log('👥 Processing creator profile images...', data.creators?.length || 0, 'creators')
      images.creatorProfiles = {}
      if (data.creators) {
        data.creators.forEach((creator) => {
          if (creator.profile_pic_url) {
            const imageUrl = getImageUrl(creator.profile_pic_url)
            console.log(`👤 Using profile URL for ${creator.username}:`, imageUrl)
            images.creatorProfiles![creator.username] = processImageUrl(imageUrl)
            console.log(`✅ Profile URL ready for ${creator.username}`)
          }
        })
      }

      // Use post thumbnail URLs directly
      console.log('🖼️ Processing post thumbnail images...', data.posts?.length || 0, 'posts')
      images.postThumbnails = {}
      if (data.posts) {
        data.posts.forEach((post) => {
          if (post.thumbnail) {
            const imageUrl = getImageUrl(post.thumbnail)
            console.log(`📷 Using thumbnail URL for post ${post.id}:`, imageUrl)
            images.postThumbnails![post.id] = processImageUrl(imageUrl)
            console.log(`✅ Thumbnail URL ready for post ${post.id}`)
          }
        })
      }

      // Add brand logo if available
      if (data.campaign.brand_logo_url) {
        console.log('📋 Using brand logo URL:', data.campaign.brand_logo_url)
        images.logo = getBrandLogo(data.campaign.brand_logo_url)
      }

      // Log image summary
      const readyCreatorImages = Object.keys(images.creatorProfiles || {}).length
      const readyPostImages = Object.keys(images.postThumbnails || {}).length
      console.log('📊 Image URL summary:')
      console.log('  📷 Brand logo:', images.logo ? '✅ Ready' : '❌ Not available')
      console.log(`  👥 Creator profiles: ${readyCreatorImages}/${data.creators?.length || 0}`)
      console.log(`  🖼️ Post thumbnails: ${readyPostImages}/${data.posts?.length || 0}`)

      // Generate PDF with preloaded images using CompleteCampaignPDFDocument
      const enhancedData: EnhancedCampaignPDFData = {
        ...data,
        images
      }

      const fileName = `${data.campaign.name.replace(/\s+/g, '_')}_Campaign_Report_${new Date()
        .toISOString()
        .split('T')[0]}.pdf`

      console.log('📄 Generating PDF with CleanCampaignPDFDocument...')
      const doc = <CleanCampaignPDFDocument data={enhancedData} />
      const pdfBlob = await pdf(doc).toBlob()

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('✅ PDF export completed successfully!')

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

// Direct download function for API usage
export const downloadCampaignPDF = async (data: CampaignPDFData) => {
  console.log('🚀 Starting direct PDF export with image preloading...')

  // Preload all images
  const images: { logo?: string; creatorProfiles?: Record<string, string>; postThumbnails?: Record<string, string> } = {}

  // Use brand logo directly if available
  if (data.campaign.brand_logo_url) {
    console.log('📋 Using brand logo URL for direct export:', data.campaign.brand_logo_url)
    images.logo = getBrandLogo(data.campaign.brand_logo_url)
  }

  // Use creator profile URLs directly
  console.log('👥 Processing creator profiles for direct export...')
  images.creatorProfiles = {}
  if (data.creators) {
    data.creators.forEach((creator) => {
      if (creator.profile_pic_url) {
        const imageUrl = getImageUrl(creator.profile_pic_url)
        images.creatorProfiles[creator.username] = processImageUrl(imageUrl)
        console.log(`✅ Profile URL ready for ${creator.username}`)
      }
    })
  }

  // Use post thumbnail URLs directly
  console.log('🖼️ Processing post thumbnails for direct export...')
  images.postThumbnails = {}
  if (data.posts) {
    data.posts.forEach((post) => {
      if (post.thumbnail) {
        const imageUrl = getImageUrl(post.thumbnail)
        images.postThumbnails[post.id] = processImageUrl(imageUrl)
        console.log(`✅ Thumbnail URL ready for post ${post.id}`)
      }
    })
  }

  // Create enhanced data with embedded images
  const enhancedData: EnhancedCampaignPDFData = {
    ...data,
    images
  }

  const fileName = `${data.campaign.name.replace(/\s+/g, '_')}_Campaign_Report_${new Date()
    .toISOString()
    .split('T')[0]}.pdf`

  console.log('📄 Generating PDF with CleanCampaignPDFDocument for direct export...')
  const blob = await pdf(<CleanCampaignPDFDocument data={enhancedData} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)

  console.log('✅ Direct PDF export completed!')
}

export default CampaignPDFExportButton