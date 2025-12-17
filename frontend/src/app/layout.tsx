import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: false, // Reduce retry attempts
  preload: true,
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${aedFont.variable} font-sans antialiased`}>
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
