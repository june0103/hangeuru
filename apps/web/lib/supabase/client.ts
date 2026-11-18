// Supabase 공식 SSR 가이드(Next.js)의 브라우저 클라이언트. 이 앱은 브라우저에서 데이터를 쓰지 않는다(spec 6.5)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
