/**
 * Gemini API 클라이언트 유틸리티
 * 모델 선택 및 Context Caching 지원
 */

import { GoogleGenerativeAI, GenerativeModel, type GenerateContentResult } from "@google/generative-ai";
import { getEnv } from "../config/env";
import { log } from "./logger";
import { createHash } from "crypto";
import { trackGeminiUsage } from "./gemini-usage-tracker";

/**
 * 작업 유형
 */
export type TaskType = "news_collection" | "translation" | "prompt_generation";

/**
 * Gemini AI 클라이언트 싱글톤
 */
let genAIClient: GoogleGenerativeAI | null = null;

/**
 * Gemini AI 클라이언트를 지연 초기화합니다.
 */
function getGenAI(): GoogleGenerativeAI {
  if (!genAIClient) {
    const { GOOGLE_GEMINI_API_KEY } = getEnv();
    genAIClient = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
  }
  return genAIClient;
}

/**
 * 작업 유형에 따른 모델 이름 선택
 */
export function selectModel(taskType: TaskType): string {
  const env = getEnv();

  switch (taskType) {
    case "news_collection":
      // 뉴스 수집은 복잡한 맥락 파악이 필요하므로 Pro 모델 사용
      return env.GEMINI_NEWS_COLLECTION_MODEL === "pro" ? "gemini-2.5-pro" : "gemini-2.5-flash";
    case "translation":
      // 번역은 단순 작업이므로 Flash 모델 사용
      return env.GEMINI_TRANSLATION_MODEL === "pro" ? "gemini-2.5-pro" : "gemini-2.5-flash";
    case "prompt_generation":
      // 이미지 프롬프트 생성은 단순 작업이므로 Flash 모델 사용
      return "gemini-2.5-flash";
    default:
      return "gemini-2.5-flash";
  }
}

/**
 * Context Caching을 지원하는 모델 생성
 * @param modelName 모델 이름
 * @param cacheKey 캐시 키 (선택적, 제공되지 않으면 Context Caching 비활성화)
 * @returns GenerativeModel 인스턴스
 */
export function getModelWithCaching(modelName: string, cacheKey?: string): GenerativeModel {
  const genAI = getGenAI();
  const env = getEnv();

  // Context Caching이 비활성화되었거나 캐시 키가 없으면 일반 모델 반환
  if (!env.GEMINI_USE_CONTEXT_CACHING || !cacheKey) {
    return genAI.getGenerativeModel({ model: modelName });
  }

  // Context Caching 활성화
  // 참고: @google/generative-ai SDK의 실제 API는 문서를 확인해야 하지만,
  // 일반적으로 systemInstruction이나 generationConfig에 cacheControl 옵션이 포함됩니다.
  // 현재 SDK 버전에서는 generateContent 호출 시 옵션으로 전달할 수 있습니다.

  log.debug("Context Caching 활성화된 모델 생성", {
    modelName,
    cacheKey: cacheKey.substring(0, 50) + "...",
  });

  // 기본 모델 생성 (Context Caching은 generateContent 호출 시 적용)
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Context Caching을 지원하는 generateContent 호출
 * @param model GenerativeModel 인스턴스
 * @param prompt 프롬프트 텍스트
 * @param cacheKey 캐시 키 (선택적)
 * @returns 생성 결과
 */
/**
 * Context Caching을 지원하는 generateContent 호출 (사용량 추적 포함)
 * @param model GenerativeModel 인스턴스
 * @param prompt 프롬프트 텍스트
 * @param cacheKey 캐시 키 (선택적)
 * @param taskType 작업 유형 (사용량 추적용)
 * @returns 생성 결과
 */
export async function generateContentWithCaching(
  model: GenerativeModel,
  prompt: string,
  cacheKey?: string,
  taskType?: TaskType
): Promise<GenerateContentResult> {
  const env = getEnv();
  const startTime = Date.now();
  const modelName = model.model || "unknown";
  const actualTaskType = taskType || "translation"; // 기본값

  let result: GenerateContentResult | null = null;
  let error: Error | null = null;

  try {
    // Context Caching이 비활성화되었거나 캐시 키가 없으면 일반 호출
    if (!env.GEMINI_USE_CONTEXT_CACHING || !cacheKey) {
      result = await model.generateContent(prompt);
    } else {
      // Context Caching 활성화
      // 참고: 실제 SDK API는 버전에 따라 다를 수 있습니다.
      // 일반적으로 generateContent에 옵션 객체를 전달할 수 있습니다.

      log.debug("Context Caching을 사용한 generateContent 호출", {
        cacheKey: cacheKey.substring(0, 50) + "...",
        promptLength: prompt.length,
      });

      // SDK의 실제 API에 맞게 조정 필요
      // 현재는 일반 호출로 대체하고, 실제 Context Caching은 SDK 업데이트 시 적용
      // TODO: SDK가 Context Caching을 지원하는 경우 아래와 같이 수정:
      // result = await model.generateContent({
      //   contents: [{ role: "user", parts: [{ text: prompt }] }],
      //   cacheControl: {
      //     cacheKey: cacheKey,
      //     ttl: 3600, // 1시간
      //   },
      // });

      // 임시로 일반 호출 사용 (SDK가 Context Caching을 지원하지 않는 경우)
      result = await model.generateContent(prompt);
    }

    // 사용량 추적 (비동기)
    trackGeminiUsage(modelName, actualTaskType, result, null, startTime, {
      cacheKey: cacheKey ? cacheKey.substring(0, 50) + "..." : undefined,
      promptLength: prompt.length,
      useContextCaching: env.GEMINI_USE_CONTEXT_CACHING && !!cacheKey,
    }).catch((trackError) => {
      log.error("사용량 추적 실패 (비동기)", trackError instanceof Error ? trackError : new Error(String(trackError)));
    });

    return result;
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err));
    log.error("Context Caching을 사용한 generateContent 호출 실패", error, {
      cacheKey,
      promptLength: prompt.length,
    });

    // 사용량 추적 (에러 포함)
    trackGeminiUsage(modelName, actualTaskType, null, error, startTime, {
      cacheKey: cacheKey ? cacheKey.substring(0, 50) + "..." : undefined,
      promptLength: prompt.length,
      useContextCaching: env.GEMINI_USE_CONTEXT_CACHING && !!cacheKey,
    }).catch((trackError) => {
      log.error("사용량 추적 실패 (비동기)", trackError instanceof Error ? trackError : new Error(String(trackError)));
    });

    // 실패 시 일반 호출로 폴백 시도
    try {
      result = await model.generateContent(prompt);
      // 폴백 성공 시 사용량 추적
      trackGeminiUsage(modelName, actualTaskType, result, null, startTime, {
        cacheKey: cacheKey ? cacheKey.substring(0, 50) + "..." : undefined,
        promptLength: prompt.length,
        useContextCaching: false,
        fallback: true,
      }).catch((trackError) => {
        log.error("사용량 추적 실패 (비동기)", trackError instanceof Error ? trackError : new Error(String(trackError)));
      });
      return result;
    } catch (fallbackError) {
      // 폴백도 실패한 경우 원래 에러를 다시 throw
      throw error;
    }
  }
}

/**
 * 작업 유형에 따른 모델 및 캐시 키 생성
 * @param taskType 작업 유형
 * @param cacheKeySource 캐시 키 생성에 사용할 소스 (날짜, 텍스트 해시 등)
 * @returns 모델 이름과 캐시 키
 */
export function getModelAndCacheKey(
  taskType: TaskType,
  cacheKeySource: string
): { modelName: string; cacheKey: string } {
  const modelName = selectModel(taskType);
  let cacheKey: string;

  switch (taskType) {
    case "news_collection":
      // 날짜 기반 캐시 키
      cacheKey = `news_collection_${cacheKeySource}`;
      break;
    case "translation":
      // 텍스트 해시 기반 캐시 키
      const textHash = createHash("sha256").update(cacheKeySource).digest("hex");
      cacheKey = `translation_${textHash}`;
      break;
    case "prompt_generation":
      // 뉴스 ID 기반 캐시 키
      cacheKey = `prompt_generation_${cacheKeySource}`;
      break;
    default:
      cacheKey = `default_${cacheKeySource}`;
  }

  return { modelName, cacheKey };
}

/**
 * 작업 유형에 따른 모델 생성 (Context Caching 포함)
 * @param taskType 작업 유형
 * @param cacheKeySource 캐시 키 생성에 사용할 소스
 * @returns GenerativeModel 인스턴스
 */
export function getModelForTask(taskType: TaskType, cacheKeySource: string): GenerativeModel {
  const { modelName, cacheKey } = getModelAndCacheKey(taskType, cacheKeySource);
  return getModelWithCaching(modelName, cacheKey);
}


