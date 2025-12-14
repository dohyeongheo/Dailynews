import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// 환경 변수 직접 사용 (빌드 시 검증 오류 방지)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// 서버 사이드에서 사용하는 Supabase 클라이언트 (Service Role Key 사용)
// 빌드 시에는 환경 변수가 없을 수 있으므로 lazy 초기화
let supabaseServerInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseServer() {
  if (!supabaseServerInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    // 빌드 시점에는 환경 변수가 없을 수 있으므로 더미 클라이언트 반환
    if (!url || !key) {
      // 빌드 시점 체크: Next.js 빌드 프로세스에서는 더미 클라이언트 반환
      const isBuildTime =
        process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.NEXT_PHASE === "phase-development-build" ||
        process.env.NEXT_PHASE === "phase-export";

      if (isBuildTime) {
        // 빌드 시점에는 더미 클라이언트 반환 (타입 오류 방지)
        supabaseServerInstance = createSupabaseClient("https://placeholder.supabase.co", "placeholder-key");
        return supabaseServerInstance;
      }
      throw new Error("Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
    }
    supabaseServerInstance = createSupabaseClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseServerInstance;
}

// 사용자 세션을 위한 Supabase 클라이언트 생성 함수
export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // 빌드 시점에는 환경 변수가 없을 수 있으므로 더미 클라이언트 반환
  if (!url || !anonKey) {
    // 빌드 시점 체크
    const isBuildTime =
      process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-development-build" || process.env.NEXT_PHASE === "phase-export";

    if (isBuildTime) {
      // 빌드 시점에는 더미 클라이언트 반환 (타입 오류 방지)
      return createSupabaseClient("https://placeholder.supabase.co", "placeholder-key");
    }
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
  }

  return createSupabaseClient(url, anonKey, {
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
