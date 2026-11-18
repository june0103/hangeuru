import { ImageResponse } from 'next/og';

import { brandMarkSvg } from '@/lib/tree';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

// 파비콘. 브랜드 마크(spec 4.6)
export default function Icon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(brandMarkSvg(64, 'transparent')).toString('base64')}`;
   
  return new ImageResponse(<img src={src} width={64} height={64} alt="" />, size);
}
