// Supabase 공식 SSR 가이드(Next.js 16)의 세션 갱신과 spec 8.4의 경로 보호
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/', '/calendar', '/garden'];
const AUTH_ONLY = ['/login', '/signup'];

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
  const target = !user && PROTECTED.includes(path) ? '/login' : user && AUTH_ONLY.includes(path) ? '/' : null;
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
