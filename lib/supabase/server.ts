import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 환경 변수 검증
if (!supabaseUrl) {
  console.error('[Supabase Server] NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  throw new Error('NEXT_PUBLIC_SUPABASE_URL 환경 변수가 필요합니다.');
}

if (!supabaseServiceRoleKey) {
  console.error('[Supabase Server] SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.');
}

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

