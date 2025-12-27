/**
 * 환경 변수 검증 및 타입 안전한 환경 변수 로딩
 */

import { z, ZodError } from "zod";

/**
 * 환경 변수 스키마
 */
const envSchema = z.object({
  // Google Gemini API
  GOOGLE_GEMINI_API_KEY: z.string().min(1, "GOOGLE_GEMINI_API_KEY는 필수입니다."),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL은 유효한 URL이어야 합니다."),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY는 필수입니다."),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY는 필수입니다."),

  // 선택적 환경 변수
  ADMIN_PASSWORD: z.string().optional(),

  // AI 이미지 생성 API 설정
  IMAGE_GENERATION_API: z.enum(["gemini", "replicate", "huggingface", "deepai", "none"]).default("none"),
  REPLICATE_API_TOKEN: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  DEEPAI_API_KEY: z.string().optional(),

  // Gemini API 최적화 설정
  GEMINI_USE_CONTEXT_CACHING: z.boolean().default(true),
  GEMINI_NEWS_COLLECTION_MODEL: z.enum(["flash", "pro"]).default("pro"),
  GEMINI_TRANSLATION_MODEL: z.enum(["flash", "pro"]).default("flash"),

  // Node 환경
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

/**
 * 검증된 환경 변수 타입
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 환경 변수 검증 및 로딩
 */
function validateEnv(): Env {
  try {
    return envSchema.parse({
      GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      IMAGE_GENERATION_API: (process.env.IMAGE_GENERATION_API as "gemini" | "replicate" | "huggingface" | "deepai" | "none") || "none",
      REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
      HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
      DEEPAI_API_KEY: process.env.DEEPAI_API_KEY,
      GEMINI_USE_CONTEXT_CACHING: process.env.GEMINI_USE_CONTEXT_CACHING === "true" || process.env.GEMINI_USE_CONTEXT_CACHING === undefined,
      GEMINI_NEWS_COLLECTION_MODEL: (process.env.GEMINI_NEWS_COLLECTION_MODEL as "flash" | "pro") || "pro",
      GEMINI_TRANSLATION_MODEL: (process.env.GEMINI_TRANSLATION_MODEL as "flash" | "pro") || "flash",
      NODE_ENV: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const missingVars = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("\n");
      throw new Error(`환경 변수 검증 실패:\n${missingVars}`);
    }
    throw error;
  }
}

/**
 * 검증된 환경 변수 (싱글톤)
 */
let validatedEnv: Env | null = null;

/**
 * 환경 변수 가져오기 (검증 포함)
 */
export function getEnv(): Env {
  if (!validatedEnv) {
    validatedEnv = validateEnv();
  }
  return validatedEnv;
}

/**
 * 환경 변수 초기화 (앱 시작 시 호출)
 * 
 * 주의: 이 함수는 초기화 단계에서 호출되므로 log 유틸리티를 사용할 수 없습니다.
 * 순환 참조를 피하기 위해 console.log를 사용합니다.
 */
export function initEnv(): void {
  try {
    validatedEnv = validateEnv();
    // 초기화 단계에서는 log 유틸리티가 아직 사용 불가능하므로 console.log 사용
    console.log("[Env] 환경 변수 검증 완료");
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    // 초기화 단계에서는 log 유틸리티가 아직 사용 불가능하므로 console.error 사용
    console.error("[Env] 환경 변수 검증 실패:", errorObj);
    throw error;
  }
}
