import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/config/env';

// 환경 변수 검증된 값 사용
const env = getEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

// 서버 사이드에서 사용하는 Supabase 클라이언트 (Service Role Key 사용)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('[Supabase Server] 클라이언트 초기화 완료:', {
  url: supabaseUrl.substring(0, 30) + '...',
  hasServiceRoleKey: !!supabaseServiceRoleKey,
});

