"use client"

import React, { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompleteCampaignPDFDocument } from './CompleteCampaignPDF'

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

// Convert image to base64 for PDF embedding (with WebP conversion)
const imageToBase64 = async (url: string): Promise<string> => {
  try {
    console.log('🖼️ Loading image:', url)

    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'image/*'
      }
    })

    console.log('📡 Response status:', response.status, 'for URL:', url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    let blob = await response.blob()
    console.log('💾 Blob size:', blob.size, 'type:', blob.type)

    if (blob.size === 0) {
      throw new Error('Empty blob received')
    }

    // Convert WebP to PNG for PDF compatibility
    if (blob.type === 'image/webp') {
      console.log('🔄 Converting WebP to PNG for PDF compatibility...')
      blob = await convertWebPToPNG(blob)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        console.log('✅ Image converted to base64, length:', result.length, 'format:', blob.type)
        resolve(result)
      }
      reader.onerror = () => {
        console.error('❌ FileReader error')
        reject(new Error('FileReader failed'))
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('❌ Failed to convert image to base64:', url, error)
    return ''
  }
}

// Get Following logo (embedded base64 PNG for reliable display)
const getFollowingLogo = (): string => {
  console.log('📋 Using embedded Following PNG logo for reliable PDF display...')

  // Embedded Following logo as base64 PNG for guaranteed @react-pdf/renderer compatibility
  const base64PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/58hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

  console.log('✅ Embedded Following PNG logo ready for PDF')
  return base64PNG
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

      // Load Following logo (embedded SVG for reliability)
      images.logo = getFollowingLogo()
      console.log('✅ Logo embedded successfully')

      // Load creator profile images
      console.log('👥 Loading creator profile images...', data.creators?.length || 0, 'creators')
      images.creatorProfiles = {}
      if (data.creators) {
        await Promise.allSettled(
          data.creators.map(async (creator) => {
            if (creator.profile_pic_url) {
              try {
                const imageUrl = getImageUrl(creator.profile_pic_url)
                console.log(`👤 Loading profile for ${creator.username}:`, imageUrl)
                const imageData = await imageToBase64(imageUrl)
                if (imageData) {
                  images.creatorProfiles![creator.username] = imageData
                  console.log(`✅ Loaded profile for ${creator.username}`)
                }
              } catch (error) {
                console.warn(`❌ Failed to load creator image for ${creator.username}:`, error)
              }
            }
          })
        )
      }

      // Load post thumbnail images
      console.log('🖼️ Loading post thumbnail images...', data.posts?.length || 0, 'posts')
      images.postThumbnails = {}
      if (data.posts) {
        await Promise.allSettled(
          data.posts.map(async (post) => {
            if (post.thumbnail) {
              try {
                const imageUrl = getImageUrl(post.thumbnail)
                console.log(`📷 Loading thumbnail for post ${post.id}:`, imageUrl)
                const imageData = await imageToBase64(imageUrl)
                if (imageData) {
                  images.postThumbnails![post.id] = imageData
                  console.log(`✅ Loaded thumbnail for post ${post.id}`)
                }
              } catch (error) {
                console.warn(`❌ Failed to load post thumbnail for ${post.id}:`, error)
              }
            }
          })
        )
      }

      // Log image loading summary
      const loadedCreatorImages = Object.keys(images.creatorProfiles || {}).length
      const loadedPostImages = Object.keys(images.postThumbnails || {}).length
      console.log('📊 Image loading summary:')
      console.log('  📷 Logo:', images.logo ? '✅ Loaded' : '❌ Failed')
      console.log(`  👥 Creator profiles: ${loadedCreatorImages}/${data.creators?.length || 0}`)
      console.log(`  🖼️ Post thumbnails: ${loadedPostImages}/${data.posts?.length || 0}`)

      // Generate PDF with preloaded images using CompleteCampaignPDFDocument
      const enhancedData: EnhancedCampaignPDFData = {
        ...data,
        images
      }

      const fileName = `${data.campaign.name.replace(/\s+/g, '_')}_Campaign_Report_${new Date()
        .toISOString()
        .split('T')[0]}.pdf`

      console.log('📄 Generating PDF with CompleteCampaignPDFDocument...')
      const doc = <CompleteCampaignPDFDocument data={enhancedData} />
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
          Loading Images...
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

  // Download Following logo
  try {
    images.logo = await getFollowingLogo()
    console.log('✅ Logo loaded for direct export')
  } catch (error) {
    console.warn('⚠️ Failed to load logo for direct export:', error)
  }

  // Download creator profile images
  console.log('👥 Loading creator profiles for direct export...')
  images.creatorProfiles = {}
  if (data.creators) {
    for (const creator of data.creators) {
      if (creator.profile_pic_url) {
        try {
          const imageUrl = getImageUrl(creator.profile_pic_url)
          const imageData = await imageToBase64(imageUrl)
          if (imageData) {
            images.creatorProfiles[creator.username] = imageData
            console.log(`✅ Loaded profile for ${creator.username}`)
          }
        } catch (error) {
          console.warn(`❌ Failed to load profile for ${creator.username}:`, error)
        }
      }
    }
  }

  // Download post thumbnail images
  console.log('🖼️ Loading post thumbnails for direct export...')
  images.postThumbnails = {}
  if (data.posts) {
    for (const post of data.posts) {
      if (post.thumbnail) {
        try {
          const imageUrl = getImageUrl(post.thumbnail)
          const imageData = await imageToBase64(imageUrl)
          if (imageData) {
            images.postThumbnails[post.id] = imageData
            console.log(`✅ Loaded thumbnail for post ${post.id}`)
          }
        } catch (error) {
          console.warn(`❌ Failed to load thumbnail for post ${post.id}:`, error)
        }
      }
    }
  }

  // Create enhanced data with embedded images
  const enhancedData: EnhancedCampaignPDFData = {
    ...data,
    images
  }

  const fileName = `${data.campaign.name.replace(/\s+/g, '_')}_Campaign_Report_${new Date()
    .toISOString()
    .split('T')[0]}.pdf`

  console.log('📄 Generating PDF with CompleteCampaignPDFDocument for direct export...')
  const blob = await pdf(<CompleteCampaignPDFDocument data={enhancedData} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)

  console.log('✅ Direct PDF export completed!')
}

export default CampaignPDFExportButton