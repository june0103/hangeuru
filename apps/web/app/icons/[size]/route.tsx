import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ImageResponse } from 'next/og';

// 홈 화면에 추가용 아이콘 192px, 512px (spec 3.10, 4.6). public/brand/icon.svg를 PNG로 바꾼다
const SIZES = [192, 512];

export function generateStaticParams() {
  return SIZES.map(s => ({ size: String(s) }));
}

export async function GET(_: Request, ctx: RouteContext<'/icons/[size]'>) {
  const size = Number((await ctx.params).size);
  if (!SIZES.includes(size)) return new Response(null, { status: 404 });
  const svg = await readFile(path.join(process.cwd(), 'public/brand/icon.svg'));
  const src = `data:image/svg+xml;base64,${svg.toString('base64')}`;
  // eslint-disable-next-line @next/next/no-img-element
  return new ImageResponse(<img src={src} width={size} height={size} alt="" />, { width: size, height: size });
}
