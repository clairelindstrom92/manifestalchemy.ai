import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GleamyWrapper from "@/components/GleamyWrapper";
import { ToastProvider } from "@/components/shared/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Get base URL for metadata
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://manifestalchemy.ai';
};

const baseUrl = getBaseUrl();
const logoUrl = `${baseUrl}/custom-logo.png`;

export const metadata: Metadata = {
  title: "Manifestation Alchemy - Transform Your Dreams Into Reality",
  description: "AI-powered manifestation coaching with personalized plans and actionable steps to help you achieve your goals.",
  icons: {
    icon: [
      { url: '/custom-logo.png', type: 'image/png' },
      { url: '/custom-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/custom-logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/custom-logo.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/custom-logo.png',
      },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Manifest Alchemy',
  },
  openGraph: {
    title: 'Manifestation Alchemy - Transform Your Dreams Into Reality',
    description: 'AI-powered manifestation coaching with personalized plans and actionable steps to help you achieve your goals.',
    url: baseUrl,
    siteName: 'Manifest Alchemy',
    images: [
      {
        url: logoUrl,
        width: 1200,
        height: 630,
        alt: 'Manifest Alchemy Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manifestation Alchemy',
    description: 'Transform Your Dreams Into Reality',
    images: [logoUrl],
  },
  metadataBase: new URL(baseUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <GleamyWrapper>
            {children}
          </GleamyWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
