import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css"
// The new Dirham sign is not in system fonts yet; this ships a face scoped to U+20C3.
import "dirham/css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { EnhancedAuthProvider } from "@/contexts/EnhancedAuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProcessingToastProvider } from "@/contexts/ProcessingToastContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { UserStoreProvider } from "@/components/providers/UserStoreProvider";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";
import { WhatsNewModal } from "@/components/notifications/WhatsNewModal";

const inter = Inter({
  subsets: ["latin"],
  // Inter gets its own name. --font-sans is composed in globals.css so it can carry the
  // Dirham face after it; when next/font owned --font-sans directly it redefined the
  // variable on <body> and the Dirham fallback never applied.
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: false, // Reduce retry attempts
  preload: true,
});

/**
 * The one serif in the product, and it has one job: the client's own name on their
 * dashboard. `--font-serif` already existed in globals.css but resolved to Geist, a sans,
 * so every `font-serif` in the app has been rendering in the body face - a variable that
 * named a thing the product did not have.
 */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const aedFont = localFont({
  src: [
    {
      path: "../fonts/aed-Regular.otf",
      weight: "400",
      style: "normal",
    }
  ],
  variable: "--font-aed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Following - Instagram Analytics Platform",
  description: "Professional Instagram Analytics Platform with AI-powered insights, SmartProxy integration, and comprehensive social media analytics.",
};

// maximumScale: 1 stops iOS Safari's auto-zoom when an input is focused —
// the single biggest "this is a website, not an app" tell on mobile.
// (iOS still allows accessibility pinch-zoom regardless of this setting.)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} ${aedFont.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <EnhancedAuthProvider>
                <UserStoreProvider>
                  <NotificationProvider>
                    <ProcessingToastProvider>
                      <ServiceWorkerProvider>
                        {children}
                        <WhatsNewModal />
                        <Toaster />
                      </ServiceWorkerProvider>
                    </ProcessingToastProvider>
                  </NotificationProvider>
                </UserStoreProvider>
              </EnhancedAuthProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
