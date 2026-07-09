import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});



export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "AutoFarm Hub — Hệ sinh thái Automation MMO",
  description: "Hệ thống tự động hoá đa nền tảng giúp bạn quản lý Threads, Facebook Reels, Shopee cày view, tương tác và đăng bài tự động 100%.",
  keywords: ["AutoFarm", "MMO", "Tool MMO", "Auto Threads", "Auto Facebook Reels", "Shopee Affiliate", "Bot đăng bài"],
  authors: [{ name: "AutoFarm Team" }],
  openGraph: {
    title: "AutoFarm Hub — Hệ sinh thái Automation MMO",
    description: "Công cụ tự động hoá đăng bài, cày tương tác Threads, Reels và Shopee Affiliate đỉnh cao.",
    url: "https://autofarm.com",
    siteName: "AutoFarm Hub",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoFarm Hub — Hệ sinh thái Automation MMO",
    description: "Hệ thống tự động hoá đa nền tảng giúp bạn quản lý Threads, Facebook Reels, Shopee.",
    images: ["/icon-512x512.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F7F8] text-[#1A1A2E]">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
