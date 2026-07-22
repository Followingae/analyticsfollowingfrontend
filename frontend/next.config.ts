import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@tabler/icons-react'],
  },
  
  // Build optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization for Instagram content
  images: {
    domains: [
      'localhost', 
      'instagram.com', 
      'scontent.cdninstagram.com', 
      'scontent-*.cdninstagram.com'
    ],
    remotePatterns: [
      {
        // OUR CDN — the only image host that actually works. Instagram's scontent-*
        // urls below are signed, short-lived and hotlink-blocked, so they render as
        // broken images; the CDN worker mirrors avatars and post thumbnails to R2 and
        // this is where they are served from. It was missing entirely, which meant
        // next/image would refuse every mirrored thumbnail we had already paid to
        // store.
        protocol: 'https',
        hostname: 'cdn.following.ae',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'instagram.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent*.xx.fbcdn.net',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/api/v1/proxy-image/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
          },
        ],
      },
      {
        source: '/admin/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  
  // Redirects for better SEO
  async redirects() {
    return [
      // Sales demo — self-contained static build in public/demo. It holds no API
      // URL, no keys and makes no network calls, so it cannot reach the platform
      // or its data; this only gives it a tidy URL.
      {
        source: '/demo',
        destination: '/demo/index.html',
        permanent: false,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
    ];
  },
  
  // Output configuration for static hosting
  output: 'standalone',
  trailingSlash: false,
};

export default nextConfig;
