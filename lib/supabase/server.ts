import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/config/env";

// 환경 변수 검증된 값 사용
const env = getEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

// 서버 사이드에서 사용하는 Supabase 클라이언트 (Service Role Key 사용)
export const supabaseServer = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 사용자 세션을 위한 Supabase 클라이언트 생성 함수
export function createClient() {
  const cookieStore = cookies();

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: async (key: string) => {
          const cookie = cookieStore.get(key);
          return cookie?.value || null;
        },
        setItem: async (key: string, value: string) => {
          cookieStore.set(key, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          });
        },
        removeItem: async (key: string) => {
          cookieStore.delete(key);
        },
      },
    },
  });
}

console.log("[Supabase Server] 클라이언트 초기화 완료:", {
  url: supabaseUrl.substring(0, 30) + "...",
  hasServiceRoleKey: !!supabaseServiceRoleKey,
});
