/**
 * 성능 메트릭 수집 유틸리티
 * API 응답 시간, 처리량 등의 성능 지표를 측정하고 저장
 */

import { log } from "@/lib/utils/logger";
import { saveMetricSnapshot, type MetricSnapshot } from "./metrics-storage";

/**
 * 성능 측정을 위한 헬퍼 클래스
 */
export class PerformanceTimer {
  private startTime: number;
  private operationName: string;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = Date.now();
  }

  /**
   * 경과 시간을 밀리초로 반환
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * 경과 시간을 로그로 기록
   */
  logElapsed(additionalContext?: Record<string, unknown>): void {
    const elapsed = this.elapsed();
    log.debug(`성능 측정: ${this.operationName}`, {
      elapsedMs: elapsed,
      ...additionalContext,
    });
  }

  /**
   * 경과 시간을 메트릭으로 저장
   */
  async saveAsMetric(metricName: string = "api_response_time", metadata?: Record<string, unknown>): Promise<boolean> {
    const elapsed = this.elapsed();
    const snapshot: MetricSnapshot = {
      metricType: "performance",
      metricName: metricName as MetricSnapshot["metricName"],
      metricValue: elapsed,
      metadata: {
        operation: this.operationName,
        ...metadata,
      },
    };
    return saveMetricSnapshot(snapshot);
  }
}

/**
 * 함수 실행 시간을 측정하고 메트릭으로 저장하는 데코레이터
 */
export async function measurePerformance<T>(
  operationName: string,
  fn: () => Promise<T>,
  options?: {
    saveMetric?: boolean;
    metricName?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<T> {
  const timer = new PerformanceTimer(operationName);
  try {
    const result = await fn();
    timer.logElapsed(options?.metadata);

    if (options?.saveMetric) {
      await timer.saveAsMetric(options?.metricName, options?.metadata);
    }

    return result;
  } catch (error) {
    timer.logElapsed({ error: true, ...options?.metadata });
    throw error;
  }
}

/**
 * API 응답 시간 측정 헬퍼
 */
export function createApiTimer(endpoint: string): PerformanceTimer {
  return new PerformanceTimer(`API: ${endpoint}`);
}

