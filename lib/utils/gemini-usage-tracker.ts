/**
 * Gemini API 사용량 추적 모듈
 * API 호출 시 자동으로 사용량을 추적하고 데이터베이스에 저장
 */

import { supabaseServer } from "@/lib/supabase/server";
import { log } from "./logger";
import type { TaskType } from "./gemini-client";
import type { GenerateContentResult } from "@google/generative-ai";

/**
 * Gemini API 사용량 로그 인터페이스
 */
export interface GeminiUsageLog {
  model_name: string;
  task_type: TaskType;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  estimated_cost?: number;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 모델별 토큰 가격 (원/1M 토큰)
 * 참고: Gemini API 가격은 변경될 수 있으므로 최신 가격 확인 필요
 */
const TOKEN_PRICES: Record<string, { input: number; output: number }> = {
  "gemini-2.5-pro": {
    input: 0.125, // $0.125 per 1M input tokens (약 1,000원/1M 토큰, 환율 8,000원 기준)
    output: 0.5, // $0.5 per 1M output tokens (약 4,000원/1M 토큰)
  },
  "gemini-2.5-flash": {
    input: 0.075, // $0.075 per 1M input tokens (약 600원/1M 토큰)
    output: 0.3, // $0.3 per 1M output tokens (약 2,400원/1M 토큰)
  },
};

/**
 * 토큰 수로부터 비용 추정 (원)
 */
function estimateCost(modelName: string, inputTokens: number, outputTokens: number): number {
  const prices = TOKEN_PRICES[modelName];
  if (!prices) {
    log.warn("알 수 없는 모델 이름으로 비용 추정 불가", { modelName });
    return 0;
  }

  // 토큰 가격을 원으로 변환 (1M 토큰 기준)
  const inputCost = (inputTokens / 1_000_000) * prices.input * 8000; // 환율 8,000원 가정
  const outputCost = (outputTokens / 1_000_000) * prices.output * 8000;

  return inputCost + outputCost;
}

/**
 * GenerateContentResult에서 토큰 사용량 추출
 */
function extractTokenUsage(result: GenerateContentResult): {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
} {
  try {
    const response = result.response;
    const usageMetadata = response.usageMetadata;

    if (usageMetadata) {
      return {
        inputTokens: usageMetadata.promptTokenCount,
        outputTokens: usageMetadata.candidatesTokenCount,
        totalTokens: usageMetadata.totalTokenCount,
      };
    }
  } catch (error) {
    log.debug("토큰 사용량 추출 실패 (응답에 usageMetadata가 없을 수 있음)", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {};
}

/**
 * Gemini API 사용량 로그 저장
 */
export async function saveGeminiUsageLog(usageLog: GeminiUsageLog): Promise<boolean> {
  try {
    const { error } = await supabaseServer.from("gemini_usage_logs").insert({
      model_name: usageLog.model_name,
      task_type: usageLog.task_type,
      input_tokens: usageLog.input_tokens || null,
      output_tokens: usageLog.output_tokens || null,
      total_tokens: usageLog.total_tokens || null,
      estimated_cost: usageLog.estimated_cost || null,
      response_time_ms: usageLog.response_time_ms || null,
      success: usageLog.success,
      error_message: usageLog.error_message || null,
      metadata: usageLog.metadata || null,
    });

    if (error) {
      log.error("Gemini 사용량 로그 저장 실패", new Error(error.message), {
        usageLog,
        errorDetails: error,
      });
      return false;
    }

    log.debug("Gemini 사용량 로그 저장 성공", {
      model: usageLog.model_name,
      taskType: usageLog.task_type,
      tokens: usageLog.total_tokens,
      cost: usageLog.estimated_cost,
    });
    return true;
  } catch (error) {
    log.error("Gemini 사용량 로그 저장 예외 발생", error instanceof Error ? error : new Error(String(error)), {
      usageLog,
    });
    return false;
  }
}

/**
 * API 호출 결과를 추적하고 저장
 */
export async function trackGeminiUsage(
  modelName: string,
  taskType: TaskType,
  result: GenerateContentResult | null,
  error: Error | null,
  startTime: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const responseTime = Date.now() - startTime;
  const success = result !== null && error === null;

  let usageLog: GeminiUsageLog = {
    model_name: modelName,
    task_type: taskType,
    response_time_ms: responseTime,
    success,
    error_message: error?.message,
    metadata,
  };

  if (result && success) {
    const tokenUsage = extractTokenUsage(result);
    usageLog = {
      ...usageLog,
      input_tokens: tokenUsage.inputTokens,
      output_tokens: tokenUsage.outputTokens,
      total_tokens: tokenUsage.totalTokens,
    };

    // 비용 추정
    if (tokenUsage.inputTokens && tokenUsage.outputTokens) {
      usageLog.estimated_cost = estimateCost(modelName, tokenUsage.inputTokens, tokenUsage.outputTokens);
    }
  }

  // 비동기로 저장 (응답 시간에 영향 없음)
  saveGeminiUsageLog(usageLog).catch((saveError) => {
    log.error("Gemini 사용량 로그 저장 실패 (비동기)", saveError instanceof Error ? saveError : new Error(String(saveError)));
  });
}

/**
 * 여러 사용량 로그 일괄 저장
 */
export async function saveGeminiUsageLogsBatch(usageLogs: GeminiUsageLog[]): Promise<{ success: number; failed: number }> {
  if (usageLogs.length === 0) {
    return { success: 0, failed: 0 };
  }

  try {
    const records = usageLogs.map((log) => ({
      model_name: log.model_name,
      task_type: log.task_type,
      input_tokens: log.input_tokens || null,
      output_tokens: log.output_tokens || null,
      total_tokens: log.total_tokens || null,
      estimated_cost: log.estimated_cost || null,
      response_time_ms: log.response_time_ms || null,
      success: log.success,
      error_message: log.error_message || null,
      metadata: log.metadata || null,
    }));

    const { error } = await supabaseServer.from("gemini_usage_logs").insert(records);

    if (error) {
      log.error("Gemini 사용량 로그 일괄 저장 실패", new Error(error.message), {
        count: usageLogs.length,
        errorDetails: error,
      });
      return { success: 0, failed: usageLogs.length };
    }

    log.debug("Gemini 사용량 로그 일괄 저장 성공", { count: usageLogs.length });
    return { success: usageLogs.length, failed: 0 };
  } catch (error) {
    log.error("Gemini 사용량 로그 일괄 저장 예외 발생", error instanceof Error ? error : new Error(String(error)), {
      count: usageLogs.length,
    });
    return { success: 0, failed: usageLogs.length };
  }
}

