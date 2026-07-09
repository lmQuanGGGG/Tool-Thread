import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AutoFarm Hub - Hệ sinh thái Automation',
    short_name: 'AutoFarm',
    description: 'Hệ thống tự động hoá đa nền tảng giúp bạn quản lý Threads, Facebook Reels, Shopee cày view, tương tác và đăng bài tự động.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F7F8',
    theme_color: '#2563EB',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
