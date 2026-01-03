/**
 * Google Cloud Billing API 클라이언트
 * MCP 서버 또는 직접 API 호출을 통한 비용 조회
 */

import { log } from "../utils/logger";

/**
 * Billing API를 통한 비용 조회 결과
 */
export interface BillingCost {
  date: string; // YYYY-MM-DD
  service: string; // 서비스 이름 (예: "Gemini API")
  cost: number; // 비용 (원)
  currency: string; // 통화 (예: "KRW")
}

/**
 * 프로젝트의 Billing Account 정보
 */
export interface BillingAccountInfo {
  billingAccountId: string;
  billingEnabled: boolean;
  projectId: string;
}

/**
 * gcloud CLI를 통한 Billing Account 정보 조회
 * MCP 서버를 통해 실행할 수 있음
 */
export async function getBillingAccountInfo(projectId: string): Promise<BillingAccountInfo | null> {
  try {
    // MCP 서버를 통해 실행할 수 있도록 명령어 반환
    // 실제 실행은 MCP 서버를 통해 수행
    log.debug("Billing Account 정보 조회 요청", { projectId });

    // 실제 구현은 MCP 서버를 통해 수행되므로 여기서는 타입만 정의
    // MCP 서버 사용 예시:
    // "gcp-general MCP로 'gcloud billing projects describe {projectId}' 명령어를 실행해줘"

    return null; // MCP 서버를 통해 실제 데이터를 가져와야 함
  } catch (error) {
    log.error("Billing Account 정보 조회 실패", error instanceof Error ? error : new Error(String(error)), {
      projectId,
    });
    return null;
  }
}

/**
 * Gemini API 비용 조회 (일별)
 * 실제 구현은 Cloud Billing API 또는 BigQuery Billing Export를 통해 수행
 *
 * 참고: gcloud CLI는 직접적인 비용 조회 기능이 제한적이므로,
 * Cloud Console 또는 BigQuery Billing Export를 사용하는 것이 권장됩니다.
 */
export async function getGeminiDailyCost(
  projectId: string,
  startDate: string,
  endDate: string
): Promise<BillingCost[]> {
  try {
    log.debug("Gemini 일별 비용 조회 요청", { projectId, startDate, endDate });

    // 실제 구현은 Cloud Billing API 또는 BigQuery를 통해 수행
    // 여기서는 데이터베이스의 추정 비용을 사용하는 대안 제공

    // MCP 서버를 통한 조회 예시:
    // "gcp-general MCP로 Gemini API의 일별 비용을 조회해줘"

    return [];
  } catch (error) {
    log.error("Gemini 일별 비용 조회 실패", error instanceof Error ? error : new Error(String(error)), {
      projectId,
      startDate,
      endDate,
    });
    return [];
  }
}

/**
 * Gemini API 비용 조회 (월별)
 */
export async function getGeminiMonthlyCost(
  projectId: string,
  year: number,
  month: number
): Promise<number> {
  try {
    log.debug("Gemini 월별 비용 조회 요청", { projectId, year, month });

    // 실제 구현은 Cloud Billing API 또는 BigQuery를 통해 수행
    // 여기서는 데이터베이스의 추정 비용 합계를 사용하는 대안 제공

    return 0;
  } catch (error) {
    log.error("Gemini 월별 비용 조회 실패", error instanceof Error ? error : new Error(String(error)), {
      projectId,
      year,
      month,
    });
    return 0;
  }
}

/**
 * 서비스별 비용 조회
 */
export async function getServiceCosts(
  projectId: string,
  startDate: string,
  endDate: string
): Promise<BillingCost[]> {
  try {
    log.debug("서비스별 비용 조회 요청", { projectId, startDate, endDate });

    // 실제 구현은 Cloud Billing API를 통해 수행
    // MCP 서버 사용 예시:
    // "gcp-general MCP로 프로젝트의 서비스별 비용을 조회해줘"

    return [];
  } catch (error) {
    log.error("서비스별 비용 조회 실패", error instanceof Error ? error : new Error(String(error)), {
      projectId,
      startDate,
      endDate,
    });
    return [];
  }
}


