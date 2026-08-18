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
  
  /**
   * The console lives at /work for everyone internal.
   *
   * Only some of its screens have physically moved; the rest still sit under /superadmin,
   * and sending a talent manager or an account manager to a URL that says "superadmin" is
   * both wrong and alarming. `afterFiles` means a real /work page always wins, and anything
   * else under /work is served by its /superadmin counterpart without the URL saying so.
   * Permissions are unaffected - they are enforced by the module guard and the backend, not
   * by the path.
   */
  async rewrites() {
    return {
      afterFiles: [
        {
          // Everything under /work that does NOT have a real page of its own falls through
          // to its /superadmin counterpart.
          //
          // The exclusion list is load-bearing. Next matches dynamic routes AFTER afterFiles
          // rewrites, so a bare `/work/:path*` swallowed /work/brands/{id} and
          // /work/sourcing/{id} before their own pages were ever tried — the rewrite sent
          // them to /superadmin/brands/{id}, which does not exist, and the brand page 404'd
          // while /work/brands (a static route, matched earlier) worked fine. Any new
          // directory added under src/app/work must be named here too.
          source: '/work/:path((?!areas|brands|coverage|creators|goals|inbox|money|payables|sourcing|team|today).*)',
          destination: '/superadmin/:path*',
        },
      ],
    };
  },

  // Redirects for better SEO
  async redirects() {
    return [
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
