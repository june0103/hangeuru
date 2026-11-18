// secret key 클라이언트. 서버 액션에서 가입 시 사용자 생성과 기록 쓰기에만 쓴다(spec 6.4, 6.5)
import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
