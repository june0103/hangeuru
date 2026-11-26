import { type NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase/proxy';

// 세션 갱신, 보호 경로 리다이렉트 (spec 6.1, 8.4)
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === '/demo' || path.startsWith('/demo/')) {
    if (request.method === 'GET' || request.method === 'HEAD') return NextResponse.next();
    return new NextResponse(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일, 이미지, 아이콘, 매니페스트는 건너뛴다
    '/((?!_next/static|_next/image|favicon.ico|icon|icons/|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
