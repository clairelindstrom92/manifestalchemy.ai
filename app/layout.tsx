import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    images: ['/custom-logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manifestation Alchemy',
    description: 'Transform Your Dreams Into Reality',
    images: ['/custom-logo.png'],
  },
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
        {children}
      </body>
    </html>
  );
}
