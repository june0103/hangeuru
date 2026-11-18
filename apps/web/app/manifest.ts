import type { MetadataRoute } from 'next';

import { APP_NAME } from '@/lib/copy';

// 홈 화면에 추가 (spec 3.10)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    start_url: '/',
    display: 'standalone',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png' },
    ],
  };
}
