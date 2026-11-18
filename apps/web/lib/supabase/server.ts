// Supabase 공식 SSR 가이드(Next.js)의 서버 클라이언트. 로그인한 사용자의 세션으로 읽는다(행 수준 보안 적용)
import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 요청마다 새로 만든다. 전역 변수에 두지 않는다
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // 서버 컴포넌트에서 불리면 쿠키를 쓸 수 없다. proxy.ts가 세션을 갱신하므로 무시한다
          }
        },
      },
    },
  );
}
