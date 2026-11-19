// Supabase 공식 SSR 가이드(Next.js 16)의 세션 갱신과 spec 8.4의 경로 보호
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { SEEN_COOKIE } from '../session';

// /seeds: 씨앗 고르기, /fruit: 20일 열매 화면, /start: 처음 온 사람이 보는 스플래시
const PROTECTED = ['/', '/calendar', '/garden', '/seeds', '/fruit'];
const AUTH_ONLY = ['/login', '/signup', '/start'];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          // 세션 쿠키가 실린 응답을 CDN이 캐시하지 않게 한다
          Object.entries(headers).forEach(([k, v]) => {
            supabaseResponse.headers.set(k, v);
            cacheHeaders[k] = v;
          });
        },
      },
    },
  );

  // createServerClient와 getClaims 사이에 다른 코드를 넣지 않는다(공식 가이드)
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const path = request.nextUrl.pathname;
  // 로그인하지 않은 채 보호 경로에 오면: 이 브라우저에서 로그인한 적이 있으면 로그인으로, 처음이면 스플래시로
  const seen = request.cookies.get(SEEN_COOKIE)?.value === '1';
  const target = !user && PROTECTED.includes(path) ? (seen ? '/login' : '/start') : user && AUTH_ONLY.includes(path) ? '/' : null;
  if (!target) return supabaseResponse;

  // 리다이렉트 응답에도 갱신된 쿠키와 캐시 헤더를 옮겨 담는다(spec 8.4)
  const url = request.nextUrl.clone();
  url.pathname = target;
  url.search = '';
  const redirect = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach(c => redirect.cookies.set(c));
  Object.entries(cacheHeaders).forEach(([k, v]) => redirect.headers.set(k, v));
  return redirect;
}
