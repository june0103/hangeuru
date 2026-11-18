import { NextResponse } from 'next/server';

import { signOutSession } from '@/lib/data';

// 로그인했지만 profiles 행이 없을 때 로그아웃시키고 로그인 화면으로 보낸다(spec 8.4)
export async function GET(request: Request) {
  await signOutSession();
  return NextResponse.redirect(new URL('/login', request.url));
}
