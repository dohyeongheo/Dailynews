/**
 * 앱 시작 시 환경 변수 검증
 * 이 파일은 서버 사이드에서만 실행됩니다.
 */

import { initEnv } from "./env";
import { log } from "../utils/logger";

/**
 * 서버 사이드 환경 변수 검증
 * Next.js 앱이 시작될 때 자동으로 실행됩니다.
 * 빌드 시점에는 환경 변수가 없을 수 있으므로 건너뜁니다.
 */
if (typeof window === "undefined") {
  // 빌드 시점 체크: Next.js 빌드 프로세스에서는 환경 변수 검증을 건너뜀
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-development-build" || !process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!isBuildTime) {
    try {
      initEnv();
    } catch (error) {
      // 환경 변수 검증 실패 시 앱 시작을 중단하지 않고 경고만 표시
      // (개발 환경에서는 더 명확한 에러 메시지)
      if (process.env.NODE_ENV === "development") {
        log.error("환경 변수 검증 실패", error instanceof Error ? error : new Error(String(error)), {
          message: "⚠️ .env.local 파일에 필요한 환경 변수를 설정해주세요.",
        });
      } else {
        log.error("환경 변수 검증 실패", error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
}
