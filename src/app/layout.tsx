import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TAIO Time App',
  description: 'Biết ngay bạn đang làm gì, vì mục tiêu nào, và còn bao nhiêu phút. Tối ưu cho người bận rộn và hay bị gián đoạn.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TAIO Time',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" style={{ backgroundColor: '#ffffff', overscrollBehavior: 'none' }}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body style={{ overflowX: 'clip', overscrollBehavior: 'none' }} className="min-h-screen bg-white text-slate-900 antialiased w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
