import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "TAIO Time App — AI-Powered Time & Priority Management",
  description: "Ứng dụng quản trị thời gian thông minh kết hợp AI (TAIO.CLUB) — Sống có kế hoạch, linh hoạt và nhân văn.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TAIO Time",
  },
};

const SAFE_AREA_BOOTSTRAP_SCRIPT = `
(function() {
  try {
    var ua = navigator.userAgent || '';
    var isIOS = /iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    var isCap = window.location.protocol === 'capacitor:' || !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.bridge);
    var isStandalone = !!window.navigator.standalone;
    if (isIOS || isCap || isStandalone) {
      var root = document.documentElement;
      root.classList.add('is-native-ios');
      var isPortrait = window.innerHeight >= window.innerWidth;
      var saved = window.__TAIO_SAFE_AREA__ || {};
      var topPx = Math.max(saved.top || 0, isPortrait ? 59 : 0);
      var bottomPx = Math.max(saved.bottom || 0, isPortrait ? 34 : 20);
      root.style.setProperty('--native-sat', topPx + 'px');
      root.style.setProperty('--native-sab', bottomPx + 'px');
      root.style.setProperty('--sat', 'max(env(safe-area-inset-top, 0px), ' + topPx + 'px)');
      root.style.setProperty('--sab', 'max(env(safe-area-inset-bottom, 0px), ' + bottomPx + 'px)');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SAFE_AREA_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
