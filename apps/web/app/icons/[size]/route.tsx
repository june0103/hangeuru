import { ImageResponse } from 'next/og';

import { brandMarkSvg } from '@/lib/tree';

// 홈 화면에 추가용 아이콘 192px, 512px (spec 3.10)
const SIZES = [192, 512];

export function generateStaticParams() {
  return SIZES.map(s => ({ size: String(s) }));
}

export async function GET(_: Request, ctx: RouteContext<'/icons/[size]'>) {
  const size = Number((await ctx.params).size);
  if (!SIZES.includes(size)) return new Response(null, { status: 404 });
  const src = `data:image/svg+xml;base64,${Buffer.from(brandMarkSvg(size)).toString('base64')}`;
  // eslint-disable-next-line @next/next/no-img-element
  return new ImageResponse(<img src={src} width={size} height={size} alt="" />, { width: size, height: size });
}
